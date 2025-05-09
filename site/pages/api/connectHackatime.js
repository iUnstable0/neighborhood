import { supabase } from '@/utils/supabase';
import { verifyToken } from '@/utils/auth';

export default async function handler(req, res) {
  // Redirect to Hackatime OAuth page
  const HACKATIME_AUTH_URL = 'https://hackatime.hackclub.com/auth';
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/hackatimeCallback`;
  
  // Generate a random state for security
  const state = Math.random().toString(36).substring(7);
  
  // Store state in cookie for verification in callback
  res.setHeader('Set-Cookie', `hackatime_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
  
  // Construct OAuth URL
  const authUrl = `${HACKATIME_AUTH_URL}?redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  
  // Redirect to Hackatime auth page
  res.redirect(authUrl);
} 