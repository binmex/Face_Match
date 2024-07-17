const crypto = require("crypto");

const secret = process.env.SECRET_KEY

const encrypt = (text) => {
  const keyBuffer = Buffer.from(secret, "utf8");
  const iv = Buffer.from(process.env.SECRET_IV, "utf8");;
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");

  const keyBuffer = Buffer.from(secret, "utf8");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = { encrypt, decrypt };
