const LOGO_URL = 'https://patient-doctor-medical-solution-production.up.railway.app/assets/logo.png';
const APP_URL  = 'https://patient-doctor-medical-solution-production.up.railway.app';

function otpTemplate({ otp, heading, subheading, purpose }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading} – Kalp Hospital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Inter',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0066CC 0%,#008B8B 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="PDMS – Kalp Hospital" width="160" style="display:block;margin:0 auto 20px;max-width:160px;" />
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${heading}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${subheading}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Hello,<br/>
                Use the one-time password below to complete your <strong>${purpose}</strong>.
                This OTP is valid for <strong>10 minutes</strong> and can only be used once.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#e8f4ff 0%,#e6f7f7 100%);border:2px solid #0066CC;border-radius:16px;padding:28px 48px;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#0066CC;letter-spacing:2px;text-transform:uppercase;">Your OTP</p>
                      <p style="margin:0;font-size:48px;font-weight:800;color:#001F3F;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fff8ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                      ⚠️ <strong>Never share this OTP</strong> with anyone. Our team will never ask for it. If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Having trouble? Visit <a href="${APP_URL}" style="color:#0066CC;text-decoration:none;font-weight:600;">Kalp Hospital</a> or contact our support team.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#001F3F;">Kalp Hospital – Patient Doctor Management System</p>
              <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Premier Healthcare Excellence · Ahmedabad, India</p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

          <!-- Bottom space -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Kalp Hospital. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function receiptTemplate({ patientName, doctorName, department, slotDate, slotStart, transactionId, amountPaid }) {
  const formattedDate = new Date(slotDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const rows = [
    ['Doctor',       `Dr. ${doctorName}`],
    ['Department',   department],
    ['Date',         formattedDate],
    ['Time',         slotStart],
    ['Amount Paid',  `&#8377;${Number(amountPaid).toFixed(2)}`],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmed – Kalp Hospital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0066CC 0%,#008B8B 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PDMS – Kalp Hospital" width="160" style="display:block;margin:0 auto 20px;max-width:160px;" />
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:50px;padding:6px 20px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">&#10003; Payment Successful</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Appointment Confirmed</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your slot has been reserved at Kalp Hospital</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
              Hello <strong>${patientName}</strong>,<br/>
              Your appointment is confirmed. Please arrive 10 minutes early. Here are your booking details:
            </p>

            <!-- Receipt table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              ${rows.map(([label, value]) => `
              <tr>
                <td style="background:#f9fafb;padding:14px 20px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
                <td style="background:#ffffff;padding:14px 20px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
              </tr>`).join('')}
            </table>

            <!-- Transaction ID -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:linear-gradient(135deg,#e8f4ff,#e6f7f7);border:2px solid #0066CC;border-radius:10px;padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#0066CC;letter-spacing:2px;text-transform:uppercase;">Transaction ID</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#001F3F;font-family:'Courier New',monospace;word-break:break-all;">${transactionId}</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${APP_URL}/patient/appointments"
                     style="display:inline-block;background:linear-gradient(135deg,#0066CC,#008B8B);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                    View My Appointments
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#001F3F;">Kalp Hospital – Patient Doctor Management System</p>
            <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Premier Healthcare Excellence · Ahmedabad, India</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated email. Please do not reply directly to this message.</p>
          </td>
        </tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Kalp Hospital. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function cancellationTemplate({ patientName, doctorName, slotDate, slotStart, reason }) {
  const formattedDate = new Date(slotDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const rows = [
    ['Doctor',  `Dr. ${doctorName}`],
    ['Date',    formattedDate],
    ['Time',    slotStart],
    ['Reason',  reason],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Cancelled – Kalp Hospital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0066CC 0%,#008B8B 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PDMS – Kalp Hospital" width="160" style="display:block;margin:0 auto 20px;max-width:160px;" />
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:50px;padding:6px 20px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Appointment Cancelled</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Your Appointment Has Been Cancelled</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Kalp Hospital</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
              Hello <strong>${patientName}</strong>,<br/>
              Your appointment has been cancelled by the hospital. No further action is required on your part.
              If a payment was made, a refund will be processed to your original payment method.
            </p>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              ${rows.map(([label, value]) => `
              <tr>
                <td style="background:#f9fafb;padding:14px 20px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
                <td style="background:#ffffff;padding:14px 20px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
              </tr>`).join('')}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${APP_URL}/patient/dashboard"
                     style="display:inline-block;background:linear-gradient(135deg,#0066CC,#008B8B);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                    Book Another Appointment
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#001F3F;">Kalp Hospital – Patient Doctor Management System</p>
            <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Premier Healthcare Excellence · Ahmedabad, India</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated email. Please do not reply directly to this message.</p>
          </td>
        </tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Kalp Hospital. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function rescheduleTemplate({ patientName, doctorName, department, newSlotDate, newSlotStart, oldSlotDate, oldSlotStart }) {
  const fmt = d => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const rows = [
    ['Doctor',    `Dr. ${doctorName}`],
    ['Department', department],
    ['New Date',  fmt(newSlotDate)],
    ['New Time',  newSlotStart],
    ['Previous Date', fmt(oldSlotDate)],
    ['Previous Time', oldSlotStart],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Rescheduled – Kalp Hospital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#0066CC 0%,#008B8B 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <img src="${LOGO_URL}" alt="PDMS" width="160" style="display:block;margin:0 auto 20px;max-width:160px;" />
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:50px;padding:6px 20px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">&#8635; Appointment Rescheduled</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Your Appointment Has Been Rescheduled</h1>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Kalp Hospital</p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;">
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
              Hello <strong>${patientName}</strong>,<br/>
              Your appointment has been rescheduled by the hospital. Please arrive 10 minutes early for your new slot.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              ${rows.map(([label, value]) => `
              <tr>
                <td style="background:#f9fafb;padding:14px 20px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
                <td style="background:#ffffff;padding:14px 20px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
              </tr>`).join('')}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${APP_URL}/patient/appointments"
                     style="display:inline-block;background:linear-gradient(135deg,#0066CC,#008B8B);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                    View My Appointments
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="background:#ffffff;padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" /></td></tr>

        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#001F3F;">Kalp Hospital – Patient Doctor Management System</p>
            <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">Premier Healthcare Excellence · Ahmedabad, India</p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">This is an automated email. Please do not reply directly to this message.</p>
          </td>
        </tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Kalp Hospital. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { otpTemplate, receiptTemplate, cancellationTemplate, rescheduleTemplate };
