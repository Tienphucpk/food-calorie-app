"""
Script download model ViT từ HuggingFace về cache local.
Chạy 1 lần trước khi start app: python download_model.py
"""
from transformers import pipeline

MODEL_ID = "BinhQuocNguyen/food-recognition-vit"

print(f"Đang download model: {MODEL_ID}")
print("Lần đầu sẽ mất vài phút...\n")

# Download và cache model
pipe = pipeline("image-classification", model=MODEL_ID)

print("\nDownload hoàn tất!")
print("Các nhãn model hỗ trợ:")
# Test nhanh để xem labels
from PIL import Image
import requests
from io import BytesIO

# Dùng ảnh mẫu nhỏ để test
try:
    url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/220px-Eq_it-na_pizza-margherita_sep2005_sml.jpg"
    response = requests.get(url, timeout=10)
    img = Image.open(BytesIO(response.content))
    results = pipe(img)
    print("\nTest prediction với ảnh pizza:")
    for r in results[:3]:
        print(f"  {r['label']}: {r['score']*100:.1f}%")
except Exception as e:
    print(f"(Bỏ qua test: {e})")

print("\nModel sẵn sàng! Chạy: python app.py")
