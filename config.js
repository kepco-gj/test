/**
 * Supabase 연동 설정
 * - Supabase 대시보드 > Project Settings > API 에서 URL과 anon key 확인
 * - Storage 버킷 이름: 대시보드 > Storage 에서 만든 버킷 이름과 정확히 일치해야 함 (관리자 서류 클릭 시 404 방지)
 */
const SUPABASE_URL = 'https://fiszfkvghlhclfzoybsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc3pma3ZnaGxoY2xmem95YnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjIzMDIsImV4cCI6MjA4ODMzODMwMn0.CFOOvoPJgzefRRs8C6T8df74gaiU1t6ziwU5YQb8puc';
const STORAGE_BUCKET = 'reservation-files';  // Storage 버킷 이름 (대시보드와 동일하게)
if (typeof window !== 'undefined') window.STORAGE_BUCKET = STORAGE_BUCKET;
const ADMIN_PASSWORD = 'kepco123456/';  // 관리자 화면 접속 비밀번호 (필요 시 변경)
