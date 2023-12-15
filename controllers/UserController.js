import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
class UserController {
  static createUser = async (req, res) => {
    const { username, password } = req.body;
    try {
      if (username && password) {
        const find_username = await UserModel.findOne({ username: username });
        if (find_username && username === find_username.username) {
          res.send({ status: "failed", message: "Username already exist" });
        } else {
          const salt = await bcrypt.genSalt(16);
          const hash_password = await bcrypt.hash(password, salt);
          const user = new UserModel({
            username: username,
            password: hash_password,
          });
          await user
            .save()
            .then(() => {
              res.send({
                status: "success",
                message: "User saved successfully!",
              });
            })
            .catch(() => {
              res.send({ status: "failed", message: "Could not save user" });
            });
        }
      }
    } catch (error) {
      res.send({ status: "failed", message: error.message });
    }
  };

  static authenticate = async (req, res) => {
    const { username, password } = req.body;
    try {
      if (username && password) {
        const user = await UserModel.findOne({ username: username });
        if (user) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (username === user.username && isMatch) {
            const expiresIn = 7 * 24 * 60 * 60;
            const token = jwt.sign(
              {
                id: user._id,
              },
              process.env.JWT_SECRET,
              { expiresIn: expiresIn }
            );
            res.send({
              status: "success",
              message: "Login Successfully",
              token: token,
            });
          } else {
            res.send({
              status: "failed",
              message: "Wrong username or password",
            });
          }
        } else {
          res.send({ status: "failed", message: "Wrong username or password" });
        }
      } else {
        res.send({ status: "failed", message: "Both fields are required" });
      }
    } catch (error) {
      res.send({ status: "failed", message: error.message });
    }
  };

  static getUser = async (req, res) => {
    if (req.user) {
      res.send({ status: "success", user: req.user });
    } else {
      res.send({ status: "failed", message: "User not found" });
    }
  };

  static changePassword = async (req, res) => {
    const { password, confirm_password } = req.body;
    try {
      if (password && confirm_password && req.user) {
        if (password === confirm_password) {
          const salt = await bcrypt.genSalt(16);
          const hash_password = await bcrypt.hash(password, salt);
          const user = await UserModel.findOne({ _id: req.user._id });
          if (user) {
            const change_password = await UserModel.updateOne(
              { _id: user._id },
              { $set: { password: hash_password } }
            );
            if (
              change_password.modifiedCount > 0 &&
              change_password.acknowledged
            ) {
              res.send({
                status: "success",
                message: "Password changed successfully!",
              });
            } else {
              res.send({
                status: "failed",
                message: "Password did not changed!",
              });
            }
          }
        } else {
          res.send({ status: "failed", message: "Passwords do not match" });
        }
      } else {
        res.send({ status: "failed", message: "fields are required" });
      }
    } catch (error) {
      res.send({ status: "failed", message: error.message });
    }
  };
}

export default UserController;
