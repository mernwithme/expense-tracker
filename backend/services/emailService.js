import nodemailer from 'nodemailer';
import dns from 'dns';

let transporterInstance = null;

/**
 * Get or create singleton Nodemailer pooled transporter
 */
const getTransporter = () => {
    if (!transporterInstance) {
        // Default to Port 465 (SSL/TLS) for Gmail if process.env.SMTP_PORT is not set.
        // Cloud hosting (Render/AWS) frequently blocks outbound TCP port 587.
        const port = parseInt(process.env.SMTP_PORT) || 465;
        const isSecure = process.env.SMTP_SECURE !== undefined 
            ? process.env.SMTP_SECURE === 'true' 
            : (port === 465);

        transporterInstance = nodemailer.createTransport({
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: port,
            secure: isSecure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            family: 4, // Force IPv4
            autoSelectFamily: false, // Disable Node.js Happy Eyeballs IPv6 probing
            lookup: (hostname, options, callback) => {
                // Explicitly query IPv4 (AF_INET) records only
                dns.lookup(hostname, { family: 4 }, callback);
            },
            connectionTimeout: 15000, // 15s TCP timeout
            greetingTimeout: 10000,   // 10s SMTP greeting timeout
            socketTimeout: 20000,     // 20s socket timeout
            keepAlive: true
        });
    }
    return transporterInstance;
};

/**
 * Verify transporter connection on startup (pre-warms SMTP socket pool)
 */
export const verifyTransporter = async () => {
    if (process.env.RESEND_API_KEY) {
        console.log('✅ Resend API key detected — using HTTPS API for email delivery (Render compatible)');
        return true;
    }
    try {
        console.time('⚡ SMTP_Transporter_Verification');
        const transporter = getTransporter();
        await transporter.verify();
        console.timeEnd('⚡ SMTP_Transporter_Verification');
        console.log('✅ SMTP Transporter connected & verified successfully (Pool active)');
        return true;
    } catch (error) {
        console.error('⚠️ SMTP Transporter verification failed:', error.message);
        console.warn('💡 Tip for Render: Port 587 is blocked by Render firewall. Port 465 or RESEND_API_KEY is recommended.');
        return false;
    }
};

/**
 * Generate professional HTML email template for OTP verification
 */
const generateOtpEmailHtml = (name, otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your ExpenseIQ Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                    💰 ExpenseIQ
                                </h1>
                                <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                                    Smart Expense Tracking
                                </p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 8px; color: #1a1a2e; font-size: 22px; font-weight: 600;">
                                    Hello ${name || 'there'},
                                </h2>
                                <p style="margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6;">
                                    Welcome to ExpenseIQ! Use the verification code below to verify your email address and complete your registration.
                                </p>

                                <!-- OTP Box -->
                                <div style="background: linear-gradient(135deg, #f8fafc, #eef2ff); border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                        Verification Code
                                    </p>
                                    <p style="margin: 0; color: #4f46e5; font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </p>
                                </div>

                                <!-- Expiry Notice -->
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 0 0 24px;">
                                    <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 500;">
                                        ⏱ This code expires in <strong>5 minutes</strong>. Do not share this code with anyone.
                                    </p>
                                </div>

                                <!-- Security Note -->
                                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 8px;">
                                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                                        🔒 <strong>Security Note:</strong> If you didn't request this verification code, please ignore this email. Your account is safe — no action is needed.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px;">
                                    &copy; ${new Date().getFullYear()} ExpenseIQ. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                                    This is an automated email. Please do not reply.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * Send OTP verification email
 */
export const sendOtpEmail = async (email, name, otp) => {
    const timerKey = `⏱️ SendOtpEmail_${email}_${Date.now()}`;
    console.time(timerKey);

    // 1. Resend HTTPS API Mode (Guaranteed to work on Render, no SMTP port blocks)
    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: process.env.SMTP_FROM || 'ExpenseIQ <onboarding@resend.dev>',
                    to: [email],
                    subject: 'Verify Your ExpenseIQ Account',
                    html: generateOtpEmailHtml(name, otp)
                })
            });
            const data = await response.json();
            console.timeEnd(timerKey);
            if (!response.ok) {
                console.error('❌ Resend API error:', data);
                throw new Error(data.message || 'Resend email delivery failed.');
            }
            console.log('✅ OTP email sent via Resend API:', data.id);
            return { success: true, messageId: data.id };
        } catch (err) {
            console.timeEnd(timerKey);
            console.error('❌ Failed to send OTP email via Resend:', err.message);
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    // 2. Nodemailer SMTP Mode
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: process.env.SMTP_FROM || `"ExpenseIQ" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your ExpenseIQ Account',
            html: generateOtpEmailHtml(name, otp)
        };

        const info = await transporter.sendMail(mailOptions);
        console.timeEnd(timerKey);
        console.log('✅ OTP email sent successfully via SMTP:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.timeEnd(timerKey);
        console.error('❌ Failed to send OTP email:', error.message);
        throw new Error('Failed to send verification email. Please try again later.');
    }
};

/**
 * Send monthly expense statement PDF automatically
 */
export const sendMonthlyStatementEmail = async (email, name, month, year, pdfBuffer) => {
    let retries = 3;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[month - 1];

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4f46e5;">ExpenseIQ Monthly Financial Statement</h2>
        <p>Hello ${name},</p>
        <p>Your monthly financial statement for <strong>${monthName} ${year}</strong> is ready.</p>
        <p>We've attached your professional PDF report containing your charts, analytics, AI-generated insights, category-wise spending, and transaction summaries.</p>
        <p>Thank you for using ExpenseIQ to manage your finances!</p>
        <br/>
        <p style="font-size: 12px; color: #777;">
            The ExpenseIQ Team<br/>
            <em>You are receiving this because you enabled Email Reports in your Settings.</em>
        </p>
    </div>
    `;

    // 1. Resend HTTPS API Mode (Guaranteed to work on Render, no SMTP port blocks)
    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: process.env.SMTP_FROM || 'ExpenseIQ <onboarding@resend.dev>',
                    to: [email],
                    subject: `ExpenseIQ Monthly Financial Statement – ${monthName} ${year}`,
                    html: html,
                    attachments: [
                        {
                            filename: `ExpenseIQ_Statement_${monthName}_${year}.pdf`,
                            content: pdfBuffer.toString('base64')
                        }
                    ]
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Resend email delivery failed.');
            }
            console.log(`✅ Monthly statement email sent to ${email} via Resend API:`, data.id);
            return { success: true, messageId: data.id };
        } catch (err) {
            console.error(`❌ Failed to send statement email to ${email} via Resend:`, err.message);
            throw new Error('Failed to send monthly statement email via Resend.');
        }
    }

    // 2. Nodemailer SMTP Mode
    while (retries > 0) {
        try {
            const transporter = getTransporter();

            const mailOptions = {
                from: process.env.SMTP_FROM || `"ExpenseIQ" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `ExpenseIQ Monthly Financial Statement – ${monthName} ${year}`,
                html: html,
                attachments: [
                    {
                        filename: `ExpenseIQ_Statement_${monthName}_${year}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Monthly statement email sent to ${email}:`, info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Failed to send statement email to ${email} (Retries left: ${retries - 1}):`, error.message);
            retries--;
            if (retries === 0) {
                throw new Error('Failed to send monthly statement email after 3 attempts.');
            }
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

export default {
    sendOtpEmail,
    sendMonthlyStatementEmail,
    verifyTransporter
};
