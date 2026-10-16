const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const LATEST_VERSION = '1.3.0';
const RELEASE_HIGHLIGHTS = [
  '🗂️ Drag & Drop Reordering: Effortlessly reorder collections, folders, and requests in the sidebar.',
  '⚡ Intelligent Header Autocomplete: Auto-suggest standard headers with typo auto-correction (e.g. autherization -> Authorization).',
  '🔍 Variable Hover Inspection: Hover over any {{variable}} to view resolved value and scope card.',
  '🎨 Bearer & Auth Syntax Highlighting: Distinct keyword colors for auth prefixes and variables.',
  '🔌 Multi-protocol Persistent Tabs: Keep Socket.IO, WebSocket, and HTTP tabs open simultaneously with IO & WS badges.',
  '🔄 1-Click Workspace Sync: Real-time project refresh with smooth animated shimmer feedback.'
];

exports.getLatestUpdate = (req, res) => {
  res.json({
    version: LATEST_VERSION,
    releaseName: `Jronix Post v${LATEST_VERSION}`,
    releaseHighlights: RELEASE_HIGHLIGHTS,
    landingPageUrl: 'https://jronix-post.vercel.app/#download',
    githubReleaseUrl: 'https://github.com/ranasheikh64/Post-Lite/releases/latest',
  });
};

exports.broadcastReleaseEmail = async (req, res) => {
  try {
    const providedSecret = req.headers['x-broadcast-secret'];
    const expectedSecret = process.env.BROADCAST_SECRET || process.env.JWT_SECRET;

    if (expectedSecret && providedSecret !== expectedSecret) {
      return res.status(403).json({ message: 'Unauthorized broadcast request' });
    }

    const {
      version = LATEST_VERSION,
      highlights = RELEASE_HIGHLIGHTS,
      landingPageUrl = 'https://jronix-post.vercel.app/#download',
    } = req.body || {};

    const users = await User.find({}, 'name email').lean();
    if (!users || users.length === 0) {
      return res.json({ message: 'No registered users found to notify', count: 0 });
    }

    const highlightsHtml = highlights
      .map(
        (h) => `
        <li style="margin-bottom: 10px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          ${h}
        </li>`
      )
      .join('');

    const emailTemplate = (userName) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Jronix Post Update</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0d0f18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0f18; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #151828; border: 1px solid #242942; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #1e2338; background: linear-gradient(180deg, #181d33 0%, #151828 100%);">
                    <div style="display: inline-block; padding: 6px 14px; background: rgba(255, 108, 55, 0.15); border: 1px solid #ff6c37; border-radius: 20px; color: #ff6c37; font-size: 12px; font-weight: bold; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                      🚀 New Release Available • v${version}
                    </div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Jronix <span style="color: #ff6c37;">Post</span>
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">
                      Lightning-fast API, Socket.IO & WebSocket Client
                    </p>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding: 32px 40px;">
                    <p style="margin: 0 0 16px; font-size: 16px; color: #f1f5f9; font-weight: 600;">
                      Hello ${userName || 'Developer'},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                      A brand new update of <strong>Jronix Post (v${version})</strong> is ready for you! We have introduced powerful new developer experience enhancements to make your API testing even faster and smoother.
                    </p>

                    <!-- Feature Box -->
                    <div style="background-color: #1b1f34; border: 1px solid #282e4d; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px;">
                      <h3 style="margin: 0 0 14px; font-size: 14px; color: #ff6c37; text-transform: uppercase; letter-spacing: 0.5px;">
                        What's New in v${version}
                      </h3>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${highlightsHtml}
                      </ul>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${landingPageUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ff6c37 0%, #ff8c5a 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 15px rgba(255, 108, 55, 0.4); letter-spacing: 0.2px;">
                        Download Latest Version Now →
                      </a>
                    </div>

                    <p style="margin: 20px 0 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                      Direct download links for macOS (Universal), Windows (.exe setup), and Linux are available on the landing page.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #0f111d; border-top: 1px solid #1e2338; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      © ${new Date().getFullYear()} Jronix Post. Built for high performance API developers.
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

    let sentCount = 0;
    let failedCount = 0;

    for (const user of users) {
      if (!user.email) continue;
      try {
        await transporter.sendMail({
          from: `"Jronix Post" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `🚀 Jronix Post v${version} Released - See What's New & Download!`,
          html: emailTemplate(user.name),
        });
        sentCount++;
      } catch (err) {
        console.error(`[UPDATE EMAIL ERROR] Failed to send to ${user.email}:`, err.message);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Broadcast finished: ${sentCount} sent, ${failedCount} failed`,
      totalUsers: users.length,
      sentCount,
      failedCount,
    });
  } catch (err) {
    console.error('[UPDATE BROADCAST ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
};
