import { supabase } from '@/utils/supabase';
import { verifyToken } from '@/utils/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get state and code from query params
    const { state, code, token } = req.query;

    // Get stored state from cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const storedState = cookies.hackatime_state;

    // Verify state matches for security
    if (!state || !storedState || state !== storedState) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    // Clear the state cookie
    res.setHeader('Set-Cookie', 'hackatime_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    // Verify user token
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://hackatime.hackclub.com/api/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/hackatimeCallback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Get user's Hackatime projects
    const projectsResponse = await fetch(
      'https://hackatime.hackclub.com/api/v1/users/current/projects',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    if (!projectsResponse.ok) {
      throw new Error('Failed to fetch projects');
    }

    const projects = await projectsResponse.json();

    // Store projects in Supabase
    const { error: deleteError } = await supabase
      .from('hackatime_projects')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old projects:', deleteError);
    }

    // Insert new projects
    const { error: insertError } = await supabase
      .from('hackatime_projects')
      .insert(
        projects.map(project => ({
          user_id: user.id,
          project_id: project.id,
          name: project.name,
          duration: project.total_seconds,
          date: project.last_heartbeat,
          created_at: new Date().toISOString(),
        }))
      );

    if (insertError) {
      console.error('Error inserting projects:', insertError);
      throw new Error('Failed to save projects');
    }

    // Redirect back to the app
    res.redirect('/desktop');
  } catch (error) {
    console.error('Error in hackatimeCallback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 