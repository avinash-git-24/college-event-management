const mongoose = require('mongoose');

const formResponseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

formResponseSchema.index({ formId: 1, userId: 1 }, { unique: true });

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

module.exports = FormResponse;
