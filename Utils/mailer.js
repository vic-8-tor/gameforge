import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export function sendCode(to, code) {
  return transporter.sendMail({
    from: `GameForge <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your GameForge verification code",
    text: `Your code is ${code}. It expires in 10 minutes. If you didn't sign up, ignore this email.`,
  });
}
