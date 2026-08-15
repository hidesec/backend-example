import { UserController } from "controllers/user.controller";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const userController = container.resolve(UserController);

router.post("/", userController.createUser);
router.get("/:id", userController.getUserById);

export default router;