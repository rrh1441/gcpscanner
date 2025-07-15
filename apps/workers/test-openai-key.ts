console.log('OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
console.log('Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'NOT_FOUND');
