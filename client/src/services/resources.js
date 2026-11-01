import { api } from './api.js';

const data = (promise) => promise.then((res) => res?.data);

export const metaApi = {
  get: () => data(api.get('/meta')),
  personas: () => data(api.get('/demo/personas')),
  health: () => api.get('/health'),
};

export const dashboardApi = {
  summary: (params, options) => data(api.get('/dashboard/summary', { params, ...options })),
  analytics: (params, options) => data(api.get('/dashboard/training-analytics', { params, ...options })),
  alerts: (params, options) => data(api.get('/dashboard/alerts', { params, ...options })),
};

export const employeesApi = {
  list: (params, options) => api.get('/employees', { params, ...options }),
  get: (id) => data(api.get(`/employees/${id}`)),
  create: (body) => data(api.post('/employees', body)),
  update: (id, body) => data(api.patch(`/employees/${id}`, body)),
  remove: (id) => api.delete(`/employees/${id}`),
};

export const competenciesApi = {
  list: (params) => data(api.get('/competencies', { params })),
  matrix: (params) => data(api.get('/competencies/matrix', { params })),
  create: (body) => data(api.post('/competencies', body)),
  update: (id, body) => data(api.patch(`/competencies/${id}`, body)),
  forEmployee: (employeeId) => data(api.get(`/employee-competencies/${employeeId}`)),
  assess: (employeeId, assessments) => data(api.put(`/employee-competencies/${employeeId}`, { assessments })),
};

export const skillsApi = {
  gaps: (params, options) => api.get('/skills/gaps', { params, ...options }),
};

export const trainingsApi = {
  list: (params, options) => api.get('/trainings', { params, ...options }),
  get: (id) => data(api.get(`/trainings/${id}`)),
  create: (body) => data(api.post('/trainings', body)),
  update: (id, body) => data(api.patch(`/trainings/${id}`, body)),
  remove: (id) => api.delete(`/trainings/${id}`),
};

export const enrollmentsApi = {
  list: (params, options) => api.get('/enrollments', { params, ...options }),
  create: (body) => api.post('/enrollments', body),
  updateProgress: (id, body) => data(api.patch(`/enrollments/${id}/progress`, body)),
  update: (id, body) => data(api.patch(`/enrollments/${id}`, body)),
  remove: (id) => api.delete(`/enrollments/${id}`),
};

export const careerApi = {
  paths: () => data(api.get('/career-paths')),
  plans: (params) => data(api.get('/career-plans', { params })),
  create: (body) => data(api.post('/career-plans', body)),
  update: (id, body) => data(api.patch(`/career-plans/${id}`, body)),
  updateGoal: (id, goalId, status) => data(api.patch(`/career-plans/${id}/goals/${goalId}`, { status })),
};
