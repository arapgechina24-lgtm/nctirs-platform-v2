import cv2
import os
import urllib.request
import numpy as np
import warnings

# Suppress PyTorch/Ultralytics warnings for clean output
warnings.filterwarnings('ignore')

try:
    from ultralytics import YOLO
except ImportError as e:
    print("❌ ERROR: Ultralytics YOLOv8 not installed. Please run: pip install -r requirements-local.txt")
    exit(1)

print("NSSPIP AI: Initializing Computer Vision Prototype...")

# 1. Download a "Surveillance" sample image
# A picture of a busy street or people with bags
SAMPLE_URL = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1470&auto=format&fit=crop"
SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "surveillance_input.jpg")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "surveillance_output_annotated.jpg")

print(f"Downloading sample surveillance feed image from Unsplash...")
try:
    urllib.request.urlretrieve(SAMPLE_URL, SAMPLE_PATH)
except Exception as e:
    print(f"❌ Failed to download sample image: {e}")
    exit(1)

# 2. Load the YOLOv8-nano model (Fastest, lightest)
print("Loading Ultralytics YOLOv8n Security Model...")
# This will automatically download yolov8n.pt on the first run
model = YOLO('yolov8n.pt') 

# COCO Classes relevant to Security/Policing
# 0: 'person'
# 24: 'backpack'
# 25: 'umbrella' (often triggers false positives for concealed items)
# 26: 'handbag'
# 28: 'suitcase'
# 43: 'knife'
TARGET_CLASSES = [0, 24, 26, 28, 43]

# 3. Run Inference
print("Executing Target Threat Detection...")
results = model(SAMPLE_PATH, classes=TARGET_CLASSES, conf=0.35)

if not results:
    print("No relevant objects detected.")
    exit(0)

# 4. Process and Annotate
result = results[0] # First image
img = cv2.imread(SAMPLE_PATH)

alerts = 0
for box in result.boxes:
    # Bounding Box
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    
    # Class ID and Confidence
    cls_id = int(box.cls[0])
    conf = float(box.conf[0])
    
    label = model.names[cls_id]
    
    # Visuals: Red for suspicious items (bags/knives), Green for persons
    is_suspicious = cls_id in [24, 26, 28, 43]
    color = (0, 0, 255) if is_suspicious else (0, 255, 0) # BGR
    
    # Draw Rectangle
    cv2.rectangle(img, (x1, y1), (x2, y2), color, 3)
    
    # Draw Label
    text = f"{label.upper()} {conf:.2f}"
    cv2.putText(img, text, (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    if is_suspicious:
        alerts += 1
        print(f"🚨 ALERT DETECTED: {label.upper()} (Confidence: {conf:.1%}) at [{x1},{y1},{x2},{y2}]")
    else:
        print(f"✓ Tagged: {label.upper()} (Confidence: {conf:.1%})")

# 5. Save Output
cv2.imwrite(OUTPUT_PATH, img)
print(f"\n✅ CV Processing Complete!")
print(f"Total Suspicious Artifacts Flagged: {alerts}")
print(f"Annotated frame saved to: {OUTPUT_PATH}")
