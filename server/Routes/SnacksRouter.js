import express from "express";
import {
  getAllSnacks,
  getSnack,
  createSnack,
  updateSnack,
  deleteSnack,
} from "../controllers/snackController.js";
import { protectAdmin } from "../middleware/auth.js";

const snackRouter = express.Router();

snackRouter.get("/all", getAllSnacks);

snackRouter.get("/:id", getSnack);


snackRouter.post("/add", protectAdmin, createSnack);


snackRouter.put("/update/:id", protectAdmin, updateSnack);

snackRouter.delete("/delete/:id", protectAdmin, deleteSnack);

export default snackRouter;
