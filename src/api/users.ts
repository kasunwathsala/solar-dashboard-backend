import express from "express";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";
import { getAllUsers, syncUsersFromClerk } from "../application/users";

const usersRouter = express.Router();

usersRouter.route("/").get(getAllUsers);
// Temporarily removed authorization - only authentication required
// After first sync, set admin role in Clerk dashboard and re-enable authorizationMiddleware
usersRouter.route("/sync").post(
  authenticationMiddleware,
  syncUsersFromClerk
);

export default usersRouter;