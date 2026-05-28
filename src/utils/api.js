const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Request failed.';
    throw new Error(message);
  }

  return data;
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addDonation(payload) {
  return request('/donor/add-donation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createDonation(payload) {
  return request('/donations/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getDonorDonations(donorId) {
  const query = donorId ? `?donor_id=${encodeURIComponent(donorId)}` : '';
  return request(`/donor/view-donations${query}`);
}

export function getDonations(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return request(`/donations${query ? `?${query}` : ''}`);
}

export function getAvailableFood(ngoId) {
  const query = ngoId ? `?ngo_id=${encodeURIComponent(ngoId)}` : '';
  return request(`/ngo/available-food${query}`);
}

export function getNgos() {
  return request('/ngo/list');
}

export function requestPickup(payload) {
  return request('/ngo/request-pickup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function approveDonationRequest(donationId, payload = {}) {
  return request(`/donations/${donationId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function assignVolunteerToDonation(donationId, payload) {
  return request(`/donations/${donationId}/assign-volunteer`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function markDonationDelivered(donationId) {
  return request(`/donations/${donationId}/delivered`, {
    method: 'PUT',
  });
}

export function getNgoRequests(ngoId) {
  const query = ngoId ? `?ngo_id=${encodeURIComponent(ngoId)}` : '';
  return request(`/ngo/my-requests${query}`);
}

export function getVolunteerDeliveries(volunteerId) {
  const query = volunteerId ? `?volunteer_id=${encodeURIComponent(volunteerId)}` : '';
  return request(`/volunteer/deliveries${query}`);
}

export function updateDeliveryStatus(deliveryId, status) {
  return request(`/volunteer/update-status/${deliveryId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function getAdminUsers() {
  return request('/admin/users');
}

export function getAdminDashboard() {
  return request('/admin/dashboard');
}

export function getAdminDonations() {
  return request('/admin/donations');
}

export function approveDonation(donationId, status) {
  return request(`/admin/approve-donation/${donationId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function assignVolunteer(payload) {
  return request('/admin/assign-volunteer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getNotifications(userId) {
  return request(`/notifications/${userId}`);
}

export function markNotificationRead(notificationId) {
  return request(`/notifications/read/${notificationId}`, {
    method: 'PUT',
  });
}

export function addFeedback(payload) {
  return request('/feedback/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { API_BASE_URL };
