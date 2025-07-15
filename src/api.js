// API base URL
export const API_BASE_URL = "https://indusai-backend.onrender.com";

// --- Auth ---
export async function register({ username, password, role = "user", projects = [] }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role, projects }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function login({ username, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export async function googleLogin(id_token) {
  const res = await fetch(`${API_BASE_URL}/auth/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token }),
  });
  if (!res.ok) throw new Error("Google login failed");
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: "Bearer " + token } : {};
}

export function logout() {
  localStorage.removeItem("access_token");
}

// --- Projects ---
export async function createProject(projectData) {
  const res = await fetch(`${API_BASE_URL}/projects/`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  if (!res.ok) throw new Error("Create project failed");
  return res.json();
}

export async function assignUsersToProject(data) {
  const res = await fetch(`${API_BASE_URL}/projects/assign-users`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Assign users failed");
  return res.json();
}

export async function fetchMyProjects() {
  const res = await fetch(`${API_BASE_URL}/projects/mine`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Fetch projects failed");
  return res.json();
}

// --- Calls ---
export async function makeSingleCall(data) {
  const res = await fetch(`${API_BASE_URL}/call/single`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Single call failed");
  return res.json();
}

export async function makeBatchCall(data) {
  const res = await fetch(`${API_BASE_URL}/call/batch`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Batch call failed");
  return res.json();
}

export async function getCallIds() {
  const res = await fetch(`${API_BASE_URL}/call/get-call-ids`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Get call IDs failed");
  return res.json();
}

export async function getConversation(call_id) {
  const res = await fetch(`${API_BASE_URL}/call/get-conversation/${call_id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Get conversation failed");
  return res.json();
}

export async function addTestCall(data) {
  const res = await fetch(`${API_BASE_URL}/call/add-test-call`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Add test call failed");
  return res.json();
}

// --- Active Calls ---
export async function getCurrentActiveCall() {
  const res = await fetch(`${API_BASE_URL}/active-calls/current`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Get current active call failed");
  return res.json();
}

export async function deleteActiveCallById(call_id) {
  const res = await fetch(`${API_BASE_URL}/active-calls/${call_id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Delete active call by ID failed");
  return res.json();
}

export async function deleteActiveCallByRoom(room_name) {
  const res = await fetch(`${API_BASE_URL}/active-calls/room/${room_name}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Delete active call by room failed");
  return res.json();
}

export async function getActiveCallsCount() {
  const res = await fetch(`${API_BASE_URL}/active-calls/count`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Get active calls count failed");
  return res.json();
}

export async function cleanupActiveCalls() {
  const res = await fetch(`${API_BASE_URL}/active-calls/cleanup`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Cleanup active calls failed");
  return res.json();
}

// --- Transcripts ---
export async function getTranscripts(project_id) {
  const res = await fetch(`${API_BASE_URL}/transcripts/${project_id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Get transcripts failed");
  return res.json();
}

// --- Docs ---
export const swaggerDocsUrl = `${API_BASE_URL}/docs`;
export const redocUrl = `${API_BASE_URL}/redoc`;

// --- Admin ---
export async function grantAllProjectsToAdmins() {
  const res = await fetch(`${API_BASE_URL}/projects/admin/grant-all-projects`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Grant all projects to admins failed");
  return res.json();
} 