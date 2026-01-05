import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

// .env 파일에서 환경 변수 로드
dotenv.config();

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

async function checkCollections() {
  console.log('🔍 Firestore 데이터 확인 중...\n');
  
  const collections = ['debates', 'messages', 'participants', 'notifications', 'users'];
  
  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    console.log(`📂 ${collectionName}: ${snapshot.size}개 문서`);
    
    if (snapshot.size > 0) {
      snapshot.forEach(doc => {
        console.log(`  - ${doc.id}:`, doc.data().title || doc.data().userName || doc.data().email || 'no title');
      });
    }
  }
}

checkCollections().then(() => process.exit(0));
