require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Course = require('../models/courseModel');
const Event = require('../models/eventModel');
const Form = require('../models/formModel');
const User = require('../models/userModel');

const courses = [
  {
    title: 'Artificial Intelligence Foundations',
    code: 'AI301',
    description: 'Core AI concepts including search, reasoning, machine learning basics, and real-world applications.',
    instructor: 'Dr. Riya Malhotra',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    maxStudents: 60,
  },
  {
    title: 'Cloud Computing Architecture',
    code: 'CC302',
    description: 'Build scalable cloud-native systems with virtualization, containers, deployment strategies, and cost analysis.',
    instructor: 'Prof. Arjun Nair',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    maxStudents: 55,
  },
  {
    title: 'Full Stack Web Engineering',
    code: 'FS310',
    description: 'End-to-end web development covering REST APIs, React interfaces, authentication, and deployment.',
    instructor: 'Prof. Sameer Khan',
    credits: 4,
    semester: 'Spring',
    year: 2026,
    maxStudents: 65,
  },
  {
    title: 'Cybersecurity Essentials',
    code: 'CY215',
    description: 'Practical security fundamentals including cryptography, authentication, access control, and incident response.',
    instructor: 'Dr. Neha Arora',
    credits: 3,
    semester: 'Summer',
    year: 2026,
    maxStudents: 45,
  },
  {
    title: 'UI UX Design Studio',
    code: 'UX205',
    description: 'User research, wireframing, prototyping, interaction design, accessibility, and product thinking.',
    instructor: 'Prof. Aditi Kapoor',
    credits: 3,
    semester: 'Spring',
    year: 2026,
    maxStudents: 42,
  },
];

const events = [
  {
    title: 'HackSprint 2026',
    description: 'A coding marathon for web, mobile, and AI builders across departments.',
    date: new Date('2026-05-12'),
    time: '9:00 AM',
    location: 'Innovation Lab',
    organizer: 'Coding Club',
    category: 'Technical',
    maxAttendees: 180,
    status: 'Upcoming',
  },
  {
    title: 'AI Innovation Summit',
    description: 'A campus-wide summit featuring AI demos, research showcases, and expert sessions.',
    date: new Date('2026-05-18'),
    time: '10:00 AM',
    location: 'Main Auditorium',
    organizer: 'Innovation Cell',
    category: 'Technical',
    maxAttendees: 220,
    status: 'Upcoming',
  },
  {
    title: 'Design Thinking Bootcamp',
    description: 'Collaborative workshop focused on product thinking and creative problem solving.',
    date: new Date('2026-05-08'),
    time: '1:00 PM',
    location: 'Design Studio',
    organizer: 'UI UX Society',
    category: 'Academic',
    maxAttendees: 90,
    status: 'Upcoming',
  },
  {
    title: 'Career Launch Fair',
    description: 'Connect with hiring partners, alumni mentors, and internship coordinators.',
    date: new Date('2026-05-28'),
    time: '11:30 AM',
    location: 'Seminar Hall',
    organizer: 'Placement Cell',
    category: 'Academic',
    maxAttendees: 250,
    status: 'Upcoming',
  },
  {
    title: 'Startup Pitch Arena',
    description: 'Student founders pitch startup ideas to a panel of entrepreneurs and investors.',
    date: new Date('2026-05-20'),
    time: '12:00 PM',
    location: 'Conference Room A',
    organizer: 'Entrepreneurship Cell',
    category: 'Technical',
    maxAttendees: 120,
    status: 'Upcoming',
  },
];

