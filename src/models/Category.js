import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true }, // e.g. "work", "computer" (Google Icon string)
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: false },
  task0_6: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false },
  task1: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false },
  task2: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false },
  taskAbove2: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false },
  task0_6Active: { type: Boolean, default: true },
  task1Active: { type: Boolean, default: true },
  task2Active: { type: Boolean, default: true },
  taskAbove2Active: { type: Boolean, default: true }
}, { timestamps: true });

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model('Category', categorySchema);