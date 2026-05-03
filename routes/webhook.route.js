const express = require("express");
const webhookController = require("../controller/webhook.controller");

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookController.handleStripeWebhook
);

module.exports = router;
