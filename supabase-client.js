/* ============================================================
   WARKOP KANG ASEP — supabase-client.js
   ============================================================
   File ini menghubungkan web ke database Supabase kamu.

   CARA ISI:
   1. Buka project di https://app.supabase.com
   2. Masuk ke menu "Settings" (ikon gear) → "API"
   3. Salin "Project URL" → tempel ke SUPABASE_URL di bawah
   4. Salin "anon public" key → tempel ke SUPABASE_ANON_KEY di bawah

   PENTING: anon key ini AMAN untuk ditaruh di kode publik (GitHub),
   karena akses data tetap dibatasi oleh aturan RLS yang sudah diatur
   di schema.sql (pengunjung cuma bisa baca menu & buat pesanan,
   tidak bisa baca/ubah data punya orang lain).
   ============================================================ */

const SUPABASE_URL      = 'https://zystguvxdukjcqdkrfoj.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3RndXZ4ZHVramNxZGtyZm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODEyNTgsImV4cCI6MjA5ODQ1NzI1OH0.G3DqhRjE_kSz4ZuuViCY3C33t9CGZf5QqsE58vCB2io';

// Inisialisasi client Supabase (butuh CDN supabase-js, sudah dimuat di HTML)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
