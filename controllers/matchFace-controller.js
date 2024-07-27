const axios = require('axios');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const NodeCache = require('node-cache');
const {decrypt} = require('../utils/encryptation')

// Caché para almacenar descriptores de imagen
const descriptorCache = new NodeCache({ stdTTL: 3600 }); // Caché de 1 hora

async function getImageDescriptor(imageUrl) {
  // Verificar si el descriptor está en caché
  const cachedDescriptor = descriptorCache.get(imageUrl);
  if (cachedDescriptor) {
    // Asegurarse de que el descriptor cacheado sea un Float32Array
    return new Float32Array(cachedDescriptor);
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data, 'binary');
    const img = await canvas.loadImage(buffer);
    
    const detections = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      throw new Error('No face detected in the image');
    }
    
    // Almacenar el descriptor en caché (como array normal)
    descriptorCache.set(imageUrl, Array.from(detections.descriptor));
    
    return detections.descriptor;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Timeout while fetching image: ${imageUrl}`);
    }
    throw error;
  }
}

exports.matchFace = async (req, res) => {
  try {
    const { imageUrl1, imageUrl2 } = req.body;

    if (!imageUrl1 || !imageUrl2) {
      return res.status(400).json({ error: "Two image URLs are required" });
    }

    const [descriptor1, descriptor2] = await Promise.all([
      getImageDescriptor(decrypt(imageUrl1)),
      getImageDescriptor(decrypt(imageUrl2)),
    ]);

    // Asegurarse de que los descriptores sean Float32Array
    const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
    const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

    const distance = faceapi.euclideanDistance(desc1, desc2);
    const similarity = 1 - distance;

    res.json({
      distance,
      similarity,
      isSamePerson: similarity > 0.5,
    });
  } catch (error) {
    console.error("Error processing images:", error);
    res
      .status(500)
      .json({ error: "Error processing images", details: error.message });
  }
};
