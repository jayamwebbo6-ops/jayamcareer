import nodemailer from 'nodemailer';
import { connectToDatabase } from '../mongoDb';
import SmtpConfig from '../../models/SmtpConfig';
import fs from 'fs';
import path from 'path';

const getLogoAttachments = () => {
  const logoPath = path.join(process.cwd(), 'public', 'logo1.png');
  if (fs.existsSync(logoPath)) {
    return [{
      filename: 'logo1.png',
      path: logoPath,
      cid: 'logo1'
    }];
  }
  return [];
};

const getTransporterConfig = async () => {
  await connectToDatabase();
  const dbConfig = await SmtpConfig.findOne();

  if (dbConfig) {
    return {
      transporter: nodemailer.createTransport({
        host: dbConfig.host,
        port: Number(dbConfig.port),
        secure: Boolean(dbConfig.secure),
        auth: {
          user: dbConfig.user,
          pass: dbConfig.pass,
        },
      }),
      from: dbConfig.from,
      cc: dbConfig.cc || '',
    };
  }

  // Fallback to environment variables
  return {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }),
    from: process.env.SMTP_FROM || `"Jayam Web Solutions" <${process.env.SMTP_USER}>`,
    cc: '',
  };
};

/**
 * Sends the experience-specific interview task email to the candidate.
 * 
 * @param {Object} params
 * @param {string} params.email - Candidate email address
 * @param {string} params.fullName - Candidate full name
 * @param {string} params.categoryName - Selected job category name
 * @param {string} params.taskContent - Task template content
 */
