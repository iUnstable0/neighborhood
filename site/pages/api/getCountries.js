export default async function handler(req, res) {
  try {
    // Fetch airports data from mwgg/Airports
    const response = await fetch(
      'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch airports data');
    }

    const data = await response.json();
    
    // Get unique countries
    const uniqueCountries = [...new Set(
      Object.values(data)
        .map(airport => airport.country)
        .filter(country => country) // Remove any null/undefined values
    )];

    // Sort countries with US first, then alphabetically
    const countries = uniqueCountries.sort((a, b) => {
      if (a === 'US') return -1;
      if (b === 'US') return 1;
      return a.localeCompare(b);
    });

    res.status(200).json({ countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
} 