const students = [
  {
    name: 'Aarav Sharma',
    email: 'aarav@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Interested in robotics, coding contests, and peer learning.',
    phone: '9876543210',
    department: 'Computer Science',
    year: '3rd Year',
  },
  {
    name: 'Priya Verma',
    email: 'priya@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Design club member and event volunteer.',
    phone: '9123456780',
    department: 'Information Technology',
    year: '2nd Year',
  },
  {
    name: 'Kabir Mehta',
    email: 'kabir@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Full stack learner and hackathon enthusiast.',
    phone: '9988776655',
    department: 'Computer Science',
    year: '4th Year',
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Loves UX design, content, and student communities.',
    phone: '9090909090',
    department: 'Information Technology',
    year: '3rd Year',
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Sports captain and cloud computing explorer.',
    phone: '9812345678',
    department: 'Electronics',
    year: '2nd Year',
  },
  {
    name: 'Ishita Jain',
    email: 'ishita@college.edu',
    password: 'password123',
    role: 'student',
    bio: 'Research-focused student interested in AI and data.',
    phone: '9345612780',
    department: 'Artificial Intelligence',
    year: '4th Year',
  },
];

const connect = async () => {
  if (!process.env.MONGO_URI && !process.env.LOCAL_MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  const connectionOptions = {
    dbName: process.env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  };

  try {
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log('Connected to primary MongoDB cluster.');
  } catch (error) {
    if (!process.env.LOCAL_MONGO_URI) {
      throw error;
    }

    console.warn(`Primary MongoDB unavailable: ${error.message}`);
    await mongoose.connect(process.env.LOCAL_MONGO_URI, connectionOptions);
    console.log('Connected to local MongoDB fallback.');
  }
};

const courseForms = [
  {
    code: 'AI301',
    title: 'AI Foundations Registration',
    description: 'Please share your AI background and interests before enrolling.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'experience', label: 'AI / ML Experience', type: 'textarea', required: true, placeholder: 'Describe your prior AI or ML experience' },
      { name: 'goals', label: 'Learning Goals', type: 'textarea', required: true, placeholder: 'What do you want to learn in this course?' },
    ],
  },
  {
    code: 'CC302',
    title: 'Cloud Computing Course Form',
    description: 'Complete this form to register for Cloud Computing Architecture.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'year', label: 'Year of Study', type: 'select', required: true, options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
      { name: 'interestArea', label: 'Cloud Interest Area', type: 'text', required: true, placeholder: 'E.g. AWS, Azure, DevOps' },
      { name: 'experience', label: 'Cloud Experience', type: 'textarea', required: true, placeholder: 'Describe any cloud skills or certifications' },
    ],
  },
  {
    code: 'FS310',
    title: 'Full Stack Web Engineering Signup',
    description: 'Tell us about your development experience and project goals.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'frontendExperience', label: 'Frontend Experience', type: 'textarea', required: true, placeholder: 'Describe your frontend skills' },
      { name: 'backendExperience', label: 'Backend Experience', type: 'textarea', required: true, placeholder: 'Describe your backend skills' },
    ],
  },
  {
    code: 'CY215',
    title: 'Cybersecurity Essentials Enrollment',
    description: 'Complete this form to join Cybersecurity Essentials.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'reason', label: 'Why do you want to take this course?', type: 'textarea', required: true, placeholder: 'Explain your motivation' },
      { name: 'experience', label: 'Security Experience', type: 'textarea', required: true, placeholder: 'Describe any prior security or networking exposure' },
    ],
  },
  {
    code: 'UX205',
    title: 'UI UX Design Studio Registration',
    description: 'Share your design interests to register for the UI/UX course.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'tools', label: 'Design Tools You Use', type: 'text', required: true, placeholder: 'Figma, Adobe XD, Sketch, etc.' },
      { name: 'portfolioLink', label: 'Portfolio / Project Link', type: 'text', required: false, placeholder: 'Add a link if available' },
    ],
  },
];

