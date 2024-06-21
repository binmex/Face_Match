const express = require('express');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const cors = require("cors");

const app = express();

// Monkey patch the faceapi canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
}

// Cargar los modelos al iniciar la aplicación
// Cargar los modelos al iniciar la aplicación
loadModels().then(() => {
  console.log('Models loaded');

  app.set("PORT", process.env.PORT || 4000);

  //middelware
  app.use(cors());
  app.use(express.json());

  app.use('/face', require('./routes/matchFace.js'));

  app.listen(app.get("PORT"), () => {
    console.log(`Server running at http://localhost:${app.get("PORT")}`);
  });

}).catch(err => {
  console.error('Error loading models:', err);
});