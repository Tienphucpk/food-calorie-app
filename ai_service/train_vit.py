"""
[ignoring loop detection]
Fine-tune ViT model cho hệ thống Food Calorie AI.
Đã tối ưu cho Windows, Python 3.13 và tích hợp kiểm tra thư viện tự động.
"""

import os
import sys
import subprocess
import numpy as np
import torch
from PIL import Image

# 1. Tự động kiểm tra và cài đặt dependency thiếu (scikit-learn)
def ensure_dependencies():
    required = ["scikit-learn", "pandas", "evaluate"]
    for lib in required:
        try:
            if lib == "scikit-learn":
                import sklearn
            else:
                __import__(lib)
        except ImportError:
            print(f"--- Đang cài đặt thư viện thiếu: {lib} ---")
            subprocess.check_call([sys.executable, "-m", "pip", "install", lib])

ensure_dependencies()

from datasets import Dataset, DatasetDict, Features, ClassLabel, Image as DatasetImage
from transformers import (
    ViTImageProcessor,
    ViTForImageClassification,
    TrainingArguments,
    Trainer,
    DefaultDataCollator,
)
import evaluate

# 2. Cấu hình môi trường Windows & Ẩn Warning không cần thiết
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HTTP_PROXY"] = "" # Đảm bảo không bị kẹt proxy
os.environ["HTTPS_PROXY"] = ""

# ============================================================
# CONFIG
# ============================================================
BASE_MODEL  = "google/vit-base-patch16-224"
OUTPUT_DIR  = "./trained_model"
DATASET_PATH = "./dataset/food-101" 
NUM_EPOCHS  = 5
BATCH_SIZE  = 8   # Giữ mức thấp để ổn định trên Windows
LR          = 2e-4

FOOD_CLASSES = [
    "apple_pie", "caesar_salad", "chocolate_cake", "cup_cakes", "donuts",
    "hamburger", "ice_cream", "pancakes", "pizza", "waffles"
]

label2id = {v: i for i, v in enumerate(FOOD_CLASSES)}
id2label = {i: v for i, v in enumerate(FOOD_CLASSES)}

# ============================================================
# 1. LOAD DATASET LOCAL
# ============================================================
def load_local_data():
    print(f"Đang quét dữ liệu từ: {DATASET_PATH} ...")
    images_dir = os.path.join(DATASET_PATH, "images")
    meta_dir = os.path.join(DATASET_PATH, "meta")
    
    train_data = {"image": [], "label": []}
    test_data = {"image": [], "label": []}
    
    try:
        with open(os.path.join(meta_dir, "train.txt"), "r") as f:
            train_list = [line.strip() for line in f.readlines()]
        with open(os.path.join(meta_dir, "test.txt"), "r") as f:
            test_list = [line.strip() for line in f.readlines()]
    except FileNotFoundError:
        print(f"LỖI: Không tìm thấy thư mục meta tại {meta_dir}")
        sys.exit(1)
        
    for item in train_list:
        class_name = item.split("/")[0]
        if class_name in FOOD_CLASSES:
            img_path = os.path.join(images_dir, f"{item}.jpg")
            if os.path.exists(img_path):
                train_data["image"].append(img_path)
                train_data["label"].append(label2id[class_name])
                
    for item in test_list:
        class_name = item.split("/")[0]
        if class_name in FOOD_CLASSES:
            img_path = os.path.join(images_dir, f"{item}.jpg")
            if os.path.exists(img_path):
                test_data["image"].append(img_path)
                test_data["label"].append(label2id[class_name])

    features = Features({
        "image": DatasetImage(),
        "label": ClassLabel(names=FOOD_CLASSES)
    })
    
    train_ds = Dataset.from_dict(train_data, features=features)
    val_ds = Dataset.from_dict(test_data, features=features)
    
    return DatasetDict({"train": train_ds, "validation": val_ds})

dataset = load_local_data()
print(f"Sẵn sàng: {len(dataset['train'])} ảnh train, {len(dataset['validation'])} ảnh val.")

# ============================================================
# 2. PREPROCESSING
# ============================================================
processor = ViTImageProcessor.from_pretrained(BASE_MODEL)

def transform(example_batch):
    inputs = processor(
        [img.convert("RGB") for img in example_batch["image"]],
        return_tensors="pt"
    )
    inputs["labels"] = example_batch["label"]
    return inputs

train_ds = dataset["train"].with_transform(transform)
val_ds   = dataset["validation"].with_transform(transform)

# ============================================================
# 3. LOAD MODEL
# ============================================================
print(f"Đang tải model gốc: {BASE_MODEL}")
model = ViTForImageClassification.from_pretrained(
    BASE_MODEL,
    num_labels=len(FOOD_CLASSES),
    id2label=id2label,
    label2id=label2id,
    ignore_mismatched_sizes=True, # Xử lý classifier mismatch warning
)

# ============================================================
# 4. METRICS (Đã fix scikit-learn dependency)
# ============================================================
def compute_metrics(eval_pred):
    metric = evaluate.load("accuracy")
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return metric.compute(predictions=preds, references=labels)

# ============================================================
# 5. TRAINING
# ============================================================
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    learning_rate=LR,
    warmup_ratio=0.1,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    fp16=torch.cuda.is_available(), # Tự động dùng GPU nếu có
    logging_dir="./logs",
    logging_steps=20,
    remove_unused_columns=False,
    report_to="none"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    compute_metrics=compute_metrics,
    data_collator=DefaultDataCollator(),
)

print("\n--- BẮT ĐẦU TRAINING ---")
trainer.train()

print("\n--- LƯU MODEL ---")
trainer.save_model(OUTPUT_DIR)
processor.save_pretrained(OUTPUT_DIR)
print(f"Thành công! Model lưu tại: {OUTPUT_DIR}")
