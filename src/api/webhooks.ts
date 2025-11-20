// import express from 'express';
// const webhooksRouter = express.Router();

// webhooksRouter.post('/clerk', (req, res) => {
//     console.log(req.body);
//     res.status(200).send('Webhook received');
// });

// export default webhooksRouter;

import express from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { User } from "../infrastructure/entities/User";

const webhooksRouter = express.Router();

webhooksRouter.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("=== Webhook received ===");
    console.log("Headers:", req.headers);
    console.log("Body length:", req.body?.length);
    
    try {
      const evt = await verifyWebhook(req);

      // Do something with payload
      // For this guide, log payload to console
      const { id } = evt.data;
      const eventType = evt.type;
      console.log(
        `✅ Webhook verified - ID: ${id}, Event: ${eventType}`
      );
      console.log("Webhook payload:", JSON.stringify(evt.data, null, 2));

      if (eventType === "user.created") {
        const { id } = evt.data;
        const user = await User.findOne({ clerkUserId: id });
        if (user) {
          console.log("User already exists");
          return res.send("User already exists");
        }
        const newUser = await User.create({
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          email: evt.data.email_addresses[0].email_address,
          clerkUserId: id,
        });
        console.log("User created successfully:", {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          clerkUserId: newUser.clerkUserId
        });
      }

      if (eventType === "user.deleted") {
        const { id } = evt.data;
        const deletedUser = await User.findOneAndDelete({ clerkUserId: id });
        if (deletedUser) {
          console.log("User deleted successfully:", {
            id: deletedUser._id,
            firstName: deletedUser.firstName,
            lastName: deletedUser.lastName,
            email: deletedUser.email,
            clerkUserId: deletedUser.clerkUserId,
            deletedAt: new Date().toISOString()
          });
        } else {
          console.log("User not found for deletion:", { clerkUserId: id });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: "Webhook processed successfully",
        eventType,
        userId: id 
      });
    } catch (err) {
      const error = err as Error;
      console.error("❌ Webhook verification failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        headers: req.headers,
        hasBody: !!req.body,
        bodyType: typeof req.body
      });
      return res.status(400).json({ 
        success: false, 
        error: "Webhook verification failed",
        message: error.message 
      });
    }
  }
);

export default webhooksRouter;