import express from "express";
import userRoutes from "./routes/user.route";
import { errorHandler } from "middlewares/error-handler.middleware";

const app = express();
app.use(express.json());
app.use("/users", userRoutes);
app.use(errorHandler);

app.listen(3000, () => console.log("Server is running on port 3000"));