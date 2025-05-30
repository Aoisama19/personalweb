// This script generates and displays the HTML email template for a date reminder
// without actually sending an email

// Sample user and date objects for testing
const sampleUser = {
  name: 'Faizan Khan',
  email: 'faizankhan977@gmail.com'
};

const sampleDate = {
  title: 'Anniversary Dinner',
  date: new Date().toISOString(), // Today
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
    <p>Hello ${sampleUser.name || 'there'},</p>
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

// Display the HTML template
console.log('================ EMAIL TEMPLATE PREVIEW ================');
console.log('Subject:', subject);
console.log('\nHTML Content:');
console.log(html);
console.log('======================================================');

// Create a simple HTML file to view the template in a browser
const fs = require('fs');
const previewPath = './email-preview.html';

fs.writeFileSync(previewPath, `
<!DOCTYPE html>
<html>
<head>
  <title>Email Preview - ${subject}</title>
</head>
<body>
  ${html}
</body>
</html>
`);

console.log(`\nHTML preview file created at: ${previewPath}`);
console.log('Open this file in your browser to see how the email will look.');
