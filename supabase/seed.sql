-- 선택 사항: 초기 조 / 샘플 물건 데이터
-- Supabase SQL Editor 에서 실행하세요. (회원가입으로 조원이 생긴 뒤 조 편성)

insert into public.groups (name, cohort) values
  ('주중 1조', 'weekday'),
  ('주중 2조', 'weekday'),
  ('주말 1조', 'weekend'),
  ('주말 2조', 'weekend')
on conflict do nothing;

insert into public.properties (name, address, property_type, region, note) values
  ('헬리오시티', '서울 송파구 가락동', '아파트', '서울 송파', '대단지, 9510세대'),
  ('마포래미안푸르지오', '서울 마포구 아현동', '아파트', '서울 마포', '역세권, 학군'),
  ('광교 자연앤힐스테이트', '경기 수원시 영통구', '아파트', '경기 수원', '신도시 대장 단지')
on conflict do nothing;
