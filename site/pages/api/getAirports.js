export default async function handler(req, res) {
  const { country } = req.query;
  
  if (!country) {
    return res.status(400).json({ error: 'Country code is required' });
  }

  try {
    // Fetch airports data from mwgg/Airports
    const response = await fetch(
      'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch airports data');
    }

    const data = await response.json();
    
    // Convert the object to an array and filter by country
    const airports = Object.values(data)
      .filter(airport => 
        airport.country === country && // Filter by country
        airport.iata && // Must have IATA code
        airport.name // Must have name
      )
      .map(airport => ({
        code: airport.iata,
        name: airport.name,
        city: airport.city || airport.name.split(' ')[0] // Use first word of name if city is not available
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    res.status(200).json({ airports });
  } catch (error) {
    console.error('Error fetching airports:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
} 