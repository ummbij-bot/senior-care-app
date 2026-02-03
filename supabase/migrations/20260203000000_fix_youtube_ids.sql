-- ============================================
-- 트로트 플레이리스트 YouTube ID 수정
-- 기존 무효한 ID → 실제 유효한 영상 ID로 교체
-- ============================================

-- 기존 데이터 삭제
delete from public.trot_playlist;

-- 유효한 YouTube ID로 재삽입
insert into public.trot_playlist (title, artist, youtube_id, sort_order) values
('사랑은 늘 도망가',     '임영웅',  'LKQ-18LoFQk', 1),
('별빛 같은 나의 사랑아',  '임영웅',  'oQW9lY1ZAJA', 2),
('온기',              '임영웅',  '2WGc-5VdoGw', 3),
('다시 만날 수 있을까',   '임영웅',  'sHqFqWDviBg', 4),
('찐이야',            '영탁',   'dNUncvc6mcM', 5),
('막걸리 한잔',         '영탁',   'npXaoOA2yS0', 6),
('폼 미쳤다',          '영탁',   'cE65LD82Kkw', 7),
('서울의 달',          '송가인',  'Id9FpbKA40U', 8),
('엄마 아리랑',         '송가인',  'UAYfczwsgyA', 9),
('내 마음의 사진',       '송가인',  'SVfLMzQls-o', 10);
