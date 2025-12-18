// server.js
const express = require('express');
const mongoose = require('mongoose');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const Task = require('./models/Task');
const taskSchema = require('./schemas/taskSchema.json');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(taskSchema);

// --- 1. EXPRESS & DB SETUP ---
const app = express();

// Use the PORT variable provided by Render, or default to 3000
const PORT = process.env.PORT || 3000;
// RENDER FIX: Must bind to 0.0.0.0 for external access on the cloud
const HOST = '0.0.0.0'; 

// Middleware
app.use(express.json());

// MongoDB Connection URI (Render uses process.env.MONGO_URI)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/midterm_api'; 

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

// All routes must use the correct prefix: /api
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
    }
});

app.post('/api/tasks', validateSchema, async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: 'Error creating task', error: error.message });
    }
});

app.patch('/api/tasks/:id', validateSchema, async (req, res) => {
    try {
        // Mongoose option { new: true } returns the updated document
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Error updating task', error: error.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // 204 means successful deletion with no body content returned
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
});


// --- 4. START SERVER ---
mongoose.connect(MONGO_URI)
    .then(() => {
        // THE FINAL FIX: Binding to both PORT and HOST (0.0.0.0)
        app.listen(PORT, HOST, () => { 
            console.log(`Server is running on host ${HOST} and port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });