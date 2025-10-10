// Simple test script to check the API
const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Get all solar units
    console.log('Getting all solar units...');
    const response = await fetch('http://localhost:8002/api/solar-units');
    const data = await response.json();
    console.log('Solar units:', JSON.stringify(data, null, 2));
    
    // Extract userid from existing solar unit
    if (data.length > 0) {
      const existingUserid = data[0].userid;
      console.log('\nExisting userid:', existingUserid);
      
      // Try to create a new solar unit with this userid
      console.log('\nTrying to create new solar unit...');
      const createResponse = await fetch('http://localhost:8002/api/solar-units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber: "SU-TEST-001",
          installationDate: "2025-10-08",
          capacity: 5500,
          status: "ACTIVE",
          userid: existingUserid
        })
      });
      
      const createResult = await createResponse.json();
      console.log('Create response status:', createResponse.status);
      console.log('Create result:', JSON.stringify(createResult, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();