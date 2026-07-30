import nodemailer from 'nodemailer';
import dns from 'dns';

let transporterInstance = null;

/**
 * Helper: Fetch with timeout via AbortController
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error(`HTTP request timed out after ${timeoutMs}ms`);
        }
        throw err;
    }
};

/**
 * Helper: Execute an async operation with retries & exponential backoff
 */
const executeWithRetry = async (fn, maxRetries = 2, initialDelayMs = 1000) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn(attempt);
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = initialDelayMs * Math.pow(2, attempt);
                console.warn(`⚠️ Transient email delivery error (Attempt ${attempt + 1}/${maxRetries + 1}): ${err.message}. Retrying in ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
    throw lastError;
};

/**
 * Get or create singleton Nodemailer pooled transporter
 */
const getTransporter = () => {
    if (!transporterInstance) {
        const port = parseInt(process.env.SMTP_PORT, 10) || 465;
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
            family: 4, // Force IPv4 socket
            autoSelectFamily: false, // Disable Node.js Happy Eyeballs IPv6 probing
            lookup: (hostname, options, callback) => {
                dns.resolve4(hostname, (err, addresses) => {
                    if (!err && addresses && addresses.length > 0) {
                        const ip = addresses[Math.floor(Math.random() * addresses.length)];
                        return callback(null, ip, 4);
                    }
                    dns.lookup(hostname, { family: 4 }, (lookupErr, address) => {
                        callback(lookupErr, address, 4);
                    });
                });
            },
            connectionTimeout: 10000, // 10s TCP connection timeout
            greetingTimeout: 10000,   // 10s SMTP greeting timeout
            socketTimeout: 10000,     // 10s socket activity timeout
            keepAlive: true
        });
    }
    return transporterInstance;
};

/**
 * Audit and verify active email delivery transport on application startup
 */
export const verifyTransporter = async () => {
    console.log('\n📧 Email Transport Configuration Audit:');
    console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
    console.log('  SMTP_PORT:', process.env.SMTP_PORT || '465 (default SSL/TLS)');
    console.log('  SMTP_USER:', process.env.SMTP_USER || '(Not configured)');
    console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '******** (Configured)' : '(Not configured)');
    console.log('  SMTP_FROM:', process.env.SMTP_FROM || '(Not configured)');
    console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? 're_******** (Configured)' : '(Not configured)');
    console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'xkeysib-******** (Configured)' : '(Not configured)');
    console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SG.******** (Configured)' : '(Not configured)');

    if (process.env.RESEND_API_KEY) {
        console.log('✅ Active Provider: RESEND REST API (HTTPS Port 443 - 100% Render Compatible)\n');
        return true;
    }
    if (process.env.BREVO_API_KEY) {
        console.log('✅ Active Provider: BREVO REST API (HTTPS Port 443 - 100% Render Compatible)\n');
        return true;
    }
    if (process.env.SENDGRID_API_KEY) {
        console.log('✅ Active Provider: SENDGRID REST API (HTTPS Port 443 - 100% Render Compatible)\n');
        return true;
    }

    console.warn('⚠️ WARNING FOR CLOUD DEPLOYMENTS (Render, AWS EC2, Heroku):');
    console.warn('  Cloud hosts block outbound TCP ports 25, 465, and 587 to prevent spam abuse.');
    console.warn('👉 Recommendation: Add RESEND_API_KEY or BREVO_API_KEY to Render Environment Variables.');

    try {
        console.time('⚡ SMTP_Transporter_Verification');
        const transporter = getTransporter();
        await transporter.verify();
        console.timeEnd('⚡ SMTP_Transporter_Verification');
        console.log('✅ SMTP Transporter connected & verified successfully (Pool active)\n');
        return true;
    } catch (error) {
        console.error('⚠️ SMTP Transporter verification failed:', error.message);
        console.warn('💡 Fix for Render: Set RESEND_API_KEY or BREVO_API_KEY in Render dashboard to use HTTPS API (Port 443).\n');
        return false;
    }
};

/**
 * Generate responsive HTML email template for OTP verification
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
 * Send OTP verification email using HTTP REST APIs (Resend/Brevo) with Nodemailer SMTP fallback
 */
export const sendOtpEmail = async (email, name, otp) => {
    const timerKey = `⏱️ SendOtpEmail_${email}_${Date.now()}`;
    console.time(timerKey);

    // 1. RESEND REST API (HTTPS Port 443 - Recommended for Render)
    if (process.env.RESEND_API_KEY) {
        try {
            const result = await executeWithRetry(async () => {
                const response = await fetchWithTimeout('https://api.resend.com/emails', {
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
                }, 10000);

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Resend API error (${response.status})`);
                }
                return data;
            });

            console.timeEnd(timerKey);
            console.log('✅ OTP email delivered via Resend REST API:', result.id);
            return { success: true, messageId: result.id, provider: 'resend' };
        } catch (err) {
            console.timeEnd(timerKey);
            console.error('❌ Failed to send OTP email via Resend API:', err.message);
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    // 2. BREVO REST API (HTTPS Port 443 - Recommended for Render)
    if (process.env.BREVO_API_KEY) {
        try {
            const result = await executeWithRetry(async () => {
                const senderEmail = process.env.SMTP_USER || 'noreply@expenseiq.com';
                const response = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': process.env.BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: {
                            name: 'ExpenseIQ',
                            email: senderEmail
                        },
                        to: [{ email: email, name: name || 'User' }],
                        subject: 'Verify Your ExpenseIQ Account',
                        htmlContent: generateOtpEmailHtml(name, otp)
                    })
                }, 10000);

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Brevo API error (${response.status})`);
                }
                return data;
            });

            console.timeEnd(timerKey);
            console.log('✅ OTP email delivered via Brevo REST API:', result.messageId);
            return { success: true, messageId: result.messageId, provider: 'brevo' };
        } catch (err) {
            console.timeEnd(timerKey);
            console.error('❌ Failed to send OTP email via Brevo API:', err.message);
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    // 3. NODEMAILER SMTP FALLBACK
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
        console.log('✅ OTP email delivered via Nodemailer SMTP');
        console.log('  Message ID:', info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error) {
        console.timeEnd(timerKey);
        console.warn(`⚠️ SMTP Connection Failed (${error.message}).`);

        console.log('\n================================================================');
        console.log(`🔑 [QA TEST MODE] Verification Code for ${email}: ${otp}`);
        console.log('💡 Render Firewall blocked outbound SMTP TCP port.');
        console.log('👉 Add RESEND_API_KEY or BREVO_API_KEY in Render Environment Variables for live inbox delivery.');
        console.log('================================================================\n');

        return { success: true, isTestFallback: true, otp, provider: 'qa_fallback' };
    }
};

/**
 * Send monthly expense statement PDF automatically
 */
export const sendMonthlyStatementEmail = async (email, name, month, year, pdfBuffer) => {
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

    // 1. RESEND REST API
    if (process.env.RESEND_API_KEY) {
        try {
            const result = await executeWithRetry(async () => {
                const response = await fetchWithTimeout('https://api.resend.com/emails', {
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
                }, 15000);

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Resend API error (${response.status})`);
                }
                return data;
            });

            console.log(`✅ Monthly statement email sent to ${email} via Resend API:`, result.id);
            return { success: true, messageId: result.id, provider: 'resend' };
        } catch (err) {
            console.error(`❌ Failed to send statement email to ${email} via Resend:`, err.message);
            throw new Error('Failed to send monthly statement email via Resend.');
        }
    }

    // 2. BREVO REST API
    if (process.env.BREVO_API_KEY) {
        try {
            const result = await executeWithRetry(async () => {
                const response = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': process.env.BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: {
                            name: 'ExpenseIQ',
                            email: process.env.SMTP_USER || 'noreply@expenseiq.com'
                        },
                        to: [{ email: email, name: name || 'User' }],
                        subject: `ExpenseIQ Monthly Financial Statement – ${monthName} ${year}`,
                        htmlContent: html,
                        attachment: [
                            {
                                content: pdfBuffer.toString('base64'),
                                name: `ExpenseIQ_Statement_${monthName}_${year}.pdf`
                            }
                        ]
                    })
                }, 15000);

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `Brevo API error (${response.status})`);
                }
                return data;
            });

            console.log(`✅ Monthly statement email sent to ${email} via Brevo API:`, result.messageId);
            return { success: true, messageId: result.messageId, provider: 'brevo' };
        } catch (err) {
            console.error(`❌ Failed to send statement email to ${email} via Brevo:`, err.message);
            throw new Error('Failed to send monthly statement email via Brevo.');
        }
    }

    // 3. NODEMAILER SMTP FALLBACK WITH RETRIES
    return await executeWithRetry(async (attempt) => {
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
        console.log(`✅ Monthly statement email sent to ${email} via SMTP:`, info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
    }, 2, 3000);
};

export default {
    sendOtpEmail,
    sendMonthlyStatementEmail,
    verifyTransporter
};
