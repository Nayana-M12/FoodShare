import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Leaf, Phone, MapPin } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    // Donor specific
    restaurantName: '',
    // NGO specific
    organizationName: '',
    registrationNumber: '',
    // Volunteer specific
    experience: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate registration
    navigate('/login');
  };

  const renderUserTypeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Choose Your Role</h3>
      
      {[
        {
          type: 'donor',
          title: 'I am a Food Donor',
          description: 'Restaurant, hotel, or food business',
          icon: '🍽️'
        },
        {
          type: 'ngo',
          title: 'I am an NGO',
          description: 'Non-profit organization',
          icon: '🤝'
        },
        {
          type: 'volunteer',
          title: 'I am a Volunteer',
          description: 'Help deliver food',
          icon: '👤'
        }
      ].map(option => (
        <button
          key={option.type}
          onClick={() => handleUserTypeSelect(option.type)}
          className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">{option.icon}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{option.title}</h4>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to role selection
        </button>
      </div>

      {/* Basic Information */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="input-field pl-12"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className="input-field pl-12"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className="input-field pl-12"
            required
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Street Name"
            className="input-field pl-12"
            required
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="New York"
          className="input-field"
          required
        />
      </div>

      {/* Role Specific Fields */}
      {userType === 'donor' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Restaurant Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant/Business Name</label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              placeholder="Your Restaurant Name"
              className="input-field"
              required
            />
          </div>
        </div>
      )}

      {userType === 'ngo' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Organization Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Organization Name"
              className="input-field"
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="Registration Number"
              className="input-field"
              required
            />
          </div>
        </div>
      )}

      {userType === 'volunteer' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Volunteer Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience with Food Delivery</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select experience level</option>
              <option value="none">No experience</option>
              <option value="some">Some experience</option>
              <option value="experienced">Very experienced</option>
            </select>
          </div>
        </div>
      )}

      {/* Password */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 mt-6">Security</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field pl-12"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field pl-12"
              required
            />
          </div>
        </div>
      </div>

      {/* Agree to Terms */}
      <div className="flex items-start gap-3 mt-6">
        <input type="checkbox" id="terms" className="w-4 h-4 text-primary-600 rounded mt-1" required />
        <label htmlFor="terms" className="text-sm text-gray-600">
          I agree to the <a href="#" className="text-primary-600 hover:text-primary-700">Terms & Conditions</a> and <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
        </label>
      </div>

      {/* Submit Button */}
      <button type="submit" className="w-full btn-primary text-center mt-6">
        Create Account
      </button>
    </form>
  );

  return (
    <>
      <Navbar hideAuthLinks={true} />
      
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 py-12 px-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FoodShare</span>
          </div>

          {step === 1 ? (
            renderUserTypeSelection()
          ) : (
            renderRegistrationForm()
          )}

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default RegisterPage;
