const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = crypto.randomBytes(12).toString("hex") + ext.toLowerCase();
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  const allowed = /image\/(png|jpe?g|gif|webp)/i;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (png, jpg, gif, webp) are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
