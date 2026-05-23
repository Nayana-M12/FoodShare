import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle, AlertCircle, Phone, User, Truck } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const VolunteerDashboard = ({ onLogout }) => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 1,
      foodName: 'Biryani & Rice',
      quantity: '20 portions',
      pickupLocation: 'Taj Restaurant, Main Street',
      pickupPhone: '+1 (555) 123-4567',
      deliveryLocation: 'Community Center, Oak Avenue',
      deliveryPhone: '+1 (555) 234-5678',
      contactPerson: 'Mr. Ahmed',
      status: 'Assigned',
      priority: 'High',
      pickedUp: false,
    },
    {
      id: 2,
      foodName: 'Fresh Vegetables',
      quantity: '50 kg',
      pickupLocation: 'Green Market, Park Road',
      pickupPhone: '+1 (555) 345-6789',
      deliveryLocation: 'Food Bank, Hope Street',
      deliveryPhone: '+1 (555) 456-7890',
      contactPerson: 'Ms. Sarah',
      status: 'In Transit',
      priority: 'Medium',
      pickedUp: true,
    },
  ]);

  const [completedDeliveries, setCompletedDeliveries] = useState([
    {
      id: 1,
      foodName: 'Prepared Meals',
      quantity: '30 servings',
      pickupLocation: 'Paradise Hotel',
      deliveryLocation: 'Shelter Home',
      completedTime: '2 hours ago',
      rating: 5,
    },
    {
      id: 2,
      foodName: 'Bread & Bakery',
      quantity: '100 pieces',
      pickupLocation: 'Sweet Bakery',
      deliveryLocation: 'Orphanage',
      completedTime: 'Yesterday at 5 PM',
      rating: 5,
    },
    {
      id: 3,
      foodName: 'Canned Goods',
      quantity: '200 items',
      pickupLocation: 'Metro Supermarket',
      deliveryLocation: 'Homeless Shelter',
      completedTime: '2 days ago',
      rating: 4,
    },
  ]);

  const handlePickUp = (id) => {
    setDeliveries(deliveries.map(d => 
      d.id === id ? { ...d, status: 'In Transit', pickedUp: true } : d
    ));
  };

  const handleCompleteDelivery = (id) => {
    const delivery = deliveries.find(d => d.id === id);
    setDeliveries(deliveries.filter(d => d.id !== id));
    setCompletedDeliveries([
      {
        id: delivery.id,
        foodName: delivery.foodName,
        quantity: delivery.quantity,
        pickupLocation: delivery.pickupLocation,
        deliveryLocation: delivery.deliveryLocation,
        completedTime: 'Just now',
        rating: 0,
      },
      ...completedDeliveries,
    ]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'text-blue-600';
      case 'In Transit':
        return 'text-orange-600';
      case 'Delivered':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userRole="volunteer" onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-md p-6 mt-16 lg:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your deliveries</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl text-white p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Thank you for volunteering! 🚚</h2>
            <p className="text-opacity-90 text-white mb-4">
              Your efforts help ensure food reaches those in need. You're making a real difference!
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Total Deliveries</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Active Deliveries</p>
                <p className="text-2xl font-bold">{deliveries.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                <p className="text-sm">Avg Rating</p>
                <p className="text-2xl font-bold">4.8⭐</p>
              </div>
            </div>
          </div>

          {/* Active Deliveries */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Active Deliveries</h3>
            <div className="space-y-6">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="card border-l-4 border-l-primary-500 hover:shadow-lg transition-all duration-300">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{delivery.foodName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{delivery.quantity}</p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(delivery.priority)}`}>
                        {delivery.priority} Priority
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(delivery.status)} bg-opacity-10`}>
                        {delivery.status === 'Assigned' && <AlertCircle size={16} />}
                        {delivery.status === 'In Transit' && <Truck size={16} />}
                        {delivery.status}
                      </span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Pickup Location */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="text-blue-600" size={18} />
                        Pickup Location
                      </h5>
                      <p className="text-gray-700 font-medium mb-1">{delivery.pickupLocation}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <a href={`tel:${delivery.pickupPhone}`} className="hover:text-blue-600">
                          {delivery.pickupPhone}
                        </a>
                      </div>
                    </div>

                    {/* Delivery Location */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="text-green-600" size={18} />
                        Delivery Location
                      </h5>
                      <p className="text-gray-700 font-medium mb-1">{delivery.deliveryLocation}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={14} />
                          <a href={`tel:${delivery.deliveryPhone}`} className="hover:text-green-600">
                            {delivery.deliveryPhone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={14} />
                          <span>{delivery.contactPerson}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    {!delivery.pickedUp ? (
                      <button
                        onClick={() => handlePickUp(delivery.id)}
                        className="btn-primary flex-1"
                      >
                        Mark as Picked Up
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteDelivery(delivery.id)}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Complete Delivery
                      </button>
                    )}
                    <button className="btn-outline flex-1">
                      Need Help?
                    </button>
                  </div>
                </div>
              ))}

              {deliveries.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg">No active deliveries at the moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Completed Deliveries */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Completed Deliveries</h3>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Food Item</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">From</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">To</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Completed</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {completedDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-gray-900 font-medium">{delivery.foodName}</td>
                      <td className="py-4 px-4 text-gray-600">{delivery.quantity}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{delivery.pickupLocation}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{delivery.deliveryLocation}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{delivery.completedTime}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < delivery.rating ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {completedDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="mb-3">
                    <p className="font-semibold text-gray-900">{delivery.foodName}</p>
                    <p className="text-sm text-gray-600">{delivery.quantity}</p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p><strong>From:</strong> {delivery.pickupLocation}</p>
                    <p><strong>To:</strong> {delivery.deliveryLocation}</p>
                    <p><strong>Completed:</strong> {delivery.completedTime}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < delivery.rating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
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

export default VolunteerDashboard;
