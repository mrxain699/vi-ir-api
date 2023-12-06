import express from "express";

import validate_auth_request from "../middlewares/AuthMiddleware.js";
import UserController from "../controllers/UserController.js";
import FileController from "../controllers/FileController.js";
import multer from "multer";

const web_router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Auth Middleware
web_router.use("/change-password", validate_auth_request);
web_router.use("/user", validate_auth_request);

// Routes

// Post Request
web_router.post("/register", UserController.createUser);
web_router.post("/login", UserController.authenticate);
web_router.post("/change-password", UserController.changePassword);
web_router.post("/upload", upload.single("file"), FileController.uploadFiles);

// Get Request
web_router.get("/user", UserController.getUser);
web_router.get("/files/:directory", FileController.getFiles);
web_router.get("/totalfiles/:directory", FileController.getTotalFiles);
web_router.get("/totaldirectories", FileController.getTotalDirectories);
// web_router.get("/download/:file", FileController.downloadFile);
// Delete Requests
web_router.delete("/delete/:directory/:id", FileController.deleteFile);

export default web_router;
