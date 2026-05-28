import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Leaf, Eye, EyeOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { login as loginRequest } from '../../utils/api';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('donor');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await loginRequest({
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });

      const user = response.user || {};
      const normalizedUser = {
        ...user,
        role: user.role || selectedRole,
      };
      localStorage.setItem('foodshare_user', JSON.stringify(normalizedUser));

      onLogin(normalizedUser.role);

      const dashboardMap = {
        donor: '/donor-dashboard',
        ngo: '/ngo-dashboard',
        volunteer: '/volunteer-dashboard',
        admin: '/admin-dashboard'
      };

      navigate(dashboardMap[normalizedUser.role]);
    } catch (error) {
      setErrorMessage(error.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar hideAuthLinks={true} />
      
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center py-12 px-4">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FoodShare</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Login As</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'donor', label: 'Donor' },
                  { value: 'ngo', label: 'NGO' },
                  { value: 'volunteer', label: 'Volunteer' },
                  { value: 'admin', label: 'Admin' },
                ].map(role => (
                  <label key={role.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="w-full btn-primary text-center" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 text-sm text-red-600 text-center">
              {errorMessage}
            </div>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Sign up
            </Link>
          </p>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default LoginPage;
