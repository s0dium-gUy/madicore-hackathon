const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists inside the backend folder
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^\.(pdf|jpeg|jpg|png)$/i;
  const allowedMimeTypes = /^(application\/pdf|image\/jpeg|image\/png)$/i;

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = allowedMimeTypes.test(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Image formats (jpeg, jpg, png) are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload.single('medicalLicenseDocument');
