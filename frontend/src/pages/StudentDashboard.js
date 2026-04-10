import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBook,
  FaCalendarAlt,
  FaUserCheck,
  FaUser,
  FaSignOutAlt,
  FaGraduationCap,
  FaChartLine,
  FaClock,
  FaArrowRight,
  FaEdit,
  FaSave
} from 'react-icons/fa';
import { authAPI, coursesAPI, eventsAPI, usersAPI } from '../services/api';
import FormFiller from '../components/FormFiller';
import './StudentDashboard.css';

const menuItems = [
  { name: 'Dashboard', icon: FaTachometerAlt },
  { name: 'Courses', icon: FaBook },
  { name: 'Events', icon: FaCalendarAlt },
  { name: 'Attendance', icon: FaUserCheck },
  { name: 'Profile', icon: FaUser }
];

const StudentDashboard = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    phone: '',
    department: '',
    year: '',
  });
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [currentFormTitle, setCurrentFormTitle] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { type: 'course'|'event', id: string }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [coursesData, eventsData] = await Promise.all([
          coursesAPI.getCourses(),
          eventsAPI.getEvents()
        ]);
        setCourses(coursesData);
        setEvents(eventsData);
        const profileData = await usersAPI.getProfile();
        setUser(profileData);
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
          year: profileData.year || '',
        });
        localStorage.setItem('user', JSON.stringify(profileData));
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    authAPI.updateActivity().catch((err) => {
      console.error('Activity ping failed:', err);
    });

    const intervalId = window.setInterval(() => {
      authAPI.updateActivity().catch(() => {});
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      setProfileSaving(true);
      setProfileMessage('');
      setError('');
      const updatedProfile = await usersAPI.updateProfile(profileForm);
      const updatedUser = {
        _id: updatedProfile._id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: updatedProfile.role,
        bio: updatedProfile.bio || '',
        phone: updatedProfile.phone || '',
        department: updatedProfile.department || '',
        year: updatedProfile.year || '',
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'course') {
        const updatedCourse = await coursesAPI.enrollCourse(pendingAction.id);
        setCourses((currentCourses) =>
          currentCourses.map((course) => (course._id === pendingAction.id ? updatedCourse : course))
        );
        setActionMessage('Course enrollment successful.');
      } else {
        const updatedEvent = await eventsAPI.registerForEvent(pendingAction.id);
        setEvents((currentEvents) =>
          currentEvents.map((event) => (event._id === pendingAction.id ? updatedEvent : event))
        );
        setActionMessage('Event registration successful.');
      }

      setShowFormFiller(false);
      setCurrentFormId(null);
      setCurrentFormTitle('');
      setPendingAction(null);
    } catch (err) {
      setError(`Failed to complete ${pendingAction.type} registration`);
      console.error('Error completing registration:', err);
    }
  };

  const handleFormClose = () => {
    setShowFormFiller(false);
    setCurrentFormId(null);
    setCurrentFormTitle('');
    setPendingAction(null);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionType');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    switch (activeItem) {
      case 'Dashboard':
        return (
          <div>
            <h1><FaTachometerAlt style={{ marginRight: '10px' }} />Dashboard Overview</h1>
            <p>Welcome to your student dashboard. Here's a quick overview of your academic progress.</p>
            {actionMessage ? <div className="success-message">{actionMessage}</div> : null}

            <div className="cards">
              <div className="card">
                <div className="card-icon">
                  <FaBook />
                </div>
                <div className="card-content">
                  <div className="card-title">Available Courses</div>
                  <div className="card-value">{courses.length}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-icon">
                  <FaCalendarAlt />
                </div>
                <div className="card-content">
                  <div className="card-title">Upcoming Events</div>
                  <div className="card-value">{upcomingEvents.length}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-icon">
                  <FaChartLine />
                </div>
                <div className="card-content">
                  <div className="card-title">Attendance Rate</div>
                  <div className="card-value">92%</div>
                </div>
              </div>

              <div className="card">
                <div className="card-icon">
                  <FaClock />
                </div>
                <div className="card-content">
                  <div className="card-title">Study Hours</div>
                  <div className="card-value">156h</div>
                </div>
              </div>
            </div>

            <div className="dashboard-section-grid">
              <section className="info-panel">
                <div className="section-heading">
                  <h2>Upcoming Events</h2>
                  <span>Stay updated with campus activities</span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <p className="muted-text">No upcoming events available right now.</p>
                ) : (
                  <div className="compact-list">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event._id}
                        to={`/student-dashboard/event/${event._id}`}
                        className="compact-item"
                      >
                        <div>
                          <strong>{event.title}</strong>
                          <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                        </div>
                        <FaArrowRight />
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="info-panel">
                <div className="section-heading">
                  <h2>Course Explorer</h2>
                  <span>Click a course to see full details</span>
                </div>

                {courses.length === 0 ? (
                  <p className="muted-text">No enrolled courses yet.</p>
                ) : (
                  <div className="compact-list">
                    {courses.slice(0, 3).map((course) => (
                      <Link
                        key={course._id}
                        to={`/student-dashboard/course/${course._id}`}
                        className="compact-item"
                      >
                        <div>
                          <strong>{course.title}</strong>
                          <span>{course.code} | {course.instructor}</span>
                        </div>
                        <FaArrowRight />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        );
      case 'Courses':
        return (
          <div>
            <h1><FaBook style={{ marginRight: '10px' }} />My Courses</h1>
            <p>Your enrolled courses for this semester. Click any course to open complete details.</p>

            {courses.length === 0 ? (
              <p>No courses enrolled yet.</p>
            ) : (
              <div className="details-layout">
                <div className="courses-list">
                  {courses.map(course => (
                    <Link
                      key={course._id}
                      to={`/student-dashboard/course/${course._id}`}
                      className="course-card interactive-card"
                    >
                      <h3>{course.title}</h3>
                      <p><strong>Code:</strong> {course.code}</p>
                      <p><strong>Instructor:</strong> {course.instructor}</p>
                      <p><strong>Credits:</strong> {course.credits}</p>
                      <p><strong>Semester:</strong> {course.semester} {course.year}</p>
                      <p><strong>Enrolled:</strong> {course.enrolledStudents?.length || 0}/{course.maxStudents}</p>
                      <span className="detail-link">View more details <FaArrowRight /></span>
                    </Link>
                  ))}
                </div>

                <aside className="detail-panel">
                  <div className="section-heading">
                    <h2>Separate Course Pages</h2>
                    <span>Course details now open on a dedicated page.</span>
                  </div>
                  <p className="muted-text">Click any course card to open the full course detail page instead of showing details in the same dashboard panel.</p>
                </aside>
              </div>
            )}
          </div>
        );
      case 'Events':
        return (
          <div>
            <h1><FaCalendarAlt style={{ marginRight: '10px' }} />College Events</h1>
            <p>Upcoming events you can explore. Click any event card to view extra details.</p>

            {events.length === 0 ? (
              <p>No events available.</p>
            ) : (
              <div className="details-layout">
                <div className="events-list">
                  {events.map(event => (
                    <Link
                      key={event._id}
                      to={`/student-dashboard/event/${event._id}`}
                      className="event-card interactive-card"
                    >
                      <h3>{event.title}</h3>
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.time}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Category:</strong> {event.category}</p>
                      <p><strong>Status:</strong> {event.status || 'Upcoming'}</p>
                      <span className="detail-link">View event details <FaArrowRight /></span>
                    </Link>
                  ))}
                </div>

                <aside className="detail-panel">
                  <div className="section-heading">
                    <h2>Separate Event Pages</h2>
                    <span>Event details now open on a dedicated page.</span>
                  </div>
                  <p className="muted-text">Click any event card to open the full event detail page instead of viewing details in the same dashboard layout.</p>
                </aside>
              </div>
            )}
          </div>
        );
      case 'Attendance':
        return (
          <div>
            <h1><FaUserCheck style={{ marginRight: '10px' }} />Attendance</h1>
            <p>Your attendance record for enrolled courses.</p>
            <p>Attendance tracking feature coming soon...</p>
          </div>
        );
      case 'Profile':
        return (
          <div>
            <h1><FaUser style={{ marginRight: '10px' }} />Profile</h1>
            <p>Manage your profile, bio, and personal details.</p>
            {profileMessage ? <div className="success-message">{profileMessage}</div> : null}
            <div className="details-layout">
              <div className="profile-info">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Department:</strong> {user.department || 'Not added yet'}</p>
                <p><strong>Year:</strong> {user.year || 'Not added yet'}</p>
                <p><strong>Phone:</strong> {user.phone || 'Not added yet'}</p>
                <p><strong>Bio:</strong> {user.bio || 'Add a short bio to personalize your profile.'}</p>
              </div>

              <aside className="detail-panel">
                <div className="section-heading">
                  <h2><FaEdit style={{ marginRight: '8px' }} />Edit Profile</h2>
                  <span>Keep your details updated</span>
                </div>
                <form className="student-profile-form" onSubmit={handleProfileSave}>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(event) => handleProfileChange('name', event.target.value)}
                    />
                  </label>
                  <label>
                    Bio
                    <textarea
                      value={profileForm.bio}
                      onChange={(event) => handleProfileChange('bio', event.target.value)}
                      placeholder="Tell us about your interests, clubs, or academic goals"
                    />
                  </label>
                  <div className="student-profile-grid">
                    <label>
                      Phone
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(event) => handleProfileChange('phone', event.target.value)}
                      />
                    </label>
                    <label>
                      Year
                      <input
                        type="text"
                        value={profileForm.year}
                        onChange={(event) => handleProfileChange('year', event.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    Department
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(event) => handleProfileChange('department', event.target.value)}
                    />
                  </label>
                  <button type="submit" className="login-button profile-save-button" disabled={profileSaving}>
                    <FaSave />
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </aside>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h1>{activeItem}</h1>
            <p>Content for {activeItem} will be displayed here.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <FaGraduationCap className="logo-icon" />
          College Event Registration & Management System
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
            <FaUser style={{ marginRight: '8px' }} />
            Welcome back, {user.name || 'Student'}!
          </div>
          <div className="user">
            <span>{user.name || 'Student'}</span>
            <Link
              className="logout"
              to="/login"
              onClick={handleLogout}
            >
              <FaSignOutAlt style={{ marginRight: '6px' }} />
              Logout
            </Link>
          </div>
        </header>

        <main className="content">
          {renderContent()}
        </main>

        {showFormFiller && (
          <FormFiller
            formId={currentFormId}
            title={currentFormTitle}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
