const Course = require('../models/courseModel');
const Form = require('../models/formModel');
const FormResponse = require('../models/formResponseModel');
const mongoose = require('mongoose');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const courses = await Course.find({}).populate('enrolledStudents', 'name email').populate('formId');
      res.json(courses);
    } else {
      // Offline mode - return mock data
      const mockCourses = [
        {
          _id: 'mock-course-1',
          title: 'Introduction to Computer Science',
          code: 'CS101',
          description: 'Basic concepts of computer science',
          instructor: 'Dr. Smith',
          credits: 3,
          semester: 'Fall',
          year: 2024,
          enrolledStudents: [],
          maxStudents: 50
        },
        {
          _id: 'mock-course-2',
          title: 'Data Structures',
          code: 'CS201',
          description: 'Advanced data structures and algorithms',
          instructor: 'Dr. Johnson',
          credits: 4,
          semester: 'Spring',
          year: 2024,
          enrolledStudents: [],
          maxStudents: 40
        }
      ];
      res.json(mockCourses);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findById(req.params.id).populate('enrolledStudents', 'name email').populate('formId');

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      res.json(course);
    } else {
      // Offline mode - return mock data for the requested course
      const mockCourses = [
        {
          _id: 'mock-course-1',
          title: 'Introduction to Computer Science',
          code: 'CS101',
          description: 'Basic concepts of computer science',
          instructor: 'Dr. Smith',
          credits: 3,
          semester: 'Fall',
          year: 2024,
          enrolledStudents: [],
          maxStudents: 50
        },
        {
          _id: 'mock-course-2',
          title: 'Data Structures',
          code: 'CS201',
          description: 'Advanced data structures and algorithms',
          instructor: 'Dr. Johnson',
          credits: 4,
          semester: 'Spring',
          year: 2024,
          enrolledStudents: [],
          maxStudents: 40
        }
      ];
      const course = mockCourses.find(c => c._id === req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (Admin only)
const createCourse = async (req, res) => {
  const { title, code, description, instructor, credits, semester, year, maxStudents } = req.body;

  try {
    const course = await Course.create({
      title,
      code,
      description,
      instructor,
      credits,
      semester,
      year,
      maxStudents: maxStudents || 50,
    });

    res.status(201).json(course);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Course code already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.formId) {
      await FormResponse.deleteMany({ formId: course.formId });
      await Form.findByIdAndDelete(course.formId);
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Students only)
const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.enrolledStudents.some((studentId) => studentId.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    if (course.enrolledStudents.length >= course.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }

    if (course.formId) {
      const activeForm = await Form.findById(course.formId);

      if (activeForm?.isActive) {
        const existingResponse = await FormResponse.findOne({
          formId: activeForm._id,
          userId: req.user._id,
        });

        if (!existingResponse) {
          return res.status(400).json({ message: 'Please complete the course form before enrolling' });
        }
      }
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    const updatedCourse = await Course.findById(course._id).populate('enrolledStudents', 'name email');
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
};
