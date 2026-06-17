-- 임장 희망 물건: 경공매 물건번호 컬럼 추가
alter table public.properties
  add column if not exists auction_no text;
