import mongoose from 'mongoose';

const adminOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true, collection: 'admin_otps' });

// Add index to auto-delete expired OTPs after they expire
adminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (mongoose.models.AdminOTP) {
  delete mongoose.models.AdminOTP;
}

const AdminOTP = mongoose.model('AdminOTP', adminOtpSchema);
export default AdminOTP;
