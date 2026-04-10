const Event = require('../models/eventModel');
const Form = require('../models/formModel');
const FormResponse = require('../models/formResponseModel');
const mongoose = require('mongoose');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const events = await Event.find({}).populate('registeredAttendees', 'name email').populate('formId');
      res.json(events);
    } else {
      // Offline mode - return mock data
      const mockEvents = [
        {
          _id: 'mock-event-1',
          title: 'Tech Conference 2026',
          description: 'Annual technology conference',
          date: '2026-12-15',
          time: '10:00 AM',
          location: 'Main Auditorium',
          organizer: 'Tech Club',
          category: 'Technical',
          maxAttendees: 200,
          registeredAttendees: [],
          status: 'Upcoming'
        },
        {
          _id: 'mock-event-2',
          title: 'Cultural Fest',
          description: 'College cultural festival',
          date: '2026-11-20',
          time: '2:00 PM',
          location: 'College Ground',
          organizer: 'Cultural Committee',
          category: 'Cultural',
          maxAttendees: 500,
          registeredAttendees: [],
          status: 'Upcoming'
        }
      ];
      res.json(mockEvents);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEvent = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const event = await Event.findById(req.params.id).populate('registeredAttendees', 'name email').populate('formId');

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.json(event);
    } else {
      // Offline mode - return mock data for the requested event
      const mockEvents = [
        {
          _id: 'mock-event-1',
          title: 'Tech Conference 2026',
          description: 'Annual technology conference',
          date: '2026-04-15',
          time: '10:00 AM',
          location: 'Main Auditorium',
          organizer: 'Tech Club',
          category: 'Technical',
          maxAttendees: 200,
          registeredAttendees: [],
          status: 'Upcoming'
        },
        {
          _id: 'mock-event-2',
          title: 'Cultural Fest',
          description: 'College cultural festival',
          date: '2026-04-20',
          time: '2:00 PM',
          location: 'College Ground',
          organizer: 'Cultural Committee',
          category: 'Cultural',
          maxAttendees: 500,
          registeredAttendees: [],
          status: 'Upcoming'
        }
      ];
      const event = mockEvents.find(e => e._id === req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Admin only)
const createEvent = async (req, res) => {
  const { title, description, date, time, location, organizer, category, maxAttendees } = req.body;

  try {
    const event = await Event.create({
      title,
      description,
      date,
      time,
      location,
      organizer,
      category,
      maxAttendees: maxAttendees || 100,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.formId) {
      await FormResponse.deleteMany({ formId: event.formId });
      await Form.findByIdAndDelete(event.formId);
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.registeredAttendees.some((studentId) => studentId.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    if (event.registeredAttendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    if (event.formId) {
      const activeForm = await Form.findById(event.formId);

      if (activeForm?.isActive) {
        const existingResponse = await FormResponse.findOne({
          formId: activeForm._id,
          userId: req.user._id,
        });

        if (!existingResponse) {
          return res.status(400).json({ message: 'Please complete the event form before registering' });
        }
      }
    }

    event.registeredAttendees.push(req.user._id);
    await event.save();

    const updatedEvent = await Event.findById(event._id).populate('registeredAttendees', 'name email');
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
};
