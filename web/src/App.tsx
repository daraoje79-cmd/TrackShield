import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, type User, type ConfirmationResult } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { signUp, logIn, createRecaptchaVerifier, startPhoneSignIn } from './lib/auth';
import type { TransactionDoc, UserDoc } from './types/schema';
import './App.css';
import { parseStatementCsv, writeTransactionRows } from './lib/importTransactions';
import { parseStatementPdf } from './lib/parsePdfStatement';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [transactions, setTransactions] = useState<(TransactionDoc & { id: string })[]>([]);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as TransactionDoc) })));
    });
  }, [user]);

  const handleSignUp = async () => {
    setError('');
    try {
      await signUp(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  const handleLogIn = async () => {
    setError('');
    try {
      await logIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

    const recaptchaVerifierRef = useRef<ReturnType<typeof createRecaptchaVerifier> | null>(null);

  const getVerifier = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = createRecaptchaVerifier('recaptcha-container');
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendCode = async () => {
    setError('');
    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const verifier = getVerifier();
      const result = await startPhoneSignIn(cleanPhone, verifier);
      setConfirmation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    }
  };

  const handleConfirmCode = async () => {
    setError('');
    try {
      if (!confirmation) return;
      const credential = await confirmation.confirm(otp);
      const userRef = doc(db, 'users', credential.user.uid);
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        const userDoc: UserDoc = {
          name: '',
          phone: credential.user.phoneNumber ?? phone,
          email: '',
          createdAt: Timestamp.now(),
          guardianContacts: [],
        };
        await setDoc(userRef, userDoc);
      }
      setConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    }
  };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    setError('');
    try {
      let rows;
      let note = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const parsed = await parseStatementPdf(file);
        rows = parsed.rows;
        if (parsed.failedLines > 0) {
          note = ` (${parsed.failedLines} line(s) in the PDF couldn't be read as transactions)`;
        }
      } else {
        rows = await parseStatementCsv(file);
      }
      const result = await writeTransactionRows(user.uid, rows);
      alert(`Imported ${result.imported} of ${result.total} transactions.${note}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  if (user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Signed in as {user.email || user.phoneNumber}</h2>
        <p>UID: {user.uid}</p>
        <button onClick={() => signOut(auth)}>Log out</button>

        <hr style={{ margin: '24px 0' }} />

        <h3>Import a statement</h3>
        <input type="file" accept=".csv,.pdf" onChange={handleFileUpload} disabled={importing} />
        {importing && <p>Importing…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <h3>Transactions ({transactions.length})</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Date</th>
              <th style={{ textAlign: 'left' }}>Description</th>
              <th style={{ textAlign: 'left' }}>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.timestamp?.toDate?.().toLocaleDateString() ?? ''}</td>
                <td>{t.description}</td>
                <td>{t.category} {t.categoryConfidence === 'unknown' ? '❓' : ''}</td>
                <td style={{ textAlign: 'right', color: t.direction === 'debit' ? '#c0392b' : '#27ae60' }}>
                  {t.direction === 'debit' ? '-' : '+'}{t.amount.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right' }}>{t.balanceAfter.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <h2>TrackShield — Auth Test</h2>

      <h3>Email + Password</h3>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><br />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /><br />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleLogIn}>Log In</button>

      <h3>Phone</h3>
      <div id="recaptcha-container" ref={recaptchaRef}></div>
      {!confirmation ? (
        <>
          <input
            placeholder="+2348000000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          /><br />
          <button onClick={handleSendCode}>Send code</button>
        </>
      ) : (
        <>
          <input
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          /><br />
          <button onClick={handleConfirmCode}>Confirm code</button>
        </>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;