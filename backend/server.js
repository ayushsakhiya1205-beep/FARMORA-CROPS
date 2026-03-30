const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors');

const path = require('path');

const cookieParser = require('cookie-parser');

require('dotenv').config();



// Import email service to test configuration

const { testEmailConfig } = require('./config/email');



const app = express();



// Middleware

app.use(cors({

  origin: process.env.FRONTEND_URL || 'http://localhost:3000',

  credentials: true

}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());



// Serve product images from the /image folder at project root

// Example URL: http://localhost:5000/image/anaj/wheat.jpg

app.use(

  '/image',

  express.static(path.join(__dirname, '..', 'image'))

);



// Routes

app.use('/api/auth', require('./routes/auth'));

app.use('/api/products', require('./routes/products'));

app.use('/api/cart', require('./routes/cart'));

app.use('/api/orders', require('./routes/orders'));

app.use('/api/outlet', require('./routes/outlet'));

app.use('/api/delivery', require('./routes/delivery'));

app.use('/api/reminders', require('./routes/reminders'));

app.use('/api/inventory', require('./routes/inventory'));

app.use('/api/ratings', require('./routes/ratings'));

app.use('/api/payment', require('./routes/payment'));



// MongoDB Connection

mongoose

  .connect(

    process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops',

    {

      useNewUrlParser: true,

      useUnifiedTopology: true,

    }

  )

  .then(() => console.log('MongoDB Connected'))

  .catch((err) => console.error('MongoDB connection error:', err));



const PORT = process.env.PORT || 8000;



// Test email configuration on startup

testEmailConfig().then(isReady => {

  if (isReady) {

    console.log('✅ Email service is ready to send OTPs');

  } else {

    console.log('⚠️  Email service not configured - OTPs will be shown in console');

  }

});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



