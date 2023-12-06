import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./config/connect.js";
import web_router from "./routes/routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT;
const DATABASE_URI = process.env.DATABASE_URI;

const app = express();

app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "static")));

connect(DATABASE_URI);

app.use("/api", web_router);

app.use("*", (req, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server Listening on port at http://localhost:${PORT}`);
});
