// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'In Progress'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);