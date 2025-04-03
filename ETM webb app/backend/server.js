const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/econme')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Default route for "/"
app.get('/', (req, res) => {
    res.send('Welcome to the Expense Tracker Mate API!');
});

// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Error handling for missing fields
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Account created successfully. Redirecting to login...' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Error handling for missing fields
    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        // Send success response with token
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err });
    }
});

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle undefined routes
app.use((req, res) => {
    res.status(404).send('404: Page Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});