# Supabase 설정 가이드

프론트에서 Supabase를 쓰려면 아래를 한 번만 설정하면 됩니다.

---

## 1. config.js 값 넣기

- **SUPABASE_URL**: 대시보드 > Project Settings > API > Project URL
- **SUPABASE_ANON_KEY**: 같은 화면의 anon public key
- **ADMIN_PASSWORD**: 관리자 화면(admin.html) 로그인 비밀번호 (원하는 값으로 변경)

---

## 2. Storage 버킷 (서류 업로드용)

코드에서 사용하는 버킷 이름: **`reservation-files`**

- **Public bucket**으로 두면 업로드된 서류의 공개 URL을 DB에 저장하고, 관리자 화면에서 링크 클릭으로 바로 조회할 수 있습니다.
- **anon(비로그인) 사용자가 업로드(INSERT)** 할 수 있는 정책이 필요합니다. (예약 신청 시 서류 3개 업로드)
- 대시보드에서 버킷·정책을 이미 만들어 두셨다면 그대로 사용하시면 됩니다.

---

## 3. RLS (reservations 테이블)

예약 테이블에 RLS를 켜고, **익명(anon)으로 예약 INSERT**와 **전체 SELECT**(관리자 화면용)를 허용합니다.

```sql
-- RLS 활성화
alter table public.reservations enable row level security;

-- 누구나 예약 1건 추가 가능 (사용자 화면)
create policy "Allow anon insert"
on public.reservations for insert to anon
with check (true);

-- 조회는 모두 허용 (관리자 화면에서 anon key로 조회 가능, 실제 접근은 admin 비밀번호로 제한)
create policy "Allow anon select"
on public.reservations for select to anon
using (true);
```

나중에 관리자만 조회하도록 바꾸려면 Supabase Auth로 관리자 로그인 후, `auth.uid()`가 관리자일 때만 SELECT 허용하는 정책으로 교체하면 됩니다.

---

## 4. 테이블 컬럼 확인

`reservations` 테이블에 아래 컬럼이 있어야 합니다. 이름이 다르면 config나 코드의 컬럼명을 맞춰 주세요.

| 컬럼        | 타입         | 비고                    |
|------------|--------------|-------------------------|
| id         | uuid         | PK, 기본값 gen_random_uuid() |
| created_at | timestamptz  | 선택, 기본값 now()      |
| date       | date         | 예약일                  |
| time       | text         | 예: "08:30"             |
| company    | text         | 업체명                  |
| car1       | text         | 차량번호1               |
| car2       | text         | nullable                |
| material   | text         | 자재 정보               |
| contact    | text         | 연락처                  |
| people     | text         | 출입 인원               |
| file1_url  | text         | 서류 공개 URL (Storage 업로드 후 getPublicUrl) |
| file2_url  | text         | 동일                      |
| file3_url  | text         | 동일                      |
| status     | text         | '대기' / '승인' / '반려', 기본값 '대기' |

---

## 5. 로컬에서 확인

`config.js`에 URL과 anon key를 넣은 뒤, `index.html`을 브라우저에서 직접 열어서(또는 로컬 서버로) 날짜 선택 → 시간 슬롯 조회, 예약 제출이 되는지 확인하면 됩니다.  
서류 업로드 시 Storage 버킷 **`reservation-files`** 와 anon 업로드 정책이 없으면 업로드에서 에러가 나므로, 먼저 Storage 설정을 마치는 것이 좋습니다.

---

## 참고

Cursor에서 Supabase MCP로 연동해 두었다면, 대시보드/DB 조회는 MCP를 통해 할 수 있습니다. 이 코드베이스에서는 당신의 Supabase 프로젝트에 직접 접속해 버킷을 확인하는 기능은 없습니다.
