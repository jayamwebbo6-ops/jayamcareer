'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import api, { fetchAllCategories, deleteApplication, fetchApplications, updateApplicationStatus, fetchAllForms, fetchOfferTemplate, sendOfferEmail, joinEmployee } from '../../../lib/api';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  // Dynamically detect base path from browser window if running in client
  let dynamicBasePath = '';
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const adminIndex = pathname.indexOf('/jayam-admin');
    if (adminIndex !== -1) {
      dynamicBasePath = pathname.substring(0, adminIndex);
    }
  }

  const resolvedBasePath = dynamicBasePath || process.env.NEXT_PUBLIC_BASE_URL || '';

  if (resolvedBasePath && path.startsWith(resolvedBasePath)) return path;
  return `${resolvedBasePath}${path.startsWith('/') ? '' : '/'}${path}`;
};

const getResumeViewUrl = (path: string) => {
  const fileUrl = getFileUrl(path);
  if (!fileUrl) return '';

  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith('.doc') || lowerPath.endsWith('.docx')) {
    let absoluteUrl = fileUrl;
    if (typeof window !== 'undefined' && !fileUrl.startsWith('http')) {
      absoluteUrl = `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=false`;
  }
  return fileUrl;
};

const normalizeDateToInputFormat = (rawDate: any): string => {
  if (!rawDate) return '';

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const str = String(rawDate).trim();
  if (!str) return '';

  // 1. Strict YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. ISO string containing 'T' (e.g. 1998-05-12T00:00:00.000Z)
  if (str.includes('T')) {
    const part = str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      return part;
    }
  }

  // 3. YYYY/MM/DD or YYYY-M-D or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 4. DD-MM-YYYY or DD/MM/YYYY or MM-DD-YYYY or MM/DD/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, p1, p2, year] = dmyMatch;
    const num1 = parseInt(p1, 10);
    const num2 = parseInt(p2, 10);

    let day = p1;
    let month = p2;
    if (num2 > 12 && num1 <= 12) {
      month = p1;
      day = p2;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 5. Native Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return '';
};

const extractCandidateDob = (app: any, formsList: any[] = []): string => {
  if (!app) return '';

  // 1. Direct app properties
  if (app.dob) {
    const formatted = normalizeDateToInputFormat(app.dob);
    if (formatted) return formatted;
  }
  if (app.dateOfBirth) {
    const formatted = normalizeDateToInputFormat(app.dateOfBirth);
    if (formatted) return formatted;
  }

  // 2. Check staticData
  const staticData = app.staticData || {};
  const staticKeys = [
    'dob', 'dateOfBirth', 'date_of_birth', 'DOB', 'birthDate', 'birth_date',
    'DateOfBirth', 'dateOfbirth', 'BirthDate', 'birthdate', 'Date_Of_Birth'
  ];
  for (const key of staticKeys) {
    if (staticData[key]) {
      const formatted = normalizeDateToInputFormat(staticData[key]);
      if (formatted) return formatted;
    }
  }

  // Generic case-insensitive search in staticData
  for (const [key, val] of Object.entries(staticData)) {
    if (!val || typeof val !== 'string') continue;
    const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanKey.includes('dob') || cleanKey.includes('birth') || cleanKey.includes('dateofbirth')) {
      const formatted = normalizeDateToInputFormat(val);
      if (formatted) return formatted;
    }
  }

  // 3. Check dynamicData
  const dynamicData = app.dynamicData || {};
  for (const key of staticKeys) {
    if (dynamicData[key]) {
      const formatted = normalizeDateToInputFormat(dynamicData[key]);
      if (formatted) return formatted;
    }
  }

  // Generic search in dynamicData keys
  for (const [key, val] of Object.entries(dynamicData)) {
    if (!val) continue;
    const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanKey.includes('dob') || cleanKey.includes('birth') || cleanKey.includes('dateofbirth')) {
      const formatted = normalizeDateToInputFormat(val);
      if (formatted) return formatted;
    }
  }

  // Search dynamicData by matching question text in form templates
  if (formsList && Array.isArray(formsList)) {
    for (const form of formsList) {
      if (form.customSections) {
        for (const sec of form.customSections) {
          if (sec.questions) {
            for (const q of sec.questions) {
              const qText = (q.text || '').toLowerCase().replace(/[^a-z]/g, '');
              if (qText.includes('dob') || qText.includes('birth') || qText.includes('dateofbirth')) {
                if (dynamicData[q.id]) {
                  const formatted = normalizeDateToInputFormat(dynamicData[q.id]);
                  if (formatted) return formatted;
                }
              }
            }
          }
        }
      }
    }
  }

  return '';
};

const extractCandidateGender = (app: any): string => {
  if (!app) return 'Male';
  if (app.gender && typeof app.gender === 'string') return app.gender;

  const staticData = app.staticData || {};
  if (staticData.gender && typeof staticData.gender === 'string') return staticData.gender;
  if (staticData.Gender && typeof staticData.Gender === 'string') return staticData.Gender;

  for (const [key, val] of Object.entries(staticData)) {
    const k = key.toLowerCase().replace(/[^a-z]/g, '');
    if (k.includes('gender') && val && typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower.startsWith('f')) return 'Female';
      if (lower.startsWith('m')) return 'Male';
      return val;
    }
  }

  const dynamicData = app.dynamicData || {};
  if (dynamicData.gender && typeof dynamicData.gender === 'string') return dynamicData.gender;
  if (dynamicData.Gender && typeof dynamicData.Gender === 'string') return dynamicData.Gender;

  for (const [key, val] of Object.entries(dynamicData)) {
    const k = key.toLowerCase().replace(/[^a-z]/g, '');
    if (k.includes('gender') && val && typeof val === 'string') {
      const lower = val.toLowerCase();
      if (lower.startsWith('f')) return 'Female';
      if (lower.startsWith('m')) return 'Male';
      return val;
    }
  }

  return 'Male';
};

interface SubFilter {
  id: string;
  label: string;
}

