// Outlet email allowlist - emails that can become Outlet Managers
// In production, this could be stored in database or environment variables
const OUTLET_EMAIL_ALLOWLIST = [
  // Add specific outlet emails here if needed
  // Example: 'manager1@farmoraoutlet.com', 'manager2@farmoraoutlet.com'
];

// Check if email qualifies for Outlet Manager role
const isOutletManagerEmail = (email) => {
  // Check if email ends with @farmoraoutlet.com
  if (email.toLowerCase().endsWith('@farmoraoutlet.com')) {
    return true;
  }
  
  // Check if email is in allowlist
  if (OUTLET_EMAIL_ALLOWLIST.includes(email.toLowerCase())) {
    return true;
  }
  
  return false;
};

// Determine user role based on email
const determineUserRole = (email) => {
  if (isOutletManagerEmail(email)) {
    return 'outletManager';
  }
  return 'customer';
};

module.exports = {
  isOutletManagerEmail,
  determineUserRole,
  OUTLET_EMAIL_ALLOWLIST
};

