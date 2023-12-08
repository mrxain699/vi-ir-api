import dotenv from "dotenv";
import crypto from "crypto";
import { ImageModel, FileModel } from "../models/FileUploadModel.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mongoose, { mongo } from "mongoose";

dotenv.config();
class FileController {
  static bucketName = process.env.BUCKET_NAME;
  static bucketRegion = process.env.BUCKET_REGION;
  static accessKey = process.env.ACCESS_KEY;
  static secretAccessKey = process.env.SECRET_ACCESS_KEY;

  static s3 = new S3Client({
    credentials: {
      accessKeyId: FileController.accessKey,
      secretAccessKey: FileController.secretAccessKey,
    },
    region: FileController.bucketRegion,
  });

  static uploadFiles = async (req, res) => {
    const randomFileName = (bytes = 32) =>
      crypto.randomBytes(bytes).toString("hex");
    const tempFileName = randomFileName();
    const fileType = req.file.originalname.split(".").pop();
    const upload_file_name = tempFileName + "." + fileType;

    const params = {
      Bucket: FileController.bucketName,
      Key: upload_file_name,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    try {
      let save_file = null;
      const file_type = req.file.mimetype.split("/")[0];

      if (file_type === "image") {
        const check_if_already_exist = await ImageModel.findOne({
          file_org_name: req.file.originalname,
        });
        if (check_if_already_exist) {
          res.send({ status: "failed", message: "Image already exists" });
        } else {
          save_file = new ImageModel({
            file_org_name: req.file.originalname,
            file_temp_name: upload_file_name,
            file_type: req.file.mimetype,
          });
        }
      } else {
        const check_if_already_exist = await FileModel.findOne({
          file_org_name: req.file.originalname,
        });
        if (check_if_already_exist) {
          res.send({ status: "failed", message: "File already exists" });
        } else {
          save_file = await new FileModel({
            file_org_name: req.file.originalname,
            file_temp_name: upload_file_name,
            file_type: req.file.mimetype,
          });
        }
      }
      if (save_file) {
        await save_file
          .save()
          .then(async () => {
            const response = await FileController.s3.send(command);
            if (response) {
              res.send({
                status: "success",
                message: "File upload successfully",
              });
            }
          })
          .catch((error) => {
            res.send({
              status: "failed",
              message: error.message,
            });
          });
      }
    } catch (error) {
      res.send({ status: "failed on catch", message: error.message });
    }
  };

  static getFiles = async (req, res) => {
    const { directory } = req.params;
    if (directory) {
      try {
        let files = null;
        if (directory === "images") {
          files = await ImageModel.find({});
        } else {
          files = await FileModel.find({});
        }
        if (files.length > 0) {
          let updated_files = [];
          for (let file of files) {
            const getObjectParams = {
              Bucket: FileController.bucketName,
              Key: file.file_temp_name,
            };
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(FileController.s3, command);
            file.file_url = url;
            updated_files.push(file);
          }
          res.send({
            status: "success",
            files: updated_files,
          });
        } else {
          res.send({
            status: "failed",
            message: "Files not found",
          });
        }
      } catch (error) {
        res.send({ status: "failed", message: error.message });
      }
    } else {
      res.send({ status: "failed", message: "Invalid parameters" });
    }
  };

  static getTotalDirectories = async (req, res) => {
    try {
      let directory_collections = [];
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      if (collections.length > 0) {
        for (const collection of collections) {
          if (collection.name !== "users") {
            directory_collections.push(collection);
          }
        }
        res.send({
          status: "success",
          directories: directory_collections.length,
        });
      } else {
        res.send({
          status: "success",
          message: "No directory found",
        });
      }
    } catch (error) {
      res.send({
        status: "failed",
        message: error.message,
      });
    }
  };

  static getTotalFiles = async (req, res) => {
    const { directory } = req.params;
    try {
      let total_files = null;
      if (directory) {
        if (directory === "images") {
          total_files = await ImageModel.find({}).count();
          res.send({ status: "success", files: total_files });
        } else {
          total_files = await FileModel.find({}).count();
          res.send({ status: "success", files: total_files });
        }
      }
    } catch (error) {
      res.send({ status: "failed", message: error.message });
    }
  };

  static deleteFile = async (req, res) => {
    const { directory, id } = req.params;
    if (directory && id) {
      try {
        let file = null;
        if (directory === "images") {
          file = await ImageModel.findById(id).exec();
        } else {
          file = await FileModel.findById(id).exec();
        }
        if (file) {
          const params = {
            Bucket: FileController.bucketName,
            Key: file.file_temp_name,
          };
          const command = new DeleteObjectCommand(params);
          const response = await FileController.s3.send(command);
          if (response) {
            let deleted_file = null;
            if (directory === "images") {
              deleted_file = await ImageModel.deleteOne({ _id: id });
            } else {
              deleted_file = await FileModel.deleteOne({ _id: id });
            }
            if (deleted_file) {
              res.send({
                status: "success",
                message: "File deletd successfully",
              });
            } else {
              res.send({
                status: "failed",
                message: "File not deletd",
              });
            }
          }
        } else {
          res.send({ status: "failed", message: "File not found" });
        }
      } catch (error) {
        res.send({ status: "failed", message: error.message });
      }
    }
  };

  static getSingleFile = async (req, res) => {
    const { directory, filename } = req.params;
    if (directory && filename) {
      try {
        let file = null;
        const searchQuery = { $text: { $search: `${filename}` } };
        if (directory === "images") {
          file = await ImageModel.findOne(searchQuery);
        } else {
          file = await FileModel.findOne(searchQuery);
        }
        if (file) {
          const getObjectParams = {
            Bucket: FileController.bucketName,
            Key: file.file_temp_name,
          };
          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(FileController.s3, command);
          file.file_url = url;
          // const dispositionHeader = `attachment; filename="${file.file_org_name}"`;
          // res.setHeader("Content-Disposition", dispositionHeader);

          // // Set Content-Type header explicitly
          // res.setHeader("Content-Type", file.file_type);
          // res.send(
          //   `
          //   <a href="${file.file_url}" download="${file.file_org_name}" id="downloadLink">
          //     <img src="${file.file_url}" alt="Image" />
          //   </a>
          //   <script>
          //     document.addEventListener("DOMContentLoaded", function() {
          //       document.getElementById("downloadLink").click();
          //     });
          //   </script>
          // `
          // );
          res.send(file.file_url);
        } else {
          res.send({ status: "failed", message: "File not found" });
        }
      } catch (error) {
        res.send({ status: "failed", message: error.message });
      }
    } else {
      res.send({ status: "failed", message: "Invalid directory or filename" });
    }
  };

  // static downloadFile = async (req, res) => {
  //   const { file } = req.params;
  //   try {
  //     const params = {
  //       Bucket: FileController.bucketName,
  //       Key: file,
  //     };
  //     const command = new GetObjectCommand(params);
  //     const response = await FileController.s3.send(command);
  //     if (response) {
  //       res.send(response.Body);
  //     } else {
  //       res.send({ status: "failed", message: "Image not found" });
  //     }
  //   } catch (error) {
  //     res.send({ status: "failed", message: error.message });
  //   }
  // };
}
export default FileController;
