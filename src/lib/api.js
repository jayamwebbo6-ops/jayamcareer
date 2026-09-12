import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending/receiving cookies securely
});

// Add a request interceptor to conditionally set Content-Type
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Let browser set the multipart/form-data with boundary
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    // Default to json for other requests
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Admin authentication helpers
export const sendAdminOtp = async (email) => {
  const response = await api.post('/api/admin/login', { email, action: 'send-otp' });
  return response.data;
};

export const verifyAdminOtp = async (email, otp) => {
  const response = await api.post('/api/admin/login', { email, otp, action: 'verify-otp' });
  return response.data;
};

export const adminLogout = async () => {
  const response = await api.post('/api/admin/logout');
  return response.data;
};

export const fetchAdminEmails = async () => {
  const response = await api.get('/api/admin/profile/emails');
  return response.data;
};

export const updateAdminEmails = async (emails) => {
  const response = await api.post('/api/admin/profile/emails', { emails });
  return response.data;
};

// SMTP Settings helpers
export const fetchSmtpConfig = async () => {
  const response = await api.get('/api/admin/smtp');
  return response.data;
};

export const updateSmtpConfig = async (configData) => {
  const response = await api.post('/api/admin/smtp', configData);
  return response.data;
};

// Offer Template helpers
export const fetchOfferTemplate = async () => {
  const response = await api.get('/api/admin/offer-template');
  return response.data;
};

export const updateOfferTemplate = async (templateData) => {
  const response = await api.post('/api/admin/offer-template', templateData);
  return response.data;
};

export const sendOfferEmail = async (payload) => {
  const response = await api.post('/api/admin/applications/send-offer', payload);
  return response.data;
};

// Forms helpers
export const fetchAllForms = async () => {
  const response = await api.get('/api/admin/forms');
  return response.data;
};

export const createForm = async (formData) => {
  const response = await api.post('/api/admin/forms', formData);
  return response.data;
};

export const updateForm = async (id, formData) => {
  const response = await api.put(`/api/admin/forms/${id}`, formData);
  return response.data;
};

export const deleteForm = async (id) => {
  const response = await api.delete(`/api/admin/forms/${id}`);
  return response.data;
};

// Task Forms helpers
export const fetchAllTaskForms = async () => {
  const response = await api.get('/api/admin/task-forms');
  return response.data;
};

export const createTaskForm = async (formData) => {
  const response = await api.post('/api/admin/task-forms', formData);
  return response.data;
};

export const updateTaskForm = async (id, formData) => {
  const response = await api.put(`/api/admin/task-forms/${id}`, formData);
  return response.data;
};

export const deleteTaskForm = async (id) => {
  const response = await api.delete(`/api/admin/task-forms/${id}`);
  return response.data;
};

// Categories helpers
export const fetchAllCategories = async () => {
  const response = await api.get('/api/admin/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/api/admin/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const response = await api.put(`/api/admin/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/api/admin/categories/${id}`);
  return response.data;
};

// Interview Task Template helpers
export const fetchAllTasks = async () => {
  const response = await api.get('/api/admin/tasks');
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/api/admin/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/api/admin/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/api/admin/tasks/${id}`);
  return response.data;
};

// Generic methods mapping for consistency if you previously used custom structures
export const get = (url, config = {}) => api.get(url, config);
export const post = (url, data, config = {}) => api.post(url, data, config);
export const put = (url, data, config = {}) => api.put(url, data, config);
export const patch = (url, data, config = {}) => api.patch(url, data, config);
export const del = (url, config = {}) => api.delete(url, config);

// Blogs helpers
export const fetchAllBlogs = async () => {
  const response = await api.get('/api/admin/blogs');
  return response.data;
};

export const createBlog = async (blogData) => {
  const response = await api.post('/api/admin/blogs', blogData);
  return response.data;
};

export const updateBlog = async (id, blogData) => {
  const response = await api.put(`/api/admin/blogs/${id}`, blogData);
  return response.data;
};

export const deleteBlog = async (id) => {
  const response = await api.delete(`/api/admin/blogs/${id}`);
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await api.delete(`/api/applications?id=${id}`);
  return response.data;
};

export const fetchApplications = async ({
  categoryId, page, limit, search,
  expType, expYears, location, gradYear, workingStatus,
  jsFramework, minSalary, maxSalary, startDate, endDate, status
}) => {
  const params = new URLSearchParams({
    categoryId: categoryId || '',
    page: page || 1,
    limit: limit || 20,
    search: search || '',
    expType: expType || '',
    expYears: expYears || '',
    location: location || '',
    gradYear: gradYear || '',
    workingStatus: workingStatus || '',
    jsFramework: jsFramework || '',
    minSalary: minSalary || '',
    maxSalary: maxSalary || '',
    startDate: startDate || '',
    endDate: endDate || '',
    status: status || ''
  });

  const response = await api.get(`/api/applications?${params.toString()}`);
  return response.data;
};

export const updateApplicationStatus = async (id, status) => {
  const response = await api.patch('/api/applications', { id, status });
  return response.data;
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return '';
};

export const joinEmployee = async (payload) => {
  const token = getCookie('jayamadmin_token');
  console.log(token, 'token in joinEmployee');

  // if (token) {
  //   const response = await axios.post(
  //     "https://webscape.co.in/projectManagement-backend/api/employee/career",
  //     payload,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );
  //   return response.data;
  // }

  // Fallback: If cookie is HttpOnly, proxy via server route which reads the cookie directly
  const response = await api.post('/api/admin/join-employee', payload);
  return response.data;
};


export default api;

