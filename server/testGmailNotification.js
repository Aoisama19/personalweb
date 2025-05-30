const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to test sending an email with Gmail
async function testGmailNotification() {
  console.log('Testing Gmail notification...');
  
  // You'll need to provide these values when running the script
  const EMAIL_USER = process.env.EMAIL_USER || process.argv[2];
  const EMAIL_PASS = process.env.EMAIL_PASS || process.argv[3];
  const TO_EMAIL = process.env.TO_EMAIL || process.argv[4] || EMAIL_USER;
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('Error: Gmail username and password are required.');
    console.log('Usage: node testGmailNotification.js your.email@gmail.com "your-app-password" recipient@example.com');
    console.log('Note: For Gmail with 2FA, you need to use an App Password.');
    console.log('You can create one at: https://myaccount.google.com/apppasswords');
    return;
  }
  
  try {
    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    
    // Sample date for the test
    const sampleDate = {
      title: 'Anniversary Dinner',
      date: new Date().toISOString(),
      category: 'anniversary',
      notes: 'Make a reservation at our favorite restaurant!'
    };
    
    // Get category name
    const categoryNames = {
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      bill: 'Bill Payment',
      event: 'Special Event',
      other: 'Other'
    };
    
    const categoryName = categoryNames[sampleDate.category] || 'Event';
    const dayText = 'today'; // or 'tomorrow'
    const subject = `Reminder: ${sampleDate.title} is ${dayText}!`;
    
    // Create email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">${subject}</h2>
        <p>Hello there,</p>
        <p>This is a friendly reminder that <strong>${sampleDate.title}</strong> is ${dayText}!</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Event:</strong> ${sampleDate.title}</p>
          <p><strong>Category:</strong> ${categoryName}</p>
          <p><strong>Date:</strong> ${new Date(sampleDate.date).toLocaleDateString()}</p>
          ${sampleDate.notes ? `<p><strong>Notes:</strong> ${sampleDate.notes}</p>` : ''}
        </div>
        <p>Have a great day!</p>
        <p>- Your PersonalWeb App</p>
      </div>
    `;
    
    console.log(`Sending test email from ${EMAIL_USER} to ${TO_EMAIL}...`);
    console.log('This may take a moment...');
    
    // Create a timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 30000)
    );
    
    // Send the email with a timeout
    const emailPromise = transporter.sendMail({
      from: `"PersonalWeb" <${EMAIL_USER}>`,
      to: TO_EMAIL,
      subject: subject,
      html: html
    });
    
    // Race the email sending against the timeout
    const info = await Promise.race([emailPromise, timeout]);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\nCheck your email inbox for the test message.');
    console.log('If you don\'t see it, check your spam folder as well.');
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\nAuthentication failed. This could be because:');
      console.log('1. Your email or password is incorrect');
      console.log('2. You need to use an App Password if you have 2FA enabled');
      console.log('3. Less secure app access might be disabled for your Google account');
      console.log('\nFor Gmail with 2FA, create an App Password at:');
      console.log('https://myaccount.google.com/apppasswords');
    }
  }
}

// Run the test
testGmailNotification();
