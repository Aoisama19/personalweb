import { useState } from 'react';
import Head from 'next/head';

export default function LoginTest() {
  const [email, setEmail] = useState('faizaniqbal917@gmail.com');
  const [password, setPassword] = useState('babypro321');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('netlify-direct');

  const endpoints = {
    'netlify-direct': '/.netlify/functions/login-test',
    'netlify-api': '/.netlify/functions/api/users/login',
    'netlify-no-api': '/.netlify/functions/api/login',
    'direct-api': '/api/users/login',
    'direct-no-api': '/users/login'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const endpoint = endpoints[selectedEndpoint];
    console.log(`Attempting login with endpoint: ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        setResult({
          success: true,
          status: response.status,
          data
        });

        // Store token if available
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token saved to localStorage');
        }
      } else {
        setResult({
          success: false,
          status: response.status,
          data
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Login Test</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Login Test Page</h1>
      <p className="mb-4">This page tests different login endpoints to diagnose authentication issues.</p>

      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded">
        <div className="mb-4">
          <label className="block mb-2">Endpoint:</label>
          <select 
            value={selectedEndpoint} 
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Object.keys(endpoints).map(key => (
              <option key={key} value={key}>
                {key} ({endpoints[key]})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`p-4 mb-4 ${result.success ? 'bg-green-100 border-green-500 text-green-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'} border-l-4`}>
          <p className="font-bold">Result: {result.success ? 'Success' : 'Failed'}</p>
          <p>Status: {result.status}</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-bold mb-2">Debug Information</h2>
        <p><strong>Current Endpoint:</strong> {endpoints[selectedEndpoint]}</p>
        <p><strong>Token in localStorage:</strong> {localStorage.getItem('token') ? 'Yes (exists)' : 'No'}</p>
      </div>
    </div>
  );
}
