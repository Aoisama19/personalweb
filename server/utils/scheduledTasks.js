const cron = require('node-cron');
const { differenceInDays, isSameDay, addYears, parseISO } = require('date-fns');
const User = require('../models/User');
const ImportantDate = require('../models/ImportantDate');
const { sendDateReminder } = require('./emailService');

// Function to check for upcoming dates and send notifications
const checkUpcomingDates = async () => {
  try {
    console.log('Running scheduled task: checking upcoming dates...');
    
    // Get all users
    const users = await User.find();
    
    // Current date at midnight (to compare dates properly)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Process each user
    for (const user of users) {
      // Skip if user has no email
      if (!user.email) {
        console.log(`User ${user._id} has no email address, skipping notifications`);
        continue;
      }
      
      console.log(`Checking dates for user: ${user.name || user.email}`);
      
      // Get all dates for this user
      const dates = await ImportantDate.find({ user: user._id });
      
      // Check each date
      for (const date of dates) {
        try {
          let nextOccurrence = new Date(date.date);
          
          // If it's a recurring event (like birthday or anniversary)
          if (date.recurring) {
            // Find the next occurrence that hasn't passed yet
            while (nextOccurrence < today) {
              nextOccurrence = addYears(nextOccurrence, 1);
            }
          }
          
          // Check if the date is today
          if (isSameDay(nextOccurrence, today)) {
            console.log(`Sending TODAY notification for ${date.title} to ${user.email}`);
            await sendDateReminder(user, date, 0);
          }
          // Check if the date is tomorrow
          else if (isSameDay(nextOccurrence, tomorrow)) {
            console.log(`Sending TOMORROW notification for ${date.title} to ${user.email}`);
            await sendDateReminder(user, date, 1);
          }
        } catch (dateError) {
          console.error(`Error processing date ${date._id}:`, dateError);
        }
      }
    }
    
    console.log('Finished checking upcoming dates');
  } catch (error) {
    console.error('Error in checkUpcomingDates task:', error);
  }
};

// Schedule the task to run once a day at 8:00 AM
// Cron format: minute hour day-of-month month day-of-week
const scheduleNotifications = () => {
  // Schedule for 8:00 AM every day
  cron.schedule('0 8 * * *', checkUpcomingDates);
  console.log('Scheduled task: Date notifications will run daily at 8:00 AM');
  
  // For testing purposes, you can also run it immediately
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: Running initial check for upcoming dates...');
    checkUpcomingDates();
  }
};

module.exports = {
  scheduleNotifications,
  checkUpcomingDates
};
