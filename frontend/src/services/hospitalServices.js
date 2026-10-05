import api from "./api";

export const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const res = await api.get("/dashboard/stats");
    return res.data;
  },
};

export const patientService = {
  getAll: async (params) => {
    const res = await api.get("/patients", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  create: async (patientData) => {
    const res = await api.post("/patients", patientData);
    return res.data;
  },
  update: async (id, patientData) => {
    const res = await api.put(`/patients/${id}`, patientData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/patients/${id}`);
    return res.data;
  },
};

export const departmentService = {
  getAll: async () => {
    const res = await api.get("/departments");
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/departments", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};

export const doctorService = {
  getAll: async (params) => {
    const res = await api.get("/doctors", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/doctors", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/doctors/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/doctors/${id}`);
    return res.data;
  },
};

export const appointmentService = {
  getAll: async (params) => {
    const res = await api.get("/appointments", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/appointments", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/appointments/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },
};

export const medicalRecordService = {
  getAll: async (params) => {
    const res = await api.get("/medical-records", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/medical-records/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/medical-records", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/medical-records/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/medical-records/${id}`);
    return res.data;
  },
};

export const prescriptionService = {
  getAll: async (params) => {
    const res = await api.get("/prescriptions", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/prescriptions/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/prescriptions", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/prescriptions/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/prescriptions/${id}`);
    return res.data;
  },
};

export const medicineService = {
  getAll: async (params) => {
    const res = await api.get("/medicines", { params });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get("/medicines/low-stock");
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/medicines", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/medicines/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/medicines/${id}`);
    return res.data;
  },
};

export const pharmacyService = {
  getAll: async (params) => {
    const res = await api.get("/pharmacy/dispensing", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/pharmacy/dispensing/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/pharmacy/dispensing", data);
    return res.data;
  },
};

export const labService = {
  getTests: async () => {
    const res = await api.get("/lab/tests");
    return res.data;
  },
  createTest: async (data) => {
    const res = await api.post("/lab/tests", data);
    return res.data;
  },
  getOrders: async (params) => {
    const res = await api.get("/lab/orders", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/lab/orders/${id}`);
    return res.data;
  },
  createOrder: async (data) => {
    const res = await api.post("/lab/orders", data);
    return res.data;
  },
  updateItemResult: async (itemId, data) => {
    const res = await api.put(`/lab/items/${itemId}/result`, data);
    return res.data;
  },
};

export const billingService = {
  getInvoices: async (params) => {
    const res = await api.get("/billing/invoices", { params });
    return res.data;
  },
  getInvoiceById: async (id) => {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },
  createInvoice: async (data) => {
    const res = await api.post("/billing/invoices", data);
    return res.data;
  },
  getPayments: async (params) => {
    const res = await api.get("/billing/payments", { params });
    return res.data;
  },
  recordPayment: async (data) => {
    const res = await api.post("/billing/payments", data);
    return res.data;
  },
};
