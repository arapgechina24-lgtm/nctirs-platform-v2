from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
import base64
import numpy as np

router = APIRouter()
logger = logging.getLogger(__name__)

yolo_available = False
model = None
TARGET_CLASSES = [0, 24, 26, 28, 43] # person, backpack, handbag, suitcase, knife

try:
    import cv2
    from ultralytics import YOLO
    # Ensure model is downloaded
    model = YOLO('yolov8n.pt')
    yolo_available = True
    logger.info("YOLOv8n model loaded successfully for surveillance feed.")
except Exception as e:
    logger.warning(f"Computer Vision / YOLOv8 model not loaded: {e}. 'pip install -r requirements-local.txt' might be needed.")

@router.websocket("/ws")
async def surveillance_feed(websocket: WebSocket):
    await websocket.accept()
    if not yolo_available:
        await websocket.send_text(json.dumps({"error": "YOLO model not initialized on server. Please ensure opencv and ultralytics are installed."}))
        await websocket.close()
        return

    try:
        while True:
            # Expecting base64 encoded image string
            data = await websocket.receive_text()
            try:
                if "," in data:
                    data = data.split(",")[1]
                
                img_bytes = base64.b64decode(data)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if img is None:
                    continue

                # Run inference
                results = model(img, classes=TARGET_CLASSES, conf=0.35, verbose=False)
                
                detections = []
                if results and len(results) > 0:
                    result = results[0]
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cls_id = int(box.cls[0])
                        conf = float(box.conf[0])
                        label = model.names[cls_id]
                        
                        # Mark bags and knives as suspicious tracking targets
                        is_suspicious = cls_id in [24, 26, 28, 43]
                        
                        detections.append({
                            "box": [x1, y1, x2, y2],
                            "label": label,
                            "confidence": round(conf, 3),
                            "is_suspicious": is_suspicious
                        })
                        
                # Send back the JSON bounding boxes
                await websocket.send_text(json.dumps({"detections": detections}))
                
            except Exception as process_error:
                logger.error(f"Error processing frame: {process_error}")
                await websocket.send_text(json.dumps({"error": "Failed to process image frame."}))

    except WebSocketDisconnect:
        logger.info("Client disconnected from surveillance feed.")
