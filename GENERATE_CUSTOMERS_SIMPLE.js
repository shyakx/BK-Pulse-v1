/**
 * SIMPLE VERSION - Generate 10,000 customers at a time
 * 
 * Run this once, wait for it to complete, then run it again.
 * Repeat until you have 170,000 customers.
 * 
 * Copy this into browser console:
 */

fetch('https://bk-pulse-v1.onrender.com/api/admin/customers/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ count: 10000 })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Result:', data);
  if (data.success) {
    console.log(`📊 Total customers now: ${data.after.toLocaleString()}`);
    console.log('💡 Run this script again to add more customers!');
  }
})
.catch(err => console.error('❌ Error:', err));

