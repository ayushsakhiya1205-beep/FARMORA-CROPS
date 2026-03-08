const mongoose = require('mongoose');



const bcrypt = require('bcryptjs');







const userSchema = new mongoose.Schema(



  {



    name: {



      type: String,



      required: true,



      trim: true



    },







    email: {



      type: String,



      required: true,



      unique: true,



      lowercase: true,



      trim: true



    },







    password: {



      type: String,



      required: true,



      minlength: 6



    },







    phone: {



      type: String,



      required: true



    },







    // 🔥 New Address Structure



    address: {



      type: String,



      required: true   // Full address text



    },







    pincode: {



      type: String,



      required: true



    },







    state: {



      type: String,



      enum: ["Gujarat", "Rajasthan", "Maharashtra"],



      required: true



    },







    district: {



      type: String,



      required: true



    },







    // User role



    role: {



      type: String,



      enum: ['customer', 'outletManager'],



      default: 'customer'



    },







    // Assigned outlet based on district



    outletId: {



      type: mongoose.Schema.Types.ObjectId,



      ref: 'Outlet',



      default: null



    },







    // Email verification



    emailVerified: {



      type: Boolean,



      default: false



    },



    emailVerificationOTP: {



      type: String,



      default: null



    },



    emailVerificationOTPExpiry: {



      type: Date,



      default: null



    },







    // Password reset



    passwordResetOTP: {



      type: String,



      default: null



    },



    passwordResetOTPExpiry: {



      type: Date,



      default: null



    },







    // Login OTP



    loginOTP: {



      type: String,



      default: null



    },



    loginOTPExpiry: {



      type: Date,



      default: null



    },







    isActive: {



      type: Boolean,



      default: true



    }



  },



  {



    timestamps: true



  }



);







userSchema.pre('save', async function (next) {



  if (!this.isModified('password')) return next();



  this.password = await bcrypt.hash(this.password, 10);



  next();



});







userSchema.methods.comparePassword = async function (candidatePassword) {



  return await bcrypt.compare(candidatePassword, this.password);



};







module.exports = mongoose.model('User', userSchema);



