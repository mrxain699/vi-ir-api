import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./config/connect.js";
import web_router from "./routes/routes.js";

dotenv.config();
const PORT = process.env.PORT;
const DATABASE_URI = process.env.DATABASE_URI;

const app = express();

app.use(cors());
app.use(express.json());

connect(DATABASE_URI);

app.use("/api", web_router);

app.listen(PORT, () => {
  console.log(`Server Listening on port at http://localhost:${PORT}`);
});
