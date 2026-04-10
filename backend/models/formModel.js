const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'email', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio'],
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [{
    type: String,
  }],
  placeholder: {
    type: String,
    default: '',
  },
  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String,
  },
});

const formSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['course', 'event'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'type',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  fields: [formFieldSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Form = mongoose.model('Form', formSchema);

module.exports = Form;
