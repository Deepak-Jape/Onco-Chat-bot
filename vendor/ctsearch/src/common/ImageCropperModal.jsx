import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "#fff",
  borderRadius: "12px",
  boxShadow: 24,
  p: 3,
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const size = 69; // 👈 final size

  canvas.width = size;
  canvas.height = size;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/png");
  });
}

export default function ImageCropperModal({ open, image, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    onSave(croppedImage);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ position: "relative", width: "100%", height: 300 }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </Box>

        <Box mt={2}>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, z) => setZoom(z)}
            sx={{
              color: "#2666BE",
            }}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button
            sx={{
              color: "#F15757",
              fontSize: "14px",
              width: "85px",
              height: "36px",
              textTransform: "capitalize",
              fontWeight: "500",
            }}
            variant="text"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            sx={{
              borderColor: "#2666BE",
              backgroundColor: "#2666BE",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "500",
              width: "85px",
              height: "36px",
              textTransform: "capitalize",
            }}
            variant="contained"
            onClick={handleSave}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
