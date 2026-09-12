import mongoose from 'mongoose';

const offerTemplateSchema = new mongoose.Schema({
  subject: { type: String, required: true, default: 'Job Offer Confirmation - Jayam Web Solutions' },
  body: { type: String, required: true }
}, { timestamps: true });

if (mongoose.models.OfferTemplate) {
  delete mongoose.models.OfferTemplate;
}

export default mongoose.model('OfferTemplate', offerTemplateSchema);
