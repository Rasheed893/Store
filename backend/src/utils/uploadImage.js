const uploadImage = async (buffer, mimetype, path) => {
  const { v4: uuidv4 } = require("uuid");
  const { getStorage } = require("firebase-admin/storage");
  const storage = getStorage();

  const fileName = `${uuidv4()}.jpg`;
  const file = storage.bucket().file(`${path}/${fileName}`);

  const stream = file.createWriteStream({
    metadata: { contentType: mimetype },
  });

  return new Promise((resolve, reject) => {
    stream.on("error", reject);
    stream.on("finish", async () => {
      await file.makePublic(); // or generate signed URL
      console.log(
        "Uploaded public file URL:",
        `https://storage.googleapis.com/${file.bucket.name}/${file.name}`
      );
      const url = `https://storage.googleapis.com/${file.bucket.name}/${file.name}`;
      resolve(url); // ✅ return only string
    });
    stream.end(buffer);
  });
};
module.exports = uploadImage;
