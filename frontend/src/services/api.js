import { validateFormBuilderConfig, validateResponses } from '../utils/formUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://college-event-management-yfmp.onrender.com/api'
    : 'http://localhost:5000/api');
const ADMIN_EMAIL = 'avinash@dev.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME = 'Avinash';
const MOCK_STORAGE_KEYS = {
  courses: 'mock_courses_data',
  events: 'mock_events_data',
  users: 'mock_users_data',
  currentUser: 'mock_current_user',
  forms: 'mock_forms_data',
  formResponses: 'mock_form_responses_data',
};

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

const buildHttpError = async (response, fallbackMessage) => {
  let message = fallbackMessage;

  try {
    const errorData = await response.json();
    if (errorData?.message) {
      message = errorData.message;
    }
  } catch (parseError) {
    // Ignore JSON parse errors and keep fallback message.
  }

  const error = new Error(message);
  error.status = response.status;
  error.isHttpError = true;
  return error;
};

// Helper function to make authenticated requests with fallback to mock data
const authRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw await buildHttpError(response, `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error?.isHttpError) {
      throw error;
    }

    console.warn(`API call to ${url} failed, using mock data:`, error.message);
    // Return mock data for development
    return getMockData(url, options);
  }
};

const defaultCourses = [
  {
    _id: 'course-1',
    title: 'Artificial Intelligence Foundations',
    code: 'AI301',
    description: 'Core AI concepts including search, reasoning, machine learning basics, and real-world applications.',
    instructor: 'Dr. Riya Malhotra',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 60
  },
  {
    _id: 'course-2',
    title: 'Cloud Computing Architecture',
    code: 'CC302',
    description: 'Build scalable cloud-native systems with virtualization, containers, deployment strategies, and cost analysis.',
    instructor: 'Prof. Arjun Nair',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 55
  },
  {
    _id: 'course-3',
    title: 'Data Structures and Algorithms',
    code: 'CS201',
    description: 'Problem solving with advanced data structures, recursion, graphs, greedy methods, and dynamic programming.',
    instructor: 'Dr. Kavita Sinha',
    credits: 4,
    semester: 'Spring',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 50
  },
  {
    _id: 'course-4',
    title: 'Full Stack Web Engineering',
    code: 'FS310',
    description: 'End-to-end web development covering REST APIs, React interfaces, authentication, and deployment.',
    instructor: 'Prof. Sameer Khan',
    credits: 4,
    semester: 'Spring',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 65
  },
  {
    _id: 'course-5',
    title: 'Cybersecurity Essentials',
    code: 'CY215',
    description: 'Practical security fundamentals including cryptography, authentication, access control, and incident response.',
    instructor: 'Dr. Neha Arora',
    credits: 3,
    semester: 'Summer',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 45
  },
  {
    _id: 'course-6',
    title: 'Database Management Systems',
    code: 'DB220',
    description: 'Relational design, normalization, SQL optimization, transactions, indexing, and NoSQL fundamentals.',
    instructor: 'Prof. Vishal Rao',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 60
  },
  {
    _id: 'course-7',
    title: 'Mobile App Development',
    code: 'MD330',
    description: 'Design and build mobile applications with modern UI patterns, API integration, and device capabilities.',
    instructor: 'Dr. Sana Qureshi',
    credits: 3,
    semester: 'Spring',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 48
  },
  {
    _id: 'course-8',
    title: 'Operating Systems',
    code: 'OS240',
    description: 'Processes, scheduling, memory management, concurrency, and systems programming fundamentals.',
    instructor: 'Prof. Rohit Tandon',
    credits: 4,
    semester: 'Fall',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 52
  },
  {
    _id: 'course-9',
    title: 'Software Testing and QA',
    code: 'ST325',
    description: 'Unit, integration, and end-to-end testing along with automation, debugging, and quality practices.',
    instructor: 'Dr. Meenal Joseph',
    credits: 3,
    semester: 'Summer',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 40
  },
  {
    _id: 'course-10',
    title: 'UI UX Design Studio',
    code: 'UX205',
    description: 'User research, wireframing, prototyping, interaction design, accessibility, and product thinking.',
    instructor: 'Prof. Aditi Kapoor',
    credits: 3,
    semester: 'Spring',
    year: 2026,
    enrolledStudents: [],
    maxStudents: 42
  }
];

const defaultEvents = [
  {
    _id: 'event-1',
    title: 'AI Innovation Summit',
    description: 'A campus-wide summit featuring AI demos, research showcases, and expert sessions.',
    date: '2026-05-18',
    time: '10:00 AM',
    location: 'Main Auditorium',
    organizer: 'Innovation Cell',
    category: 'Technical',
    maxAttendees: 220,
    registeredAttendees: [],
    status: 'Upcoming'
  },
  {
    _id: 'event-2',
    title: 'Annual Cultural Fest',
    description: 'Music, drama, dance, and creative performances celebrating campus talent.',
    date: '2026-05-24',
    time: '2:00 PM',
    location: 'Open Air Theatre',
    organizer: 'Cultural Committee',
    category: 'Cultural',
    maxAttendees: 500,
    registeredAttendees: [],
    status: 'Upcoming'
  },
  {
    _id: 'event-3',
    title: 'HackSprint 2026',
    description: 'A coding marathon for web, mobile, and AI builders across departments.',
    date: '2026-05-12',
    time: '9:00 AM',
    location: 'Innovation Lab',
    organizer: 'Coding Club',
    category: 'Technical',
    maxAttendees: 180,
    registeredAttendees: [],
    status: 'Upcoming'
  },
  {
    _id: 'event-4',
    title: 'Career Launch Fair',
    description: 'Connect with hiring partners, alumni mentors, and internship coordinators.',
    date: '2026-05-28',
    time: '11:30 AM',
    location: 'Seminar Hall',
    organizer: 'Placement Cell',
    category: 'Academic',
    maxAttendees: 250,
    registeredAttendees: [],
    status: 'Upcoming'
  },
  {
    _id: 'event-5',
    title: 'Design Thinking Bootcamp',
    description: 'Collaborative workshop focused on product thinking and creative problem solving.',
    date: '2026-05-08',
    time: '1:00 PM',
    location: 'Design Studio',
    organizer: 'UI UX Society',
    category: 'Academic',
    maxAttendees: 90,
    registeredAttendees: [],
    status: 'Upcoming'
  },
  {
    _id: 'event-6',
    title: 'Sports Week Finals',
    description: 'Final round matches and medal ceremonies for college sports competitions.',
    date: '2026-04-10',
    time: '4:00 PM',
    location: 'Sports Complex',
    organizer: 'Sports Council',
    category: 'Sports',
    maxAttendees: 300,
    registeredAttendees: [],
    status: 'Ongoing'
  },
  {
    _id: 'event-7',
    title: 'Startup Pitch Arena',
    description: 'Student founders pitch startup ideas to a panel of entrepreneurs and investors.',
    date: '2026-04-10',
    time: '12:00 PM',
    location: 'Conference Room A',
    organizer: 'Entrepreneurship Cell',
    category: 'Technical',
    maxAttendees: 120,
    registeredAttendees: [],
    status: 'Ongoing'
  },
  {
    _id: 'event-8',
    title: 'Research Poster Expo',
    description: 'Poster presentations from student researchers across engineering and sciences.',
    date: '2026-04-03',
    time: '11:00 AM',
    location: 'Library Foyer',
    organizer: 'Research Council',
    category: 'Academic',
    maxAttendees: 160,
    registeredAttendees: [],
    status: 'Completed'
  },
  {
    _id: 'event-9',
    title: 'Community Outreach Drive',
    description: 'Volunteer-led social impact drive with awareness sessions and donation support.',
    date: '2026-03-27',
    time: '9:30 AM',
    location: 'City Community Center',
    organizer: 'NSS Unit',
    category: 'Other',
    maxAttendees: 140,
    registeredAttendees: [],
    status: 'Completed'
  },
  {
    _id: 'event-10',
    title: 'Robotics Showcase',
    description: 'Live robotics demonstrations, autonomous prototypes, and student innovation displays.',
    date: '2026-04-01',
    time: '3:00 PM',
    location: 'Mechanical Block Arena',
    organizer: 'Robotics Club',
    category: 'Technical',
    maxAttendees: 190,
    registeredAttendees: [],
    status: 'Completed'
  }
];

const defaultUsers = [
  {
    _id: 'admin-1',
    name: 'Admin User',
    email: 'admin@college.edu',
    role: 'admin',
    bio: 'Platform administrator',
    phone: '',
    department: 'Administration',
    year: '',
    isOnline: false,
    lastLoginAt: null,
    lastActiveAt: null,
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    _id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav@college.edu',
    role: 'student',
    bio: 'Interested in robotics, coding contests, and peer learning.',
    phone: '9876543210',
    department: 'Computer Science',
    year: '3rd Year',
    isOnline: false,
    lastLoginAt: null,
    lastActiveAt: null,
    createdAt: '2026-02-02T10:00:00.000Z'
  },
  {
    _id: 'student-2',
    name: 'Priya Verma',
    email: 'priya@college.edu',
    role: 'student',
    bio: 'Design club member and event volunteer.',
    phone: '9123456780',
    department: 'Information Technology',
    year: '2nd Year',
    isOnline: false,
    lastLoginAt: null,
    lastActiveAt: null,
    createdAt: '2026-02-14T10:00:00.000Z'
  }
];

const getStoredMockData = (key, fallback) => {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

const setStoredMockData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const createMockId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildSimpleRegistrationFields = (type) => [
  {
    name: 'studentName',
    label: 'Student Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'Enter your college email',
  },
  {
    name: type === 'course' ? 'learningGoals' : 'interestReason',
    label: type === 'course' ? 'Why do you want to enroll?' : 'Why do you want to join?',
    type: 'textarea',
    required: true,
    placeholder: type === 'course'
      ? 'Share your learning goals'
      : 'Share your reason for joining this event',
  },
];

const createSimpleFormForItem = (type, itemId, itemTitle) => ({
  _id: createMockId('form'),
  type,
  itemId,
  title: `${itemTitle || 'Registration'} Form`,
  description: type === 'course'
    ? 'Complete this short form before course enrollment.'
    : 'Complete this short form before event registration.',
  fields: buildSimpleRegistrationFields(type),
  isActive: true,
  createdAt: new Date().toISOString(),
});

const ensureSimpleFormsForAllMockItems = () => {
  const courses = getStoredMockData(MOCK_STORAGE_KEYS.courses, defaultCourses);
  const events = getStoredMockData(MOCK_STORAGE_KEYS.events, defaultEvents);
  const forms = getStoredForms();

  let nextForms = [...forms];
  let coursesChanged = false;
  let eventsChanged = false;
  let formsChanged = false;

  const formsByItem = new Map(nextForms.map((form) => [`${form.type}:${form.itemId}`, form]));

  const nextCourses = courses.map((course) => {
    const key = `course:${course._id}`;
    const linkedForm = formsByItem.get(key);

    if (linkedForm) {
      if (course.formId !== linkedForm._id) {
        coursesChanged = true;
        return { ...course, formId: linkedForm._id };
      }
      return course;
    }

    const form = createSimpleFormForItem('course', course._id, course.title);
    nextForms = [form, ...nextForms];
    formsByItem.set(key, form);
    formsChanged = true;
    coursesChanged = true;
    return { ...course, formId: form._id };
  });

  const nextEvents = events.map((event) => {
    const key = `event:${event._id}`;
    const linkedForm = formsByItem.get(key);

    if (linkedForm) {
      if (event.formId !== linkedForm._id) {
        eventsChanged = true;
        return { ...event, formId: linkedForm._id };
      }
      return event;
    }

    const form = createSimpleFormForItem('event', event._id, event.title);
    nextForms = [form, ...nextForms];
    formsByItem.set(key, form);
    formsChanged = true;
    eventsChanged = true;
    return { ...event, formId: form._id };
  });

  if (formsChanged) {
    setStoredMockData(MOCK_STORAGE_KEYS.forms, nextForms);
  }

  if (coursesChanged) {
    setStoredMockData(MOCK_STORAGE_KEYS.courses, nextCourses);
  }

  if (eventsChanged) {
    setStoredMockData(MOCK_STORAGE_KEYS.events, nextEvents);
  }
};

const createMockError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getCurrentMockUser = () => {
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : getStoredMockData(MOCK_STORAGE_KEYS.currentUser, defaultUsers[1]);
  return currentUser || defaultUsers[1];
};

const getStoredForms = () => getStoredMockData(MOCK_STORAGE_KEYS.forms, []);
const getStoredFormResponses = () => getStoredMockData(MOCK_STORAGE_KEYS.formResponses, []);

const attachFormToItem = (item, forms = getStoredForms()) => {
  if (!item?.formId) {
    return item;
  }

  const formId = typeof item.formId === 'object' ? item.formId._id : item.formId;
  const form = forms.find((entry) => entry._id === formId);

  return form
    ? { ...item, formId: { ...form } }
    : item;
};

const attachFormsToItems = (items = []) => {
  const forms = getStoredForms();
  return items.map((item) => attachFormToItem(item, forms));
};

const deleteMockItemForms = (type, itemId) => {
  const forms = getStoredForms();
  const formsToDelete = forms.filter((form) => form.type === type && form.itemId === itemId);
  const nextForms = forms.filter((form) => !(form.type === type && form.itemId === itemId));
  const nextResponses = getStoredFormResponses().filter(
    (response) => !formsToDelete.some((form) => form._id === response.formId)
  );

  setStoredMockData(MOCK_STORAGE_KEYS.forms, nextForms);
  setStoredMockData(MOCK_STORAGE_KEYS.formResponses, nextResponses);
};

const getMockData = (url, options = {}) => {
  ensureSimpleFormsForAllMockItems();

  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const currentUser = getCurrentMockUser();

  if (url === '/courses') {
    const courses = getStoredMockData(MOCK_STORAGE_KEYS.courses, defaultCourses);

    if (method === 'POST') {
      const newCourse = {
        _id: `course-${Date.now()}`,
        title: body.title || 'New Course',
        code: (body.code || `C${Date.now().toString().slice(-4)}`).toUpperCase(),
        description: body.description || 'Course description pending.',
        instructor: body.instructor || 'Faculty Team',
        credits: Number(body.credits) || 3,
        semester: body.semester || 'Fall',
        year: Number(body.year) || new Date().getFullYear(),
        enrolledStudents: body.enrolledStudents || [],
        maxStudents: Number(body.maxStudents) || 50,
        formId: body.formId || null,
      };

      setStoredMockData(MOCK_STORAGE_KEYS.courses, [newCourse, ...courses]);
      return attachFormToItem(newCourse);
    }

    return attachFormsToItems(courses);
  }

  if (url.startsWith('/courses/')) {
    const courses = getStoredMockData(MOCK_STORAGE_KEYS.courses, defaultCourses);
    const [, , courseId, action] = url.split('/');
    const course = courses.find((entry) => entry._id === courseId);

    if (!course) {
      throw createMockError('Course not found', 404);
    }

    if (method === 'PUT') {
      const updatedCourses = courses.map((entry) =>
        entry._id === courseId
          ? {
              ...entry,
              ...body,
              code: body.code ? body.code.toUpperCase() : entry.code,
              credits: body.credits !== undefined ? Number(body.credits) : entry.credits,
              year: body.year !== undefined ? Number(body.year) : entry.year,
              maxStudents: body.maxStudents !== undefined ? Number(body.maxStudents) : entry.maxStudents,
            }
          : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.courses, updatedCourses);
      return attachFormToItem(updatedCourses.find((entry) => entry._id === courseId));
    }

    if (method === 'DELETE') {
      deleteMockItemForms('course', courseId);
      const filteredCourses = courses.filter((entry) => entry._id !== courseId);
      setStoredMockData(MOCK_STORAGE_KEYS.courses, filteredCourses);
      return { success: true };
    }

    if (action === 'enroll' && method === 'POST') {
      if (course.enrolledStudents?.some((student) => student._id === currentUser._id)) {
        throw createMockError('Already enrolled in this course', 400);
      }

      if ((course.enrolledStudents?.length || 0) >= Number(course.maxStudents || 0)) {
        throw createMockError('Course is full', 400);
      }

      if (course.formId) {
        const forms = getStoredForms();
        const formId = typeof course.formId === 'object' ? course.formId._id : course.formId;
        const activeForm = forms.find((form) => form._id === formId && form.isActive !== false);

        if (activeForm) {
          const responses = getStoredFormResponses();
          const existingResponse = responses.find(
            (response) => response.formId === activeForm._id && response.userId === currentUser._id
          );

          if (!existingResponse) {
            throw createMockError('Please complete the course form before enrolling', 400);
          }
        }
      }

      const updatedCourses = courses.map((entry) =>
        entry._id === courseId
          ? {
              ...entry,
              enrolledStudents: [...(entry.enrolledStudents || []), currentUser],
            }
          : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.courses, updatedCourses);
      return attachFormToItem(updatedCourses.find((entry) => entry._id === courseId));
    }

    return attachFormToItem(course);
  }

  if (url === '/events') {
    const events = getStoredMockData(MOCK_STORAGE_KEYS.events, defaultEvents);

    if (method === 'POST') {
      const newEvent = {
        _id: `event-${Date.now()}`,
        title: body.title || 'New Event',
        description: body.description || '',
        date: body.date || new Date().toISOString().split('T')[0],
        time: body.time || '10:00 AM',
        location: body.location || 'Campus',
        organizer: body.organizer || 'Admin Office',
        category: body.category || 'General',
        maxAttendees: Number(body.maxAttendees) || 100,
        registeredAttendees: [],
        status: body.status || 'Upcoming',
        formId: body.formId || null,
      };

      setStoredMockData(MOCK_STORAGE_KEYS.events, [newEvent, ...events]);
      return attachFormToItem(newEvent);
    }

    return attachFormsToItems(events);
  }

  if (url.startsWith('/events/')) {
    const events = getStoredMockData(MOCK_STORAGE_KEYS.events, defaultEvents);
    const [, , eventId, action] = url.split('/');
    const event = events.find((entry) => entry._id === eventId);

    if (!event) {
      throw createMockError('Event not found', 404);
    }

    if (method === 'DELETE') {
      deleteMockItemForms('event', eventId);
      const filteredEvents = events.filter((entry) => entry._id !== eventId);
      setStoredMockData(MOCK_STORAGE_KEYS.events, filteredEvents);
      return { success: true };
    }

    if (method === 'PUT') {
      const updatedEvents = events.map((entry) =>
        entry._id === eventId ? { ...entry, ...body } : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.events, updatedEvents);
      return attachFormToItem(updatedEvents.find((entry) => entry._id === eventId));
    }

    if (action === 'register' && method === 'POST') {
      if (event.registeredAttendees?.some((student) => student._id === currentUser._id)) {
        throw createMockError('Already registered for this event', 400);
      }

      if ((event.registeredAttendees?.length || 0) >= Number(event.maxAttendees || 0)) {
        throw createMockError('Event is full', 400);
      }

      if (event.formId) {
        const forms = getStoredForms();
        const formId = typeof event.formId === 'object' ? event.formId._id : event.formId;
        const activeForm = forms.find((form) => form._id === formId && form.isActive !== false);

        if (activeForm) {
          const responses = getStoredFormResponses();
          const existingResponse = responses.find(
            (response) => response.formId === activeForm._id && response.userId === currentUser._id
          );

          if (!existingResponse) {
            throw createMockError('Please complete the event form before registering', 400);
          }
        }
      }

      const updatedEvents = events.map((entry) =>
        entry._id === eventId
          ? {
              ...entry,
              registeredAttendees: [...(entry.registeredAttendees || []), currentUser],
            }
          : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.events, updatedEvents);
      return attachFormToItem(updatedEvents.find((entry) => entry._id === eventId));
    }

    return attachFormToItem(event);
  }

  if (url.startsWith('/forms/id/')) {
    const formId = url.split('/')[3];
    const form = getStoredForms().find((entry) => entry._id === formId);

    if (!form) {
      throw createMockError('Form not found', 404);
    }

    return form;
  }

  if (url.startsWith('/forms/')) {
    const parts = url.split('/');
    const forms = getStoredForms();
    const responses = getStoredFormResponses();

    if (parts[3] === 'submit' && method === 'POST') {
      const formId = parts[2];
      const form = forms.find((entry) => entry._id === formId);

      if (!form) {
        throw createMockError('Form not found', 404);
      }

      if (form.isActive === false) {
        throw createMockError('This form is no longer active', 400);
      }

      if (responses.some((entry) => entry.formId === formId && entry.userId === currentUser._id)) {
        throw createMockError('Form already submitted', 400);
      }

      const validation = validateResponses(form.fields || [], body.responses || {});
      if (!validation.isValid) {
        throw createMockError(Object.values(validation.errors)[0], 400);
      }

      const newResponse = {
        _id: `response-${Date.now()}`,
        formId,
        userId: currentUser._id,
        responses: validation.normalizedResponses,
        submittedAt: new Date().toISOString(),
      };

      setStoredMockData(MOCK_STORAGE_KEYS.formResponses, [newResponse, ...responses]);
      return newResponse;
    }

    if (parts[3] === 'responses' && method === 'GET') {
      const formId = parts[2];
      const users = getStoredMockData(MOCK_STORAGE_KEYS.users, defaultUsers);

      return responses
        .filter((entry) => entry.formId === formId)
        .map((entry) => ({
          ...entry,
          userId: users.find((user) => user._id === entry.userId) || { _id: entry.userId, email: 'Unknown user' },
        }))
        .sort((first, second) => new Date(second.submittedAt) - new Date(first.submittedAt));
    }

    if (parts[3] === 'my-response' && method === 'GET') {
      const formId = parts[2];
      const response = responses.find(
        (entry) => entry.formId === formId && entry.userId === currentUser._id
      );

      if (!response) {
        throw createMockError('Response not found', 404);
      }

      return response;
    }

    const type = parts[2];
    const itemId = parts[3];

    if (!['course', 'event'].includes(type)) {
      throw createMockError('Invalid form type', 400);
    }

    if (method === 'GET') {
      const form = forms.find(
        (entry) => entry.type === type && entry.itemId === itemId && entry.isActive !== false
      );

      if (!form) {
        throw createMockError('Form not found', 404);
      }

      return form;
    }

    if (method === 'POST') {
      const validation = validateFormBuilderConfig(
        {
          enabled: true,
          title: body.title,
          description: body.description,
          fields: body.fields,
        },
        body.title || 'Registration Form'
      );

      if (!validation.isValid) {
        throw createMockError(validation.message, 400);
      }

      const existingForm = forms.find((entry) => entry.type === type && entry.itemId === itemId);
      const nextForm = existingForm
        ? {
            ...existingForm,
            title: validation.normalizedConfig.title,
            description: validation.normalizedConfig.description,
            fields: validation.normalizedConfig.fields,
            isActive: true,
          }
        : {
            _id: `form-${Date.now()}`,
            type,
            itemId,
            title: validation.normalizedConfig.title,
            description: validation.normalizedConfig.description,
            fields: validation.normalizedConfig.fields,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

      const nextForms = existingForm
        ? forms.map((entry) => (entry._id === existingForm._id ? nextForm : entry))
        : [nextForm, ...forms];

      setStoredMockData(MOCK_STORAGE_KEYS.forms, nextForms);

      const collectionKey = type === 'course' ? MOCK_STORAGE_KEYS.courses : MOCK_STORAGE_KEYS.events;
      const collectionFallback = type === 'course' ? defaultCourses : defaultEvents;
      const updatedCollection = getStoredMockData(collectionKey, collectionFallback).map((entry) =>
        entry._id === itemId ? { ...entry, formId: nextForm._id } : entry
      );
      setStoredMockData(collectionKey, updatedCollection);

      return nextForm;
    }

    if (method === 'DELETE') {
      const form = forms.find((entry) => entry.type === type && entry.itemId === itemId);
      if (!form) {
        throw createMockError('Form not found', 404);
      }

      const nextForms = forms.map((entry) =>
        entry._id === form._id ? { ...entry, isActive: false } : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.forms, nextForms);
      return { message: 'Form archived successfully', form: nextForms.find((entry) => entry._id === form._id) };
    }
  }

  if (url === '/auth/users') {
    return getStoredMockData(MOCK_STORAGE_KEYS.users, defaultUsers);
  }

  if (url === '/auth/me') {
    const fallbackUser = currentUser;

    if (method === 'PUT') {
      const updatedUser = {
        ...fallbackUser,
        ...body,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setStoredMockData(MOCK_STORAGE_KEYS.currentUser, updatedUser);

      const users = getStoredMockData(MOCK_STORAGE_KEYS.users, defaultUsers);
      const updatedUsers = users.map((user) =>
        user._id === updatedUser._id ? { ...user, ...updatedUser } : user
      );
      setStoredMockData(MOCK_STORAGE_KEYS.users, updatedUsers);

      return {
        ...updatedUser,
        token: getAuthToken() || `mock-jwt-token-${Date.now()}`,
      };
    }

    return getStoredMockData(MOCK_STORAGE_KEYS.currentUser, fallbackUser);
  }

  if (url === '/auth/activity') {
    return { success: true, lastActiveAt: new Date().toISOString() };
  }

  if (url === '/auth/logout') {
    return { message: 'Logged out successfully' };
  }

  if (url.startsWith('/auth/users/')) {
    const users = getStoredMockData(MOCK_STORAGE_KEYS.users, defaultUsers);
    const userId = url.split('/').pop();
    const user = users.find((entry) => entry._id === userId);

    if (!user) {
      throw createMockError('User not found', 404);
    }

    if (method === 'PUT') {
      const updatedUsers = users.map((entry) =>
        entry._id === userId ? { ...entry, ...body } : entry
      );
      setStoredMockData(MOCK_STORAGE_KEYS.users, updatedUsers);
      return updatedUsers.find((entry) => entry._id === userId);
    }

    if (method === 'DELETE') {
      const filteredUsers = users.filter((entry) => entry._id !== userId);
      setStoredMockData(MOCK_STORAGE_KEYS.users, filteredUsers);
      return { success: true };
    }

    return user;
  }

  return [];
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      return response.json();
    } catch (error) {
      console.warn('Registration API failed, using mock:', error.message);
      // Mock registration success
      return {
        _id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'student',
        token: 'mock-jwt-token-' + Date.now()
      };
    }
  },

  login: async (credentials) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Login failed');
      }

      return response.json();
    } catch (error) {
      if (normalizedEmail === ADMIN_EMAIL) {
        throw new Error('Admin login is available only on the secure admin route.');
      }

      console.warn('Login API failed, using mock:', error.message);
      return {
        _id: 'mock-user-id',
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'student',
        bio: '',
        phone: '',
        department: '',
        year: '',
        token: 'mock-jwt-token-' + Date.now()
      };
    }
  },

  adminLogin: async (credentials) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Admin login failed');
      }

      return response.json();
    } catch (error) {
      console.warn('Admin login API failed, using mock:', error.message);

      if (normalizedEmail !== ADMIN_EMAIL || credentials.password !== ADMIN_PASSWORD) {
        throw new Error('Invalid admin credentials');
      }

      return {
        _id: 'secure-admin-avinash',
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin',
        bio: 'System administrator',
        phone: '',
        department: 'Platform Operations',
        year: '',
        token: 'mock-admin-token-' + Date.now()
      };
    }
  },

  getCurrentUser: async () => {
    return authRequest('/auth/me');
  },
  updateActivity: async () => authRequest('/auth/activity', { method: 'POST' }),
  logout: async () => authRequest('/auth/logout', { method: 'POST' }),
};

// Courses API
export const coursesAPI = {
  getCourses: () => authRequest('/courses'),
  getCourse: (id) => authRequest(`/courses/${id}`),
  createCourse: (courseData) => authRequest('/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  updateCourse: (id, courseData) => authRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
  deleteCourse: (id) => authRequest(`/courses/${id}`, { method: 'DELETE' }),
  enrollCourse: (id) => authRequest(`/courses/${id}/enroll`, { method: 'POST' }),
};

// Events API
export const eventsAPI = {
  getEvents: () => authRequest('/events'),
  getEvent: (id) => authRequest(`/events/${id}`),
  createEvent: (eventData) => authRequest('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => authRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  deleteEvent: (id) => authRequest(`/events/${id}`, { method: 'DELETE' }),
  registerForEvent: (id) => authRequest(`/events/${id}/register`, { method: 'POST' }),
};

// Forms API
export const formsAPI = {
  getForm: (type, itemId) => authRequest(`/forms/${type}/${itemId}`),
  getFormById: (formId) => authRequest(`/forms/id/${formId}`),
  createOrUpdateForm: (type, itemId, formData) => authRequest(`/forms/${type}/${itemId}`, { method: 'POST', body: JSON.stringify(formData) }),
  deleteForm: (type, itemId) => authRequest(`/forms/${type}/${itemId}`, { method: 'DELETE' }),
  submitFormResponse: (formId, responses) => authRequest(`/forms/${formId}/submit`, { method: 'POST', body: JSON.stringify({ responses }) }),
  getFormResponses: (formId) => authRequest(`/forms/${formId}/responses`),
  getMyFormResponse: (formId) => authRequest(`/forms/${formId}/my-response`),
};

// Users API (Admin only)
export const usersAPI = {
  getUsers: () => authRequest('/auth/users'),
  getUser: (id) => authRequest(`/auth/users/${id}`),
  updateUser: (id, userData) => authRequest(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => authRequest(`/auth/users/${id}`, { method: 'DELETE' }),
  getProfile: () => authRequest('/auth/me'),
  updateProfile: (userData) => authRequest('/auth/me', { method: 'PUT', body: JSON.stringify(userData) }),
};
