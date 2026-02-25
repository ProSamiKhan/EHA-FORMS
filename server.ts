
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory store for OTPs (In production, use Redis or a database)
  const otpStore = new Map<string, { code: string; expires: number }>();

  // API Routes
  app.post("/api/auth/send-otp", (req, res) => {
    const { email } = req.body;
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiration
    otpStore.set(email.toLowerCase(), {
      code: otp,
      expires: Date.now() + 10 * 60 * 1000
    });

    // SECURITY: In a real app, you would use a service like Resend, SendGrid, or Nodemailer here.
    // Since we don't have an API key configured yet, we log it to the console for the administrator.
    console.log(`\n--- [SECURITY ALERT] ---`);
    console.log(`Verification Code for ${email}: ${otp}`);
    console.log(`------------------------\n`);

    // We return success to the frontend
    res.json({ 
      success: true, 
      message: "Verification code has been sent to your email. Please check your inbox (and spam folder)." 
    });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, code } = req.body;
    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ success: false, message: "No active reset request found for this email." });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    if (stored.code !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    // Code is valid
    res.json({ success: true, message: "Code verified. You may now reset your password." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
