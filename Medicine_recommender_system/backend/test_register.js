const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRegister() {
  const form = new FormData();
  form.append('name', 'Doc Test');
  form.append('email', 'doctest@test.com');
  form.append('password', 'password123');
  form.append('role', 'doctor');
  form.append('license_number', '12345');
  form.append('license_issuing_authority', 'Auth');
  form.append('license_expiry_date', '2026-01-01');
  
  // create dummy files
  fs.writeFileSync('dummy.jpg', 'dummy image content');
  form.append('document', fs.createReadStream('dummy.jpg'));
  form.append('selfie', fs.createReadStream('dummy.jpg'));
  
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}

testRegister();
