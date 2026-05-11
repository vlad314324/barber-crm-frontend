import React from 'react';
import { Settings as SettingsIcon, Store, Clock, CreditCard, Mail, Bell, Shield, User } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <SettingsIcon size={24} className="mr-2 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-600">Manage your barbershop preferences</p>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Store size={20} className="mr-2 text-indigo-600" />
            Business Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your barbershop details
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                name="business_name"
                id="business_name"
                defaultValue="Classic Cuts Barbershop"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                defaultValue="contact@classiccuts.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                name="phone"
                id="phone"
                defaultValue="(555) 123-4567"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="text"
                name="website"
                id="website"
                defaultValue="www.classiccuts.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                id="address"
                defaultValue="123 Main Street, Suite 101"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                id="city"
                defaultValue="New York"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
              <input
                type="text"
                name="zip"
                id="zip"
                defaultValue="10001"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Clock size={20} className="mr-2 text-indigo-600" />
            Business Hours
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Set your operating hours
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
              <div key={day} className="flex items-center justify-between">
                <div className="w-1/4 text-sm font-medium text-gray-700">{day}</div>
                <div className="w-3/4 flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id={`${day.toLowerCase()}_closed`}
                      name={`${day.toLowerCase()}_status`}
                      type="radio"
                      defaultChecked={index === 6}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor={`${day.toLowerCase()}_closed`} className="ml-2 block text-sm text-gray-700">
                      Closed
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id={`${day.toLowerCase()}_open`}
                      name={`${day.toLowerCase()}_status`}
                      type="radio"
                      defaultChecked={index !== 6}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor={`${day.toLowerCase()}_open`} className="ml-2 block text-sm text-gray-700">
                      Open
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      id={`${day.toLowerCase()}_start`}
                      name={`${day.toLowerCase()}_start`}
                      defaultValue="09:00"
                      disabled={index === 6}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <option key={`${hour}:00`} value={`${hour}:00`}>
                            {`${hour}:00`}
                          </option>
                        );
                      })}
                    </select>
                    <span>to</span>
                    <select
                      id={`${day.toLowerCase()}_end`}
                      name={`${day.toLowerCase()}_end`}
                      defaultValue="18:00"
                      disabled={index === 6}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <option key={`${hour}:00`} value={`${hour}:00`}>
                            {`${hour}:00`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Hours
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <CreditCard size={20} className="mr-2 text-indigo-600" />
              Payment Settings
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure payment methods
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {['Credit Card', 'Cash', 'Mobile Payment'].map((method) => (
                <div key={method} className="flex items-center">
                  <input
                    id={method.toLowerCase().replace(' ', '_')}
                    name="payment_methods"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={method.toLowerCase().replace(' ', '_')} className="ml-3 block text-sm font-medium text-gray-700">
                    {method}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Mail size={20} className="mr-2 text-indigo-600" />
              Notification Settings
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure notifications and reminders
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="appointment_reminders"
                    name="appointment_reminders"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="appointment_reminders" className="ml-3 block text-sm font-medium text-gray-700">
                    Appointment Reminders
                  </label>
                </div>
                <select
                  id="reminder_time"
                  name="reminder_time"
                  className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option>1 hour</option>
                  <option>3 hours</option>
                  <option selected>24 hours</option>
                  <option>2 days</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  id="new_appointment"
                  name="new_appointment"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="new_appointment" className="ml-3 block text-sm font-medium text-gray-700">
                  New Appointment Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="appointment_changes"
                  name="appointment_changes"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="appointment_changes" className="ml-3 block text-sm font-medium text-gray-700">
                  Appointment Changes
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="marketing_emails"
                  name="marketing_emails"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="marketing_emails" className="ml-3 block text-sm font-medium text-gray-700">
                  Marketing Emails
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* System settings */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Shield size={20} className="mr-2 text-indigo-600" />
            System Settings
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Advanced system configuration
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Data Backup</h4>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">Last backup: 2023-10-15 03:00 AM</p>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Backup Now
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900">Database Connection</h4>
              <div className="mt-2 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Connected
                </span>
                <span className="ml-2 text-sm text-gray-500">MongoDB: barbershop</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900">API Configuration</h4>
              <div className="mt-2">
                <label htmlFor="api_url" className="block text-sm font-medium text-gray-700">API URL</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="api_url"
                    id="api_url"
                    defaultValue="http://localhost:5000/api"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save System Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* Account settings */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <User size={20} className="mr-2 text-indigo-600" />
            Account Settings
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your user account
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                AM
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Admin Manager</h4>
                <p className="text-sm text-gray-500">admin@barbershop.com</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  id="current_password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
              </div>
              
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  id="new_password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  id="confirm_password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;