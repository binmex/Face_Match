const axios = require('axios');
const canvas = require('canvas');
const faceapi = require('face-api.js');
async function getImageDescriptor(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000 // 10 segundos de tiempo de espera
    });

    const buffer = Buffer.from(response.data, 'binary');
    const img = await canvas.loadImage(buffer);
    
    const detections = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detections) {
      throw new Error('No face detected in the image');
    }
    
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
      getImageDescriptor(imageUrl1),
      getImageDescriptor(imageUrl2),
    ]);

    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const similarity = 1 - distance;

    res.json({
      distance,
      similarity,
      isSamePerson: similarity > 0.6,
    });
  } catch (error) {
    console.error("Error processing images:", error);
    res
      .status(500)
      .json({ error: "Error processing images", details: error.message });
  }
};
