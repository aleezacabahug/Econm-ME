const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const open = require('open');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key



// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Update with your frontend URL
  credentials: true
}));
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/econme')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Schemas and Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', profileSchema);

// Income and Expense Schemas
const incomeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  const Income = mongoose.model('Income', incomeSchema);
  
  const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  const Expense = mongoose.model('Expense', expenseSchema);
  
// Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Create profile for new user
    const newProfile = new Profile({
      userId: newUser._id,
      fullName: username
    });
    await newProfile.save();

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});
// Clear all expenses for a user
app.delete('/expenses/clear', authenticateJWT, async (req, res) => {
    try {
        await Expense.deleteMany({ userId: req.user.id });
        res.status(200).json({ message: 'All expenses cleared successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error clearing expenses', error: err.message });
    }
});

  // Income and Expense Endpoints
  app.get('/incomes', authenticateJWT, async (req, res) => {
    try {
      const incomes = await Income.find({ userId: req.user.id }).sort({ date: -1 });
      res.status(200).json(incomes);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching incomes', error: err.message });
    }
  });
  
  app.post('/incomes', authenticateJWT, async (req, res) => {
    try {
      const { source, amount, date } = req.body;
      const newIncome = new Income({
        userId: req.user.id,
        source,
        amount,
        date
      });
      await newIncome.save();
      res.status(201).json(newIncome);
    } catch (err) {
      res.status(500).json({ message: 'Error adding income', error: err.message });
    }
  });
  
  app.delete('/incomes/:id', authenticateJWT, async (req, res) => {
    try {
      const income = await Income.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }
      res.status(200).json({ message: 'Income deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting income', error: err.message });
    }
  });
  
  // Similar endpoints for expenses
  app.get('/expenses', authenticateJWT, async (req, res) => {
    try {
      const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
      res.status(200).json(expenses);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching expenses', error: err.message });
    }
  });
  
  app.post('/expenses', authenticateJWT, async (req, res) => {
    try {
      const { title, amount, category, date } = req.body;
      const newExpense = new Expense({
        userId: req.user.id,
        title,
        amount,
        category,
        date
      });
      await newExpense.save();
      res.status(201).json(newExpense);
    } catch (err) {
      res.status(500).json({ message: 'Error adding expense', error: err.message });
    }
  });
  
  app.put('/expenses/:id', authenticateJWT, async (req, res) => {
    try {
      const { title, amount, category, date } = req.body;
      const updatedExpense = await Expense.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { title, amount, category, date },
        { new: true, runValidators: true }
      );
  
      if (!updatedExpense) {
        return res.status(404).json({ message: 'Expense not found or not authorized' });
      }
  
      res.status(200).json(updatedExpense);
    } catch (err) {
      res.status(500).json({ message: 'Error updating expense', error: err.message });
    }
  });

  
  app.delete('/expenses/:id', authenticateJWT, async (req, res) => {
    try {
      const expense = await Expense.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting expense', error: err.message });
    }
  });

// Profile Endpoints
app.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id }).populate('userId', 'username email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({
      fullName: profile.fullName,
      username: profile.userId.username,
      email: profile.userId.email,
      profilePicture: profile.profilePicture
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

app.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { fullName, profilePicture } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { fullName, profilePicture },
      { new: true }
    ).populate('userId', 'username email');

    res.status(200).json({
      fullName: profile.fullName,
      username: profile.userId.username,
      email: profile.userId.email,
      profilePicture: profile.profilePicture
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

app.put('/profile/credentials', authenticateJWT, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();
    res.status(200).json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating credentials', error: err.message });
  }
});

// Update income
app.put('/incomes/:id', authenticateJWT, async (req, res) => {
  try {
      const { source, amount, date } = req.body;
      
      // Validate input
      if (!source || !amount || !date) {
          return res.status(400).json({ message: 'All fields are required' });
      }
      
      if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      
      // Convert date to proper Date object
      const incomeDate = new Date(date);
      if (isNaN(incomeDate.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
      }

      const updatedIncome = await Income.findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id },
          { 
              source: source.trim(),
              amount: parseFloat(amount),
              date: incomeDate
          },
          { 
              new: true, 
              runValidators: true 
          }
      );
      
      if (!updatedIncome) {
          return res.status(404).json({ 
              message: 'Income not found or not authorized',
              details: `Income ID: ${req.params.id}, User ID: ${req.user.id}`
          });
      }
      
      res.status(200).json({
          message: 'Income updated successfully',
          income: updatedIncome
      });
  } catch (err) {
      console.error('Error updating income:', err);
      res.status(500).json({ 
          message: 'Error updating income',
          error: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
  }
});

// Clear all incomes for a user
app.delete('/incomes/clear', authenticateJWT, async (req, res) => {
  try {
      const result = await Income.deleteMany({ userId: req.user.id });
      res.status(200).json({ 
          message: 'All incomes cleared successfully',
          deletedCount: result.deletedCount
      });
  } catch (err) {
      res.status(500).json({ message: 'Error clearing incomes', error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirect root URL to homepage.html
app.get('/', (req, res) => {
  res.redirect('/homepage.html');
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
    // Automatically open the homepage in the default browser
    const { default: open } = await import('open');

    // Automatically open the homepage in the default browser
    open(`http://localhost:${PORT}/homepage.html`);
});