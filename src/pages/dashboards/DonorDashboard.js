import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { createDonation, getDonations, getNgos } from '../../utils/api';
import NotificationsPanel from '../../components/NotificationsPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const getStoredUserInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem('foodshare_user') || '{}');
    return {
      donorId: user.donor_id || user.donorId || null,
      userId: user.id || user.user_id || user.userId || null,
    };
  } catch (error) {
    return { donorId: null, userId: null };
  }
};

const normalizeDonation = (donation) => {
  const rawStatus = donation.status || donation.donation_status || 'pending';
  const normalizedStatus = String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1).toLowerCase();

  return {
    id: donation.id || donation.donation_id || donation.food_donation_id || donation.ID,
    foodName: donation.foodName || donation.food_name || donation.item_name || donation.food_item || donation.title || 'Food Donation',
    quantity: donation.quantity || donation.qty || donation.amount || '',
    foodType: donation.foodType || donation.food_type || donation.category || '',
    expiryTime: donation.expiryTime || donation.expiry_time || donation.expiry || donation.expire_time || '',
    pickupAddress: donation.pickupAddress || donation.pickup_address || donation.address || '',
    status: normalizedStatus,
    date: donation.date || donation.created_at || donation.createdAt || '',
    volunteerName: donation.volunteerName || donation.volunteer_name || donation.assigned_volunteer || donation.assignedVolunteer || '',
  };
};

const DonorDashboard = ({ onLogout }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    foodType: '',
    expiryTime: '',
    pickupAddress: '',
    ngoId: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const { donorId, userId } = getStoredUserInfo();

  const {
    data: donationsData,
    isLoading,
    error: donationsError,
  } = useQuery({
    queryKey: ['donations', 'donor', donorId, userId],
    queryFn: () => getDonations({ donor_id: donorId, user_id: userId }),
    enabled: Boolean(donorId || userId),
    refetchInterval: 5000,
  });

  const { data: ngosData } = useQuery({
    queryKey: ['ngos'],
    queryFn: getNgos,
    staleTime: 5 * 60 * 1000,
  });

  const donations = useMemo(() => {
    const rows = donationsData?.data || [];
    return rows.map(normalizeDonation);
  }, [donationsData]);

  const ngoOptionsData = useMemo(() => ngosData?.data || [], [ngosData]);

  const ngoSelectDisabled = ngoOptionsData.length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const donorValue = donorId || userId;

    if (!donorValue) {
      setErrorMessage('Please login again to add donations.');
      return;
    }

    try {
      const payload = {
        donor_id: donorValue,
        ngo_id: formData.ngoId,
        food_name: formData.foodName,
        quantity: formData.quantity,
        food_type: formData.foodType,
        expiry_time: formData.expiryTime,
        pickup_address: formData.pickupAddress,
        status: 'pending',
        foodName: formData.foodName,
        foodType: formData.foodType,
        expiryTime: formData.expiryTime,
        pickupAddress: formData.pickupAddress,
        ngoId: formData.ngoId,
      };

      await createDonation(payload);
      toast.success('Donation submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['donations', 'donor', donorId, userId] });
      setFormData({
        foodName: '',
        quantity: '',
        foodType: '',
        expiryTime: '',
        pickupAddress: '',
        ngoId: '',
      });
      setShowForm(false);
    } catch (error) {
      const message = error.message || 'Failed to add donation.';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'badge-pending';
      case 'Approved':
        return 'badge-approved';
      case 'Picked Up':
        return 'badge-picked';
      case 'Delivered':
        return 'badge-delivered';
      default:
        return 'badge-pending';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userRole="donor" onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-md p-6 mt-16 lg:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your food donations</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <NotificationsPanel />
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Welcome, Food Donor! 👋</h2>
            <p className="text-primary-100 mb-4">
              Thank you for contributing to reduce food waste and feed those in need. Your donations make a real difference.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Total Donations</p>
                <p className="text-2xl font-bold">{donations.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Meals Shared</p>
                <p className="text-2xl font-bold">580+</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Lives Helped</p>
                <p className="text-2xl font-bold">145+</p>
              </div>
            </div>
          </div>

          {/* Add Donation Form */}
          {showForm ? (
            <div className="card mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add New Food Donation</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                {/* Food Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Name *</label>
                  <input
                    type="text"
                    name="foodName"
                    value={formData.foodName}
                    onChange={handleChange}
                    placeholder="e.g., Biryani & Rice"
                    className="input-field"
                    required
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="text"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 20 portions"
                    className="input-field"
                    required
                  />
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Type *</label>
                  <select
                    name="foodType"
                    value={formData.foodType}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select food type</option>
                    <option value="Cooked Food">Cooked Food</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Bakery Items">Bakery Items</option>
                    <option value="Packaged Food">Packaged Food</option>
                  </select>
                </div>

                {/* NGO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select NGO *</label>
                  <select
                    name="ngoId"
                    value={formData.ngoId}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={ngoSelectDisabled}
                  >
                    <option value="">
                      {ngoSelectDisabled ? 'No NGOs available' : 'Choose an NGO'}
                    </option>
                    {ngoOptionsData.map((ngo) => (
                      <option key={ngo.id} value={ngo.id}>
                        {ngo.name || `NGO ${ngo.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Time *</label>
                  <input
                    type="text"
                    name="expiryTime"
                    value={formData.expiryTime}
                    onChange={handleChange}
                    placeholder="e.g., 2 hours"
                    className="input-field"
                    required
                  />
                </div>

                {/* Pickup Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
                  <textarea
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                    placeholder="Full address with landmark"
                    className="input-field resize-none h-24"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex gap-4">
                  <button type="submit" className="btn-primary flex-1">
                    Submit Donation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 mb-8"
            >
              <Plus size={20} />
              Add New Donation
            </button>
          )}

          {/* Donation History */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Donation History</h3>

            {isLoading && (
              <div className="text-gray-600">Loading donations...</div>
            )}

            {(errorMessage || donationsError) && !isLoading && (
              <div className="text-sm text-red-600 mb-4">
                {errorMessage || donationsError?.message || 'Failed to load donations.'}
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Food Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Expiry</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Volunteer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-gray-900 font-medium">{donation.foodName}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.quantity}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.foodType}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.expiryTime}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.volunteerName || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={getStatusBadgeClass(donation.status)}>
                          {donation.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{donation.date}</td>
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
                      <p className="font-semibold text-gray-900">{donation.foodName}</p>
                      <p className="text-sm text-gray-600">{donation.quantity}</p>
                    </div>
                    <span className={getStatusBadgeClass(donation.status)}>
                      {donation.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Type:</strong> {donation.foodType}</p>
                    <p><strong>Expiry:</strong> {donation.expiryTime}</p>
                    <p><strong>Volunteer:</strong> {donation.volunteerName || '-'}</p>
                    <p><strong>Date:</strong> {donation.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
