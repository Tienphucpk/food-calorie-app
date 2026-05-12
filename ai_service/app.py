import os
import io
import base64
import random
import logging
from difflib import get_close_matches

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

import torch

# ============================================================
# FLASK CONFIG
# ============================================================
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

# ============================================================
# MODEL CONFIG
# ============================================================
LOCAL_MODEL_PATH  = "./trained_model"
ONLINE_MODEL_ID   = "BinhQuocNguyen/food-recognition-vit"

DEVICE = 0 if torch.cuda.is_available() else -1

# ============================================================
# LABEL MAPPING
# ============================================================
LABEL_MAPPING = {
    "LABEL_0": "apple_pie",
    "LABEL_1": "caesar_salad",
    "LABEL_2": "chocolate_cake",
    "LABEL_3": "cup_cakes",
    "LABEL_4": "donuts",
    "LABEL_5": "hamburger",
    "LABEL_6": "ice_cream",
    "LABEL_7": "pancakes",
    "LABEL_8": "pizza",
    "LABEL_9": "waffles"
}

# ============================================================
# NUTRITION DATABASE
# ============================================================
NUTRITION_DB = {
    "apple_pie": {
        "calories": 296,
        "protein": 2.4,
        "carbs": 43.0,
        "fat": 13.0,
        "fiber": 2.0
    },

    "caesar_salad": {
        "calories": 180,
        "protein": 8.0,
        "carbs": 9.0,
        "fat": 14.0,
        "fiber": 2.0
    },

    "chocolate_cake": {
        "calories": 352,
        "protein": 5.0,
        "carbs": 55.0,
        "fat": 14.0,
        "fiber": 2.0
    },

    "cup_cakes": {
        "calories": 305,
        "protein": 3.0,
        "carbs": 48.0,
        "fat": 12.0,
        "fiber": 0.5
    },

    "donuts": {
        "calories": 452,
        "protein": 5.0,
        "carbs": 51.0,
        "fat": 25.0,
        "fiber": 1.5
    },

    "hamburger": {
        "calories": 295,
        "protein": 17.0,
        "carbs": 24.0,
        "fat": 14.0,
        "fiber": 1.5
    },

    "ice_cream": {
        "calories": 207,
        "protein": 3.5,
        "carbs": 24.0,
        "fat": 11.0,
        "fiber": 0.6
    },

    "pancakes": {
        "calories": 227,
        "protein": 5.0,
        "carbs": 40.0,
        "fat": 6.0,
        "fiber": 1.0
    },

    "pizza": {
        "calories": 285,
        "protein": 12.0,
        "carbs": 36.0,
        "fat": 10.0,
        "fiber": 2.5
    },

    "waffles": {
        "calories": 291,
        "protein": 7.0,
        "carbs": 37.0,
        "fat": 13.0,
        "fiber": 1.5
    }
}

DEFAULT_NUTRITION = {
    "calories": 250,
    "protein": 10.0,
    "carbs": 30.0,
    "fat": 10.0,
    "fiber": 2.0
}

# ============================================================
# LOAD MODEL
# ============================================================
classifier = None
MODEL_ID = ONLINE_MODEL_ID  # Will be updated by load_vit_model()


def is_valid_huggingface_model(path: str) -> bool:
    """
    Kiểm tra thư mục có phải HuggingFace model hợp lệ không.
    Yêu cầu: tồn tại config.json và có key 'model_type' bên trong.
    """
    import json

    if not os.path.isdir(path):
        return False

    config_path = os.path.join(path, "config.json")
    if not os.path.isfile(config_path):
        logging.warning(f"[Model Check] No config.json in '{path}'")
        return False

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        if "model_type" not in config:
            logging.warning(f"[Model Check] config.json missing 'model_type' in '{path}'")
            return False
        logging.info(f"[Model Check] Valid HF model: model_type='{config['model_type']}'")
        return True
    except Exception as e:
        logging.warning(f"[Model Check] Could not parse config.json: {e}")
        return False


def load_vit_model():
    global classifier, MODEL_ID
    from transformers import pipeline

    # ── Bước 1: Thử local model nếu hợp lệ ──────────────────
    if is_valid_huggingface_model(LOCAL_MODEL_PATH):
        try:
            logging.info(f"[Load] Using LOCAL model: {LOCAL_MODEL_PATH}")
            _pipe = pipeline(
                "image-classification",
                model=LOCAL_MODEL_PATH,
                top_k=3,
                device=DEVICE,
            )
            # Warmup
            _pipe(Image.new("RGB", (224, 224)))
            classifier = _pipe
            MODEL_ID = LOCAL_MODEL_PATH
            logging.info("[Load] LOCAL model loaded and warmed up successfully.")
            return
        except Exception as e:
            logging.error(f"[Load] LOCAL model failed: {e}")
            logging.info("[Load] Falling back to online model...")

    # ── Bước 2: Fallback → HuggingFace online ───────────────
    try:
        logging.info(f"[Load] Using ONLINE model: {ONLINE_MODEL_ID}")
        _pipe = pipeline(
            "image-classification",
            model=ONLINE_MODEL_ID,
            top_k=3,
            device=DEVICE,
        )
        # Warmup
        _pipe(Image.new("RGB", (224, 224)))
        classifier = _pipe
        MODEL_ID = ONLINE_MODEL_ID
        logging.info("[Load] ONLINE model loaded and warmed up successfully.")
        return
    except Exception as e:
        logging.error(f"[Load] ONLINE model also failed: {e}")

    # ── Bước 3: Mock mode (last resort) ─────────────────────
    logging.warning("[Load] Both models failed. Running in MOCK mode.")
    classifier = None


