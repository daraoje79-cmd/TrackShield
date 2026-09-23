import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserDoc } from '../types/schema';

export async function signUp(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Keeps Firebase Auth's own profile in sync (handy later for displaying
  // a name without an extra Firestore read).
  await updateProfile(user, { displayName: name });

  const userDoc: UserDoc = {
    name,
    phone: '',
    email,
    createdAt: Timestamp.now(),
    guardianContacts: [],
  };

  // This exact field set matches what firestore.rules allows a client to write.
  await setDoc(doc(db, 'users', user.uid), userDoc);

  return user;
}

export async function logIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

export function createRecaptchaVerifier(containerId: string) {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

export async function startPhoneSignIn(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}