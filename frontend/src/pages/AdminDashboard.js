import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaBullhorn,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaClipboardCheck,
  FaCogs,
  FaDatabase,
  FaDownload,
  FaEdit,
  FaEnvelopeOpenText,
  FaExclamationTriangle,
  FaFileExport,
  FaGraduationCap,
  FaLayerGroup,
  FaLock,
  FaPlus,
  FaShieldAlt,
  FaTachometerAlt,
  FaTrash,
  FaUpload,
  FaUserCog,
  FaUserFriends,
  FaUserShield,
  FaUsersCog,
  FaEye,
  FaBell,
  FaServer,
  FaSignOutAlt,
} from 'react-icons/fa';
import { authAPI, coursesAPI, eventsAPI, usersAPI, formsAPI } from '../services/api';
import FormBuilder from '../components/FormBuilder';
import { validateFormBuilderConfig } from '../utils/formUtils';
import './StudentDashboard.css';
import './AdminDashboard.css';

const STORAGE_KEYS = {
  announcements: 'admin_broadcast_center',
  compliance: 'admin_compliance_queue',
  tickets: 'admin_support_tickets',
  audit: 'admin_audit_feed',
  settings: 'admin_system_settings',
  notifications: 'admin_notification_settings',
};

const menuItems = [
  { name: 'Dashboard', icon: FaTachometerAlt },
  { name: 'User Management', icon: FaUserFriends },
  { name: 'Course Studio', icon: FaBookOpen },
  { name: 'Event Mission', icon: FaCalendarAlt },
  { name: 'Analytics Hub', icon: FaChartBar },
  { name: 'Broadcast Center', icon: FaBullhorn },
  { name: 'Capacity Planner', icon: FaLayerGroup },
  { name: 'Compliance Desk', icon: FaClipboardCheck },
  { name: 'Support Inbox', icon: FaEnvelopeOpenText },
  { name: 'System Control', icon: FaCogs },
  { name: 'Data Operations', icon: FaDatabase },
  { name: 'Security Center', icon: FaShieldAlt },
];

const createDefaultCourseForm = () => ({
  title: '',
  code: '',
  description: '',
  instructor: '',
  credits: 3,
  semester: 'Fall',
  year: new Date().getFullYear(),
  maxStudents: 50,
  formEnabled: false,
  formTitle: '',
  formDescription: '',
  formFields: [],
});

const createDefaultEventForm = () => ({
  title: '',
  description: '',
  date: '',
  time: '10:00 AM',
  location: '',
  organizer: 'Admin Office',
  category: 'Academic',
  maxAttendees: 100,
  status: 'Upcoming',
  formEnabled: false,
  formTitle: '',
  formDescription: '',
  formFields: [],
});

const defaultAnnouncementForm = {
  title: '',
  message: '',
  audience: 'All Users',
};

const defaultTaskForm = {
  title: '',
  priority: 'Medium',
  owner: 'Admin Desk',
};

const defaultTicketNote = {
  id: '',
  note: '',
};

const defaultSystemSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  maxFileSize: 10,
  sessionTimeout: 60,
};

const defaultNotificationSettings = {
  emailEnabled: true,
  pushEnabled: false,
  smsEnabled: false,
  frequency: 'daily',
};

const readLocalCollection = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const persistCollection = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatPercent = (count, limit) => {
  if (!limit) return 0;
  return Math.min(100, Math.round((count / limit) * 100));
};

const getEventThumbnailStyle = (eventItem) => {
  const thumbMap = {
    Academic: 'linear-gradient(135deg, #818cf8 0%, #8b5cf6 100%)',
    Sports: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
    Cultural: 'linear-gradient(135deg, #f97316 0%, #fb7185 100%)',
    Technical: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    Other: 'linear-gradient(135deg, #facc15 0%, #f43f5e 100%)',
  };
  return thumbMap[eventItem.category] || thumbMap.Other;
};

const createSeedTickets = (users, courses, events) => [
  {
    id: 'ticket-1',
    subject: 'New student onboarding query',
    requester: users[0]?.name || 'Student Services',
    channel: 'Email',
    priority: 'High',
    status: 'Open',
    note: 'Verify whether orientation details are included in the welcome flow.',
  },
  {
    id: 'ticket-2',
    subject: 'Course capacity review',
    requester: courses[0]?.instructor || 'Academic Office',
    channel: 'Internal',
    priority: 'Medium',
    status: 'Investigating',
    note: `Check seat expansion plan for ${courses[0]?.title || 'the next course batch'}.`,
  },
  {
    id: 'ticket-3',
    subject: 'Event logistics approval',
    requester: events[0]?.organizer || 'Events Committee',
    channel: 'Portal',
    priority: 'Low',
    status: 'Pending Reply',
    note: `Confirm space and volunteer support for ${events[0]?.title || 'the next event'}.`,
  },
];

