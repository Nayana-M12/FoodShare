import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import NotificationsPanel from '../../components/NotificationsPanel';
import {
  approveDonation,
  getAdminDashboard,
  getAdminDonations,
  getAdminUsers,
} from '../../utils/api';

const normalizeDonation = (donation) => ({
  id: donation.id || donation.donation_id || donation.food_donation_id || donation.ID,
  donor: donation.donor || donation.donor_name || donation.donorName || 'Donor',
  foodName: donation.foodName || donation.food_name || donation.item_name || donation.food_item || donation.title || 'Food Donation',
  quantity: donation.quantity || donation.qty || donation.amount || '',
  status: String(donation.status || donation.donation_status || 'Pending').toLowerCase() === 'accepted'
    ? 'Approved'
    : donation.status || donation.donation_status || 'Pending',
  date: donation.date || donation.created_at || donation.createdAt || '',
  contact: donation.contact || donation.phone || donation.contact_phone || '',
});

const normalizeUser = (user) => ({
  id: user.id || user.user_id || user.ID,
  name: user.name || user.full_name || user.username || 'User',
  email: user.email || user.username || '',
  role: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User',
  status: user.status || 'Active',
  joinDate: user.joinDate || user.created_at || user.createdAt || '',
});

const AdminDashboard = ({ onLogout }) => {
  const [donations, setDonations] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    activeDeliveries: 0,
    approvalRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [usersResponse, donationsResponse, dashboardResponse] = await Promise.all([
          getAdminUsers(),
          getAdminDonations(),
          getAdminDashboard(),
        ]);

        const usersData = (usersResponse.data || []).map(normalizeUser);
        // hide admin accounts from the users list in the UI
        const visibleUsers = usersData.filter(u => String(u.role || '').toLowerCase() !== 'admin');
        const donationData = (donationsResponse.data || []).map(normalizeDonation);
        const dashboard = dashboardResponse.data || {};

        setUsers(visibleUsers);
        setDonations(donationData);
        const approvedCount = dashboard.donationStatus
          ? dashboard.donationStatus.find((item) => String(item.status || '').toLowerCase() === 'approved')?.total || 0
          : 0;

        setStats({
          totalUsers: dashboard.users || usersData.length || 0,
          totalDonations: dashboard.food_donations || donationData.length || 0,
          activeDeliveries: dashboard.deliveries || 0,
          approvalRate: donationData.length
            ? Math.round((approvedCount / donationData.length) * 100)
            : 0,
        });
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load admin data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleApproveDonation = async (id) => {
    setErrorMessage('');

    try {
      await approveDonation(id, 'approved');
      setDonations(donations.map(d =>
        d.id === id ? { ...d, status: 'Approved' } : d
      ));
    } catch (error) {
      setErrorMessage(error.message || 'Failed to approve donation.');
    }
  };

  const handleRejectDonation = async (id) => {
    setErrorMessage('');

    try {
      await approveDonation(id, 'rejected');
      setDonations(donations.map(d =>
        d.id === id ? { ...d, status: 'Rejected' } : d
      ));
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reject donation.');
    }
  };

  const handleDeactivateUser = (id) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: 'Inactive' } : u
    ));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'badge-pending';
      case 'Approved':
        return 'badge-approved';
      case 'Rejected':
        return 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium';
      case 'Active':
        return 'badge-delivered';
      case 'Inactive':
        return 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium';
      default:
        return 'badge-pending';
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
    { label: 'Total Donations', value: stats.totalDonations, icon: TrendingUp, color: 'secondary' },
    { label: 'Active Deliveries', value: stats.activeDeliveries, icon: BarChart3, color: 'primary' },
    { label: 'Approval Rate', value: `${stats.approvalRate}%`, icon: CheckCircle, color: 'secondary' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userRole="admin" onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-md p-6 mt-16 lg:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage the platform, users, and donations</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <NotificationsPanel />
          {/* Statistics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const colorClass = stat.color === 'primary' ? 'text-primary-600 bg-primary-100' : 'text-secondary-600 bg-secondary-100';
              return (
                <div key={index} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${colorClass}`}>
                      <Icon size={28} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="space-y-8">
            {/* Donations Section */}
            <div id="donations" className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Manage Donations</h3>

              {isLoading && (
                <div className="text-gray-600 mb-4">Loading donations...</div>
              )}

              {errorMessage && !isLoading && (
                <div className="text-sm text-red-600 mb-4">{errorMessage}</div>
              )}

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Donor</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Food Item</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Quantity</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation) => (
                      <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{donation.donor}</p>
                            <p className="text-sm text-gray-600">{donation.contact}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900">{donation.foodName}</td>
                        <td className="py-4 px-4 text-gray-600">{donation.quantity}</td>
                        <td className="py-4 px-4">
                          <span className={getStatusBadgeClass(donation.status)}>
                            {donation.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{donation.date}</td>
                        <td className="py-4 px-4">
                          {donation.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveDonation(donation.id)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleRejectDonation(donation.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                          {donation.status !== 'Pending' && (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{donation.donor}</p>
                        <p className="text-xs text-gray-600">{donation.contact}</p>
                      </div>
                      <span className={getStatusBadgeClass(donation.status)}>
                        {donation.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p><strong>Item:</strong> {donation.foodName}</p>
                      <p><strong>Quantity:</strong> {donation.quantity}</p>
                      <p><strong>Date:</strong> {donation.date}</p>
                    </div>
                    {donation.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveDonation(donation.id)}
                          className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 font-medium text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectDonation(donation.id)}
                          className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Users Section */}
            <div id="users" className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h3>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Join Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-medium">{user.name}</td>
                        <td className="py-4 px-4 text-gray-600 text-sm">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={getStatusBadgeClass(user.status)}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">{user.joinDate}</td>
                        <td className="py-4 px-4">
                          {user.status === 'Active' && (
                            <button
                              onClick={() => handleDeactivateUser(user.id)}
                              className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              Deactivate
                            </button>
                          )}
                          {user.status === 'Inactive' && (
                            <span className="text-gray-600 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      <span className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p><strong>Role:</strong> {user.role}</p>
                      <p><strong>Join Date:</strong> {user.joinDate}</p>
                    </div>
                    {user.status === 'Active' && (
                      <button
                        onClick={() => handleDeactivateUser(user.id)}
                        className="w-full py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
