const mysql = require('mysql');
require('dotenv').config({ path: '.env.local' });

// MySQL 연결
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 새로운 일기 데이터
const newDiaries = [
  {
    user_id: 1,
    title: '8월 11일 (월요일)',
    content: '오늘은 아기가 혼자 뒤집은 뒤 장난감을 잡으려고 손을 뻗었다. 아직은 손끝이 서툴지만, 의지가 보여서 대견하다. "바바바" 옹알이를 하길래 따라 해주니 까르르 웃었다. 점점 소통이 되는 기분이다.',
    mood: 'happy',
    date: '2025-08-11'
  },
  {
    user_id: 1,
    title: '8월 12일 (화요일)',
    content: '낮잠에서 깬 아기가 혼자 웃음을 터뜨렸다. 다리를 번쩍 들고 발끝을 잡으려는 모습이 너무 귀엽다. 수유할 때 내 눈을 똑바로 바라보는데, 눈빛 속 교감이 깊어졌다.',
    mood: 'excited',
    date: '2025-08-12'
  },
  {
    user_id: 1,
    title: '8월 13일 (수요일)',
    content: '잠깐 혼자 앉으려는 시도를 했다. 금세 휘청거리며 넘어지지만 조금씩 균형을 잡는다. 오늘은 이유식을 두세 숟갈 먹었는데, 처음보다 표정이 한결 여유롭다. 숟가락을 뺏으려는 모습까지 보여서 놀랐다.',
    mood: 'excited',
    date: '2025-08-13'
  },
  {
    user_id: 1,
    title: '8월 14일 (목요일)',
    content: '낯가림이 시작된 듯, 처음 보는 사람에게 안기자 얼굴을 찡그리고 울었다. 내가 안아주자 금세 진정한다. 저녁에는 "마마" 같은 소리가 들려 마음이 울컥했다. 우연이겠지만 기분이 좋다.',
    mood: 'happy',
    date: '2025-08-14'
  },
  {
    user_id: 1,
    title: '8월 15일 (금요일)',
    content: '오늘은 장난감을 한 손에서 다른 손으로 옮기는 걸 성공했다. 거울을 보여주자 자기 얼굴을 보며 활짝 웃는다. 스스로를 인식하진 못하겠지만, 무언가 재미있어 하는 게 분명하다.',
    mood: 'excited',
    date: '2025-08-15'
  },
  {
    user_id: 1,
    title: '8월 16일 (토요일)',
    content: '아기가 하루 종일 옹알이를 하며 즐거워했다. 그림책을 보여주니 파란색 페이지에서 특히 반응이 컸다. 오후에는 혼자 앉아 있다가 엎드려 기어보려는 듯 몸을 앞으로 밀며 작은 시도를 했다.',
    mood: 'happy',
    date: '2025-08-16'
  },
  {
    user_id: 1,
    title: '8월 17일 (일요일)',
    content: '밤에 잠시 깼지만 내가 토닥여 주자 금세 다시 잠들었다. 낮에는 옆으로 데굴데굴 굴러 방 한쪽 끝까지 이동했다. 호기심이 점점 커지는 게 느껴졌다. 이번 주는 한층 더 활발하고 반응이 풍부해진 일주일이었다.',
    mood: 'happy',
    date: '2025-08-17'
  }
];

// 새로운 일기들 저장
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  
  console.log('MySQL 연결 성공');
  console.log(`${newDiaries.length}개의 새로운 일기를 저장합니다...`);
  
  let insertedCount = 0;
  
  newDiaries.forEach((diary, index) => {
    const query = `
      INSERT INTO parent_diaries (user_id, title, content, mood, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [
      diary.user_id,
      diary.title,
      diary.content,
      diary.mood,
      new Date(diary.date + 'T12:00:00')
    ];
    
    connection.query(query, values, (error, results) => {
      if (error) {
        console.error(`일기 ${index + 1} 저장 실패:`, error);
      } else {
        insertedCount++;
        console.log(`일기 ${index + 1} 저장 성공: ID ${results.insertId}`);
      }
      
      // 모든 일기 저장 완료 후 연결 종료
      if (insertedCount + (newDiaries.length - insertedCount) === newDiaries.length) {
        console.log(`\n총 ${insertedCount}개의 일기가 성공적으로 저장되었습니다.`);
        connection.end();
      }
    });
  });
});
