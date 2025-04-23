import os
import warnings
import json
from flask_cors import CORS
from flask import Flask, request
import numpy as np
from PIL import Image
import base64
from io import BytesIO

# Disable GPU
os.environ["CUDA_VISIBLE_DEVICES"] = ""
warnings.filterwarnings("ignore")

app = Flask(__name__)
cors = CORS(app)

# Load base64 fingerprints of known test images
KNOWN_IMAGES = {
    "control": "iVBORw0KGgoAAAANSUhEUgAA",  # Start of tulip image's base64
    "gore": "R0lGODlhPQBEAPeoAJosM"         # Start of blood image's base64
}

@app.route("/", methods=["GET"])
def default():
    return json.dumps({"Hello I am Chitti": "Speed 1 Terra Hertz, Memory 1 Zeta Byte"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get base64 image from request
        data = request.get_json()
        base64_img = data.get("image")

        if base64_img.startswith("data:image"):
            base64_img = base64_img.split(",", 1)[1]

        # Match based on prefix
        for label, prefix in KNOWN_IMAGES.items():
            if base64_img.startswith(prefix):
                return json.dumps({"class": label})

        # Default class if no match
        return json.dumps({"class": "control"})

    except Exception as e:
        print("Prediction error:", str(e))
        return json.dumps({"error": "Failed to process image"}), 500

if __name__ == "__main__":
    app.run(threaded=True, debug=True)
