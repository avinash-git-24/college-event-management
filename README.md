# College Event Registration & Management System (CERM)

## Problem Statement

### Project Title: College Event Registration & Management System (CERM)  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  

### Overview  
Colleges worldwide face significant challenges in managing vast amounts of data related to students, courses, events, and administrative operations. Traditional manual systems, relying on paper-based records, spreadsheets, and isolated software tools, often lead to inefficiencies, errors, and poor communication. This project proposes the development of a comprehensive, web-based College Event Registration & Management System using the MERN stack to address these issues, streamline operations, and enhance the overall educational experience.

### Current Problems in Traditional/Manual Systems  
Traditional college management practices suffer from several critical drawbacks:  
- **Data Inconsistencies and Errors:** Manual entry of student information, course enrollments, and grades across multiple departments leads to discrepancies, duplication, and inaccuracies. For instance, student records may be updated in one department but not reflected elsewhere, causing confusion during exams or graduations.  
- **Inefficient Resource Allocation:** Tracking course schedules, faculty assignments, and classroom availability manually consumes significant time and effort, often resulting in scheduling conflicts, underutilized resources, or last-minute cancellations.  
- **Poor Communication and Accessibility:** Events, announcements, and administrative notices are disseminated through physical notices or emails, limiting reach and timeliness. Stakeholders (students, faculty, and administrators) struggle to access real-time information, leading to missed deadlines or uninformed decisions.  
- **Administrative Burden:** Tasks such as fee collection, attendance tracking, and report generation rely on manual processes, increasing workload, reducing productivity, and heightening the risk of human error.  
- **Scalability Issues:** As colleges grow, manual systems become overwhelmed, making it difficult to handle increasing data volumes or integrate new requirements without significant rework.  

These problems not only hinder operational efficiency but also impact student satisfaction, faculty performance, and institutional reputation.

### Why a Digital System is Needed  
A digital system is essential to modernize college operations in an era of rapid technological advancement and increasing demands for efficiency. Manual systems are prone to errors, time-consuming, and lack the scalability required for growing institutions. By leveraging the MERN stack—a robust, full-stack JavaScript framework—the CMS will provide a centralized, secure, and user-friendly platform accessible via web browsers. This shift to digitalization will enable real-time data management, automated workflows, and seamless integration across departments, reducing reliance on outdated methods and fostering a more agile educational environment.

### What the System Will Achieve  
The College Event Registration & Management System aims to deliver the following key outcomes:  
- **Centralized Data Management:** A unified database for storing and retrieving student profiles, course details, event calendars, and administrative records, ensuring data integrity and easy access.  
- **Streamlined Administrative Tasks:** Automated features for course enrollment, attendance monitoring, fee tracking, and report generation, minimizing manual effort and errors.  
- **Enhanced Communication:** Real-time notifications, event management, and announcement boards to keep all stakeholders informed and engaged.  
- **Improved Efficiency and Scalability:** Faster processing of operations, conflict-free scheduling, and the ability to scale with institutional growth.  
- **Better User Experience:** Intuitive interfaces for students, faculty, and administrators, promoting self-service capabilities and reducing dependency on support staff.  

By achieving these goals, the CMS will transform college management into a more efficient, transparent, and effective process, ultimately supporting better educational outcomes and institutional success. This project is suitable for a college assignment as it demonstrates practical application of MERN stack technologies while addressing real-world challenges in education.

## Functional Requirements

### Student Features
- **Profile Management:** View and update personal information, including contact details, academic history, and emergency contacts.
- **Course Enrollment:** Browse available courses, enroll in classes, and view enrolled courses with schedules and prerequisites.
- **Grade Viewing:** Access academic transcripts, view grades for completed courses, and track GPA.
- **Attendance Tracking:** Check personal attendance records for each course and receive notifications for low attendance.
- **Event Participation:** View upcoming college events, register for events, and receive reminders.
- **Fee Payment:** View outstanding fees, make online payments, and download payment receipts.
- **Announcements Access:** Read college-wide announcements, news, and updates in a dedicated dashboard.


### Admin Features
- **Student Management:** Add, edit, and delete student records; manage enrollments and academic progress.
- **Course Management:** Create, update, and delete courses; assign faculty and set schedules.
- **Faculty Management:** Manage faculty profiles, assign courses, and track performance.
- **Event Management:** Create and schedule events, manage registrations, and send notifications.
- **Report Generation:** Generate reports on student performance, attendance, fees, and enrollment statistics.
- **Fee Management:** Set fee structures, track payments, and send reminders for overdue fees.
- **Communication Tools:** Post announcements, send targeted notifications, and manage college-wide messaging.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (for full backend functionality)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - The `.env` file is already configured with default settings
   - For production, change the JWT secret

4. **Optional: Install MongoDB** (for full database functionality):
   - Download and install MongoDB Community Edition from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
   - Update the `MONGO_URI` in `.env` if needed

5. Start the backend server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

The backend will run on `http://localhost:5002` (Note: Changed from 5000/5001 due to port conflicts)

**Note:** The application works in "offline mode" without MongoDB installed. It will use mock data for courses and events, and simulate user authentication.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000` (or `http://localhost:3001` if port 3000 is busy)

### Usage
1. Open your browser and go to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. For admin access, use an email containing 'admin' (e.g., admin@example.com)
4. For student access, use any other email

### Features Implemented
- User authentication (registration/login)
- Role-based access (Student/Admin)
- Protected routes
- Student dashboard with course and event viewing
- Admin dashboard with management overview
- Responsive design with glassmorphism UI
- JWT token-based authentication
- API integration with fallback to mock data

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/courses` - Get courses (filtered by role)
- `GET /api/events` - Get events
- `GET /api/health` - Health check

### Development Notes
- The application includes mock data fallbacks for development when the backend is not available
- All API calls gracefully handle network errors
- The UI is fully responsive and works on mobile devices
- Authentication state is managed via localStorage

### Troubleshooting

#### MongoDB Connection Issues
If you encounter MongoDB connection problems:

1. **Install MongoDB**: Download from https://www.mongodb.com/try/download/community
2. **Start MongoDB**: Run `mongod` in a terminal (default port 27017)
3. **Check Connection**: Use MongoDB Compass with connection string: `mongodb://localhost:27017`
4. **Alternative**: Use MongoDB Atlas (cloud database) and update the `MONGO_URI` in `.env`

#### Port Conflicts
- Backend runs on port 5002 (changed from 5000/5001)
- Frontend runs on port 3000 or 3001
- If ports are busy, the applications will prompt for alternatives

#### Authentication Issues
- The app works in offline mode without MongoDB
- Registration and login are simulated when database is unavailable
- Use any email for student access, or include 'admin' in email for admin access