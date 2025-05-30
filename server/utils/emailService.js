const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const createTransporter = async () => {
  // For production, you would use actual email service credentials
  // For development/testing, we can use a test account from Ethereal
  let testAccount;
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use configured email if available
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // For development, use Ethereal test account
    testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"PersonalWeb" <notifications@personalweb.com>',
      to,
      subject,
      html
    });
    
    console.log('Email sent:', info.messageId);
    
    // If using Ethereal for testing, log the URL where the email can be viewed
    if (!process.env.EMAIL_USER) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Send date reminder email
const sendDateReminder = async (user, date, daysUntil) => {
  if (!user.email) {
    console.log('No email address available for user');
    return { success: false, error: 'No email address' };
  }
  
  const dayText = daysUntil === 0 ? 'today' : 'tomorrow';
  const subject = `Reminder: ${date.title} is ${dayText}!`;
  
  // Get category name
  const categoryNames = {
    birthday: 'Birthday',
    anniversary: 'Anniversary',
    bill: 'Bill Payment',
    event: 'Special Event',
    other: 'Other'
  };
  
  const categoryName = categoryNames[date.category] || 'Event';
  
  // Create email content
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">${subject}</h2>
      <p>Hello ${user.name || 'there'},</p>
      <p>This is a friendly reminder that <strong>${date.title}</strong> is ${dayText}!</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Event:</strong> ${date.title}</p>
        <p><strong>Category:</strong> ${categoryName}</p>
        <p><strong>Date:</strong> ${new Date(date.date).toLocaleDateString()}</p>
        ${date.notes ? `<p><strong>Notes:</strong> ${date.notes}</p>` : ''}
      </div>
      <p>Have a great day!</p>
      <p>- Your PersonalWeb App</p>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendDateReminder
};
