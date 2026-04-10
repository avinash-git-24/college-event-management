const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: String,
      required: true,
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    semester: {
      type: String,
      required: true,
      enum: ['Fall', 'Spring', 'Summer'],
    },
    year: {
      type: Number,
      required: true,
    },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    maxStudents: {
      type: Number,
      default: 50,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;