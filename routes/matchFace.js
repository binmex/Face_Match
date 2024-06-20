const express = require('express');
const {matchFace} = require("../controllers/matchFace-controller.js");
const router = express.Router();

router.post('/compare', matchFace);

module.exports = router;