interface WorkflowStage {
  id: string;
  label: string;
  icon: string;
  badgeColor?: string;
  subFilters?: SubFilter[];
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'New', label: 'All', icon: '🆕', badgeColor: 'bg-blue-600' },
  {
    id: 'Task Submitted',
    label: 'Task Submitted',
    icon: '📝',
    badgeColor: 'bg-indigo-600',
    subFilters: [
      { id: 'Task Submitted', label: 'All Task Submitted' },
      { id: 'Task Submitted - Submitted', label: 'Submitted' },
      { id: 'Task Submitted - Not Submitted', label: 'Not Submitted' },
    ]
  },
  {
    id: 'Direct Interview',
    label: 'Direct Interview',
    icon: '🎤',
    badgeColor: 'bg-teal-600',
    subFilters: [
      { id: 'Direct Interview', label: 'All Direct Interview' },
      { id: 'Direct Interview - Selected', label: 'Selected' },
      { id: 'Direct Interview - Not Selected', label: 'Not Selected (Rejected)' },
    ]
  },
  {
    id: 'Direct Interview Attended',
    label: 'Direct Interview Attended',
    icon: '👥',
    badgeColor: 'bg-emerald-600',
    subFilters: [
      { id: 'Direct Interview Attended', label: 'All Interview Attended' },
      { id: 'Direct Interview Attended - Attended', label: 'Attended' },
      { id: 'Direct Interview Attended - Not Attended', label: 'Not Attended' },
    ]
  },
  {
    id: 'Final Result',
    label: 'Final Result',
    icon: '🎯',
    badgeColor: 'bg-green-600',
    subFilters: [
      { id: 'Final Result', label: 'All Final Result' },
      { id: 'Final Result - Selected', label: 'Selected' },
      { id: 'Final Result - Not Selected', label: 'Not Selected (Rejected)' },
    ]
  },
  {
    id: 'Joined',
    label: 'Joined',
    icon: '🎉',
    badgeColor: 'bg-teal-700'
  }
];

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'New':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Task Submitted - Submitted':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Task Submitted - Not Submitted':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Direct Interview - Selected':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Direct Interview - Not Selected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Direct Interview Attended - Attended':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Direct Interview Attended - Not Attended':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Final Result - Selected':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Final Result - Not Selected':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Joined':
      return 'bg-emerald-600 text-white border-emerald-700';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Task Submitted':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Direct Interview':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Direct Interview Attended':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Final Result':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getNextWorkflowOptions = (status: string) => {
  const current = status || 'New';
  const nextOptions: { value: string; label: string }[] = [];

  if (current === 'New') {
    nextOptions.push(
      { value: 'New', label: '1. New (Current)' },
      { value: 'Task Submitted - Submitted', label: '➜ Task Submitted: Submitted' },
      { value: 'Task Submitted - Not Submitted', label: '➜ Task Submitted: Not Submitted' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Task Submitted' || current === 'Task Submitted - Submitted') {
    nextOptions.push(
      { value: 'Task Submitted - Submitted', label: '2. Task Submitted (Current)' },
      { value: 'Direct Interview - Selected', label: '➜ Direct Interview: Selected' },
      { value: 'Direct Interview - Not Selected', label: '➜ Direct Interview: Not Selected' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Task Submitted - Not Submitted') {
    nextOptions.push(
      { value: 'Task Submitted - Not Submitted', label: '2. Task Not Submitted (Current)' },
      { value: 'Task Submitted - Submitted', label: '➜ Mark as Task Submitted' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Direct Interview' || current === 'Direct Interview - Selected') {
    nextOptions.push(
      { value: 'Direct Interview - Selected', label: '3. Direct Interview: Selected (Current)' },
      { value: 'Direct Interview Attended - Attended', label: '➜ Interview Attended: Attended' },
      { value: 'Direct Interview Attended - Not Attended', label: '➜ Interview Attended: Not Attended' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Direct Interview - Not Selected') {
    nextOptions.push(
      { value: 'Direct Interview - Not Selected', label: '3. Direct Interview: Not Selected (Current)' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Direct Interview Attended' || current === 'Direct Interview Attended - Attended') {
    nextOptions.push(
      { value: 'Direct Interview Attended - Attended', label: '4. Interview Attended: Attended (Current)' },
      { value: 'Final Result - Selected', label: '➜ Final Result: Selected' },
      { value: 'Final Result - Not Selected', label: '➜ Final Result: Not Selected' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Direct Interview Attended - Not Attended') {
    nextOptions.push(
      { value: 'Direct Interview Attended - Not Attended', label: '4. Interview Attended: Not Attended (Current)' },
      { value: 'Direct Interview Attended - Attended', label: '➜ Mark as Attended' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Final Result' || current === 'Final Result - Selected') {
    nextOptions.push(
      { value: 'Final Result - Selected', label: '5. Final Result: Selected (Current)' },
      { value: 'Joined', label: '➜ Joined 🎉' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Final Result - Not Selected') {
    nextOptions.push(
      { value: 'Final Result - Not Selected', label: '5. Final Result: Not Selected (Current)' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else if (current === 'Joined') {
    nextOptions.push(
      { value: 'Joined', label: '6. Joined 🎉 (Current)' },
      { value: 'Rejected', label: '✖ Reject Candidate' }
    );
  } else {
    nextOptions.push({ value: current, label: `${current} (Current)` });
  }

  return nextOptions;
};

export default function ApplicationsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollPipeline = (offset: number) => {
    if (pipelineRef.current) {
      pipelineRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tabsRef.current) {
        const scrollContainer = tabsRef.current.closest('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: tabsRef.current.offsetTop - 12,
            behavior: 'smooth'
          });
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  const [loading, setLoading] = useState(true);
  const [viewApp, setViewApp] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forms, setForms] = useState<any[]>([]);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };

  // Offer email sending state
  const [offerApp, setOfferApp] = useState<any>(null);
  const [offerTargetStatus, setOfferTargetStatus] = useState<string>('');
  const [offerTemplate, setOfferTemplate] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);

  // Dynamic field values for offer popup
  const [offerCandidateName, setOfferCandidateName] = useState('');
  const [offerEmail, setOfferEmail] = useState('');
  const [offerJobPosition, setOfferJobPosition] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerDocuments, setOfferDocuments] = useState('');
  const [offerWorkingHours, setOfferWorkingHours] = useState('');
  const [offerNoticePeriod, setOfferNoticePeriod] = useState('');
  const [offerCustomBody, setOfferCustomBody] = useState('');
  const [offerSubject, setOfferSubject] = useState('');

  const resolveTemplate = (text: string, params: Record<string, string>) => {
    let resolved = text;
    Object.entries(params).forEach(([key, val]) => {
      resolved = resolved.replaceAll(`{{${key}}}`, val);
    });
    return resolved;
  };

  const triggerOfferModal = async (app: any, status: string) => {
    setOfferApp(app);
    setOfferTargetStatus(status);
    setLoadingTemplate(true);
    
    setOfferCandidateName(app.fullName || '');
    setOfferEmail(app.email || '');
    
    let categoryName = 'REACT DEVELOPER';
    if (activeCategoryId) {
      const activeCat = categories.find(c => c._id === activeCategoryId);
      if (activeCat && activeCat.name) {
        categoryName = activeCat.name.toUpperCase();
      }
    }
    setOfferJobPosition(categoryName);
    
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    setOfferStartDate(formattedDate);
    setOfferSalary('10,000 INR');
    setOfferDocuments('Your Aadhar card copy & Photocopy');
    setOfferWorkingHours('Monday to Saturday, 9:30 AM to 6:00 PM (Lunch break from 1:00 PM to 1:30 PM)');
    setOfferNoticePeriod('2 months');

    try {
      const response = await fetchOfferTemplate();
      if (response && response.success) {
        setOfferTemplate(response.data);
        setOfferSubject(response.data.subject || 'Job Offer Confirmation - Jayam Web Solutions');
        const initialBody = resolveTemplate(response.data.body, {
          candidateName: app.fullName || '',
          jobPosition: categoryName,
          startDate: formattedDate,
          salary: '10,000 INR',
          documents: 'Your Aadhar card copy & Photocopy',
          workingHours: 'Monday to Saturday, 9:30 AM to 6:00 PM (Lunch break from 1:00 PM to 1:30 PM)',
          noticePeriod: '2 months'
        });
        setOfferCustomBody(initialBody);
      }
    } catch (err) {
      console.error('Failed to load offer letter template', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (!offerTemplate || !offerTemplate.body) return;
    const resolved = resolveTemplate(offerTemplate.body, {
      candidateName: offerCandidateName,
      jobPosition: offerJobPosition,
      startDate: offerStartDate,
      salary: offerSalary,
      documents: offerDocuments,
      workingHours: offerWorkingHours,
      noticePeriod: offerNoticePeriod
    });
    setOfferCustomBody(resolved);
  }, [
    offerCandidateName,
    offerJobPosition,
    offerStartDate,
    offerSalary,
    offerDocuments,
    offerWorkingHours,
    offerNoticePeriod,
    offerTemplate
  ]);

  const handleSendOfferEmail = async () => {
    if (!offerApp || !offerEmail || !offerSubject || !offerCustomBody) {
      alert('All email fields are required.');
      return;
    }

    setSendingOffer(true);
    try {
      await sendOfferEmail({
        applicationId: offerApp._id,
        email: offerEmail,
        subject: offerSubject,
        body: offerCustomBody,
        status: offerTargetStatus
      });
      showToast('Offer letter sent and candidate status updated successfully!', 'success');
      setOfferApp(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to send offer email.', 'error');
    } finally {
      setSendingOffer(false);
    }
  };

  // Onboard Employee / Join PM state
  const [joinApp, setJoinApp] = useState<any>(null);
  const [joinTargetStatus, setJoinTargetStatus] = useState<string>('Joined');
  const [isJoiningEmployee, setIsJoiningEmployee] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinPersonalEmail, setJoinPersonalEmail] = useState('');
  const [joinGender, setJoinGender] = useState('Male');
  const [joinDob, setJoinDob] = useState('');
  const [joinJoiningDate, setJoinJoiningDate] = useState('');
  const [joinPosition, setJoinPosition] = useState('');
  const [joinSalary, setJoinSalary] = useState('');
  const [joinAddress, setJoinAddress] = useState('');
  const [joinBankName, setJoinBankName] = useState('');
  const [joinAccountNumber, setJoinAccountNumber] = useState('');
  const [joinIfscCode, setJoinIfscCode] = useState('');
  const [joinRole, setJoinRole] = useState('employee');

  const triggerJoinModal = (app: any, status: string = 'Joined') => {
    setJoinApp(app);
    setJoinTargetStatus(status);

    let categoryName = 'React Developer';
    if (activeCategoryId) {
      const activeCat = categories.find(c => c._id === activeCategoryId);
      if (activeCat && activeCat.name) {
        categoryName = activeCat.name;
      }
    } else if (app.categoryId?.name) {
      categoryName = app.categoryId.name;
    }

    const cleanName = (app.fullName || '').trim();
    const today = new Date().toISOString().split('T')[0];
    const candidateDob = extractCandidateDob(app, forms);
    const candidateGender = extractCandidateGender(app);

    setJoinName(cleanName);
    setJoinPhone(app.mobile || '');
    setJoinPersonalEmail(app.email || '');
  
    setJoinGender(candidateGender);
    setJoinDob(candidateDob);
    setJoinJoiningDate(today);
    setJoinPosition(categoryName);
    setJoinSalary(app.staticData?.currentSalary || '');
    setJoinAddress(app.staticData?.currentChennaiLocation || app.staticData?.nativePlace || '');
  };

  const handleConfirmJoinEmployee = async () => {
    if (!joinApp || !joinName.trim()) {
      showToast('Full Name is required.', 'error');
      return;
    }

    setIsJoiningEmployee(true);
    try {
      const response = await joinEmployee({
        name: joinName.trim(),
        phone: joinPhone || '',
        personalEmail: joinPersonalEmail || '',
        gender: joinGender || '',
        dob: joinDob || '',
        joiningDate: joinJoiningDate || '',
        position: joinPosition || '',
        salary: joinSalary || '',
        address: joinAddress || '',
        bankName: joinBankName || '',
        accountNumber: joinAccountNumber || '',
        ifscCode: joinIfscCode || '',
        role: joinRole || 'employee'
      });

      if (response && (response.success || response.employee)) {
        try {
          await updateApplicationStatus(joinApp._id, 'Joined');
        } catch (statusErr) {
          console.error("Status update error:", statusErr);
        }

        showToast(`🎉 ${joinName} added to Project Management and marked as Joined!`, 'success');
        setJoinApp(null);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast(response?.error || response?.message || 'Failed to onboard employee.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to onboard employee:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to onboard employee.';
      showToast(msg, 'error');
    } finally {
      setIsJoiningEmployee(false);
    }
  };


  useEffect(() => {
    const loadForms = async () => {
      try {
        const response = await fetchAllForms();
        if (response.success) {
          setForms(response.data || []);
        }
      } catch (err) {
        console.error('Failed to load forms', err);
      }
    };
    loadForms();
  }, []);

  const getQuestionText = (questionId: string) => {
    if (!/^\d+q?$/.test(questionId)) {
      return questionId;
    }
    for (const form of forms) {
      if (form.customSections) {
        for (const section of form.customSections) {
          if (section.questions) {
            const question = section.questions.find((q: any) => q.id === questionId);
            if (question) {
              return question.text;
            }
          }
        }
      }
    }
    return questionId;
  };

  const [evalTaskForm, setEvalTaskForm] = useState<any>(null);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [isLoadingEvalForm, setIsLoadingEvalForm] = useState(false);

  useEffect(() => {
    if (viewApp && viewApp.taskAnswers) {
      const loadEvalTaskForm = async () => {
        try {
          setIsLoadingEvalForm(true);
          const response = await api.get(`/api/task-submissions?applicationId=${viewApp._id}`);
          if (response.data.success) {
            setEvalTaskForm(response.data.data.form);
            setEvalScores(viewApp.taskScores || {});
          }
        } catch (error) {
          console.error("Failed to load task form details for evaluation:", error);
        } finally {
          setIsLoadingEvalForm(false);
        }
      };
      loadEvalTaskForm();
    } else {
      setEvalTaskForm(null);
      setEvalScores({});
    }
  }, [viewApp]);
  const handleSaveEvaluation = async () => {
    if (!viewApp || !evalTaskForm) return;

    let totalScore = 0;
    Object.values(evalScores).forEach(val => {
      totalScore += Number(val) || 0;
    });

    try {
      setIsSavingEval(true);
      const response = await api.put(`/api/admin/applications/${viewApp._id}/evaluate`, {
        taskScores: evalScores,
        taskTotalScore: totalScore
      });

      if (response.data.success) {
        showToast("Evaluation saved successfully!", 'success');
        setViewApp((prev: any) => ({
          ...prev,
          taskScores: evalScores,
          taskTotalScore: totalScore,
          taskEvaluated: true
        }));
        setRefreshKey(prev => prev + 1);
      } else {
        showToast(response.data.message || "Failed to save evaluation.", 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to save evaluation.", 'error');
    } finally {
      setIsSavingEval(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    expType: '',
    expYears: '',
    gradYear: '',
    workingStatus: '',
    jsFramework: '',
    minSalary: '',
    maxSalary: '',
    startDate: '',
    endDate: '',
    status: 'New'
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const textChanged =
      filters.location !== debouncedFilters.location ||
      filters.gradYear !== debouncedFilters.gradYear ||
      filters.minSalary !== debouncedFilters.minSalary ||
      filters.maxSalary !== debouncedFilters.maxSalary;

    if (textChanged) {
      const timer = setTimeout(() => {
        setDebouncedFilters(filters);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDebouncedFilters(filters);
    }
  }, [filters]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [totalPages, setTotalPages] = useState(0);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [stats, setStats] = useState({ today: 0, month: 0, total: 0 });

  const activeStage = WORKFLOW_STAGES.find(s =>
    filters.status === s.id || (s.subFilters && s.subFilters.some(sub => sub.id === filters.status))
  ) || WORKFLOW_STAGES[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchAllCategories();
        const categoriesData = response.data || response;
        setCategories(categoriesData);
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategoryId(categoriesData[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch applications when dependencies change
  useEffect(() => {
    if (!activeCategoryId) return;

    const loadApplications = async () => {
      setLoading(true);
      try {
        const data = await fetchApplications({
          categoryId: activeCategoryId,
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          ...debouncedFilters
        });
        setApplications(data.applications || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalFilteredCount(data.pagination?.total || 0);
        setStats(data.stats || { today: 0, month: 0, total: 0 });
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, [activeCategoryId, currentPage, debouncedSearch, debouncedFilters, refreshKey]);

  // Reset pagination and selection on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [debouncedSearch, debouncedFilters, activeCategoryId]);

  // Clear selection on page change
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  const handleDelete = (id: string) => {
    setAppToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;
    try {
      await deleteApplication(appToDelete);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete', err);
      showToast('Failed to delete application.', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Optimistically update the UI to feel instant
      setApplications(applications.map(app =>
        app._id === id ? { ...app, status: newStatus } : app
      ));
      await updateApplicationStatus(id, newStatus);
      // Trigger a refetch in case filters exclude the new status
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to update application status.', 'error');
      // Revert optimism by fetching
      setRefreshKey(prev => prev + 1);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  // Export Selected Applications to Excel (.xlsx) — excludes resume, groups by section
  const handleExport = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one application checkbox to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Build query params matching current filters
      const params = new URLSearchParams({
        categoryId: activeCategoryId,
        search: debouncedSearch,
        ...Object.fromEntries(
          Object.entries(debouncedFilters).filter(([, v]) => v !== '')
        )
      });

      const apiBase = process.env.NEXT_PUBLIC_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/applications/export?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Export API error:', res.status, text.slice(0, 200));
        throw new Error(`Export API returned ${res.status}`);
      }
      const data = await res.json();
      let apps: any[] = data.applications || [];

      // Filter to only export selected ones
      apps = apps.filter(app => selectedIds.includes(app._id));

      if (apps.length === 0) {
        alert('No matching selected applications found to export.');
        return;
      }

      // Collect all unique dynamic question keys across all selected apps
      const dynamicKeys = new Set<string>();
      apps.forEach(app => {
        Object.keys(app.dynamicData || {}).forEach(k => dynamicKeys.add(k));
      });
      const dynamicKeysList = Array.from(dynamicKeys);

      // Define static columns with clear user-friendly labels
      const STATIC_PERSONAL = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'mobile', label: 'Phone' },
        { key: 'nativePlace', label: 'Native Place' },
        { key: 'basedInChennai', label: 'Based in Chennai' },
        { key: 'joinWithinWeek', label: 'Join Within a Week' },
        { key: 'maritalStatus', label: 'Marital Status' },
        { key: 'dob', label: 'Date of Birth' },
        { key: 'experience', label: 'Experience Type' },
        { key: 'degree', label: 'Degree' },
        { key: 'specialization', label: 'Specialization / Major' },
        { key: 'university', label: 'University / College' },
        { key: 'gradYear', label: 'Graduation Year' },
        { key: 'careerGap', label: 'Career Gap' },
      ];

      const STATIC_PROFESSIONAL = [
        { key: 'workingCurrently', label: 'Working Currently' },
        { key: 'servingNotice', label: 'Serving Notice Period' },
        { key: 'canSubmitBankStatement', label: 'Can Submit Bank Statement' },
        { key: 'reasonForChange', label: 'Reason for Job Change' },
        { key: 'clientProjects', label: 'Client Projects Experience' },
        { key: 'workPreference', label: 'Work Preference' },
      ];

      const STATIC_COMPENSATION = [
        { key: 'currentSalary', label: 'Current Salary' },
        { key: 'noticePeriod', label: 'Notice Period' },
      ];

      const buildRow = (app: any, index: number) => {
        const row: Record<string, any> = {
          'S.No': index + 1,
          'Status': app.status || 'New',
          'Applied Date': new Date(app.createdAt).toLocaleString('en-GB')
        };

        // Personal Information Section
        STATIC_PERSONAL.forEach(({ key, label }) => {
          row[label] = app.staticData?.[key] ?? app[key] ?? '';
        });

        // Professional Information Section
        STATIC_PROFESSIONAL.forEach(({ key, label }) => {
          row[label] = app.staticData?.[key] ?? '';
        });

        // Compensation Section
        STATIC_COMPENSATION.forEach(({ key, label }) => {
          row[label] = app.staticData?.[key] ?? '';
        });

        // Dynamic Questions
        dynamicKeysList.forEach(k => {
          const v = (app.dynamicData || {})[k];
          row[k] = Array.isArray(v) ? (v as any[]).join(', ') : (v ?? '');
        });

        return row;
      };

      const rows = apps.map((app, i) => buildRow(app, i));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 2, 12)
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Applications');

      const categoryName = categories.find((c: any) => c._id === activeCategoryId)?.name || 'Export';
      const filename = `${categoryName.replace(/\s+/g, '_')}_Selected_Applications_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export selected applications.');
    } finally {
      setIsExporting(false);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  if (!isMounted) {
    return null; // Prevents hydration errors from browser extensions injecting attributes
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-2 relative min-h-[80vh] flex flex-col">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 shrink-0">
        <div className="bg-white rounded-2xl border border-blue-100 p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-blue-600 mb-1">Today's Applications</h3>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats.today}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-emerald-600 mb-1">This Month</h3>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats.month}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h3 className="text-xs sm:text-sm font-bold text-gray-600 mb-1">Total Applications</h3>
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto p-2.5 shrink-0 bg-[#0f172a] rounded-t-[2rem] border-b border-white/10 no-scrollbar" 
        style={{ scrollbarWidth: 'none' }}
      >
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => setActiveCategoryId(cat._id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                ? 'bg-[#ff6600] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Toolbar (Search & Filter) */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-2 shrink-0 shadow-sm flex flex-col gap-4">

        <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 shrink-0">
          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-5 py-2.5 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-gray-300 active:scale-95 duration-100 ${
              showAdvancedFilters
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-80 flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-colors"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 bg-white border-l border-gray-200 rounded-r-xl text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Collapsible Unified Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="Current Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Experience Level</label>
                <select
                  value={filters.expYears}
                  onChange={(e) => setFilters({ ...filters, expYears: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="">All Experience Levels</option>
                  <option value="0-6">0-6 Months</option>
                  <option value="6-1">6 Months - 1 Year</option>
                  <option value="1-2">1-2 Years</option>
                  <option value="2+">2+ Years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Graduation Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  value={filters.gradYear}
                  onChange={(e) => setFilters({ ...filters, gradYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Working Status</label>
                <select
                  value={filters.workingStatus}
                  onChange={(e) => setFilters({ ...filters, workingStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700"
                >
                  <option value="">All Working Status</option>
                  <option value="Working">Working</option>
                  <option value="Not Working">Not Working</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Min Salary</label>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={filters.minSalary}
                  onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Max Salary</label>
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={filters.maxSalary}
                  onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Date Range</label>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update: [Date | null, Date | null]) => {
                    setDateRange(update);
                    setFilters({
                      ...filters,
                      startDate: update[0] ? update[0].toISOString().split('T')[0] : '',
                      endDate: update[1] ? update[1].toISOString().split('T')[0] : ''
                    });
                  }}
                  isClearable={true}
                  placeholderText="Select Date Range..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  dateFormat="MM/dd/yyyy"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200/60">
              <button
                onClick={() => {
                  const empty = { location: '', expType: '', expYears: '', gradYear: '', workingStatus: '', jsFramework: '', minSalary: '', maxSalary: '', startDate: '', endDate: '', status: filters.status };
                  setDateRange([null, null]);
                  setFilters(empty);
                }}
                className="bg-[#64748b] hover:bg-[#475569] text-white font-bold py-2 px-6 rounded-xl shadow-sm text-sm transition-colors border border-transparent active:scale-95 duration-100 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-[#059669] hover:bg-[#047857] disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-xl shadow-sm text-sm transition-colors border border-transparent flex items-center gap-2 active:scale-95 duration-100 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    Exporting...
                  </>
                ) : (
                  'Export'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Workflow Stage Pipeline */}
        <div className="flex flex-col gap-3 mt-1">
          {/* Main Stage Pipeline Bar wrapper with swiper scroll arrows */}
          <div className="relative flex items-center w-full group">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollPipeline(-200)}
              className="absolute left-0 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md border border-gray-200 transition-all active:scale-95 opacity-100 cursor-pointer"
              type="button"
              title="Scroll Left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Scrollable Stage Pipeline Bar */}
            <div 
              ref={pipelineRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 px-8 scroll-smooth no-scrollbar" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {WORKFLOW_STAGES.map((stage) => {
                const isActive = activeStage.id === stage.id;
                let activeColor = stage.badgeColor || 'bg-blue-600';

                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, status: stage.id }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm shrink-0 ${isActive
                      ? `${activeColor} text-white border-transparent scale-[1.02] shadow-md`
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                  >
                    <span>{stage.icon}</span>
                    <span>{stage.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollPipeline(200)}
              className="absolute right-0 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md border border-gray-200 transition-all active:scale-95 opacity-100 cursor-pointer"
              type="button"
              title="Scroll Right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Sub-Filters Pill Bar (Shown when active stage has subFilters) */}
          {activeStage.subFilters && activeStage.subFilters.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-3 bg-gradient-to-r from-blue-50/80 to-orange-50/80 rounded-xl border border-gray-200/80">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                {activeStage.label} Filter:
              </span>
              <div className="flex items-center gap-1.5">
                {activeStage.subFilters.map((sub) => {
                  const isSubActive = filters.status === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: sub.id }));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${isSubActive
                        ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full min-w-[1200px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th key={i} className="py-3 px-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-[60px]"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="py-4 px-2">
                        <div className={`h-4 bg-gray-100 rounded animate-pulse ${j === 1 ? 'w-32' : j === 2 ? 'w-24' : 'w-16'}`}></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="font-medium text-lg">No applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[1200px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applications.length > 0 && selectedIds.length === applications.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(applications.map(app => app._id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300 cursor-pointer"
                      />
                      <span>no</span>
                    </div>
                  </th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Name</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Phone</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Location</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Exp</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Salary</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Intern</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Grad Yr</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs text-center">Resume</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs">Applied</th>
                  <th className="py-2 px-1 font-bold text-gray-500  text-xs text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {applications.map((app, index) => (
                  <tr key={app._id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="py-2 px-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, app._id]);
                            } else {
                              setSelectedIds(selectedIds.filter(id => id !== app._id));
                            }
                          }}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300 cursor-pointer"
                        />
                        <span className="font-medium">{startIndex + index + 1}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1">
                      <div className="font-bold text-gray-900 truncate max-w-[120px]" title={app.fullName}>{app.fullName}</div>
                      <a
                        href={`mailto:${app.email}`}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate max-w-[120px] block"
                        title={`Send email to ${app.email}`}
                      >
                        {app.email}
                      </a>
                      {app.taskAnswers && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-1 py-0.5 rounded leading-none uppercase tracking-wide border ${app.taskEvaluated ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {app.taskEvaluated ? 'Evaluated' : 'Pending Eval'}
                          </span>
                          <span className="text-[10px] font-black text-[#ff6600]">
                            {(app.taskTotalScore !== undefined) ? `${app.taskTotalScore} / ${app.taskMaxScore || 0}` : ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-1 text-sm font-medium">
                      <a
                        href={`https://wa.me/${(app.mobile || '').replace(/\D/g, '').length === 10 ? '91' + (app.mobile || '').replace(/\D/g, '') : (app.mobile || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
                        title="Message on WhatsApp"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                        {app.mobile}
                      </a>
                    </td>
                    <td className="py-2 px-1 text-sm text-gray-700 truncate max-w-[80px]" title={app.staticData?.currentChennaiLocation || app.staticData?.nativePlace || 'N/A'}>
                      {app.staticData?.currentChennaiLocation || app.staticData?.nativePlace || 'N/A'}
                    </td>
                    <td className="py-2 px-1 text-sm text-gray-700 font-medium">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${app.staticData?.experience?.toLowerCase() === 'fresher' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {app.staticData?.experience === '0-6' ? '0-6 Months' :
                          app.staticData?.experience === '6-1' ? '6 Months - 1 Year' :
                            app.staticData?.experience === '1-2' ? '1-2 Years' :
                              app.staticData?.experience === '2+' ? '2+ Years' :
                                (app.staticData?.experience || 'N/A')}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-sm text-gray-700 font-bold">{app.staticData?.currentSalary || 'N/A'}</td>
                    <td className="py-2 px-1 text-sm text-gray-700">{app.dynamicData?.['internship'] || app.dynamicData?.['Internship'] || 'N/A'}</td>
                    <td className="py-2 px-1 text-sm text-gray-700">{app.staticData?.gradYear || 'N/A'}</td>
                    <td className="py-2 px-1 text-center">
                      <a
                        href={getResumeViewUrl(app.resume)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 transition-all font-bold text-xs border border-orange-100/50 shadow-sm"
                        title="View Resume"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Resume</span>
                      </a>
                    </td>
                    <td className="py-2 px-1 text-sm text-gray-600 font-medium">
                      {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}<br />
                      <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <select
                          value={app.status || 'New'}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (newStatus === 'Final Result - Selected') {
                              triggerOfferModal(app, newStatus);
                            } else if (newStatus === 'Joined') {
                              triggerJoinModal(app, newStatus);
                            } else {
                              handleStatusChange(app._id, newStatus);
                            }
                          }}
                          className={`border rounded-lg text-[10px] px-1.5 py-1.5 w-44 focus:outline-none font-bold mb-1 shadow-sm transition-colors cursor-pointer ${getStatusBadgeStyle(app.status || 'New')}`}
                        >
                          {getNextWorkflowOptions(app.status || 'New').map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-bold">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewApp(app)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(app._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 shrink-0 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{totalFilteredCount === 0 ? 0 : startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, totalFilteredCount)}</span> of <span className="font-bold text-gray-900">{totalFilteredCount}</span> entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-500 shadow-sm'}`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-bold text-gray-700">Page {currentPage} of {totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-500 shadow-sm'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewApp.fullName}'s Application</h2>
                <p className="text-sm text-gray-500">{viewApp.email} • {viewApp.mobile}</p>
              </div>
              <div className="flex items-center gap-3">
                {viewApp.status !== 'Joined' && (
                  <button
                    onClick={() => {
                      const target = viewApp;
                      setViewApp(null);
                      triggerJoinModal(target, 'Joined');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>🎉</span>
                    <span>Onboard to PM</span>
                  </button>
                )}
                <span className={`px-3 py-1 rounded-xl text-xs font-black border shadow-sm ${getStatusBadgeStyle(viewApp.status || 'New')}`}>
                  {viewApp.status || 'New'}
                </span>
                <button
                  onClick={() => setViewApp(null)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-sm font-bold text-gray-400  mb-4 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-orange-100 text-orange-500 flex items-center justify-center text-[10px]">1</span>
                Static Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
                {Object.entries(viewApp.staticData || {})
                  .filter(([key]) => !['dynamicFields'].includes(key))
                  .map(([key, val]) => (
                    <div key={key} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {key === 'experience' ? (
                          val === '0-6' ? '0-6 Months' :
                            val === '6-1' ? '6 Months - 1 Year' :
                              val === '1-2' ? '1-2 Years' :
                                val === '2+' ? '2+ Years' :
                                  (val as string || 'N/A')
                        ) : (
                          typeof val === 'object' ? JSON.stringify(val) : (val as string || 'N/A')
                        )}
                      </p>
                    </div>
                  ))}
              </div>

              {viewApp.dynamicData && Object.keys(viewApp.dynamicData).length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-gray-400  mb-4 mt-8 flex items-center gap-2 border-t border-gray-100 pt-6">
                    <span className="w-4 h-4 rounded bg-blue-100 text-blue-500 flex items-center justify-center text-[10px]">2</span>
                    Custom Questions
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(viewApp.dynamicData).map(([q, a]) => (
                      <div key={q} className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                        <p className="text-xs text-blue-800 font-bold mb-2">{getQuestionText(q)}</p>
                        <p className="font-medium text-gray-900 text-sm">
                          {Array.isArray(a) ? a.join(', ') : (typeof a === 'object' ? JSON.stringify(a) : (a as string))}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {viewApp.taskAnswers && (
                <>
                  <h3 className="text-sm font-bold text-gray-400 mb-4 mt-8 flex items-center gap-2 border-t border-gray-100 pt-6">
                    <span className="w-4 h-4 rounded bg-orange-100 text-[#ff6600] flex items-center justify-center text-[10px]">3</span>
                    Remote Interview Task Evaluation
                  </h3>

                  {isLoadingEvalForm ? (
                    <div className="flex justify-center items-center py-6">
                      <div className="w-8 h-8 border-4 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : evalTaskForm ? (
                    <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-150">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm">{evalTaskForm.name}</h4>
                          <span className="text-xs text-gray-400 font-bold tracking-wider uppercase">Auto-Graded Task Submission</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-bold block">TOTAL SCORE</span>
                          <span className="text-lg font-black text-[#ff6600]">
                            {Object.values(evalScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0).toFixed(1)} / {evalTaskForm.customSections.reduce((acc: number, sec: any) => acc + sec.questions.reduce((qAcc: number, q: any) => qAcc + (Number(q.marks) || 1), 0), 0)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {evalTaskForm.customSections.map((section: any) => (
                          <div key={section.id} className="space-y-3">
                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-wide border-l-2 border-[#ff6600] pl-2">{section.heading}</h5>
                            <div className="space-y-3 pl-3">
                              {section.questions.map((q: any) => {
                                const answer = viewApp.taskAnswers[q.id];
                                return (
                                  <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-start gap-2">
                                        <span className="text-sm font-bold text-gray-800">{q.text}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide">Max: {q.marks || 1}</span>
                                      </div>

                                      <div className="text-xs">
                                        <span className="text-gray-400 font-bold">Candidate Answer: </span>
                                        <span className="font-semibold text-gray-700">
                                          {Array.isArray(answer)
                                            ? (answer.length > 0 ? answer.join(', ') : <span className="italic text-gray-400">None checked</span>)
                                            : (answer || <span className="italic text-gray-400">No input provided</span>)
                                          }
                                        </span>
                                      </div>

                                      {(q.type === 'radio' || q.type === 'checkbox') && q.options && q.options.length > 0 && (
                                        <div className="text-xs">
                                          <span className="text-emerald-500 font-bold">Option Marks: </span>
                                          <span className="font-semibold text-emerald-600">
                                            {q.options.map((opt: string, idx: number) => {
                                              const mark = (q.optionMarks && q.optionMarks[idx] !== undefined) ? q.optionMarks[idx] : 0;
                                              return mark > 0 ? `${opt} (${mark} pts)` : null;
                                            }).filter(Boolean).join(', ') || 'No positive points defined'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="w-full md:w-32 flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                      <label className="text-xs font-bold text-gray-500 uppercase">Score:</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={q.marks || 1}
                                        step={0.1}
                                        value={evalScores[q.id] !== undefined ? evalScores[q.id] : 0}
                                        onChange={(e) => setEvalScores({ ...evalScores, [q.id]: Math.min(Number(q.marks) || 1, Math.max(0, Number(e.target.value))) })}
                                        className="w-16 px-2 py-1 rounded border border-gray-200 text-center font-bold text-[#ff6600] focus:ring-1 focus:ring-[#ff6600] focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                        <button
                          onClick={handleSaveEvaluation}
                          disabled={isSavingEval}
                          className="bg-[#ff6600] hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors"
                        >
                          {isSavingEval ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              Save Evaluation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 italic">Could not load task form details for this candidate submission.</p>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Applied on: {new Date(viewApp.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-3">
                <button onClick={() => setViewApp(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                  Close
                </button>
                <a
                  href={getResumeViewUrl(viewApp.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Resume
                </a>
                <a
                  href={getFileUrl(viewApp.resume)}
                  download={`${viewApp.fullName.replace(/\s+/g, '-')}`}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Offer Email Modal */}
      {offerApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-950">Send Job Offer Letter</h2>
                <p className="text-sm text-gray-500 font-medium">Configure parameters and preview the offer email for {offerApp.fullName}.</p>
              </div>
              <button
                onClick={() => setOfferApp(null)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {loadingTemplate ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff6600]"></div>
              </div>
            ) : (
              /* Modal Body */
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inputs Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Offer Parameters</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Candidate Name</label>
                    <input
                      type="text"
                      value={offerCandidateName}
                      onChange={(e) => setOfferCandidateName(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Candidate Email Address</label>
                    <input
                      type="email"
                      value={offerEmail}
                      onChange={(e) => setOfferEmail(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Job Position (Uppercase)</label>
                    <input
                      type="text"
                      value={offerJobPosition}
                      onChange={(e) => setOfferJobPosition(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Effective Date</label>
                      <input
                        type="text"
                        value={offerStartDate}
                        onChange={(e) => setOfferStartDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Salary</label>
                      <input
                        type="text"
                        value={offerSalary}
                        onChange={(e) => setOfferSalary(e.target.value)}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Notice Period</label>
                    <input
                      type="text"
                      value={offerNoticePeriod}
                      onChange={(e) => setOfferNoticePeriod(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Documents to Submit</label>
                    <input
                      type="text"
                      value={offerDocuments}
                      onChange={(e) => setOfferDocuments(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Working Hours</label>
                    <textarea
                      value={offerWorkingHours}
                      onChange={(e) => setOfferWorkingHours(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-950"
                    />
                  </div>
                </div>

                {/* Email Preview & Send */}
                <div className="flex flex-col h-full space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Email Content Preview (Editable)</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Subject Header</label>
                    <input
                      type="text"
                      value={offerSubject}
                      onChange={(e) => setOfferSubject(e.target.value)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-950 font-bold"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Message Body</label>
                    <textarea
                      value={offerCustomBody}
                      onChange={(e) => setOfferCustomBody(e.target.value)}
                      className="w-full flex-1 p-4 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600]/20 focus:border-[#ff6600] bg-gray-50 text-gray-950 font-mono leading-relaxed resize-none h-[220px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            {!loadingTemplate && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">
                  Sending as: {offerTargetStatus}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOfferApp(null)}
                    className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendOfferEmail}
                    disabled={sendingOffer}
                    className="bg-[#ff6600] hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-75"
                  >
                    {sendingOffer ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Offer...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Send Email & Select
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboard Employee to Project Management Modal */}
      {joinApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-emerald-50 to-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-teal-600/20">
                  🎉
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Onboard Employee to Project Management</h2>
                  <p className="text-xs text-gray-500">Candidate: <strong className="text-teal-700">{joinApp.fullName}</strong> • Status: <span className="font-semibold text-emerald-600">Joined</span></p>
                </div>
              </div>
              <button
                onClick={() => setJoinApp(null)}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Informational Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3">
                <div className="text-emerald-600 mt-0.5 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold text-emerald-950 mb-0.5">Automated Project Management Database Sync</p>
                  Confirming this form will immediately create an Employee profile in Project Management with the candidate's personal email, assign standard module edit permissions, and update this candidate to <span className="font-bold text-emerald-800">Joined</span>.
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Candidate & Contact Details */}
                <div className="space-y-4 bg-gray-50/60 p-5 rounded-2xl border border-gray-150">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    Candidate & Contact Details
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={joinPhone}
                      onChange={(e) => setJoinPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={joinPersonalEmail}
                      onChange={(e) => setJoinPersonalEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                    />
                  </div>

                  

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                      <select
                        value={joinGender}
                        onChange={(e) => setJoinGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={joinDob}
                        onChange={(e) => setJoinDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                      >
                      </input>
                    </div>
                  </div>
                </div>

                {/* Column 2: Employment & Banking Details */}
                <div className="space-y-4 bg-gray-50/60 p-5 rounded-2xl border border-gray-150">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Employment & Banking Information
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Position / Designation</label>
                    <input
                      type="text"
                      value={joinPosition}
                      onChange={(e) => setJoinPosition(e.target.value)}
                      placeholder="e.g. React Developer"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={joinJoiningDate}
                        onChange={(e) => setJoinJoiningDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Salary</label>
                      <input
                        type="text"
                        value={joinSalary}
                        onChange={(e) => setJoinSalary(e.target.value)}
                        placeholder="e.g. 15,000 INR"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                    <textarea
                      value={joinAddress}
                      onChange={(e) => setJoinAddress(e.target.value)}
                      rows={2}
                      placeholder="Full Address"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium text-gray-900 resize-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Bank Details (Optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={joinBankName}
                        onChange={(e) => setJoinBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
                      />
                      <input
                        type="text"
                        value={joinAccountNumber}
                        onChange={(e) => setJoinAccountNumber(e.target.value)}
                        placeholder="Account Number"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
                      />
                      <input
                        type="text"
                        value={joinIfscCode}
                        onChange={(e) => setJoinIfscCode(e.target.value)}
                        placeholder="IFSC Code"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Creates employee in Project Management & sets status to Joined
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setJoinApp(null)}
                  disabled={isJoiningEmployee}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoinEmployee}
                  disabled={isJoiningEmployee}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-7 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-75 cursor-pointer"
                >
                  {isJoiningEmployee ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Employee...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Confirm & Create Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemType="application"
      />

      {/* Premium Floating Toast Notification */}
      {toast.type && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md border animate-in slide-in-from-bottom duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800' 
            : 'bg-red-500/10 border-red-500/25 text-red-800'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
            toast.type === 'success' ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-red-500 shadow-md shadow-red-500/30'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div>
            <h4 className="font-extrabold text-sm capitalize">{toast.type}</h4>
            <p className="text-xs font-semibold opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
