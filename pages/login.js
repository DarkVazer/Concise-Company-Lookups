import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/query');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push('/query');
    }
  };

  if (loading) {
    return <div className="page-container">Загрузка...</div>;
  }

  return (
    <div className="page-container">
      <div className="form-box">
        <h1>Вход в систему</h1>
        <div className="input-wrapper">
          <Mail className="input-icon" size={18} />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="pl-12"
          />
        </div>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="pl-12"
          />
        </div>
        <button onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <LogIn size={18} /> Войти
        </button>
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Нет аккаунта?{' '}
          <a 
            href="/register" 
            style={{ color: '#2563eb', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogIn size={16} /> Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}