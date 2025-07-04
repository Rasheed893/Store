// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const sharp = require("sharp");
// const path = require("path");
// const os = require("os");
// const fs = require("fs");

// admin.initializeApp();
// const bucket = admin.storage().bucket();

// exports.resizeCoverImage = functions.storage
//   .object()
//   .onFinalize(async (object) => {
//     const filePath = object.name;
//     const contentType = object.contentType;

//     // Only process images inside 'cover' folders
//     if (!contentType.startsWith("image/") || !filePath.includes("/cover/"))
//       return null;

//     const fileName = path.basename(filePath);
//     const tempLocalFile = path.join(os.tmpdir(), fileName);

//     await bucket.file(filePath).download({ destination: tempLocalFile });

//     const sizes = [
//       { label: "thumb", width: 300 },
//       { label: "medium", width: 600 },
//     ];

//     const uploadPromises = sizes.map(async ({ label, width }) => {
//       const resizedFileName = `${label}_${fileName}`;
//       const tempResizedPath = path.join(os.tmpdir(), resizedFileName);
//       const destination = path.join(path.dirname(filePath), resizedFileName);

//       await sharp(tempLocalFile).resize({ width }).toFile(tempResizedPath);

//       await bucket.upload(tempResizedPath, {
//         destination,
//         metadata: { contentType },
//       });

//       await bucket.file(destination).makePublic(); // ✅ Make resized file public
//       fs.unlinkSync(tempResizedPath);
//     });

//     await Promise.all(uploadPromises);
//     fs.unlinkSync(tempLocalFile);
//     return null;
//   });
