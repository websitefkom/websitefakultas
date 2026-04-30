import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Buffer or File-like object to Cloudinary using uploader.upload
export const uploadToCloudinary = async (fileOrBuffer, folder = 'ukm', options = {}) => {
  try {
    const uploadOpts = { folder, resource_type: 'auto', ...options };

    // If already a URL, assume it's uploaded
    if (typeof fileOrBuffer === 'string' && fileOrBuffer.startsWith('http')) {
      return { success: true, url: fileOrBuffer };
    }

    // If string path to existing file, upload by path (works for tmp files)
    if (typeof fileOrBuffer === 'string' && fs.existsSync(fileOrBuffer)) {
      const res = await cloudinary.uploader.upload(fileOrBuffer, uploadOpts);
      if (!res || !res.secure_url) throw new Error('Cloudinary did not return secure_url');
      return { success: true, url: res.secure_url, public_id: res.public_id, raw: res };
    }

    // If Buffer, use upload_stream for reliable streaming
    if (Buffer.isBuffer(fileOrBuffer)) {
      const res = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOpts, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(fileOrBuffer);
      });
      if (!res || !res.secure_url) throw new Error('Cloudinary did not return secure_url');
      return { success: true, url: res.secure_url, public_id: res.public_id, raw: res };
    }

    // If file-like browser File (has arrayBuffer), convert to Buffer and stream
    if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      const arrayBuffer = await fileOrBuffer.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const res = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOpts, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });
      if (!res || !res.secure_url) throw new Error('Cloudinary did not return secure_url');
      return { success: true, url: res.secure_url, public_id: res.public_id, raw: res };
    }

    throw new Error('Invalid input to uploadToCloudinary (expected Buffer, file path, URL, or File-like object)');
  } catch (err) {
    return { success: false, message: err.message || 'Cloudinary upload failed' };
  }
};

export const deleteCloudinaryAsset = async (public_id) => {
  try {
    if (!public_id) return { success: false, message: 'Missing public_id' };
    // Try deleting as image first, then raw (pdf/doc) if not found
    let res = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
    if (res && (res.result === 'ok' || res.result === 'not found')) {
      return { success: true, raw: res };
    }
    // Try raw resource type (for PDFs or other raw assets)
    res = await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' });
    if (res && (res.result === 'ok' || res.result === 'not found')) {
      return { success: true, raw: res };
    }
    return { success: false, message: 'Delete failed or asset not found', raw: res };
  } catch (err) {
    return { success: false, message: err.message || 'Delete failed' };
  }
};

// Helper: extract public_id from Cloudinary URL when possible
export const publicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    // Cloudinary URL usually contains /v123456/ and then public_id.ext
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    const idx = last.lastIndexOf('.');
    const public_id = idx > 0 ? last.substring(0, idx) : last;
    // include folder path (parts between cloud name and version)
    // find index of 'upload' segment
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex >= 0) {
      const folderParts = parts.slice(uploadIndex + 2, parts.length - 1); // skip version
      const folderPath = folderParts.join('/');
      return folderPath ? `${folderPath}/${public_id}` : public_id;
    }
    return public_id;
  } catch (err) {
    return null;
  }
};