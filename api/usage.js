// Derek OS Usage Tracker API
// Fetches Anthropic API usage data

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('Missing ANTHROPIC_API_KEY environment variable');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Try regular API first, fallback to Admin API if needed
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/usage', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });
    } catch (error) {
      console.log('Regular API failed, trying admin endpoint:', error.message);
      // If regular fails, try admin endpoint
      response = await fetch('https://api.anthropic.com/v1/admin/usage', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({ 
        error: `Anthropic API error: ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('Anthropic usage data:', JSON.stringify(data, null, 2));
    
    // Return the usage data
    return res.status(200).json(data);

  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}