import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDJOHBARgnIXI39IT0rCClKg_MjL7n87b0',
  authDomain: 'gen-lang-client-0530088745.firebaseapp.com',
  projectId: 'gen-lang-client-0530088745',
  storageBucket: 'gen-lang-client-0530088745.appspot.com',
  messagingSenderId: '841573260646',
  appId: '1:841573260646:web:35ebbd6c7e3435a6743ca7',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
