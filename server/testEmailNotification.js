const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { sendDateReminder } = require('./utils/emailService');
const { checkUpcomingDates } = require('./utils/scheduledTasks');

// Load environment variables
dotenv.config();

// Sample user and date objects for testing
const sampleUser = {
  name: 'Test User',
  email: 'test@example.com'
};

const sampleDate = {
  title: 'Anniversary Dinner',
  date: new Date().toISOString(), // Today
  category: 'anniversary',
  notes: 'Make a reservation at our favorite restaurant!'
};

// Function to test sending a single email
const testSingleEmail = async () => {
  console.log('Testing single email notification...');
  
  try {
    // Test sending a "today" reminder
    const result = await sendDateReminder(sampleUser, sampleDate, 0);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Check the console output above for the preview URL to view the test email');
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
};

// Function to test the scheduled task
const testScheduledTask = async () => {
  console.log('Testing scheduled task for checking upcoming dates...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personalweb');
    console.log('MongoDB Connected for testing');
    
    // Run the scheduled task
    await checkUpcomingDates();
    
    console.log('✅ Scheduled task test completed!');
    console.log('Check the console output above for any email preview URLs');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error in scheduled task test:', error);
  }
};

// Run the tests
const runTests = async () => {
  // First test sending a single email
  await testSingleEmail();
  
  console.log('\n-----------------------------------\n');
  
  // Then test the scheduled task
  await testScheduledTask();
  
  console.log('\nAll tests completed!');
};

// Run the tests
runTests();
