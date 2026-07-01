const SUPABASE_URL      = 'https://zystguvxdukjcqdkrfoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3RndXZ4ZHVramNxZGtyZm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODEyNTgsImV4cCI6MjA5ODQ1NzI1OH0.G3DqhRjE_kSz4ZuuViCY3C33t9CGZf5QqsE58vCB2io';

// Inisialisasi client Supabase (butuh CDN supabase-js, sudah dimuat di HTML)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
