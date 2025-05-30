# PersonalWeb

A full-stack web application for couples to manage their life together. This application includes several features:

1. **Important Date Tracking**
   - Anniversary reminders
   - Birthday reminders
   - Bill payment due dates
   - Special occasions

2. **Shared Calendar & Events**
   - Joint scheduling
   - Event planning
   - Appointment tracking

3. **Shared To-Do Lists**
   - Household chores
   - Shopping lists
   - Shared goals and projects

4. **Photo Gallery**
   - Store and share memories
   - Organize by events or dates

5. **Budget Tracker**
   - Shared expenses
   - Savings goals
   - Bill splitting

6. **Recipe Collection**
   - Favorite meals
   - Meal planning
   - Grocery lists

7. **Travel Planning**
   - Trip itineraries
   - Packing lists
   - Travel memories

8. **Notes & Messages**
   - Leave notes for each other
   - Private messaging

## Tech Stack

- **Frontend**: React.js (Next.js)
- **Backend**: Node.js with Express
- **Database**: MongoDB Atlas
- **Deployment**: Netlify (both frontend and backend using Netlify Functions)

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- MongoDB Atlas account (for database)

### Installation

1. Clone the repository
2. Install dependencies for both client and server
   ```
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. Create a `.env` file in the server directory with your MongoDB connection string and other environment variables

4. Start the development servers
   ```
   # Start client
   cd client
   npm run dev

   # Start server
   cd ../server
   npm run dev
   ```

## Cloud Deployment

### Step 1: Set Up MongoDB Atlas

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
2. Create a new cluster (free tier is sufficient)
3. Set up database access (create a user with read/write privileges)
4. Set up network access (allow access from anywhere for deployment)
5. Get your connection string (it will look like: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/personalweb?retryWrites=true&w=majority`)

### Step 2: Prepare Your Code for Netlify Deployment

1. Make sure your project has the following files:
   - `netlify.toml` in the root directory (configures build settings and redirects)
   - `netlify/functions/api.js` (serves as your backend API through Netlify Functions)
   - Updated `client/config.js` to use Netlify Functions in production

2. Commit all your changes to your Git repository

### Step 3: Deploy to Netlify

1. Create a [Netlify](https://www.netlify.com/) account
2. Click "New site from Git"
3. Connect your GitHub repository or upload your code
4. Configure the build settings:
   - Base directory: Leave empty (uses the project root)
   - Build command: `npm run build-netlify`
   - Publish directory: `client/.next`
5. Click "Deploy site"

### Step 4: Configure Environment Variables in Netlify

1. After deployment, go to Site settings > Build & deploy > Environment
2. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT token generation
   - `NODE_ENV`: `production`
   - `EMAIL_USER`: Your email address (for notifications)
   - `EMAIL_PASS`: Your email password or app password
   - `EMAIL_HOST`: Your email SMTP host (e.g., smtp.gmail.com)
   - `EMAIL_PORT`: Your email SMTP port (e.g., 587)
   - `EMAIL_SECURE`: `false` (or `true` if using port 465)
   - `EMAIL_FROM`: Your email address

### Step 5: Trigger a New Deployment

1. Go to the Deploys section in your Netlify dashboard
2. Click "Trigger deploy" > "Deploy site"

### Step 6: Test Your Deployed Application

1. Visit your Netlify URL (shown in the dashboard)
2. Register a new account
3. Test all features to ensure they're working correctly

### Troubleshooting

If you encounter issues:

1. Check Netlify Function logs in the Functions tab of your Netlify dashboard
2. Verify that all environment variables are set correctly
3. Make sure your MongoDB Atlas cluster is accessible from Netlify's IP addresses

## License

This project is licensed under the MIT License.
