// server.js
const express = require('express');
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Ajv = require('ajv');
const taskSchema = require('./schemas/taskSchema.json');

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(taskSchema);

// --- 1. EXPRESS & DB SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB Connection (Crucial for Render Deployment)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/midterm_api'; // <<< USE YOUR ATLAS URI HERE LOCALLY

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --- 2. VALIDATION MIDDLEWARE ---
const validateSchema = (req, res, next) => {
    const valid = validate(req.body);
    if (!valid) {
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors: validate.errors 
        });
    }
    next();
};

// --- 3. API ROUTES (CRUD) ---

// GET: Retrieve all resources (Required)
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
    }
});

// POST: Create a new resource (Required)
app.post('/api/tasks', validateSchema, async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask); // 201 Created Status
    } catch (error) {
        res.status(400).json({ message: 'Error creating task', error: error.message });
    }
});

// PUT/PATCH: Update an existing resource (Required)
app.patch('/api/tasks/:id', validateSchema, async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Error updating task', error: error.message });
    }
});

// DELETE: Remove a resource (Required)
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send(); // 204 No Content Status
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});


// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});