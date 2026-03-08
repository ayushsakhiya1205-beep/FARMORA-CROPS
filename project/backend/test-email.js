require('dotenv').config();
const { testEmailConfig } = require('./sendmail');

console.log('Testing email configuration...');
testEmailConfig().then(success => {
  if (success) {
    console.log('✅ Email configuration is working!');
  } else {
    console.log('❌ Email configuration failed');
  }
});
