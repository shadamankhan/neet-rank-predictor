// checkClaim.js (one-liner)
const admin = require('./initFirebaseAdmin');
admin.auth().getUserByEmail('shad@gmail.com').then(u => console.log(u.customClaims)).catch(console.error);
