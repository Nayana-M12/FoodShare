import React, { useMemo, useState } from 'react';
import { Search, Filter, MapPin, Clock, Package, Utensils, User } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import NotificationsPanel from '../../components/NotificationsPanel';
import {
  approveDonationRequest,
  getDonations,
} from '../../utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('foodshare_user') || '{}');
    return user.ngo_id || user.ngoId || user.id || user.user_id || user.userId || null;
  } catch (error) {
    return null;
  }
};

const normalizeDonation = (donation) => {
  const rawStatus = donation.status || donation.donation_status || donation.delivery_status || 'pending';
  const normalizedStatus = String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1).toLowerCase();

  return {
    id: donation.id || donation.donation_id || donation.food_donation_id || donation.ID,
    foodName: donation.foodName || donation.food_name || donation.item_name || donation.food_item || donation.title || 'Food Donation',
    quantity: donation.quantity || donation.qty || donation.amount || '',
    foodType: donation.foodType || donation.food_type || donation.category || 'Cooked Food',
    expiryTime: donation.expiryTime || donation.expiry_time || donation.expiry || donation.expire_time || '',
    donor: donation.donor || donation.donor_name || donation.donorName || 'Donor',
    location: donation.location || donation.pickup_address || donation.pickupAddress || 'Pickup location',
    posted: donation.posted || donation.created_at || donation.createdAt || 'Recently',
    volunteerName: donation.volunteerName || donation.volunteer_name || donation.assigned_volunteer || donation.assignedVolunteer || donation.volunteer_name || '',
    status: normalizedStatus,
    requestDate: donation.requestDate || donation.request_date || donation.created_at || donation.createdAt || donation.ngo_accepted_at || '',
    eta: donation.eta || donation.estimated_time || 'Pending',
  };
};

const uniqueFoodsById = (foods) => {
  const seen = new Set();

  return foods.filter((food) => {
    const id = food.id ? String(food.id).trim() : '';
    const fallbackKey = [
      food.foodName,
      food.donor,
      food.location,
      food.quantity,
      food.expiryTime,
      food.posted,
    ]
      .filter(Boolean)
      .join('|')
      .toLowerCase();

    const key = id || fallbackKey;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const NGODashboard = ({ onLogout }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const ngoId = getStoredUserId();

  const {
    data: donationsData,
    isLoading,
    error: donationsError,
  } = useQuery({
    queryKey: ['donations', 'ngo', ngoId],
    queryFn: () => getDonations({ ngo_id: ngoId }),
    enabled: Boolean(ngoId),
    refetchInterval: 5000,
  });

  const donations = useMemo(() => {
    const rows = donationsData?.data || [];
    return rows.map(normalizeDonation);
  }, [donationsData]);

  const availableFoods = useMemo(() => {
    const eligible = donations.filter((donation) => ['Pending', 'Approved'].includes(donation.status));
    return uniqueFoodsById(eligible);
  }, [donations]);

  const requestedDonations = useMemo(() => {
    return donations.filter((donation) => ['Approved', 'Delivered'].includes(donation.status));
  }, [donations]);

  const handleRequestPickup = async (id) => {
    setErrorMessage('');
    if (!ngoId) {
      const message = 'Please login again to accept pickup.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      const response = await approveDonationRequest(id, { ngo_id: ngoId });
      const message = response.message || 'Pickup approved.';
      if (message.toLowerCase().includes('no volunteer')) {
        toast.error(message);
      } else {
        toast.success(message);
      }
      queryClient.invalidateQueries({ queryKey: ['donations', 'ngo', ngoId] });
    } catch (error) {
      const message = error.message || 'Failed to approve pickup.';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'badge-approved';
      case 'Delivered':
        return 'badge-delivered';
      default:
        return 'badge-pending';
    }
  };

  const filteredFoods = availableFoods.filter(food => {
    const matchesSearch = food.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         food.donor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || food.foodType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userRole="ngo" onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-md p-6 mt-16 lg:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600 mt-1">Browse and request food donations</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <NotificationsPanel />
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Welcome to FoodShare NGO Portal! 🤝</h2>
            <p className="text-primary-100">
              Find surplus food from donors in your area and request pickups for your community.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="card mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Find Available Food</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by food name or donor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field pl-12 cursor-pointer"
                >
                  <option value="all">All Food Types</option>
                  <option value="Cooked Food">Cooked Food</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Bakery Items">Bakery Items</option>
                  <option value="Packaged Food">Packaged Food</option>
                </select>
              </div>
            </div>
          </div>

          {/* Available Foods Grid */}
          <div id="foodGrid" className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Donations</h3>

            {isLoading && (
              <div className="text-gray-600 mb-4">Loading available food...</div>
            )}

            {(errorMessage || donationsError) && !isLoading && (
              <div className="text-sm text-red-600 mb-4">
                {errorMessage || donationsError?.message || 'Failed to load NGO data.'}
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <div key={food.id} className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{food.foodName}</h4>
                      <p className="text-sm text-gray-600">{food.donor}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-primary-100 text-primary-600 rounded-full px-3 py-1 text-xs font-semibold">
                        {food.foodType}
                      </span>
                      <span className={getStatusBadgeClass(food.status)}>
                        {food.status}
                      </span>
                      {food.status === 'Approved' && !food.volunteerName && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          Volunteers are busy
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Package size={16} />
                      <span>{food.quantity}</span>
                    </div>
                    {food.volunteerName && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <User size={16} />
                        <span>Volunteer: {food.volunteerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Clock size={16} />
                      <span>Expires in {food.expiryTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>{food.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">Posted {food.posted}</p>

                  <button
                    onClick={() => handleRequestPickup(food.id)}
                    className={`w-full btn-secondary ${food.status !== 'Pending' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={food.status !== 'Pending'}
                  >
                    {food.status === 'Pending' ? 'Accept Pickup' : 'Accepted'}
                  </button>
                </div>
              ))}
            </div>

            {filteredFoods.length === 0 && (
              <div className="text-center py-12">
                <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No food donations matching your search</p>
              </div>
            )}
          </div>

          {/* Requested Donations */}
          <div id="requestedDonations" className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Requested Donations</h3>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Food Item</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Donor</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Volunteer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">ETA</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requestedDonations.map((donation) => (
                    <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-gray-900 font-medium">{donation.foodName}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.quantity}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.donor}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.volunteerName || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={getStatusBadgeClass(donation.status)}>
                          {donation.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{donation.eta}</td>
                      <td className="py-4 px-4 text-gray-600">{donation.requestDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {requestedDonations.map((donation) => (
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
                    <p><strong>Donor:</strong> {donation.donor}</p>
                    <p><strong>Volunteer:</strong> {donation.volunteerName || '-'}</p>
                    <p><strong>ETA:</strong> {donation.eta}</p>
                    <p><strong>Date:</strong> {donation.requestDate}</p>
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

export default NGODashboard;
