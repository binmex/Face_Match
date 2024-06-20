const express = require('express');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const cors = require("cors");

const app = express();
const port = 3000;

// Monkey patch the faceapi canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models
async function loadModels() {
  const modelPath = path.join(__dirname, 'models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
}

// Cargar los modelos al iniciar la aplicación
loadModels().then(() => {
  console.log('Models loaded');
}).catch(err => {
  console.error('Error loading models:', err);
});

//middelware
app.use(cors());
app.use(express.json());

app.use('/face', require('./routes/matchFace.js'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});