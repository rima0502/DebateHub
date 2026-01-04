/**
 * Firestore 데이터베이스에 초기 더미 데이터를 추가하는 스크립트
 * 실행 방법: npm run seed
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 더미 토론방 데이터
const SEED_DEBATES = [
  {
    title: '보편적 기본소득: 필수인가, 재정 파탄인가?',
    description: 'AI로 인한 일자리 감소에 대비해 보편적 기본소득(UBI)을 도입해야 한다는 주장과, 국가 재정에 막대한 부담을 주며 근로 의욕을 저하시킬 것이라는 반론이 맞서고 있습니다.',
    category: '경제',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 15,
    messageCount: 342,
    imageUrl: 'https://picsum.photos/seed/ubidebate/600/400',
  },
  {
    title: '원격 근무의 제도화: 생산성 향상 vs 조직 문화 붕괴',
    description: '포스트 코로나 시대, 전면 원격 근무를 법적으로 보장해야 하는가? 아니면 사무실 복귀가 조직의 혁신을 위해 필수적인가?',
    category: '정치/사회',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 8,
    messageCount: 128,
    imageUrl: 'https://picsum.photos/seed/remotework/600/400',
  },
  {
    title: '우주 탐사 예산 증액: 인류의 도약인가, 자원 낭비인가?',
    description: '지구의 기후 위기와 빈곤 문제가 시급한 상황에서, 화성 이주 계획과 같은 거대 우주 프로젝트에 천문학적 예산을 투입하는 것이 정당한가?',
    category: '기술',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 21,
    messageCount: 890,
    imageUrl: 'https://picsum.photos/seed/spacexx/600/400',
  },
  {
    title: '일회용 컵 보증금제 실효성 논란',
    description: '환경 보호를 위한 보증금제가 소상공인과 소비자에게 미치는 영향과 실제 폐기물 저감 효과를 분석합니다.',
    category: '환경',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 11,
    messageCount: 210,
    imageUrl: 'https://picsum.photos/seed/ecocup/600/400',
  },
  {
    title: '디지털 교과서 도입, 학습 효과인가 중독인가?',
    description: '전국 초중고 디지털 교과서 전면 도입에 따른 교육의 질 향상과 스마트폰/태블릿 중독 우려 사이의 팽팽한 토론.',
    category: '교육',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 7,
    messageCount: 156,
    imageUrl: 'https://picsum.photos/seed/education/600/400',
  },
  {
    title: 'AI는 지각을 가질 수 있는가? 인공 의식의 윤리적 딜레마',
    description: '인공지능이 진정한 의식을 가질 수 있는지, 그리고 그렇다면 우리는 AI에 어떤 권리를 부여해야 하는지에 대한 논의.',
    category: '윤리',
    creatorId: 'system',
    creatorName: '관리자',
    status: 'active',
    participantCount: 13,
    messageCount: 267,
    imageUrl: 'https://picsum.photos/seed/aiconsciousness/600/400',
  }
];

async function seedDatabase() {
  console.log('🌱 데이터베이스 시딩 시작...\n');

  try {
    // 토론방 데이터 추가
    console.log('📋 토론방 추가 중...');
    for (const debate of SEED_DEBATES) {
      const docRef = await addDoc(collection(db, 'debates'), {
        ...debate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pinnedBy: []
      });
      console.log(`✅ 토론방 추가됨: ${debate.title} (ID: ${docRef.id})`);
    }

    console.log('\n✨ 데이터베이스 시딩 완료!');
    console.log('🔗 Firebase Console에서 확인하세요: https://console.firebase.google.com/');

    process.exit(0);
  } catch (error) {
    console.error('❌ 시딩 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
seedDatabase();
