import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  resume: { type: String, required: true },
  staticData: { type: Object },
  dynamicData: { type: Object },
  status: { type: String, default: 'New' },
  taskAnswers: { type: Map, of: mongoose.Schema.Types.Mixed },
  taskScores: { type: Map, of: Number },
  taskTotalScore: { type: Number, default: 0 },
  taskMaxScore: { type: Number, default: 0 },
  taskEvaluated: { type: Boolean, default: false },
  taskSubmittedAt: { type: Date },
  emailSent: { type: Boolean, default: false },
  lastEmailSentAt: { type: Date },
  lastEmailType: { type: String }
}, { timestamps: true });

if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

export default mongoose.model('Application', ApplicationSchema);
