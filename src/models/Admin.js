import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  emails: {
    type: [String],
    required: true,
    default: ['jayamwebsolutionspvtltd@gmail.com']
  }
}, { timestamps: true, collection: 'admin' });

// Delete the cached model to force recompilation during Next.js Hot Reload
if (mongoose.models.Admin) {
  delete mongoose.models.Admin;
}

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