load_vit_model()

# ============================================================
# IMAGE PROCESSING
# ============================================================
def decode_base64_image(base64_string):
    """
    Decode base64 image safely
    """

    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    img_bytes = base64.b64decode(base64_string)

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    return img


def validate_image(img):
    """
    Basic image validation
    """

    if img.width < 10 or img.height < 10:
        raise ValueError("Image too small")

    if img.width > 10000 or img.height > 10000:
        raise ValueError("Image too large")


def get_image_from_request(req):
    """
    Support:
    - multipart/form-data
    - JSON base64
    """

    # JSON base64
    if req.is_json:
        data = req.get_json()

        if "image_base64" in data:
            img = decode_base64_image(data["image_base64"])
            validate_image(img)
            return img

    # multipart/form-data
    if "image" in req.files:
        file = req.files["image"]

        img = Image.open(file.stream).convert("RGB")

        validate_image(img)

        return img

    return None

# ============================================================
# HELPER FUNCTIONS
# ============================================================
def map_label(raw_label):
    """
    Convert model label to nutrition DB key
    """

    # LABEL_X mapping
    if raw_label in LABEL_MAPPING:
        return LABEL_MAPPING[raw_label]

    # Normalize
    normalized = raw_label.lower().replace(" ", "_")

    if normalized in NUTRITION_DB:
        return normalized

    # Fuzzy match
    matches = get_close_matches(
        normalized,
        NUTRITION_DB.keys(),
        n=1,
        cutoff=0.4
    )

    if matches:
        return matches[0]

    return "pizza"


def build_prediction_list(results):
    """
    Return formatted top predictions
    """

    predictions = []

    for r in results:
        label = map_label(r["label"])

        predictions.append({
            "label": label.replace("_", " ").title(),
            "confidence": round(r["score"] * 100, 2)
        })

    return predictions

# ============================================================
# ROUTES
# ============================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "FoodAI ViT API Running",
        "model": MODEL_ID,
        "model_source": "local" if MODEL_ID == LOCAL_MODEL_PATH else "online",
        "mode": "real" if classifier else "mock"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_ID,
        "device": "GPU" if DEVICE == 0 else "CPU",
        "model_loaded": classifier is not None,
        "mode": "real" if classifier else "mock",
        "supported_classes": list(NUTRITION_DB.keys())
    })


@app.route("/predict", methods=["POST"])
def predict():

    try:

        # ====================================================
        # GET IMAGE
        # ====================================================
        img = get_image_from_request(request)

        if img is None:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400

        # ====================================================
        # REAL MODEL
        # ====================================================
        if classifier is not None:

            results = classifier(img)

            top = results[0]

            raw_label = top["label"]

            confidence = float(top["score"])

            class_key = map_label(raw_label)

            logging.info(
                f"Prediction: {raw_label} -> {class_key} ({confidence:.3f})"
            )

        # ====================================================
        # MOCK MODE
        # ====================================================
        else:

            class_key = random.choice(
                list(NUTRITION_DB.keys())
            )

            confidence = random.uniform(0.80, 0.97)

            results = [
                {
                    "label": class_key,
                    "score": confidence
                }
            ]

        # ====================================================
        # NUTRITION
        # ====================================================
        nutrition = NUTRITION_DB.get(
            class_key,
            DEFAULT_NUTRITION
        )

        food_name = class_key.replace("_", " ").title()

        # ====================================================
        # RESPONSE
        # ====================================================
        return jsonify({
            "success":    True,
            "food_name":  food_name,
            "confidence": round(confidence * 100, 2),

            # Flat fields (dễ đọc từ Node.js)
            "calories": nutrition["calories"],
            "protein":  nutrition["protein"],
            "carbs":    nutrition["carbs"],
            "fat":      nutrition["fat"],
            "fiber":    nutrition["fiber"],

            # Nested (giữ tương thích)
            "nutrition": {
                "calories": nutrition["calories"],
                "protein":  nutrition["protein"],
                "carbs":    nutrition["carbs"],
                "fat":      nutrition["fat"],
                "fiber":    nutrition["fiber"],
            },

            "predictions": build_prediction_list(results),
            "model_info": {
                "model":  MODEL_ID,
                "device": "GPU" if DEVICE == 0 else "CPU",
                "mode":   "real" if classifier else "mock"
            }
        })


    except Exception as e:

        logging.exception("Prediction error")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":

    print("\n===================================")
    print("      FoodAI ViT Service")
    print("===================================")
    print(f"Model : {MODEL_ID}")
    print(f"Device: {'GPU' if DEVICE == 0 else 'CPU'}")
    print(f"Status: {'LOADED' if classifier else 'MOCK MODE'}")
    print("URL   : http://0.0.0.0:5000")
    print("===================================\n")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )