const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Connection
const MONGO_URI = 'mongodb://127.0.0.1:27017/econme';
mongoose.connect(MONGO_URI)
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
  createdAt: { type: Date, default: Date.now },
});
const Profile = mongoose.model('Profile', profileSchema);

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Income = mongoose.model('Income', incomeSchema);

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Expense = mongoose.model('Expense', expenseSchema);

// Initial Data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Income.deleteMany({});
    await Expense.deleteMany({});
    console.log('Cleared existing data.');

    // Create a sample user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      username: 'testuser',
      email: 'testuser@example.com',
      password: hashedPassword,
    });
    await user.save();
    console.log('Created sample user.');

    // Create a profile for the user
    const profile = new Profile({
      userId: user._id,
      fullName: 'Test User',
      profilePicture: 'default-profile.jpg',
    });
    await profile.save();
    console.log('Created profile for sample user.');

    // Add sample incomes
    const incomes = [
      { userId: user._id, source: 'Freelance Work', amount: 500, date: '2025-04-01' },
      { userId: user._id, source: 'Part-Time Job', amount: 300, date: '2025-04-05' },
      { userId: user._id, source: 'Online Sales', amount: 200, date: '2025-04-10' }, // New income
      { userId: user._id, source: 'Gift', amount: 150, date: '2025-04-15' }, // New income
    ];
    await Income.insertMany(incomes);
    console.log('Added sample incomes.');

  // Add more sample expenses
  const expenses = [
    { userId: user._id, title: 'Groceries', amount: 100, category: 'Food', date: '2025-04-01' },
    { userId: user._id, title: 'Electricity Bill', amount: 75, category: 'Utilities', date: '2025-04-03' },
    { userId: user._id, title: 'Internet Bill', amount: 50, category: 'Utilities', date: '2025-04-05' }, // New expense
    { userId: user._id, title: 'Dining Out', amount: 60, category: 'Entertainment', date: '2025-04-07' }, // New expense
    { userId: user._id, title: 'Gym Membership', amount: 40, category: 'Health', date: '2025-04-10' }, // New expense
    { userId: user._id, title: 'Clothing', amount: 80, category: 'Shopping', date: '2025-04-12' }, // New expense
    { userId: user._id, title: 'Transportation', amount: 30, category: 'Transport', date: '2025-04-15' }, // New expense
    { userId: user._id, title: 'Entertainment', amount: 50, category: 'Entertainment', date: '2025-04-20' }, // New expense
    { userId: user._id, title: 'Healthcare', amount: 100, category: 'Health', date: '2025-04-25' }, // New expense
    { userId: user._id, title: 'Miscellaneous', amount: 20, category: 'Other', date: '2025-04-30' }, // New expense  
  ];
    await Expense.insertMany(expenses);
    console.log('Added sample expenses.');

    console.log('Database initialized successfully.');
    process.exit(0); // Exit the script
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1); // Exit with error
  }
};

// Run the seed function
seedData();