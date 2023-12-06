import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
const validate_auth_request = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      token = authorization.split(" ")[1];
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await UserModel.findById(id).select("-password");
      next();
    } catch (error) {
      res.send({ status: "failed", message: error.message });
    }
  } else {
    res.send({ status: "failed", message: "Unauthorized User" });
  }
};

export default validate_auth_request;