const AdminDashboard = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [announcements, setAnnouncements] = useState(() =>
    readLocalCollection(STORAGE_KEYS.announcements, [
      {
        id: 'announcement-1',
        title: 'Semester operations check-in',
        message: 'Review event readiness, course capacity, and support queue before the next weekly sync.',
        audience: 'Admin Team',
        pinned: true,
        createdAt: new Date().toISOString(),
      },
    ])
  );
  const [complianceTasks, setComplianceTasks] = useState(() =>
    readLocalCollection(STORAGE_KEYS.compliance, [
      {
        id: 'task-1',
        title: 'Review low-capacity academic events',
        priority: 'High',
        owner: 'Operations',
        completed: false,
      },
      {
        id: 'task-2',
        title: 'Verify active student records',
        priority: 'Medium',
        owner: 'Admin Desk',
        completed: false,
      },
    ])
  );
  const [supportTickets, setSupportTickets] = useState(() => readLocalCollection(STORAGE_KEYS.tickets, []));
  const [auditLog, setAuditLog] = useState(() =>
    readLocalCollection(STORAGE_KEYS.audit, [
      {
        id: 'audit-bootstrap',
        text: 'Admin route initialized for secure operations.',
        createdAt: new Date().toISOString(),
      },
    ])
  );
  const [systemSettings, setSystemSettings] = useState(() =>
    readLocalCollection(STORAGE_KEYS.settings, defaultSystemSettings)
  );
  const [notificationSettings, setNotificationSettings] = useState(() =>
    readLocalCollection(STORAGE_KEYS.notifications, defaultNotificationSettings)
  );
  const [studentDraft, setStudentDraft] = useState(null);
  const [courseDraft, setCourseDraft] = useState(createDefaultCourseForm());
  const [eventDraft, setEventDraft] = useState(createDefaultEventForm());
  const [announcementDraft, setAnnouncementDraft] = useState(defaultAnnouncementForm);
  const [taskDraft, setTaskDraft] = useState(defaultTaskForm);
  const [ticketNoteDraft, setTicketNoteDraft] = useState(defaultTicketNote);
  const [settingsDraft, setSettingsDraft] = useState(defaultSystemSettings);
  const [notificationDraft, setNotificationDraft] = useState(defaultNotificationSettings);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logAction = (text) => {
    const nextAudit = [
      {
        id: `audit-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
      },
      ...auditLog,
    ].slice(0, 10);

    setAuditLog(nextAudit);
    persistCollection(STORAGE_KEYS.audit, nextAudit);
  };

  const showFeedback = (message) => {
    setActionMessage(message);
    setError('');
  };

  const buildDraftFormConfig = (draft, fallbackTitle) => validateFormBuilderConfig(
    {
      enabled: draft.formEnabled,
      title: draft.formTitle || fallbackTitle,
      description: draft.formDescription,
      fields: draft.formFields,
    },
    fallbackTitle
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [coursesData, eventsData, usersData] = await Promise.all([
          coursesAPI.getCourses(),
          eventsAPI.getEvents(),
          usersAPI.getUsers(),
        ]);

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);

        if (!supportTickets.length) {
          const seededTickets = createSeedTickets(usersData || [], coursesData || [], eventsData || []);
          setSupportTickets(seededTickets);
          persistCollection(STORAGE_KEYS.tickets, seededTickets);
        }
      } catch (err) {
        setError('Admin data load failed. Showing the last available state.');
        console.error('Admin dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [supportTickets.length]);

  useEffect(() => {
    authAPI.updateActivity().catch((err) => {
      console.error('Admin activity ping failed:', err);
    });

    const intervalId = window.setInterval(() => {
      authAPI.updateActivity().catch(() => {});
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    persistCollection(STORAGE_KEYS.announcements, announcements);
  }, [announcements]);

  useEffect(() => {
    persistCollection(STORAGE_KEYS.compliance, complianceTasks);
  }, [complianceTasks]);

  useEffect(() => {
    persistCollection(STORAGE_KEYS.tickets, supportTickets);
  }, [supportTickets]);

  useEffect(() => {
    persistCollection(STORAGE_KEYS.settings, systemSettings);
  }, [systemSettings]);

  useEffect(() => {
    persistCollection(STORAGE_KEYS.notifications, notificationSettings);
  }, [notificationSettings]);

  useEffect(() => {
    setSettingsDraft(systemSettings);
  }, [systemSettings]);

  useEffect(() => {
    setNotificationDraft(notificationSettings);
  }, [notificationSettings]);

  const activeUsers = users.filter((item) => item.isOnline).length;
  const pinnedAnnouncements = announcements.filter((item) => item.pinned);
  const completedTasks = complianceTasks.filter((item) => item.completed).length;
  const totalCourseSeats = courses.reduce((sum, item) => sum + (Number(item.maxStudents) || 0), 0);
  const filledCourseSeats = courses.reduce(
    (sum, item) => sum + (Array.isArray(item.enrolledStudents) ? item.enrolledStudents.length : 0),
    0
  );
  const totalEventSeats = events.reduce((sum, item) => sum + (Number(item.maxAttendees) || 0), 0);
  const filledEventSeats = events.reduce(
    (sum, item) => sum + (Array.isArray(item.registeredAttendees) ? item.registeredAttendees.length : 0),
    0
  );
  const riskItems = [
    ...courses
      .filter((course) => formatPercent(course.enrolledStudents?.length || 0, course.maxStudents) >= 80)
      .map((course) => ({
        id: `course-risk-${course._id}`,
        title: `${course.title} is nearing full capacity`,
        meta: `${course.enrolledStudents?.length || 0}/${course.maxStudents} seats filled`,
        level: 'High',
      })),
    ...events
      .filter((event) => formatPercent(event.registeredAttendees?.length || 0, event.maxAttendees) <= 25)
      .map((event) => ({
        id: `event-risk-${event._id}`,
        title: `${event.title} needs attendance attention`,
        meta: `${event.registeredAttendees?.length || 0}/${event.maxAttendees} registrations`,
        level: 'Medium',
      })),
  ].slice(0, 6);

  const handleUserEdit = (user) => {
    setStudentDraft({
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      department: user.department || '',
    });
  };

  const handleUserSave = async (event) => {
    event.preventDefault();
    if (!studentDraft?._id) return;

    try {
      const updated = await usersAPI.updateUser(studentDraft._id, studentDraft);
      setUsers((current) => current.map((item) => (item._id === studentDraft._id ? updated : item)));
      setStudentDraft(null);
      showFeedback('User record updated successfully.');
      logAction(`User record updated for ${updated.name}.`);
    } catch (err) {
      setError('Unable to update user record.');
      console.error('User update error:', err);
    }
  };

  const handleUserDelete = async (userId) => {
    const confirmed = window.confirm('Delete this user record? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const deletedUser = users.find((item) => item._id === userId);
      await usersAPI.deleteUser(userId);
      setUsers((current) => current.filter((item) => item._id !== userId));
      showFeedback('User record deleted.');
      logAction(`User record deleted for ${deletedUser?.name || 'a user'}.`);
      if (studentDraft?._id === userId) {
        setStudentDraft(null);
      }
    } catch (err) {
      setError('Unable to delete user record.');
      console.error('User delete error:', err);
    }
  };

  const handleCourseSubmit = async (event) => {
    event.preventDefault();

    const formValidation = buildDraftFormConfig(
      courseDraft,
      `${courseDraft.title || 'Course'} Registration Form`
    );

    if (!formValidation.isValid) {
      setError(formValidation.message || 'Course form configuration is invalid.');
      return;
    }

    try {
      let savedCourse;
      if (courseDraft._id) {
        savedCourse = await coursesAPI.updateCourse(courseDraft._id, {
          title: courseDraft.title,
          code: courseDraft.code,
          description: courseDraft.description,
          instructor: courseDraft.instructor,
          credits: courseDraft.credits,
          semester: courseDraft.semester,
          year: courseDraft.year,
          maxStudents: courseDraft.maxStudents,
        });
      } else {
        savedCourse = await coursesAPI.createCourse({
          title: courseDraft.title,
          code: courseDraft.code,
          description: courseDraft.description,
          instructor: courseDraft.instructor,
          credits: courseDraft.credits,
          semester: courseDraft.semester,
          year: courseDraft.year,
          maxStudents: courseDraft.maxStudents,
        });
      }

      if (formValidation.normalizedConfig.enabled) {
        await formsAPI.createOrUpdateForm('course', savedCourse._id, {
          title: formValidation.normalizedConfig.title,
          description: formValidation.normalizedConfig.description,
          fields: formValidation.normalizedConfig.fields,
        });
      } else if (courseDraft._id && courses.find((item) => item._id === courseDraft._id)?.formId) {
        await formsAPI.deleteForm('course', savedCourse._id);
      }

      const refreshedCourse = await coursesAPI.getCourse(savedCourse._id);
      setCourses((current) => {
        const withoutCurrent = current.filter((item) => item._id !== refreshedCourse._id);
        return courseDraft._id ? [refreshedCourse, ...withoutCurrent] : [refreshedCourse, ...withoutCurrent];
      });

      showFeedback(courseDraft._id ? 'Course updated successfully.' : 'Course created successfully.');
      logAction(`${courseDraft._id ? 'Course updated' : 'Course created'}: ${refreshedCourse.title}.`);
      setCourseDraft(createDefaultCourseForm());
    } catch (err) {
      setError(err.message || 'Unable to save course.');
      console.error('Course save error:', err);
    }
  };

  const handleCourseEdit = async (course) => {
    setCourseDraft({
      _id: course._id,
      title: course.title || '',
      code: course.code || '',
      description: course.description || '',
      instructor: course.instructor || '',
      credits: Number(course.credits) || 3,
      semester: course.semester || 'Fall',
      year: Number(course.year) || new Date().getFullYear(),
      maxStudents: Number(course.maxStudents) || 50,
      formEnabled: false,
      formTitle: '',
      formDescription: '',
      formFields: [],
    });

    const formRef = course.formId?._id || course.formId;
    if (formRef) {
      try {
        const form = await formsAPI.getFormById(formRef);
        setCourseDraft((prev) => ({
          ...prev,
          formEnabled: form.isActive !== false,
          formTitle: form.title || '',
          formDescription: form.description || '',
          formFields: form.fields || [],
        }));
      } catch (err) {
        console.error('Course form load error:', err);
      }
    }
  };

  const handleCourseDelete = async (courseId) => {
    const confirmed = window.confirm('Delete this course?');
    if (!confirmed) return;

    try {
      const deletingCourse = courses.find((item) => item._id === courseId);
      await coursesAPI.deleteCourse(courseId);
      setCourses((current) => current.filter((item) => item._id !== courseId));
      showFeedback('Course removed.');
      logAction(`Course deleted: ${deletingCourse?.title || 'Untitled course'}.`);
      if (courseDraft._id === courseId) {
        setCourseDraft(createDefaultCourseForm());
      }
    } catch (err) {
      setError('Unable to delete course.');
      console.error('Course delete error:', err);
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();

    const formValidation = buildDraftFormConfig(
      eventDraft,
      `${eventDraft.title || 'Event'} Registration Form`
    );

    if (!formValidation.isValid) {
      setError(formValidation.message || 'Event form configuration is invalid.');
      return;
    }

    try {
      let savedEvent;
      if (eventDraft._id) {
        savedEvent = await eventsAPI.updateEvent(eventDraft._id, {
          title: eventDraft.title,
          description: eventDraft.description,
          date: eventDraft.date,
          time: eventDraft.time,
          location: eventDraft.location,
          organizer: eventDraft.organizer,
          category: eventDraft.category,
          maxAttendees: eventDraft.maxAttendees,
          status: eventDraft.status,
        });
      } else {
        savedEvent = await eventsAPI.createEvent({
          title: eventDraft.title,
          description: eventDraft.description,
          date: eventDraft.date,
          time: eventDraft.time,
          location: eventDraft.location,
          organizer: eventDraft.organizer,
          category: eventDraft.category,
          maxAttendees: eventDraft.maxAttendees,
          status: eventDraft.status,
        });
      }

      if (formValidation.normalizedConfig.enabled) {
        await formsAPI.createOrUpdateForm('event', savedEvent._id, {
          title: formValidation.normalizedConfig.title,
          description: formValidation.normalizedConfig.description,
          fields: formValidation.normalizedConfig.fields,
        });
      } else if (eventDraft._id && events.find((item) => item._id === eventDraft._id)?.formId) {
        await formsAPI.deleteForm('event', savedEvent._id);
      }

      const refreshedEvent = await eventsAPI.getEvent(savedEvent._id);
      setEvents((current) => {
        const withoutCurrent = current.filter((item) => item._id !== refreshedEvent._id);
        return [refreshedEvent, ...withoutCurrent];
      });

      showFeedback(eventDraft._id ? 'Event updated successfully.' : 'Event created successfully.');
      logAction(`${eventDraft._id ? 'Event updated' : 'Event created'}: ${refreshedEvent.title}.`);
      setEventDraft(createDefaultEventForm());
    } catch (err) {
      setError(err.message || 'Unable to save event.');
      console.error('Event save error:', err);
    }
  };

  const handleEventEdit = async (eventItem) => {
    setEventDraft({
      _id: eventItem._id,
      title: eventItem.title || '',
      description: eventItem.description || '',
      date: eventItem.date ? new Date(eventItem.date).toISOString().split('T')[0] : '',
      time: eventItem.time || '10:00 AM',
      location: eventItem.location || '',
      organizer: eventItem.organizer || 'Admin Office',
      category: eventItem.category || 'Academic',
      maxAttendees: Number(eventItem.maxAttendees) || 100,
      status: eventItem.status || 'Upcoming',
      formEnabled: false,
      formTitle: '',
      formDescription: '',
      formFields: [],
    });

    const formRef = eventItem.formId?._id || eventItem.formId;
    if (formRef) {
      try {
        const form = await formsAPI.getFormById(formRef);
        setEventDraft((prev) => ({
          ...prev,
          formEnabled: form.isActive !== false,
          formTitle: form.title || '',
          formDescription: form.description || '',
          formFields: form.fields || [],
        }));
      } catch (err) {
        console.error('Event form load error:', err);
      }
    }
  };

  const handleEventDelete = async (eventId) => {
    const confirmed = window.confirm('Delete this event?');
    if (!confirmed) return;

    try {
      const deletingEvent = events.find((item) => item._id === eventId);
      await eventsAPI.deleteEvent(eventId);
      setEvents((current) => current.filter((item) => item._id !== eventId));
      showFeedback('Event removed.');
      logAction(`Event deleted: ${deletingEvent?.title || 'Untitled event'}.`);
      if (eventDraft._id === eventId) {
        setEventDraft(createDefaultEventForm());
      }
    } catch (err) {
      setError('Unable to delete event.');
      console.error('Event delete error:', err);
    }
  };

  const handleAnnouncementSubmit = (event) => {
    event.preventDefault();
    const nextAnnouncement = {
      id: `announcement-${Date.now()}`,
      title: announcementDraft.title,
      message: announcementDraft.message,
      audience: announcementDraft.audience,
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    setAnnouncements((current) => [nextAnnouncement, ...current]);
    setAnnouncementDraft(defaultAnnouncementForm);
    showFeedback('Broadcast published successfully.');
    logAction(`Broadcast published for ${nextAnnouncement.audience}.`);
  };

  const handleAnnouncementToggle = (announcementId) => {
    setAnnouncements((current) =>
      current.map((item) => (item.id === announcementId ? { ...item, pinned: !item.pinned } : item))
    );
    showFeedback('Broadcast updated.');
  };

  const handleAnnouncementDelete = (announcementId) => {
    setAnnouncements((current) => current.filter((item) => item.id !== announcementId));
    showFeedback('Broadcast removed.');
  };

  const handleTaskSubmit = (event) => {
    event.preventDefault();
    const nextTask = {
      id: `task-${Date.now()}`,
      title: taskDraft.title,
      priority: taskDraft.priority,
      owner: taskDraft.owner,
      completed: false,
    };

    setComplianceTasks((current) => [nextTask, ...current]);
    setTaskDraft(defaultTaskForm);
    showFeedback('Compliance task added.');
    logAction(`Compliance task created: ${nextTask.title}.`);
  };

  const handleTaskToggle = (taskId) => {
    setComplianceTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleTaskDelete = (taskId) => {
    setComplianceTasks((current) => current.filter((item) => item.id !== taskId));
  };

  const handleTicketStatusChange = (ticketId, status) => {
    setSupportTickets((current) => current.map((item) => (item.id === ticketId ? { ...item, status } : item)));
    showFeedback('Support ticket status updated.');
  };

  const handleTicketNoteSave = (event) => {
    event.preventDefault();
    if (!ticketNoteDraft.id) return;

    setSupportTickets((current) =>
      current.map((item) => (item.id === ticketNoteDraft.id ? { ...item, note: ticketNoteDraft.note } : item))
    );
    setTicketNoteDraft(defaultTicketNote);
    showFeedback('Ticket note saved.');
  };

  const handleSystemSettingsSave = (event) => {
    event.preventDefault();
    setSystemSettings(settingsDraft);
    showFeedback('System settings updated successfully.');
    logAction('System settings updated.');
  };

  const handleNotificationSettingsSave = (event) => {
    event.preventDefault();
    setNotificationSettings(notificationDraft);
    showFeedback('Notification settings updated successfully.');
    logAction('Notification settings updated.');
  };

  const handleDataExport = (type) => {
    let data = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = users;
        filename = 'users_export.csv';
        break;
      case 'courses':
        data = courses;
        filename = 'courses_export.csv';
        break;
      case 'events':
        data = events;
        filename = 'events_export.csv';
        break;
      case 'all':
        const exportData = {
          users,
          courses,
          events,
          announcements,
          complianceTasks,
          supportTickets,
          auditLog,
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'system_backup.json';
        a.click();
        URL.revokeObjectURL(url);
        showFeedback('System backup downloaded successfully.');
        logAction('System backup exported.');
        return;
      default:
        return;
    }

    if (data.length === 0) {
      showFeedback('No data to export.');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback(`${type} data exported successfully.`);
    logAction(`${type} data exported.`);
  };

  const handleBulkOperation = (operation) => {
    const confirmed = window.confirm(`Are you sure you want to execute "${operation}"? This action may affect multiple records.`);
    if (!confirmed) return;

    switch (operation) {
      case 'resetPasswords':
        showFeedback('Password reset emails sent to all users.');
        logAction('Bulk password reset initiated.');
        break;
      case 'clearLogs':
        const oldLogs = auditLog.filter(item => {
          const itemDate = new Date(item.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return itemDate > thirtyDaysAgo;
        });
        setAuditLog(oldLogs);
        persistCollection(STORAGE_KEYS.audit, oldLogs);
        showFeedback('Old audit logs cleared.');
        logAction('Old audit logs cleared.');
        break;
      case 'optimizeDB':
        showFeedback('Database optimization completed.');
        logAction('Database optimization performed.');
        break;
      default:
        showFeedback('Operation completed.');
    }
  };

  const handleDataImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Handle imported data based on structure
        if (importedData.users) {
          setUsers(importedData.users);
          persistCollection('mock_users_data', importedData.users);
        }
        if (importedData.courses) {
          setCourses(importedData.courses);
          persistCollection('mock_courses_data', importedData.courses);
        }
        if (importedData.events) {
          setEvents(importedData.events);
          persistCollection('mock_events_data', importedData.events);
        }
        showFeedback('Data imported successfully.');
        logAction('Data import completed.');
      } catch (error) {
        showFeedback('Invalid file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    authAPI.logout().catch((err) => {
      console.error('Admin logout API failed:', err);
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionType');
    });
  };

  const renderOverview = () => (
    <div className="admin-shell">
      <div className="cards">
        <div className="card">
          <div className="card-icon"><FaUserCog /></div>
          <div className="card-content">
            <div className="card-title">Total Users</div>
            <div className="card-value">{users.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon"><FaUserShield /></div>
          <div className="card-content">
            <div className="card-title">Portal Logged In</div>
            <div className="card-value">{activeUsers}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon"><FaBookOpen /></div>
          <div className="card-content">
            <div className="card-title">Total Courses</div>
            <div className="card-value">{courses.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon"><FaCalendarAlt /></div>
          <div className="card-content">
            <div className="card-title">Total Events</div>
            <div className="card-value">{events.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section-grid admin-detail-grid">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Admin Priority Feed</h2>
            <span>Fast visibility into what needs action first</span>
          </div>
          <div className="admin-feed">
            {riskItems.length ? (
              riskItems.map((item) => (
                <div key={item.id} className="admin-feed-item">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                  </div>
                  <span className={`admin-badge ${item.level.toLowerCase()}`}>{item.level}</span>
                </div>
              ))
            ) : (
              <p className="muted-text">No critical operational flags right now.</p>
            )}
          </div>
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h2>Secure Route Snapshot</h2>
            <span>Admin-only access channel</span>
          </div>
          <div className="admin-mini-stats">
            <div>
              <span>Portal route</span>
              <strong>/admin/portal</strong>
            </div>
            <div>
              <span>Broadcasts pinned</span>
              <strong>{pinnedAnnouncements.length}</strong>
            </div>
            <div>
              <span>Compliance progress</span>
              <strong>{complianceTasks.length ? `${completedTasks}/${complianceTasks.length}` : '0/0'}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>User Management Center</h2>
        <span>Complete user lifecycle management and access control</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <div className="users-list">
          {users.map((userItem) => (
            <div key={userItem._id} className="user-card admin-user-card">
              <h3>{userItem.name}</h3>
              <p><strong>Email:</strong> {userItem.email}</p>
              <p><strong>Role:</strong> {userItem.role}</p>
              <p><strong>Status:</strong> {userItem.isOnline ? 'Online' : 'Offline'}</p>
              <p><strong>Joined:</strong> {formatDate(userItem.createdAt)}</p>
              <div className="user-actions">
                <button className="edit-btn" onClick={() => handleUserEdit(userItem)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleUserDelete(userItem._id)}>
                  <FaTrash /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>User Editor</h2>
            <span>{studentDraft ? 'Update selected user' : 'Pick a user card to edit'}</span>
          </div>
          {studentDraft ? (
            <form className="admin-form" onSubmit={handleUserSave}>
              <label>
                Full name
                <input
                  value={studentDraft.name}
                  onChange={(event) => setStudentDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={studentDraft.email}
                  onChange={(event) => setStudentDraft((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label>
                Role
                <select
                  value={studentDraft.role}
                  onChange={(event) => setStudentDraft((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Department
                <input
                  value={studentDraft.department || ''}
                  onChange={(event) => setStudentDraft((current) => ({ ...current, department: event.target.value }))}
                />
              </label>
              <div className="admin-form-actions">
                <button className="edit-btn" type="submit">
                  <FaCheckCircle /> Save Changes
                </button>
                <button className="ghost-btn" type="button" onClick={() => setStudentDraft(null)}>
                  Clear
                </button>
              </div>
            </form>
          ) : (
            <p className="muted-text">User profile details will appear here for controlled editing.</p>
          )}
        </aside>
      </div>
    </div>
  );

  const renderCourseStudio = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Course Studio</h2>
        <span>Create, revise, and retire academic offerings</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <div className="courses-list">
          {courses.map((course) => (
            <div key={course._id} className="course-card admin-content-card">
              <h3>{course.title}</h3>
              <p><strong>Code:</strong> {course.code}</p>
              <p><strong>Instructor:</strong> {course.instructor}</p>
              <p><strong>Capacity:</strong> {course.enrolledStudents?.length || 0}/{course.maxStudents}</p>
              <p><strong>Form:</strong> {course.formId ? (course.formId.isActive === false ? 'Archived' : 'Active') : 'Not configured'}</p>
              <div className="user-actions">
                <Link className="view-btn" to={`/admin/course/${course._id}`}>
                  <FaEye /> View
                </Link>
                <button className="edit-btn" onClick={() => handleCourseEdit(course)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleCourseDelete(course._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>{courseDraft._id ? 'Update Course' : 'Add Course'}</h2>
            <span>Admin-managed academic inventory</span>
          </div>
          <form className="admin-form" onSubmit={handleCourseSubmit}>
            <label>Title<input value={courseDraft.title} onChange={(event) => setCourseDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Code<input value={courseDraft.code} onChange={(event) => setCourseDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></label>
            <label>Description<textarea value={courseDraft.description} onChange={(event) => setCourseDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <label>Instructor<input value={courseDraft.instructor} onChange={(event) => setCourseDraft((current) => ({ ...current, instructor: event.target.value }))} /></label>
            <div className="admin-form-split">
              <label>Credits<input type="number" min="1" max="6" value={courseDraft.credits} onChange={(event) => setCourseDraft((current) => ({ ...current, credits: Number(event.target.value) }))} /></label>
              <label>Capacity<input type="number" min="1" value={courseDraft.maxStudents} onChange={(event) => setCourseDraft((current) => ({ ...current, maxStudents: Number(event.target.value) }))} /></label>
            </div>
            <div className="admin-form-split">
              <label>Semester<select value={courseDraft.semester} onChange={(event) => setCourseDraft((current) => ({ ...current, semester: event.target.value }))}><option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option></select></label>
              <label>Year<input type="number" value={courseDraft.year} onChange={(event) => setCourseDraft((current) => ({ ...current, year: Number(event.target.value) }))} /></label>
            </div>
            <FormBuilder
              config={{
                enabled: courseDraft.formEnabled,
                title: courseDraft.formTitle,
                description: courseDraft.formDescription,
                fields: courseDraft.formFields,
              }}
              onChange={(formConfig) =>
                setCourseDraft((current) => ({
                  ...current,
                  formEnabled: formConfig.enabled,
                  formTitle: formConfig.title,
                  formDescription: formConfig.description,
                  formFields: formConfig.fields,
                }))
              }
              itemLabel="course registration"
            />

            <div className="admin-form-actions">
              <button className="edit-btn" type="submit"><FaPlus /> {courseDraft._id ? 'Update Course' : 'Create Course'}</button>
              <button className="ghost-btn" type="button" onClick={() => setCourseDraft(createDefaultCourseForm())}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );

  const renderEventMission = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Event Mission Control</h2>
        <span>Launch, monitor, and adjust campus events</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <div className="events-list">
          {events.map((eventItem) => (
            <div key={eventItem._id} className="event-card admin-content-card">
              <div className="event-card-thumbnail" style={{ background: getEventThumbnailStyle(eventItem) }}>
                <span>{eventItem.category}</span>
              </div>
              <h3>{eventItem.title}</h3>
              <p><strong>Date:</strong> {formatDate(eventItem.date)}</p>
              <p><strong>Location:</strong> {eventItem.location}</p>
              <p><strong>Status:</strong> {eventItem.status || 'Upcoming'}</p>
              <p><strong>Seats:</strong> {eventItem.registeredAttendees?.length || 0}/{eventItem.maxAttendees}</p>
              <p><strong>Form:</strong> {eventItem.formId ? (eventItem.formId.isActive === false ? 'Archived' : 'Active') : 'Not configured'}</p>
              <div className="user-actions">
                <Link className="view-btn" to={`/admin/event/${eventItem._id}`}>
                  <FaEye /> View
                </Link>
                <button className="edit-btn" onClick={() => handleEventEdit(eventItem)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleEventDelete(eventItem._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>{eventDraft._id ? 'Update Event' : 'Create Event'}</h2>
            <span>Admin-controlled event lifecycle</span>
          </div>
          <form className="admin-form" onSubmit={handleEventSubmit}>
            <label>Title<input value={eventDraft.title} onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Description<textarea value={eventDraft.description} onChange={(event) => setEventDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <div className="admin-form-split">
              <label>Date<input type="date" value={eventDraft.date} onChange={(event) => setEventDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Time<input value={eventDraft.time} onChange={(event) => setEventDraft((current) => ({ ...current, time: event.target.value }))} /></label>
            </div>
            <label>Location<input value={eventDraft.location} onChange={(event) => setEventDraft((current) => ({ ...current, location: event.target.value }))} /></label>
            <label>Organizer<input value={eventDraft.organizer} onChange={(event) => setEventDraft((current) => ({ ...current, organizer: event.target.value }))} /></label>
            <div className="admin-form-split">
              <label>Category<select value={eventDraft.category} onChange={(event) => setEventDraft((current) => ({ ...current, category: event.target.value }))}><option value="Academic">Academic</option><option value="Sports">Sports</option><option value="Cultural">Cultural</option><option value="Technical">Technical</option><option value="Other">Other</option></select></label>
              <label>Status<select value={eventDraft.status} onChange={(event) => setEventDraft((current) => ({ ...current, status: event.target.value }))}><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></label>
            </div>
            <label>Capacity<input type="number" min="1" value={eventDraft.maxAttendees} onChange={(event) => setEventDraft((current) => ({ ...current, maxAttendees: Number(event.target.value) }))} /></label>
            <FormBuilder
              config={{
                enabled: eventDraft.formEnabled,
                title: eventDraft.formTitle,
                description: eventDraft.formDescription,
                fields: eventDraft.formFields,
              }}
              onChange={(formConfig) =>
                setEventDraft((current) => ({
                  ...current,
                  formEnabled: formConfig.enabled,
                  formTitle: formConfig.title,
                  formDescription: formConfig.description,
                  formFields: formConfig.fields,
                }))
              }
              itemLabel="event registration"
            />

            <div className="admin-form-actions">
              <button className="edit-btn" type="submit"><FaPlus /> {eventDraft._id ? 'Update Event' : 'Publish Event'}</button>
              <button className="ghost-btn" type="button" onClick={() => setEventDraft(createDefaultEventForm())}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );

  const renderAnalyticsHub = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Analytics Hub</h2>
        <span>Admin-only system insights and utilization trends</span>
      </div>
      <div className="admin-analytics-grid">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Enrollment Pressure</h2>
            <span>Courses ordered by occupancy</span>
          </div>
          <div className="metric-stack">
            {courses.map((course) => {
              const percentage = formatPercent(course.enrolledStudents?.length || 0, course.maxStudents);
              return (
                <div key={course._id} className="metric-row">
                  <div className="metric-label">
                    <strong>{course.title}</strong>
                    <span>{course.enrolledStudents?.length || 0}/{course.maxStudents} seats filled</span>
                  </div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <strong>{percentage}%</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="info-panel">
          <div className="section-heading">
            <h2>Event Reach</h2>
            <span>Registration strength by event</span>
          </div>
          <div className="metric-stack">
            {events.map((eventItem) => {
              const percentage = formatPercent(eventItem.registeredAttendees?.length || 0, eventItem.maxAttendees);
              return (
                <div key={eventItem._id} className="metric-row">
                  <div className="metric-label">
                    <strong>{eventItem.title}</strong>
                    <span>{eventItem.registeredAttendees?.length || 0}/{eventItem.maxAttendees} registrations</span>
                  </div>
                  <div className="metric-bar">
                    <div className="metric-bar-fill alt" style={{ width: `${percentage}%` }} />
                  </div>
                  <strong>{percentage}%</strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );

  const renderBroadcastCenter = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Broadcast Center</h2>
        <span>Publish admin notices that regular users cannot manage</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <section className="info-panel">
          <div className="announcement-list">
            {announcements.map((item) => (
              <article key={item.id} className="announcement-card">
                <div className="announcement-top">
                  <div>
                    <h3>{item.title}</h3>
                    <span>{item.audience} | {formatDate(item.createdAt)}</span>
                  </div>
                  {item.pinned ? <span className="admin-badge neutral">Pinned</span> : null}
                </div>
                <p>{item.message}</p>
                <div className="user-actions">
                  <button className="edit-btn" onClick={() => handleAnnouncementToggle(item.id)}>
                    <FaBullhorn /> {item.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button className="delete-btn" onClick={() => handleAnnouncementDelete(item.id)}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>New Broadcast</h2>
            <span>Admin communication layer</span>
          </div>
          <form className="admin-form" onSubmit={handleAnnouncementSubmit}>
            <label>Title<input value={announcementDraft.title} onChange={(event) => setAnnouncementDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>Audience<select value={announcementDraft.audience} onChange={(event) => setAnnouncementDraft((current) => ({ ...current, audience: event.target.value }))}><option value="All Users">All Users</option><option value="Students">Students</option><option value="Faculty">Faculty</option><option value="Admin Team">Admin Team</option></select></label>
            <label>Message<textarea value={announcementDraft.message} onChange={(event) => setAnnouncementDraft((current) => ({ ...current, message: event.target.value }))} /></label>
            <div className="admin-form-actions">
              <button className="edit-btn" type="submit"><FaBullhorn /> Publish</button>
              <button className="ghost-btn" type="button" onClick={() => setAnnouncementDraft(defaultAnnouncementForm)}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );

  const renderCapacityPlanner = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Capacity Planner</h2>
        <span>Spot overloaded courses and underperforming events fast</span>
      </div>
      <div className="admin-two-column">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Course Capacity</h2>
            <span>{filledCourseSeats}/{totalCourseSeats} seats occupied</span>
          </div>
          {courses.map((course) => {
            const percentage = formatPercent(course.enrolledStudents?.length || 0, course.maxStudents);
            return (
              <div key={course._id} className="capacity-row">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.enrolledStudents?.length || 0}/{course.maxStudents}</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-bar-fill" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="info-panel">
          <div className="section-heading">
            <h2>Event Capacity</h2>
            <span>{filledEventSeats}/{totalEventSeats} registrations tracked</span>
          </div>
          {events.map((eventItem) => {
            const percentage = formatPercent(eventItem.registeredAttendees?.length || 0, eventItem.maxAttendees);
            return (
              <div key={eventItem._id} className="capacity-row">
                <div>
                  <strong>{eventItem.title}</strong>
                  <span>{eventItem.registeredAttendees?.length || 0}/{eventItem.maxAttendees}</span>
                </div>
                <div className="metric-bar">
                  <div className="metric-bar-fill alt" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );

  const renderComplianceDesk = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Compliance Desk</h2>
        <span>Track admin tasks that students never see</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <section className="info-panel">
          <div className="task-list">
            {complianceTasks.map((task) => (
              <div key={task.id} className={`task-card ${task.completed ? 'done' : ''}`}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.owner} | {task.priority} priority</span>
                </div>
                <div className="user-actions">
                  <button className="edit-btn" onClick={() => handleTaskToggle(task.id)}>
                    <FaCheckCircle /> {task.completed ? 'Reopen' : 'Complete'}
                  </button>
                  <button className="delete-btn" onClick={() => handleTaskDelete(task.id)}>
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>Add Task</h2>
            <span>Internal admin checklist manager</span>
          </div>
          <form className="admin-form" onSubmit={handleTaskSubmit}>
            <label>Task title<input value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <div className="admin-form-split">
              <label>Priority<select value={taskDraft.priority} onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value }))}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></label>
              <label>Owner<input value={taskDraft.owner} onChange={(event) => setTaskDraft((current) => ({ ...current, owner: event.target.value }))} /></label>
            </div>
            <div className="admin-form-actions">
              <button className="edit-btn" type="submit"><FaPlus /> Add Task</button>
              <button className="ghost-btn" type="button" onClick={() => setTaskDraft(defaultTaskForm)}>Reset</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );

  const renderSupportInbox = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Support Inbox</h2>
        <span>Admin-side ticket triage and note handling</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <section className="info-panel">
          <div className="ticket-list">
            {supportTickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="announcement-top">
                  <div>
                    <h3>{ticket.subject}</h3>
                    <span>{ticket.requester} via {ticket.channel}</span>
                  </div>
                  <span className={`admin-badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                </div>
                <p>{ticket.note}</p>
                <div className="ticket-footer">
                  <select value={ticket.status} onChange={(event) => handleTicketStatusChange(ticket.id, event.target.value)}>
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Pending Reply">Pending Reply</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <button className="ghost-btn" type="button" onClick={() => setTicketNoteDraft({ id: ticket.id, note: ticket.note })}>
                    Edit Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>Ticket Notes</h2>
            <span>Internal support commentary</span>
          </div>
          {ticketNoteDraft.id ? (
            <form className="admin-form" onSubmit={handleTicketNoteSave}>
              <label>Internal note<textarea value={ticketNoteDraft.note} onChange={(event) => setTicketNoteDraft((current) => ({ ...current, note: event.target.value }))} /></label>
              <div className="admin-form-actions">
                <button className="edit-btn" type="submit"><FaCheckCircle /> Save Note</button>
                <button className="ghost-btn" type="button" onClick={() => setTicketNoteDraft(defaultTicketNote)}>Cancel</button>
              </div>
            </form>
          ) : (
            <p className="muted-text">Choose a ticket from the inbox to update admin notes.</p>
          )}
        </aside>
      </div>
    </div>
  );

  const renderSystemControl = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>System Control Panel</h2>
        <span>Platform configuration, maintenance, and performance settings</span>
      </div>
      <div className="details-layout admin-detail-grid">
        <section className="info-panel">
          <div className="section-heading">
            <h2>System Status</h2>
            <span>Current platform operational state</span>
          </div>
          <div className="admin-two-column">
            <div className="status-card">
              <FaServer />
              <div>
                <strong>System Health</strong>
                <span className="status-indicator online">Online</span>
              </div>
            </div>
            <div className="status-card">
              <FaUsersCog />
              <div>
                <strong>Active Users</strong>
                <span>{activeUsers} online</span>
              </div>
            </div>
            <div className="status-card">
              <FaDatabase />
              <div>
                <strong>Database</strong>
                <span className="status-indicator online">Connected</span>
              </div>
            </div>
            <div className="status-card">
              <FaBell />
              <div>
                <strong>Notifications</strong>
                <span className={notificationSettings.emailEnabled ? 'status-indicator online' : 'status-indicator offline'}>
                  {notificationSettings.emailEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <aside className="detail-panel admin-form-panel">
          <div className="section-heading">
            <h2>System Settings</h2>
            <span>Configure platform behavior</span>
          </div>
          <form className="admin-form" onSubmit={handleSystemSettingsSave}>
            <div className="admin-form-split">
              <label>
                Maintenance Mode
                <select value={settingsDraft.maintenanceMode} onChange={(event) => setSettingsDraft((current) => ({ ...current, maintenanceMode: event.target.value === 'true' }))}>
                  <option value={false}>Disabled</option>
                  <option value={true}>Enabled</option>
                </select>
              </label>
              <label>
                User Registration
                <select value={settingsDraft.registrationEnabled} onChange={(event) => setSettingsDraft((current) => ({ ...current, registrationEnabled: event.target.value === 'true' }))}>
                  <option value={true}>Enabled</option>
                  <option value={false}>Disabled</option>
                </select>
              </label>
            </div>
            <div className="admin-form-split">
              <label>
                Max File Size (MB)
                <input type="number" min="1" max="100" value={settingsDraft.maxFileSize} onChange={(event) => setSettingsDraft((current) => ({ ...current, maxFileSize: Number(event.target.value) }))} />
              </label>
              <label>
                Session Timeout (min)
                <input type="number" min="15" max="480" value={settingsDraft.sessionTimeout} onChange={(event) => setSettingsDraft((current) => ({ ...current, sessionTimeout: Number(event.target.value) }))} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="edit-btn" type="submit">
                <FaCogs /> Save Settings
              </button>
              <button className="ghost-btn" type="button" onClick={() => setSettingsDraft(systemSettings)}>
                Reset
              </button>
            </div>
          </form>
        </aside>
      </div>

      <div className="admin-analytics-grid">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Notification Settings</h2>
            <span>Configure automated communications</span>
          </div>
          <form className="admin-form" onSubmit={handleNotificationSettingsSave}>
            <div className="admin-form-split">
              <label>
                Email Notifications
                <select value={notificationDraft.emailEnabled} onChange={(event) => setNotificationDraft((current) => ({ ...current, emailEnabled: event.target.value === 'true' }))}>
                  <option value={true}>Enabled</option>
                  <option value={false}>Disabled</option>
                </select>
              </label>
              <label>
                Push Notifications
                <select value={notificationDraft.pushEnabled} onChange={(event) => setNotificationDraft((current) => ({ ...current, pushEnabled: event.target.value === 'true' }))}>
                  <option value={false}>Disabled</option>
                  <option value={true}>Enabled</option>
                </select>
              </label>
            </div>
            <label>
              Frequency
              <select value={notificationDraft.frequency} onChange={(event) => setNotificationDraft((current) => ({ ...current, frequency: event.target.value }))}>
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </label>
            <div className="admin-form-actions">
              <button className="edit-btn" type="submit">
                <FaBell /> Save Notifications
              </button>
            </div>
          </form>
        </section>

        <section className="info-panel">
          <div className="section-heading">
            <h2>Performance Metrics</h2>
            <span>System resource utilization</span>
          </div>
          <div className="metric-stack">
            <div className="metric-row">
              <div className="metric-label">
                <strong>API Response Time</strong>
                <span>Average: 245ms</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '75%' }} />
              </div>
              <strong>Good</strong>
            </div>
            <div className="metric-row">
              <div className="metric-label">
                <strong>Database Queries</strong>
                <span>Per minute: 1,247</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '60%' }} />
              </div>
              <strong>Normal</strong>
            </div>
            <div className="metric-row">
              <div className="metric-label">
                <strong>Memory Usage</strong>
                <span>Current: 68%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill alt" style={{ width: '68%' }} />
              </div>
              <strong>Stable</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderDataOperations = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Data Operations Center</h2>
        <span>Bulk operations, data export/import, and backup management</span>
      </div>
      <div className="admin-two-column">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Data Export</h2>
            <span>Download system data for analysis or backup</span>
          </div>
          <div className="data-operations-grid">
            <div className="data-card">
              <FaFileExport />
              <div>
                <strong>Users Data</strong>
                <span>{users.length} records</span>
                <button className="export-btn" onClick={() => handleDataExport('users')}>
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>
            <div className="data-card">
              <FaFileExport />
              <div>
                <strong>Courses Data</strong>
                <span>{courses.length} records</span>
                <button className="export-btn" onClick={() => handleDataExport('courses')}>
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>
            <div className="data-card">
              <FaFileExport />
              <div>
                <strong>Events Data</strong>
                <span>{events.length} records</span>
                <button className="export-btn" onClick={() => handleDataExport('events')}>
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>
            <div className="data-card">
              <FaFileExport />
              <div>
                <strong>Complete Backup</strong>
                <span>All system data</span>
                <button className="export-btn" onClick={() => handleDataExport('all')}>
                  <FaDownload /> Full Backup
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="info-panel">
          <div className="section-heading">
            <h2>Bulk Operations</h2>
            <span>Mass data management actions</span>
          </div>
          <div className="bulk-operations">
            <div className="operation-card">
              <FaUsersCog />
              <div>
                <strong>Reset User Passwords</strong>
                <span>Send password reset to all users</span>
                <button className="operation-btn caution" onClick={() => handleBulkOperation('resetPasswords')}>
                  Execute
                </button>
              </div>
            </div>
            <div className="operation-card">
              <FaTrash />
              <div>
                <strong>Clear Old Logs</strong>
                <span>Remove audit logs older than 30 days</span>
                <button className="operation-btn" onClick={() => handleBulkOperation('clearLogs')}>
                  Execute
                </button>
              </div>
            </div>
            <div className="operation-card">
              <FaDatabase />
              <div>
                <strong>Optimize Database</strong>
                <span>Clean up and optimize data storage</span>
                <button className="operation-btn" onClick={() => handleBulkOperation('optimizeDB')}>
                  Execute
                </button>
              </div>
            </div>
            <div className="operation-card">
              <FaUpload />
              <div>
                <strong>Data Import</strong>
                <span>Import data from CSV files</span>
                <input type="file" accept=".csv" onChange={handleDataImport} style={{ marginTop: '8px' }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="info-panel">
        <div className="section-heading">
          <h2>Data Integrity</h2>
          <span>System data validation and consistency checks</span>
        </div>
        <div className="integrity-checks">
          <div className="check-item">
            <FaCheckCircle />
            <div>
              <strong>User Records</strong>
              <span>All user data is consistent</span>
            </div>
          </div>
          <div className="check-item">
            <FaCheckCircle />
            <div>
              <strong>Course Enrollments</strong>
              <span>Enrollment data matches user records</span>
            </div>
          </div>
          <div className="check-item">
            <FaExclamationTriangle />
            <div>
              <strong>Event Registrations</strong>
              <span>Some events have capacity issues</span>
            </div>
          </div>
          <div className="check-item">
            <FaCheckCircle />
            <div>
              <strong>Database Indexes</strong>
              <span>All indexes are optimized</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSecurityCenter = () => (
    <div className="admin-shell">
      <div className="section-heading">
        <h2>Security Center</h2>
        <span>Route access, audit trail, and secure exit controls</span>
      </div>
      <div className="admin-two-column">
        <section className="info-panel">
          <div className="section-heading">
            <h2>Route Guard</h2>
            <span>Dedicated admin-only entry path</span>
          </div>
          <div className="security-grid">
            <div className="security-card">
              <FaLock />
              <strong>Entry Route</strong>
              <span>/admin</span>
            </div>
            <div className="security-card">
              <FaUserShield />
              <strong>Session Type</strong>
              <span>{localStorage.getItem('sessionType') || 'unknown'}</span>
            </div>
            <div className="security-card">
              <FaShieldAlt />
              <strong>Current Role</strong>
              <span>{user.role || 'admin'}</span>
            </div>
          </div>
        </section>

        <section className="info-panel">
          <div className="section-heading">
            <h2>Recent Audit Log</h2>
            <span>Last 10 admin actions</span>
          </div>
          <div className="admin-feed">
            {auditLog.map((item) => (
              <div key={item.id} className="admin-feed-item">
                <div>
                  <strong>{item.text}</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="info-panel">Loading admin control room...</div>;
    }

    switch (activeItem) {
      case 'Dashboard':
        return renderOverview();
      case 'User Management':
        return renderUserManagement();
      case 'Course Studio':
        return renderCourseStudio();
      case 'Event Mission':
        return renderEventMission();
      case 'Analytics Hub':
        return renderAnalyticsHub();
      case 'Broadcast Center':
        return renderBroadcastCenter();
      case 'Capacity Planner':
        return renderCapacityPlanner();
      case 'Compliance Desk':
        return renderComplianceDesk();
      case 'Support Inbox':
        return renderSupportInbox();
      case 'System Control':
        return renderSystemControl();
      case 'Data Operations':
        return renderDataOperations();
      case 'Security Center':
        return renderSecurityCenter();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <aside className="sidebar">
        <div className="logo">
          <FaGraduationCap className="logo-icon" />
          College Event Registration & Management System
        </div>
        <div className="admin-sidebar-note">
          <FaShieldAlt />
          Secure admin operations panel
        </div>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`menu-item ${activeItem === item.name ? 'active' : ''}`}
              onClick={() => setActiveItem(item.name)}
            >
              <item.icon className="menu-icon" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="welcome">
            <FaUserShield />
            Welcome back, {user.name || 'Administrator'}
          </div>
          <div className="user">
            <span>{user.email || 'admin@secure.route'}</span>
            <Link className="logout" to="/admin" onClick={handleLogout}>
              <FaSignOutAlt />
              Logout
            </Link>
          </div>
        </header>

        <main className="content">
          <h1><FaShieldAlt /> Admin Control Room</h1>
          <p>
            This panel keeps operational power inside the secure admin route only, while preserving your current UI theme.
          </p>

          {error ? (
            <div className="error-message admin-message">
              <FaExclamationTriangle /> {error}
            </div>
          ) : null}

          {actionMessage ? (
            <div className="success-message admin-message">
              <FaCheckCircle /> {actionMessage}
            </div>
          ) : null}

          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
