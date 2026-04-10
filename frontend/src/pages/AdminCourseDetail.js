import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import FormBuilder from '../components/FormBuilder';
import FormResponsesViewer from '../components/FormResponsesViewer';
import { coursesAPI, formsAPI } from '../services/api';
import { createEmptyFormConfig, validateFormBuilderConfig } from '../utils/formUtils';
import './AdminDashboard.css';

const createDefaultCourseDraft = () => ({
  title: '',
  code: '',
  description: '',
  instructor: '',
  credits: 3,
  semester: 'Fall',
  year: new Date().getFullYear(),
  maxStudents: 50,
});

const AdminCourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [draft, setDraft] = useState(createDefaultCourseDraft());
  const [formConfig, setFormConfig] = useState(createEmptyFormConfig());
  const [formEntity, setFormEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [formResponses, setFormResponses] = useState([]);
  const [formResponsesLoading, setFormResponsesLoading] = useState(false);

  const loadCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const courseData = await coursesAPI.getCourse(id);
      setCourse(courseData);
      setDraft({
        _id: courseData._id,
        title: courseData.title || '',
        code: courseData.code || '',
        description: courseData.description || '',
        instructor: courseData.instructor || '',
        credits: Number(courseData.credits) || 3,
        semester: courseData.semester || 'Fall',
        year: Number(courseData.year) || new Date().getFullYear(),
        maxStudents: Number(courseData.maxStudents) || 50,
      });

      const formRef = courseData.formId?._id || courseData.formId;
      if (formRef) {
        try {
          const form = await formsAPI.getFormById(formRef);
          setFormEntity(form);
          setFormConfig({
            enabled: form.isActive !== false,
            title: form.title || '',
            description: form.description || '',
            fields: form.fields || [],
          });

          setFormResponsesLoading(true);
          const responses = await formsAPI.getFormResponses(formRef);
          setFormResponses(responses);
        } catch (formError) {
          console.error('AdminCourseDetail form load error:', formError);
          setFormEntity(null);
          setFormConfig(createEmptyFormConfig());
          setFormResponses([]);
        } finally {
          setFormResponsesLoading(false);
        }
      } else {
        setFormResponsesLoading(false);
        setFormEntity(null);
        setFormConfig(createEmptyFormConfig());
        setFormResponses([]);
      }
    } catch (err) {
      setFormResponsesLoading(false);
      setError('Unable to load course details.');
      console.error('AdminCourseDetail load error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourseDetail();
  }, [loadCourseDetail]);

  const handleSave = async (event) => {
    event.preventDefault();

    const formValidation = validateFormBuilderConfig(
      formConfig,
      `${draft.title || 'Course'} Registration Form`
    );

    if (!formValidation.isValid) {
      setError(formValidation.message || 'Course form configuration is invalid.');
      setSaved('');
      return;
    }

    try {
      await coursesAPI.updateCourse(id, draft);

      if (formValidation.normalizedConfig.enabled) {
        await formsAPI.createOrUpdateForm('course', id, {
          title: formValidation.normalizedConfig.title,
          description: formValidation.normalizedConfig.description,
          fields: formValidation.normalizedConfig.fields,
        });
      } else if (course?.formId) {
        await formsAPI.deleteForm('course', id);
      }

      await loadCourseDetail();
      setSaved('Course saved successfully.');
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to save course.');
      setSaved('');
      console.error('AdminCourseDetail save error:', err);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="info-panel">
          <FaSpinner className="spin-icon" /> Loading course details...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="page-topbar admin-topbar">
        <Link to="/admin/portal" className="ghost-btn">
          <FaArrowLeft /> Back to Admin Portal
        </Link>
        <h1>Course Detail</h1>
      </div>

      <main className="content admin-shell">
        <div className="details-layout admin-detail-grid">
          <section className="info-panel">
            <div className="section-heading">
              <h2>{course?.title || 'Course Detail'}</h2>
              <span>Admin course inspection, form setup, and submission review</span>
            </div>
            {error ? (
              <div className="error-message admin-message">
                <FaExclamationTriangle /> {error}
              </div>
            ) : null}
            {saved ? (
              <div className="success-message admin-message">
                <FaCheckCircle /> {saved}
              </div>
            ) : null}

            <div className="detail-summary">
              <div className="detail-summary-row">
                <strong>{course.title}</strong>
                <span>{course.code}</span>
              </div>
              <p>{course.description}</p>
              <div className="detail-summary-grid">
                <div><strong>Instructor</strong><span>{course.instructor}</span></div>
                <div><strong>Semester</strong><span>{course.semester}</span></div>
                <div><strong>Year</strong><span>{course.year}</span></div>
                <div><strong>Capacity</strong><span>{course.enrolledStudents?.length || 0}/{course.maxStudents}</span></div>
                <div><strong>Form Status</strong><span>{formEntity ? (formEntity.isActive === false ? 'Archived' : 'Active') : 'Not configured'}</span></div>
                <div><strong>Responses</strong><span>{formResponses.length}</span></div>
              </div>
            </div>

            <div className="section-heading">
              <h2>Enrolled Students</h2>
              <span>{course.enrolledStudents?.length || 0} enrolled</span>
            </div>
            <div className="admin-feed">
              {(course.enrolledStudents || []).map((student) => (
                <div key={student._id || student.email} className="admin-feed-item">
                  <div>
                    <strong>{student.name || student.email}</strong>
                    <span>{student.email || 'No email available'}</span>
                  </div>
                </div>
              ))}
              {!course.enrolledStudents?.length ? <p className="muted-text">No students enrolled yet.</p> : null}
            </div>

            <div className="section-heading">
              <h2>Registration Form Responses</h2>
              <span>{formResponses.length} responses</span>
            </div>
            <FormResponsesViewer
              form={formEntity}
              responses={formResponses}
              loading={formResponsesLoading}
              emptyMessage="No course form submissions yet."
            />
          </section>

          <aside className="detail-panel admin-form-panel">
            <div className="section-heading">
              <h2>Edit Course</h2>
              <span>Update course metadata and registration form from one place</span>
            </div>
            <form className="admin-form" onSubmit={handleSave}>
              <label>Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label>Code<input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></label>
              <label>Description<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              <label>Instructor<input value={draft.instructor} onChange={(event) => setDraft((current) => ({ ...current, instructor: event.target.value }))} /></label>
              <div className="admin-form-split">
                <label>Credits<input type="number" min="1" max="6" value={draft.credits} onChange={(event) => setDraft((current) => ({ ...current, credits: Number(event.target.value) }))} /></label>
                <label>Capacity<input type="number" min="1" value={draft.maxStudents} onChange={(event) => setDraft((current) => ({ ...current, maxStudents: Number(event.target.value) }))} /></label>
              </div>
              <div className="admin-form-split">
                <label>Semester<select value={draft.semester} onChange={(event) => setDraft((current) => ({ ...current, semester: event.target.value }))}>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select></label>
                <label>Year<input type="number" value={draft.year} onChange={(event) => setDraft((current) => ({ ...current, year: Number(event.target.value) }))} /></label>
              </div>

              <FormBuilder
                config={formConfig}
                onChange={setFormConfig}
                itemLabel="course registration"
              />

              <button className="edit-btn" type="submit"><FaCheckCircle /> Save Course</button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminCourseDetail;
