-- ============================================
-- 엔터테인먼트 스키마: 트로트 + 오늘의 영어
-- ============================================

-- 1. 트로트 플레이리스트
create table if not exists public.trot_playlist (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  youtube_id text not null,          -- YouTube 영상 ID
  thumbnail_url text,
  duration_seconds int,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_trot_active on public.trot_playlist(is_active, sort_order);

-- 2. 오늘의 한마디 영어
create table if not exists public.daily_english (
  id uuid primary key default gen_random_uuid(),
  day_number int not null unique,     -- 1, 2, 3... (순환 사용)
  english_text text not null,         -- "Good morning"
  korean_text text not null,          -- "좋은 아침이에요"
  pronunciation text not null,        -- "굿 모닝"
  example_sentence text,              -- "Good morning, how are you?"
  example_korean text,                -- "좋은 아침이에요, 어떠세요?"
  category text not null default '인사',  -- 인사, 감사, 일상, 건강
  created_at timestamptz not null default now()
);

create index if not exists idx_english_day on public.daily_english(day_number);

-- RLS 정책
alter table public.trot_playlist enable row level security;
alter table public.daily_english enable row level security;

create policy "Allow all for trot" on public.trot_playlist for all using (true) with check (true);
create policy "Allow all for english" on public.daily_english for all using (true) with check (true);

-- ============================================
-- 테스트 데이터: 트로트 10곡
-- ============================================
insert into public.trot_playlist (title, artist, youtube_id, sort_order) values
('천년바위',       '임영웅',  'SFHdsVSH4JQ', 1),
('나는 트로트가 좋다', '금잔디',  'QjPzdB-oFlQ', 2),
('사랑의 콜센타',    '임영웅',  '2a6sMPdCHiM', 3),
('바람길',         '송가인',  'RhQMbj-UfFE', 4),
('막걸리 한잔',     '영탁',   'UMd_LhPTmVo', 5),
('찐이야',         '영탁',   'k0sXAjmoDME', 6),
('보라빛 엽서',     '임영웅',  'WFpmMJOH9ps', 7),
('사랑은 늘 도망가', '임영웅',  'TlBCB1fTYoY', 8),
('꽃길',          '송가인',  'UWqxDBRgNgg', 9),
('합정역 5번 출구',  '박진도',  'v7dPsRwZ3DI', 10);

-- ============================================
-- 테스트 데이터: 오늘의 영어 30일분
-- ============================================
insert into public.daily_english (day_number, english_text, korean_text, pronunciation, example_sentence, example_korean, category) values
(1,  'Good morning',        '좋은 아침이에요',      '굿 모닝',         'Good morning, how are you?',          '좋은 아침이에요, 어떠세요?',       '인사'),
(2,  'Thank you',           '감사합니다',          '땡큐',           'Thank you very much.',               '정말 감사합니다.',              '감사'),
(3,  'How are you?',        '어떠세요?',           '하우 아 유?',      'How are you today?',                '오늘 어떠세요?',               '인사'),
(4,  'I am fine',           '저는 괜찮아요',        '아이 엠 파인',     'I am fine, thank you.',              '저는 괜찮아요, 감사합니다.',       '인사'),
(5,  'Good night',          '안녕히 주무세요',      '굿 나잇',         'Good night, sleep well.',            '안녕히 주무세요, 푹 쉬세요.',      '인사'),
(6,  'Please',             '부탁합니다',          '플리즈',          'Water, please.',                    '물 좀 주세요.',                '일상'),
(7,  'Excuse me',          '실례합니다',          '익스큐즈 미',      'Excuse me, where is the restroom?',  '실례합니다, 화장실이 어디예요?',    '일상'),
(8,  'I love you',          '사랑해요',           '아이 러브 유',     'I love you so much.',               '정말 많이 사랑해요.',            '감사'),
(9,  'Help me',            '도와주세요',          '헬프 미',         'Please help me.',                   '저를 도와주세요.',              '일상'),
(10, 'Yes / No',           '네 / 아니요',         '예스 / 노',       'Yes, I understand.',                '네, 알겠습니다.',              '일상'),
(11, 'Delicious',          '맛있어요',           '딜리셔스',        'This is delicious!',                '이거 맛있어요!',               '일상'),
(12, 'I am happy',          '행복해요',           '아이 엠 해피',     'I am happy today.',                 '오늘 행복해요.',               '일상'),
(13, 'Take care',          '몸 조심하세요',        '테이크 케어',      'Take care of yourself.',             '몸 조심하세요.',               '인사'),
(14, 'See you later',       '나중에 봐요',         '씨 유 레이터',     'See you later, bye!',               '나중에 봐요, 안녕!',            '인사'),
(15, 'I am sorry',          '죄송합니다',          '아이 엠 쏘리',     'I am sorry about that.',             '그것에 대해 죄송합니다.',         '일상'),
(16, 'Bless you',          '건강하세요',          '블레스 유',       'God bless you.',                    '건강하세요.',                  '건강'),
(17, 'I feel good',         '기분이 좋아요',        '아이 필 굿',      'I feel good this morning.',          '오늘 아침 기분이 좋아요.',        '건강'),
(18, 'Water please',        '물 주세요',           '워터 플리즈',      'Can I have water please?',           '물 좀 주시겠어요?',             '일상'),
(19, 'My name is',          '제 이름은',           '마이 네임 이즈',    'My name is Hong.',                  '제 이름은 홍입니다.',            '인사'),
(20, 'Nice to meet you',    '만나서 반가워요',      '나이스 투 밋 유',   'Nice to meet you too.',             '저도 만나서 반가워요.',           '인사'),
(21, 'I am hungry',         '배가 고파요',         '아이 엠 헝그리',    'I am hungry, let us eat.',           '배가 고파요, 먹어요.',           '일상'),
(22, 'Good job',           '잘 했어요',           '굿 잡',          'Good job, well done!',              '잘 했어요, 훌륭해요!',           '감사'),
(23, 'Have a nice day',     '좋은 하루 보내세요',    '해브 어 나이스 데이', 'Have a nice day today.',            '오늘 좋은 하루 보내세요.',        '인사'),
(24, 'I am tired',          '피곤해요',           '아이 엠 타이어드',   'I am tired, I need rest.',           '피곤해요, 쉬어야 해요.',         '건강'),
(25, 'Be careful',          '조심하세요',          '비 케어풀',       'Be careful on the road.',           '길에서 조심하세요.',             '일상'),
(26, 'Welcome',            '환영합니다',          '웰컴',           'Welcome to my home.',               '우리 집에 오신 것을 환영합니다.',   '인사'),
(27, 'Congratulations',     '축하합니다',          '컨그래츄레이션스',   'Congratulations on your birthday.',  '생일 축하합니다.',              '감사'),
(28, 'I understand',        '이해해요',           '아이 언더스탠드',    'I understand what you mean.',        '무슨 말인지 이해해요.',          '일상'),
(29, 'Stay healthy',        '건강하세요',          '스테이 헬시',      'Please stay healthy always.',        '항상 건강하세요.',              '건강'),
(30, 'You are the best',    '당신이 최고예요',      '유 아 더 베스트',   'You are the best grandpa!',         '할아버지가 최고예요!',           '감사');
