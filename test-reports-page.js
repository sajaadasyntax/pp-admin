// This script is meant to be run in the browser console on the admin panel's reports page
// It tests the API call to fetch reports

// Function to get a token (either from context or cookies)
function getToken() {
  // Try to get token from cookies first
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  
  if (cookieToken) {
    console.log('Found token in cookies');
    return cookieToken;
  }
  
  console.log('No token found in cookies');
  return null;
}

// Function to test the reports endpoint directly
async function testReportsEndpoint() {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available, cannot test reports endpoint');
      return;
    }
    
    console.log('Testing reports endpoint with token:', token);
    
    const response = await fetch('http://localhost:5000/api/content/reports', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const status = response.status;
    console.log('Response status:', status);
    
    if (status === 200) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing reports endpoint:', error);
  }
}

// Run the test
testReportsEndpoint();
