import mongoose from 'mongoose';

const smtpConfigSchema = new mongoose.Schema({
  host: { type: String, required: true },
  port: { type: Number, required: true, default: 587 },
  secure: { type: Boolean, required: true, default: false },
  user: { type: String, required: true },
  pass: { type: String, required: true },
  from: { type: String, required: true },
  cc: { type: String, required: false },
  autoEmailEnabled: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models.SmtpConfig) {
  delete mongoose.models.SmtpConfig;
}

export default mongoose.model('SmtpConfig', smtpConfigSchema);
