import express from "express";
import {
  getInvoicesForUser,
  getAllInvoices,
  getInvoiceById,
  createCheckoutSession,
  getSessionStatus,
  handleStripeWebhook,
  generateInvoiceManually,
} from "../application/invoices";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { authorizationMiddleware } from "./middlewares/authorization-middleware";

const invoicesRouter = express.Router();

// Stripe webhook is registered directly in index.ts BEFORE auth/json middleware

// User routes
invoicesRouter.get(
  "/user/me",
  authenticationMiddleware,
  getInvoicesForUser
);

invoicesRouter.get(
  "/:id",
  authenticationMiddleware,
  getInvoiceById
);

// Payment routes
invoicesRouter.post(
  "/create-checkout-session",
  authenticationMiddleware,
  createCheckoutSession
);

invoicesRouter.get(
  "/session-status",
  authenticationMiddleware,
  getSessionStatus
);

// Admin routes
invoicesRouter.get(
  "/",
  authenticationMiddleware,
  authorizationMiddleware,
  getAllInvoices
);

invoicesRouter.post(
  "/generate",
  authenticationMiddleware,
  authorizationMiddleware,
  generateInvoiceManually
);

export default invoicesRouter;
