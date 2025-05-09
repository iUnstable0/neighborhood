import formidable from "formidable";
import fs from "fs";
import { uploadToS3 } from "../utils/s3.js";
import { checkUser } from "../utils/airtable.js";

export async function uploadVideo(req, res) {
  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const token = Array.isArray(fields.token) ? fields.token[0] : fields.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is required" });
    }

    const user = await checkUser(token);
    if (user == false) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    const fileBuffer = fs.readFileSync(file.filepath);
    const s3Key = `omg-moments/${Date.now()}-${file.originalFilename}`;
    const s3Upload = await uploadToS3(fileBuffer, s3Key, file.mimetype);

    fs.unlinkSync(file.filepath);

    res.status(200).json({
      url: s3Upload.Location,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
}

export async function uploadIcon(req, res) {
  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: function ({name, originalFilename, mimetype}) {
        // Keep only image files
        return mimetype && mimetype.includes("image");
      }
    });

    try {
      const [fields, files] = await form.parse(req);
      console.log("Parsed fields:", fields); // Debug log
      console.log("Parsed files:", files); // Debug log

      const token = Array.isArray(fields.token) ? fields.token[0] : fields.token;

      if (!token) {
        return res
          .status(401)
          .json({ message: "Authentication token is required" });
      }

      const user = await checkUser(token);
      if (user == false) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // In formidable v3, files is an array of arrays where each inner array contains the files for a field
      if (!files.file || !files.file[0]) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = files.file[0]; // Get the first file from the 'file' field
      console.log("File object:", file); // Debug log

      // File type validation is now handled by the filter option above
      const fileBuffer = fs.readFileSync(file.filepath);
      const s3Key = `omg-moments/${Date.now()}-${file.originalFilename}`;
      const s3Upload = await uploadToS3(fileBuffer, s3Key, file.mimetype);

      // Clean up the temporary file
      try {
        fs.unlinkSync(file.filepath);
      } catch (unlinkError) {
        console.error("Error cleaning up temporary file:", unlinkError);
        // Continue execution even if cleanup fails
      }

      res.status(200).json({
        url: s3Upload.Location,
      });
    } catch (parseError) {
      console.error("Form parse error:", parseError);
      return res.status(400).json({ 
        message: "Error parsing form data",
        details: parseError.message
      });
    }
  } catch (error) {
    console.error("Error uploading icon:", error);
    res.status(500).json({ 
      message: "Error uploading icon",
      details: error.message
    });
  }
}

export async function uploadImages(req, res) {
  try {
    const form = formidable({
      multiples: true, // Enable multiple file uploads
      keepExtensions: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const token = Array.isArray(fields.token) ? fields.token[0] : fields.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token is required" });
    }

    const user = await checkUser(token);
    if (user == false) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!files.files) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Handle both single and multiple file uploads
    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
    const uploadedUrls = [];

    for (const file of uploadedFiles) {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        continue; // Skip non-image files
      }

      const fileBuffer = fs.readFileSync(file.filepath);
      const s3Key = `omg-moments/${Date.now()}-${file.originalFilename}`;
      const s3Upload = await uploadToS3(fileBuffer, s3Key, file.mimetype);
      uploadedUrls.push(s3Upload.Location);

      fs.unlinkSync(file.filepath);
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({ message: "No valid images were uploaded" });
    }

    res.status(200).json({
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({ message: "Error uploading images" });
  }
}
