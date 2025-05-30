const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Creating test email account...');
  
  // Create a test account on Ethereal
  const testAccount = await nodemailer.createTestAccount();
  console.log('Test account created:', testAccount.user);
  
  // Create a transporter using the test account
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  
  console.log('Sending test email...');
  
  // Send a test email
  const info = await transporter.sendMail({
    from: '"PersonalWeb" <notifications@personalweb.com>',
    to: 'test@example.com',
    subject: 'Test Email from PersonalWeb',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Test Email from PersonalWeb</h2>
        <p>Hello there,</p>
        <p>This is a test email from your PersonalWeb application.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Event:</strong> Anniversary Dinner</p>
          <p><strong>Category:</strong> Anniversary</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Notes:</strong> Make a reservation at our favorite restaurant!</p>
        </div>
        <p>Have a great day!</p>
        <p>- Your PersonalWeb App</p>
      </div>
    `
  });
  
  console.log('Email sent:', info.messageId);
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

// Run the test
testEmail()
  .then(() => console.log('Test completed successfully!'))
  .catch(error => console.error('Error in test:', error));
