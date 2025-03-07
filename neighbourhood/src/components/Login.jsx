import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { auth } from '../firebaseConfig'; // Adjust the path
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../AuthContext.jsx'; // Import useAuth for authentication state
import { firestore } from '../firebaseConfig'; // Import firestore for role fetching
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

export default function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation
  const { user } = useAuth(); // Get user from AuthContext (optional for role checking)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      console.log('Attempting to log in with email:', formData.email);

      // Sign in user with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const firebaseUser = userCredential.user;
      console.log('User logged in with UID:', firebaseUser.uid);

      // Fetch user role from Firestore
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role || 'Resident'; // Default to 'Resident' if role not found
        console.log('User role:', userRole);

        // Redirect based on role
        if (userRole === 'Resident') {
          navigate('/resident-dashboard'); // Navigate to ResidentDashboard for residents
        } else if (userRole === 'Committee Member') {
          navigate('/home'); // Navigate to Home for committee members
        } else {
          throw new Error('Unknown user role. Please contact support.');
        }
      } else {
        throw new Error('User profile not found in Firestore. Please register or contact support.');
      }

      setSuccess('Logged in successfully!');
      setFormData({
        email: '',
        password: '',
      });

      if (setIsAuthenticated) {
        setIsAuthenticated(true); // Update authentication state
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 px-4 py-2 ${
                loading ? 'bg-gray-400' : 'bg-indigo-600'
              } text-white rounded-md hover:${
                loading ? '' : 'bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}