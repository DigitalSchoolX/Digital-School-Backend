const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/modules/auth/models/user.model.js');

async function resetPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ecoschool-dev');
    console.log('Connected to database');
    
    // Find the manager user
    const user = await User.findOne({ email: 'hades@yopmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.name, '- Email:', user.email);
    
    // Hash the new password
    const newPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    user.passwordHash = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!');
    console.log('New password:', newPassword);
    console.log('You can now login with:');
    console.log('Email: hades@yopmail.com');
    console.log('Password: password123');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword(); 