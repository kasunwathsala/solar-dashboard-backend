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

// Stripe webhook (MUST be before express.json() middleware)
// This route is registered in index.ts BEFORE express.json()
invoicesRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

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
