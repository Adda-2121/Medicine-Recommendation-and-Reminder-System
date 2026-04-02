const multer = require('multer');
const path = require('path');
const fs = require('fs');

const setupUploadStorage = (folderName) => {
  const uploadDir = path.join(__dirname, '..', 'uploads', folderName);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `uploads/${folderName}/`);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${folderName}-` + uniqueSuffix + path.extname(file.originalname));
    }
  });

  return multer({ storage });
};

module.exports = setupUploadStorage;