export const sendTaskEmail = async ({ email, fullName, categoryName, taskContent, taskLink, taskFormLink, baseURL }) => {
  if (!email || !taskContent) {
    throw new Error('Email address and task content are required to send an interview task.');
  }

  const { transporter, from, cc } = await getTransporterConfig();

  // ── Build the task-link block (shown at the TOP of the email) ──
  const taskLinkText = taskLink && taskLink.trim()
    ? `\n📎 PROJECT TASK DETAILS:\n${taskLink.trim()}\n\n`
    : '';

  const taskLinkHtml = taskLink && taskLink.trim()
    ? `
      <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
        <table width="100%" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 36px; padding-right: 12px; font-size: 24px; line-height: 1;">
              📎
            </td>
            <td style="vertical-align: top; text-align: left;">
              <h4 style="margin: 0 0 6px 0; color: #111111; font-size: 15px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Task Link</h4>
             
              <a href="${taskLink.trim()}" target="_blank"
                 style="display: inline-block; background-color: #ff6600; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                View Project Task Details →
              </a>
            </td>
          </tr>
        </table>
      </div>`
    : '';

  // ── Build the task form link block ──
  const taskFormLinkText = taskFormLink && taskFormLink.trim()
    ? `\n📋 TASK FORM SUBMISSION LINK:\n${taskFormLink.trim()}\n\n`
    : '';

  const taskFormLinkHtml = taskFormLink && taskFormLink.trim()
    ? `
      <div style="background-color: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
        <table width="100%" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 36px; padding-right: 12px; font-size: 24px; line-height: 1;">
              📋
            </td>
            <td style="vertical-align: top; text-align: left;">
              <h4 style="margin: 0 0 6px 0; color: #111111; font-size: 15px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Task Submission Link</h4>
            
              <a href="${taskFormLink.trim()}" target="_blank"
                 style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Open Form Submission →
              </a>
            </td>
          </tr>
        </table>
      </div>`
    : '';

  const mailOptions = {
    from: from,
    to: email,
    ...(cc && { cc }),
    subject: `Interview Task for ${categoryName} - Jayam Web Solutions`,
    text: `Hi ${fullName},\n\nThank you for applying for the ${categoryName} position at Jayam Web Solutions.\n\nTo proceed further with your application, please complete the interview task below:\n\n---------------------------------------------\n${taskLinkText}${taskFormLinkText}${taskContent}\n---------------------------------------------\n\nSubmission Instructions:\nThe complete project should be submitted as a GitHub repository & Vercel or Netlify App to 98405 99789 through WhatsApp with your name & phone number.\n\n"This task is designed to assess your speed and efficiency. Please complete it as soon as possible and notify us upon submission. We are specifically looking for immediate joiners."\n\nThanks & Regards,\nJayam Web Solutions\nTambaram`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="cid:logo1" alt="Jayam Web Solutions Logo" style="height: 50px; max-width: 100%; object-fit: contain;" />
      </div>
      <div style="background-color: #ff6600; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Interview Task Details</h2>
      </div>
      <div style="padding: 20px 10px;">
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Thank you for applying for the <strong>${categoryName}</strong> position at Jayam Web Solutions.</p>
        <p>To proceed further with your application, please complete the remote interview task below:</p>

        ${taskLinkHtml}
        ${taskFormLinkHtml}

        <div style="background-color: #fafafa; border-left: 4px solid #ff6600; padding: 15px; font-family: monospace; white-space: pre-wrap; margin: 20px 0; border-radius: 4px; border: 1px solid #eee; border-left-width: 4px;">${taskContent.replace(/\n/g, '<br/>')}</div>
  
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <div style="font-size: 12px; color: #888; text-align: center;">
        <strong>JAYAM WEB SOLUTIONS</strong><br/>
        Tambaram<br/>
        <a href="http://www.jayamwebsolutions.com" style="color: #ff6600; text-decoration: none;">www.jayamwebsolutions.com</a>
      </div>
    </div>`,
    attachments: getLogoAttachments()
  };

  return await transporter.sendMail(mailOptions);
};


/**
 * Sends a general "Thank you for applying" email to the candidate.
 * 
 * @param {Object} params
 * @param {string} params.email - Candidate email address
 * @param {string} params.fullName - Candidate full name
 * @param {string} params.categoryName - Selected job category name
 */
export const sendThankYouEmail = async ({ email, fullName, categoryName, baseURL }) => {
  if (!email) {
    throw new Error('Email address is required to send thank you email.');
  }

  const { transporter, from, cc } = await getTransporterConfig();

  const mailOptions = {
    from: from,
    to: email,
    ...(cc && { cc }),
    subject: `Application Received: ${categoryName} - Jayam Web Solutions`,
    text: `Hi ${fullName},\n\nThank you for applying for the ${categoryName} position at Jayam Web Solutions.\n\nWe have successfully received your application. Our team is currently reviewing all applications and we will contact you if your profile matches our requirements.\n\nThanks & Regards,\nJayam Web Solutions\nTambaram`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="cid:logo1" alt="Jayam Web Solutions Logo" style="height: 50px; max-width: 100%; object-fit: contain;" />
      </div>
      <div style="background-color: #ff6600; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">Application Received</h2>
      </div>
      <div style="padding: 20px 10px;">
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Thank you for applying for the <strong>${categoryName}</strong> position at Jayam Web Solutions.</p>
        <p>We have successfully received your application and resume. Our recruiting team is currently reviewing your profile.</p>
        <p>If your qualifications and experience align with our requirements for this role, we will get in touch with you for the next steps.</p>
        <p>We appreciate your interest in joining Jayam Web Solutions and wish you the best of luck!</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <div style="font-size: 12px; color: #888; text-align: center;">
        <strong>JAYAM WEB SOLUTIONS</strong><br/>
        Tambaram<br/>
        <a href="http://www.jayamwebsolutions.com" style="color: #ff6600; text-decoration: none;">www.jayamwebsolutions.com</a>
      </div>
    </div>`,
    attachments: getLogoAttachments()
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Sends a generic custom email to any recipient.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Plain text content
 * @param {string} params.html - HTML content
 */
export const sendCustomEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('To address, subject, and body content are required.');
  }

  const { transporter, from, cc } = await getTransporterConfig();

  // Parse logo1.png references in custom HTML templates (like job offer emails) to use cid:logo1
  const processedHtml = html ? html.replace(/src="[^"]*logo1\.png"/g, 'src="cid:logo1"') : html;

  const mailOptions = {
    from,
    to,
    ...(cc && { cc }),
    subject,
    text,
    html: processedHtml,
    attachments: getLogoAttachments()
  };

  return await transporter.sendMail(mailOptions);
};

