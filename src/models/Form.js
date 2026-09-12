import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'checkbox', 'radio'], required: true },
  required: { type: Boolean, default: true },
  options: [{ type: String }]
});

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  heading: { type: String, required: true },
  questions: [questionSchema]
});

const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customSections: [sectionSchema]
}, { timestamps: true });

if (mongoose.models.Form) {
  delete mongoose.models.Form;
}

export default mongoose.model('Form', formSchema);
