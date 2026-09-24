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

ApplicationSchema.index({ categoryId: 1, createdAt: -1 }, { name: 'applications_by_category_date' });
ApplicationSchema.index({ categoryId: 1, status: 1, createdAt: -1 }, { name: 'applications_by_category_status_date' });

if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

export default mongoose.model('Application', ApplicationSchema);
