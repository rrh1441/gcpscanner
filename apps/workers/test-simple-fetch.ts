#!/usr/bin/env tsx

async function testSimpleFetch() {
  console.log('Testing basic fetch...');
  
  try {
    const response = await fetch('https://www.google.com');
    console.log('Fetch succeeded! Status:', response.status);
  } catch (err) {
    console.log('Fetch failed:', err);
  }
}

testSimpleFetch();