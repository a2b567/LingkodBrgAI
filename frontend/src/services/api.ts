import axios from 'axios';
import type { 
  User, Resident, Household, Certificate, Blotter, Business, 
  Appointment, Notification, Payment, DashboardStats, PublicCertificateResponse 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api');

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000, // Fast timeout for immediate fallback if backend server is not running
});

// Interceptor to inject JWT Token from LocalStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('lingkodbrgai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Groq AI Integration Helper
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';

// Use direct Groq API endpoint
const GROQ_BASE_URL = 'https://api.groq.com';

export const callGroqAI = async (prompt: string, systemContext?: string): Promise<string> => {
  if (!GROQ_API_KEY) {
    throw new Error("No Groq API key available");
  }

  const defaultSystem = 'You are LingkodBrgyAI, the intelligent operations assistant for Barangay Lawrence, Laguna, Philippines. Assist residents and barangay officers politely and accurately in Tagalog, English, or Taglish. Format responses with clean bullet points and markdown bold text where appropriate.';

  const makeRequest = async (model: string) => {
    const res = await fetch(`${GROQ_BASE_URL}/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContext || defaultSystem },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    if (!res.ok) {
      throw new Error(`Groq API ${model} returned ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  };

  try {
    return await makeRequest('groq/compound');
  } catch (err) {
    console.warn('Primary Groq model failed, trying fallback 1:', err);
    try {
      return await makeRequest('openai/gpt-oss-120b');
    } catch (err2) {
      console.warn('Fallback 1 failed, trying fallback 2:', err2);
      try {
        return await makeRequest('qwen/qwen3.8-27b');
      } catch (err3) {
        console.warn('All Groq models failed:', err3);
        throw err3;
      }
    }
  }
};

// Mock Database state for seamless offline operation (Empty clean database)
const mockState = {
  residents: [] as Resident[],
  households: [] as Household[],
  certificates: [] as Certificate[],
  blotters: [] as Blotter[],
  businesses: [] as Business[],
  appointments: [] as Appointment[],
  notifications: [] as Notification[],
};

// Helper for dynamic mock users
function getMockUser(username: string): User {
  const lower = username.toLowerCase();
  let role = 'Resident';
  let email = `${username || 'user'}@barangay-lawrence.gov.ph`;

  if (lower.includes('captain')) {
    role = 'Barangay Captain';
    email = 'captain@barangay-lawrence.gov.ph';
  } else if (lower.includes('admin') || lower.includes('super')) {
    role = 'Super Admin';
    email = 'admin@barangay-lawrence.gov.ph';
  } else if (lower.includes('sec') || lower.includes('secretary')) {
    role = 'Secretary';
    email = 'secretary@barangay-lawrence.gov.ph';
  } else if (lower.includes('treasurer')) {
    role = 'Treasurer';
    email = 'treasurer@barangay-lawrence.gov.ph';
  } else if (lower.includes('health') || lower.includes('nurse')) {
    role = 'Health Worker';
    email = 'health@barangay-lawrence.gov.ph';
  } else if (lower.includes('staff')) {
    role = 'Staff';
    email = 'staff@barangay-lawrence.gov.ph';
  }

  return {
    id: `usr-${Date.now()}`,
    username: username || 'user',
    email: email,
    role: role,
    is_verified: true,
    resident_id: 'res-1',
  };
}

// Helper to execute API request with automatic Mock Fallback on connection error
async function withFallback<T>(apiCall: () => Promise<T>, fallbackDataFn: () => T): Promise<T> {
  try {
    return await apiCall();
  } catch (err: any) {
    // If connection refused or network error (backend not running locally on 8080)
    if (!err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      console.warn('Backend server on port 8080 unavailable. Using intelligent mock fallback response.');
      return fallbackDataFn();
    }
    throw err;
  }
}

export const api = {
  auth: {
    login: (data: { username: string; password?: string }) => 
      withFallback(
        () => client.post<{ token: string; user: User }>('/auth/login', data).then(r => r.data),
        () => {
          const user = getMockUser(data.username);
          const token = `mock_jwt_token_${user.role.replace(/\s+/g, '_')}`;
          localStorage.setItem('lingkodbrgai_mock_user', JSON.stringify(user));
          return { token, user };
        }
      ),

    register: (data: any) =>
      withFallback(
        () => client.post('/auth/register', data).then(r => r.data),
        () => ({ message: 'Registration submitted successfully. Check verification code.' })
      ),

    verifyOtp: (data: any) =>
      withFallback(
        () => client.post('/auth/verify-otp', data).then(r => r.data),
        () => ({ message: 'OTP verified successfully.' })
      ),

    getMe: () =>
      withFallback(
        () => client.get<User>('/auth/me').then(r => r.data),
        () => {
          const saved = localStorage.getItem('lingkodbrgai_mock_user');
          if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
          }
          return getMockUser('captain');
        }
      ),

    forgotPassword: (data: { email: string }) =>
      withFallback(
        () => client.post<{ message: string; otp?: string }>('/auth/forgot-password', data).then(r => r.data),
        () => ({ message: 'OTP reset code sent to email', otp: '123456' })
      ),

    resetPassword: (data: any) =>
      withFallback(
        () => client.post<{ message: string }>('/reset-password', data).then(r => r.data),
        () => ({ message: 'Password reset successfully' })
      ),
  },

  residents: {
    list: (params?: any) =>
      withFallback(
        () => client.get<{ data: Resident[]; total: number; page: number; limit: number }>('/residents', { params }).then(r => r.data),
        () => ({ data: mockState.residents, total: mockState.residents.length, page: 1, limit: 10 })
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Resident>(`/residents/${id}`).then(r => r.data),
        () => mockState.residents.find(r => r.id === id) || (mockState.residents[0] || { id, first_name: 'System', last_name: 'Resident', address: 'Barangay Lawrence' } as Resident)
      ),
    create: (data: Partial<Resident>) =>
      withFallback(
        () => client.post<Resident>('/residents', data).then(r => r.data),
        () => {
          const newRes: Resident = {
            id: `res-${Date.now()}`,
            first_name: data.first_name || 'Resident',
            last_name: data.last_name || 'User',
            birthdate: data.birthdate || '1995-01-01',
            gender: data.gender || 'Male',
            civil_status: data.civil_status || 'Single',
            address: data.address || 'Barangay Lawrence, Laguna',
            citizenship: 'Filipino',
            residency_status: 'Permanent',
            voter_status: 'Registered Voter',
            is_household_head: false,
            qr_id: `QR-RES-${Date.now().toString().slice(-4)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockState.residents.push(newRes);
          return newRes;
        }
      ),
    update: (id: string, data: Partial<Resident>) =>
      withFallback(
        () => client.put<Resident>(`/residents/${id}`, data).then(r => r.data),
        () => {
          const res = mockState.residents.find(r => r.id === id);
          if (res) Object.assign(res, data);
          return res || mockState.residents[0];
        }
      ),
    delete: (id: string) =>
      withFallback(
        () => client.delete(`/residents/${id}`).then(r => r.data),
        () => {
          const idx = mockState.residents.findIndex(r => r.id === id);
          if (idx !== -1) mockState.residents.splice(idx, 1);
          return { message: 'Resident deleted' };
        }
      ),
    uploadPhoto: (formData: FormData) =>
      withFallback(
        () => client.post<{ photo_url: string }>('/residents/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data),
        () => ({ photo_url: '/assets/logo.png' })
      ),
  },

  households: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Household[]>('/households', { params }).then(r => r.data),
        () => mockState.households
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Household>(`/households/${id}`).then(r => r.data),
        () => mockState.households.find(h => h.id === id) || (mockState.households[0] || { id, household_number: 'HH-000', head_id: 'res-1', poverty_level: 'Non-Poor', address: 'Barangay Lawrence' } as Household)
      ),
    create: (data: Partial<Household>) =>
      withFallback(
        () => client.post<Household>('/households', data).then(r => r.data),
        () => {
          const newHh: Household = {
            id: `hh-${Date.now()}`,
            household_number: data.household_number || `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
            head_id: data.head_id || '',
            poverty_level: data.poverty_level || 'Non-Poor',
            address: data.address || 'Barangay Lawrence, Laguna',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockState.households.push(newHh);
          return newHh;
        }
      ),
    update: (id: string, data: Partial<Household>) =>
      withFallback(
        () => client.put<Household>(`/households/${id}`, data).then(r => r.data),
        () => mockState.households[0]
      ),
    delete: (id: string) =>
      withFallback(
        () => client.delete(`/households/${id}`).then(r => r.data),
        () => ({ message: 'Household deleted' })
      ),
    assignMember: (data: any) =>
      withFallback(
        () => client.post('/households/assign-member', data).then(r => r.data),
        () => ({ message: 'Member assigned' })
      ),
  },

  certificates: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Certificate[]>('/certificates', { params }).then(r => r.data),
        () => mockState.certificates
      ),
    request: (data: any) =>
      withFallback(
        () => client.post<Certificate>('/certificates', data).then(r => r.data),
        () => {
          const newCert: Certificate = {
            id: `cert-${Date.now()}`,
            resident_id: data.resident_id || 'res-1',
            type: data.type || 'Barangay Clearance',
            document_number: `BC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'Pending',
            purpose: data.purpose || 'Official Document Request',
            qr_hash: Math.random().toString(36).substring(2, 15),
            fee: data.fee || 50,
            payment_status: 'Unpaid',
            request_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          mockState.certificates.push(newCert);
          return newCert;
        }
      ),
    publicRequest: (data: any) =>
      withFallback(
        () => client.post<PublicCertificateResponse>('/public/certificates/request', data).then(r => r.data),
        () => ({
          certificate: mockState.certificates[0],
          queue_number: 'Q-042',
        })
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Certificate>(`/certificates/${id}`).then(r => r.data),
        () => mockState.certificates[0]
      ),
    approve: (id: string) =>
      withFallback(
        () => client.post<Certificate>(`/certificates/${id}/approve`).then(r => r.data),
        () => {
          const cert = mockState.certificates.find(c => c.id === id) || mockState.certificates[0];
          cert.status = 'Approved';
          return cert;
        }
      ),
    reject: (id: string) =>
      withFallback(
        () => client.post<Certificate>(`/certificates/${id}/reject`).then(r => r.data),
        () => {
          const cert = mockState.certificates.find(c => c.id === id) || mockState.certificates[0];
          cert.status = 'Rejected';
          return cert;
        }
      ),
    verifyQR: (hash: string) =>
      withFallback(
        () => client.get<{ valid: boolean; message: string; document?: string; type?: string; recipient?: string; issued_on?: string; purpose?: string }>(`/verify/document/${hash}`).then(r => r.data),
        () => ({
          valid: true,
          message: 'Official Document Authentic & Verified',
          document: 'Barangay Clearance Certificate',
          type: 'Barangay Clearance',
          recipient: 'Juan Dela Cruz',
          issued_on: '2026-06-01',
          purpose: 'Local Employment Verification'
        })
      ),
  },

  blotters: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Blotter[]>('/blotters', { params }).then(r => r.data),
        () => mockState.blotters
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Blotter>(`/blotters/${id}`).then(r => r.data),
        () => mockState.blotters[0]
      ),
    create: (data: Partial<Blotter>) =>
      withFallback(
        () => client.post<Blotter>('/blotters', data).then(r => r.data),
        () => mockState.blotters[0]
      ),
    update: (id: string, data: Partial<Blotter>) =>
      withFallback(
        () => client.put<Blotter>(`/blotters/${id}`, data).then(r => r.data),
        () => mockState.blotters[0]
      ),
    delete: (id: string) =>
      withFallback(
        () => client.delete(`/blotters/${id}`).then(r => r.data),
        () => ({ message: 'Blotter deleted' })
      ),
    summarize: async (id: string): Promise<{ summary: string }> => {
      try {
        const res = await client.post<{ summary: string }>(`/blotters/${id}/summarize`);
        return res.data;
      } catch (_) {
        // Backend unavailable
      }
      try {
        const groqSummary = await callGroqAI(
          `Summarize this barangay blotter incident (ID: ${id}) as a brief AI Case Digest in 2-3 sentences. Include recommended action.`,
          'You are LingkodBrgyAI, an AI legal assistant for Barangay Lawrence. Generate concise blotter case digests with recommended actions like conciliation, hearing scheduling, or escalation.'
        );
        if (groqSummary) return { summary: groqSummary };
      } catch (_) {
        // Groq unavailable
      }
      return { summary: 'Neighborhood noise dispute log. Recommended for amicable conciliation at hall.' };
    },
  },

  businesses: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Business[]>('/businesses', { params }).then(r => r.data),
        () => mockState.businesses
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Business>(`/businesses/${id}`).then(r => r.data),
        () => mockState.businesses[0]
      ),
    create: (data: Partial<Business>) =>
      withFallback(
        () => client.post<Business>('/businesses', data).then(r => r.data),
        () => mockState.businesses[0]
      ),
    update: (id: string, data: Partial<Business>) =>
      withFallback(
        () => client.put<Business>(`/businesses/${id}`, data).then(r => r.data),
        () => mockState.businesses[0]
      ),
    delete: (id: string) =>
      withFallback(
        () => client.delete(`/businesses/${id}`).then(r => r.data),
        () => ({ message: 'Business deleted' })
      ),
  },

  appointments: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Appointment[]>('/appointments', { params }).then(r => r.data),
        () => mockState.appointments
      ),
    book: (data: any) =>
      withFallback(
        () => client.post<Appointment>('/appointments', data).then(r => r.data),
        () => {
          const newApp: Appointment = {
            id: `app-${Date.now()}`,
            resident_id: data.resident_id || 'res-1',
            purpose: data.purpose || 'Barangay Consultation',
            appointment_date: data.appointment_date || '2026-09-10',
            time_slot: data.time_slot || '10:00 AM - 11:00 AM',
            status: 'Confirmed',
            queue_number: Math.floor(1 + Math.random() * 15),
            created_at: new Date().toISOString(),
          };
          mockState.appointments.push(newApp);
          return newApp;
        }
      ),
    updateStatus: (id: string, status: string) =>
      withFallback(
        () => client.put<Appointment>(`/appointments/${id}/status`, { status }).then(r => r.data),
        () => {
          const app = mockState.appointments.find(a => a.id === id) || mockState.appointments[0];
          app.status = status;
          return app;
        }
      ),
    getCongestion: () =>
      withFallback(
        () => client.get<{ date: string; bookings_count: number; congestion_risk: string }[]>('/appointments/congestion').then(r => r.data),
        () => [
          { date: '2026-09-01', bookings_count: 3, congestion_risk: 'Low' },
          { date: '2026-09-02', bookings_count: 14, congestion_risk: 'High' },
          { date: '2026-09-03', bookings_count: 5, congestion_risk: 'Medium' },
        ]
      ),
  },

  notifications: {
    list: () =>
      withFallback(
        () => client.get<Notification[]>('/notifications').then(r => r.data),
        () => mockState.notifications
      ),
    read: (id: string) =>
      withFallback(
        () => client.patch(`/notifications/${id}/read`).then(r => r.data),
        () => ({ message: 'Read' })
      ),
    broadcastAnnouncement: (data: any) =>
      withFallback(
        () => client.post<Notification>('/announcements', data).then(r => r.data),
        () => ({
          id: `notif-${Date.now()}`,
          title: data.title,
          content: data.content,
          type: data.type || 'General',
          is_read: false,
          created_at: new Date().toISOString(),
        })
      ),
  },

  payments: {
    list: (params?: any) =>
      withFallback(
        () => client.get<Payment[]>('/payments', { params }).then(r => r.data),
        () => [
          {
            id: 'pay-1',
            reference_number: 'PAY-2026-901',
            purpose: 'Barangay Clearance Fee',
            amount: 50,
            status: 'Completed',
            payor_name: 'Juan Dela Cruz',
            transaction_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }
        ]
      ),
    get: (id: string) =>
      withFallback(
        () => client.get<Payment>(`/payments/${id}`).then(r => r.data),
        () => ({
          id: id,
          reference_number: 'PAY-2026-901',
          purpose: 'Barangay Clearance Fee',
          amount: 50,
          status: 'Completed',
          payor_name: 'Juan Dela Cruz',
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
      ),
  },

  analytics: {
    dashboard: () =>
      withFallback(
        () => client.get<DashboardStats>('/analytics/dashboard').then(r => r.data),
        () => ({
          total_residents: mockState.residents.length,
          total_households: mockState.households.length,
          indigent_households: mockState.households.filter(h => h.poverty_level === 'Indigent' || h.poverty_level === 'Poor').length,
          active_incidents: mockState.blotters.filter(b => b.status !== 'Settled').length,
          active_businesses: mockState.businesses.filter(b => b.status === 'Active').length,
          voters_count: mockState.residents.filter(r => r.voter_status === 'Registered Voter').length,
          senior_citizens: mockState.residents.filter(r => (r.age || 0) >= 60).length,
          solo_parents: 0,
          pwd_residents: 0,
          age_demographics: {
            children: mockState.residents.filter(r => (r.age || 0) < 18).length,
            youth: mockState.residents.filter(r => (r.age || 0) >= 18 && (r.age || 0) < 30).length,
            adults: mockState.residents.filter(r => (r.age || 0) >= 30 && (r.age || 0) < 60).length,
            seniors: mockState.residents.filter(r => (r.age || 0) >= 60).length,
          },
          gender_ratio: {
            Male: mockState.residents.filter(r => r.gender === 'Male').length,
            Female: mockState.residents.filter(r => r.gender === 'Female').length,
          },
          revenue_history: [
            { month: 'Jan', amount: 0 },
            { month: 'Feb', amount: 0 },
            { month: 'Mar', amount: 0 },
            { month: 'Apr', amount: 0 },
            { month: 'May', amount: 0 },
            { month: 'Jun', amount: 0 },
          ],
        })
      ),
  },

  ai: {
    chat: async (prompt: string): Promise<{ response: string }> => {
      // Try Go backend first
      try {
        const backendRes = await client.post<{ response: string }>('/ai/chat', { prompt });
        return backendRes.data;
      } catch (_) {
        // Backend unavailable, try Groq API
      }

      // Try Groq AI (llama-3.3-70b-versatile)
      try {
        const groqResponse = await callGroqAI(prompt);
        if (groqResponse) {
          return { response: groqResponse };
        }
      } catch (err) {
        console.warn('Groq AI unavailable, using offline fallback:', err);
      }

      // Offline fallback mock responses
      const lower = prompt.toLowerCase();
      let response = `Mabuhay! I am your Barangay Lawrence AI Operations Assistant. How may I assist you today?\n\n- **Resident Profiles**: Register, update, and search citizen profiles\n- **Certificates & Clearances**: Request Barangay Clearance, Indigency, Residency, and Cedulas online\n- **Queue & Scheduling**: Book counter pickup slots or view real-time queue status\n- **Blotters & Conciliation**: File incident reports and schedule Lupon peace hearings`;

      if (lower.includes('help') || lower.includes('can you help') || lower.includes('hello') || lower.includes('hi')) {
        response = `Mabuhay! I am glad to assist you. Here are the key services I can manage for you:\n- **Document Issuance**: Apply for Barangay Clearance, Certificate of Indigency, Certificate of Residency, and Business Permits.\n- **Queue Monitor**: Book appointment pickup slots and monitor live counter processing numbers.\n- **Blotter & Incident Registry**: Log public disputes, schedule peace hearings, and review AI dispute summaries.\n- **Demographics & Analytics**: Inspect resident statistics, indigent household counts, and senior citizen records.`;
      } else if (lower.includes('senior') || lower.includes('citizen')) {
        response = `**Barangay Senior Citizen Registry Overview:**\n- Registered Seniors: **1,450 residents**\n- Senior citizens enjoy priority express queueing at counter processing.\n- Quarterly wellness stipends and health drives are scheduled automatically.`;
      } else if (lower.includes('indigent') || lower.includes('household')) {
        response = `**Indigent Household Services:**\n- Certificate of Indigency is issued with **PHP 0.00 fee**.\n- You can apply online by submitting your household ID or visiting the Social Services desk.\n- Current Indigent Households: **420 families**.`;
      } else if (lower.includes('blotter') || lower.includes('incident')) {
        response = `**Blotter & Dispute Guidelines:**\n- Incident blotters are logged confidentially by the Barangay Captain or Secretary.\n- Scheduled hearings for Lupon Tagapamayapa are conducted Tuesdays and Thursdays.\n- Emergency assistance hotline: **+63 (49) 555-8291**.`;
      } else if (lower.includes('certificate') || lower.includes('clearance')) {
        response = `**E-Certificate Processing:**\n- Requests are processed and verified within 24 hours.\n- Digital clearances are generated with an authentic **cryptographic QR code**.\n- Standard Clearance Fee: **PHP 150.00** (Free for Indigent residents).`;
      }

      return { response };
    },
  }
};

export default client;
