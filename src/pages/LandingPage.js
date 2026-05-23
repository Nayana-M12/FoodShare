import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Utensils, Volunteer } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-orange-50 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Reduce Food Waste, <span className="text-primary-600">Feed More Lives</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect food donors with NGOs and volunteers to eliminate food waste and support those in need. Join our community today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/register"
                  className="btn-primary flex items-center justify-center gap-2 text-lg"
                >
                  Donate Food
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/register"
                  className="btn-outline flex items-center justify-center gap-2 text-lg"
                >
                  Request Food
                </Link>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-12 shadow-xl">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Utensils className="text-primary-600" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Easy Donation</p>
                        <p className="text-sm text-gray-600">List food in minutes</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <Users className="text-secondary-600" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Community</p>
                        <p className="text-sm text-gray-600">Connect with NGOs</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Volunteer className="text-primary-600" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Volunteers</p>
                        <p className="text-sm text-gray-600">Fast delivery service</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Impact</h2>
            <p className="section-subtitle">Making a real difference in communities worldwide</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="card text-center">
              <div className="text-5xl font-bold text-primary-600 mb-3">50K+</div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Total Meals Donated</p>
              <p className="text-gray-600">Nutritious meals distributed to those in need</p>
            </div>

            {/* Stat 2 */}
            <div className="card text-center">
              <div className="text-5xl font-bold text-secondary-600 mb-3">250+</div>
              <p className="text-xl font-semibold text-gray-900 mb-2">NGOs Connected</p>
              <p className="text-gray-600">Partner organizations making a real impact</p>
            </div>

            {/* Stat 3 */}
            <div className="card text-center">
              <div className="text-5xl font-bold text-primary-600 mb-3">1.2K+</div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Active Volunteers</p>
              <p className="text-gray-600">Community members volunteering their time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple steps to make a difference</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Register as Donor/NGO/Volunteer</h3>
              <p className="text-gray-600">
                Create an account and choose your role. It takes just a few minutes to get started.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-secondary-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect & Collaborate</h3>
              <p className="text-gray-600">
                Donors list food items, NGOs request pickups, and volunteers deliver goods.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Make an Impact</h3>
              <p className="text-gray-600">
                Track your contributions and see how you're making a difference every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title">About FoodShare</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  FoodShare is a innovative platform dedicated to reducing food waste while supporting communities in need. We believe that no food should go to waste when there are people who need it.
                </p>
                <p>
                  Our mission is to create a sustainable ecosystem where donors, NGOs, and volunteers work together to ensure that surplus food reaches those who need it most, quickly and efficiently.
                </p>
                <p>
                  Since our launch, we've facilitated the donation of thousands of meals, connected hundreds of organizations, and empowered thousands of volunteers to make a real difference in their communities.
                </p>
              </div>
              <div className="mt-8">
                <Link to="/register" className="btn-primary">
                  Join Our Community Today
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-12 shadow-xl">
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-gray-900 mb-2">Environmental Impact</h4>
                  <p className="text-sm text-gray-600">Reducing food waste helps combat climate change and preserves natural resources.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-gray-900 mb-2">Social Impact</h4>
                  <p className="text-sm text-gray-600">We provide nutritious meals to those in food-insecure situations in our communities.</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-bold text-gray-900 mb-2">Community Engagement</h4>
                  <p className="text-sm text-gray-600">We foster a sense of community and shared responsibility among our members.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default LandingPage;
