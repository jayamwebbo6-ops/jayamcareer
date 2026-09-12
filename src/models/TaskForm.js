import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'checkbox', 'radio', 'select'], required: true },
  required: { type: Boolean, default: true },
  options: [{ type: String }],
  marks: { type: Number, default: 1 },
  correctAnswers: [{ type: String }],
  optionMarks: [{ type: Number }]
});

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  heading: { type: String, required: true },
  questions: [questionSchema]
});

const taskFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  jobCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  experience: { type: String, required: true }, // e.g. "task0_6", "task1", "task2", "taskAbove2"
  customSections: [sectionSchema]
}, { timestamps: true });


if (mongoose.models.TaskForm) {
  delete mongoose.models.TaskForm;
}

export default mongoose.model('TaskForm', taskFormSchema);
