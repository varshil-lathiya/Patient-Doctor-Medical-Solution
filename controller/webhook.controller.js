const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("../config/db.config");
const mailSender = require("../utils/mail_sender");
const { receiptTemplate } = require("../utils/email_templates");
const logger = require("../utils/logger");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn("WEBHOOK", "Signature verification failed", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const { slot_id, patient_id } = session.metadata || {};

  try {
    const [result] = await db.execute(
      "UPDATE appointment_slots SET patient_id = ?, status = 'is_occupied' WHERE id = ? AND status = 'is_available'",
      [patient_id, slot_id]
    );

    if (result.affectedRows === 0) {
      logger.warn("WEBHOOK", "Slot already processed or unavailable", { slot_id, patient_id });
      return res.status(200).json({ received: true });
    }

    logger.info("WEBHOOK", "Slot booked via webhook", { slot_id, patient_id });

    const [rows] = await db.execute(
      `SELECT p.firstname AS patient_first, p.lastname AS patient_last, p.email,
              s.firstname AS doc_first, s.lastname AS doc_last,
              dd.department,
              a.slot_date, a.slot_start
       FROM appointment_slots a
       JOIN staff s ON a.doctor_id = s.id
       JOIN doctor_details dd ON s.id = dd.doctor_id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [slot_id]
    );

    if (rows.length > 0) {
      const r = rows[0];
      const html = receiptTemplate({
        patientName: `${r.patient_first} ${r.patient_last}`,
        doctorName: `${r.doc_first} ${r.doc_last}`,
        department: r.department,
        slotDate: r.slot_date,
        slotStart: r.slot_start,
        transactionId: session.payment_intent,
        amountPaid: session.amount_total / 100,
      });

      mailSender(r.email, "Your Appointment is Confirmed – Kalp Hospital", "", html);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("WEBHOOK", "DB error processing webhook", { error: error.message, slot_id, patient_id });
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { handleStripeWebhook };