const eventForms = [
  {
    title: 'HackSprint 2026',
    type: 'event',
    formTitle: 'HackSprint 2026 Registration',
    description: 'Register your team or solo entry for HackSprint 2026.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'teamSize', label: 'Team Size', type: 'number', required: true, placeholder: 'Enter number of team members' },
      { name: 'track', label: 'Preferred Track', type: 'select', required: true, options: ['Web', 'Mobile', 'AI', 'Gaming'] },
    ],
  },
  {
    title: 'AI Innovation Summit',
    type: 'event',
    formTitle: 'AI Innovation Summit Registration',
    description: 'Tell us your interest areas so we can plan sessions for you.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'sessionInterest', label: 'Session Interest', type: 'textarea', required: true, placeholder: 'Which AI session interests you?' },
      { name: 'dietary', label: 'Dietary Preferences', type: 'text', required: false, placeholder: 'Optional dietary notes' },
    ],
  },
  {
    title: 'Design Thinking Bootcamp',
    type: 'event',
    formTitle: 'Design Thinking Bootcamp Registration',
    description: 'Share your design interests and workshop goals.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'focusArea', label: 'Design Focus Area', type: 'select', required: true, options: ['Product Design', 'Service Design', 'UX Research', 'Interaction'] },
      { name: 'experience', label: 'Prior Design Workshops', type: 'textarea', required: false, placeholder: 'Mention any prior workshops attended' },
    ],
  },
  {
    title: 'Career Launch Fair',
    type: 'event',
    formTitle: 'Career Launch Fair Registration',
    description: 'Let us know your career interests before the fair.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'careerInterest', label: 'Career Interest', type: 'textarea', required: true, placeholder: 'Which industries are you targeting?' },
      { name: 'resumeLink', label: 'Resume / Portfolio Link', type: 'text', required: false, placeholder: 'Optional resume or portfolio link' },
    ],
  },
  {
    title: 'Startup Pitch Arena',
    type: 'event',
    formTitle: 'Startup Pitch Arena Registration',
    description: 'Register to pitch your startup idea and meet investors.',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'Enter your college email' },
      { name: 'startupIdea', label: 'Startup Idea', type: 'textarea', required: true, placeholder: 'Describe your startup concept' },
      { name: 'teamSize', label: 'Team Size', type: 'number', required: false, placeholder: 'How many team members are you bringing?' },
    ],
  },
];

const seedCourses = async () => {
  for (const course of courses) {
    const createdCourse = await Course.create({
      ...course,
      enrolledStudents: [],
    });

    const formSpec = courseForms.find((form) => form.code === course.code);
    if (formSpec) {
      const createdForm = await Form.create({
        type: 'course',
        itemId: createdCourse._id,
        title: formSpec.title,
        description: formSpec.description,
        fields: formSpec.fields,
        isActive: true,
      });

      createdCourse.formId = createdForm._id;
      await createdCourse.save();
    }
  }
};

const seedEvents = async () => {
  for (const event of events) {
    const createdEvent = await Event.create({
      ...event,
      registeredAttendees: [],
    });

    const formSpec = eventForms.find((form) => form.title === event.title);
    if (formSpec) {
      const createdForm = await Form.create({
        type: 'event',
        itemId: createdEvent._id,
        title: formSpec.formTitle,
        description: formSpec.description,
        fields: formSpec.fields,
        isActive: true,
      });

      createdEvent.formId = createdForm._id;
      await createdEvent.save();
    }
  }
};

const seedUsers = async () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  for (const student of students) {
    const existingUser = await User.findOne({ email: student.email });
    const hashedPassword = await bcrypt.hash(student.password, saltRounds);
    const userPayload = {
      ...student,
      password: hashedPassword,
      isOnline: false,
      lastLoginAt: null,
      lastActiveAt: null,
    };

    if (existingUser) {
      await User.findOneAndUpdate(
        { email: student.email },
        {
          $set: {
            name: student.name,
            role: student.role,
            bio: student.bio,
            phone: student.phone,
            department: student.department,
            year: student.year,
          },
        },
        { new: true }
      );
      continue;
    }

    await User.create(userPayload);
  }
};

const run = async () => {
  try {
    await connect();
    await Form.deleteMany({});
    await Course.deleteMany({});
    await Event.deleteMany({});
    await seedUsers();
    await seedCourses();
    await seedEvents();

    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const eventCount = await Event.countDocuments();

    console.log(`Seed complete: ${userCount} users, ${courseCount} courses and ${eventCount} events available.`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
