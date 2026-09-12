import mongoose from 'mongoose';

const taskLinkSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  label: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  taskLinks: [taskLinkSchema],  // Support multiple links with individual active/inactive statuses
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
