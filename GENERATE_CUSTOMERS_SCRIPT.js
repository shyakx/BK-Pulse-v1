/**
 * Browser Console Script to Generate Customers
 * 
 * Copy and paste this entire script into your browser console (F12 → Console)
 * Make sure you're logged in as admin first!
 */

async function generateCustomers() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ Not logged in! Please login first.');
    return;
  }

  const API_URL = 'https://bk-pulse-v1.onrender.com/api/admin/customers/generate';
  const BATCH_SIZE = 10000; // Max per request
  const TOTAL_NEEDED = 169990; // To get to 170,000 total (10 existing + 169,990 new)
  
  let totalAdded = 0;
  let currentCount = 10; // Start with existing 10
  
  console.log('🚀 Starting customer generation...\n');
  console.log(`📊 Target: ${TOTAL_NEEDED.toLocaleString()} customers\n`);

  const generateBatch = async (batchNum, count) => {
    try {
      console.log(`⏳ Batch ${batchNum}: Generating ${count.toLocaleString()} customers...`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ count })
      });

      const data = await response.json();
      
      if (data.success) {
        totalAdded += data.added;
        currentCount = data.after;
        console.log(`✅ Batch ${batchNum} complete! Added: ${data.added.toLocaleString()}, Total now: ${currentCount.toLocaleString()}\n`);
        return true;
      } else {
        console.error(`❌ Batch ${batchNum} failed:`, data.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNum} error:`, error.message);
      return false;
    }
  };

  // Calculate number of batches needed
  const batchesNeeded = Math.ceil(TOTAL_NEEDED / BATCH_SIZE);
  console.log(`📦 Will run ${batchesNeeded} batches of ${BATCH_SIZE.toLocaleString()} each\n`);

  // Generate in batches with delays to avoid overwhelming the server
  for (let i = 0; i < batchesNeeded; i++) {
    const remaining = TOTAL_NEEDED - totalAdded;
    const batchCount = Math.min(BATCH_SIZE, remaining);
    
    if (batchCount <= 0) break;
    
    const success = await generateBatch(i + 1, batchCount);
    
    if (!success) {
      console.error(`\n❌ Stopping due to error. Progress: ${totalAdded.toLocaleString()}/${TOTAL_NEEDED.toLocaleString()}`);
      break;
    }
    
    // Wait 2 seconds between batches to avoid rate limiting
    if (i < batchesNeeded - 1) {
      console.log('⏸️  Waiting 2 seconds before next batch...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n🎉 Customer generation complete!');
  console.log(`📊 Total added: ${totalAdded.toLocaleString()}`);
  console.log(`📊 Final count: ${currentCount.toLocaleString()}\n`);
  console.log('💡 Refresh your dashboard to see the updated count!');
}

// Run it
generateCustomers();

