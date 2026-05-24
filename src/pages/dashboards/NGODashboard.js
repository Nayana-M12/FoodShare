import React, { useState } from 'react';
import { Search, Filter, MapPin, Clock, Package, Utensils } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const NGODashboard = ({ onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [availableFoods, setAvailableFoods] = useState([
    {
      id: 1,
      foodName: 'Biryani & Rice',
      quantity: '20 portions',
      foodType: 'Cooked Food',
      expiryTime: '2 hours',
      donor: 'Taj Restaurant',
      location: '5 km away',
      posted: '30 minutes ago',
    },
    {
      id: 2,
      foodName: 'Fresh Vegetables',
      quantity: '50 kg',
      foodType: 'Fresh Produce',
      expiryTime: '5 days',
      donor: 'Green Market',
      location: '8 km away',
      posted: '2 hours ago',
    },
    {
      id: 3,
      foodName: 'Bread & Bakery',
      quantity: '100 pieces',
      foodType: 'Bakery Items',
      expiryTime: '1 day',
      donor: 'Sweet Bakery',
      location: '3 km away',
      posted: '45 minutes ago',
    },
    {
      id: 4,
      foodName: 'Canned Goods',
      quantity: '200 items',
      foodType: 'Packaged Food',
      expiryTime: '6 months',
      donor: 'Metro Supermarket',
      location: '12 km away',
      posted: '1 hour ago',
    },
  ]);

  const [requestedDonations, setRequestedDonations] = useState([
    {
      id: 1,
      foodName: 'Biryani & Rice',
      quantity: '20 portions',
      donor: 'Taj Restaurant',
      requestDate: '2024-05-20',
      deliveryStatus: 'Approved',
      eta: '2 hours',
    },
    {
      id: 2,
      foodName: 'Fresh Fruits',
      quantity: '50 kg',
      donor: 'Metro Store',
      requestDate: '2024-05-19',
      deliveryStatus: 'In Transit',
      eta: 'Arriving soon',
    },
    {
      id: 3,
      foodName: 'Prepared Meals',
      quantity: '30 servings',
      donor: 'Paradise Hotel',
      requestDate: '2024-05-18',
      deliveryStatus: 'Delivered',
      eta: 'Completed',
    },
  ]);

  const handleRequestPickup = (id) => {
    alert(`Pickup requested for food ID: ${id}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'badge-approved';
      case 'In Transit':
        return 'badge-picked';
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <div key={food.id} className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{food.foodName}</h4>
                      <p className="text-sm text-gray-600">{food.donor}</p>
                    </div>
                    <div className="bg-primary-100 text-primary-600 rounded-full px-3 py-1 text-xs font-semibold">
                      {food.foodType}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Package size={16} />
                      <span>{food.quantity}</span>
                    </div>
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
                    className="w-full btn-secondary"
                  >
                    Request Pickup
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
                      <td className="py-4 px-4">
                        <span className={getStatusBadgeClass(donation.deliveryStatus)}>
                          {donation.deliveryStatus}
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
                    <span className={getStatusBadgeClass(donation.deliveryStatus)}>
                      {donation.deliveryStatus}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Donor:</strong> {donation.donor}</p>
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
