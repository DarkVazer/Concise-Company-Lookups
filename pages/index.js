// pages/index.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/register'); // Перенаправление на страницу логина
  }, []);
  return <div>Redirecting...</div>;
}