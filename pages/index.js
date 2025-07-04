// pages/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/query');
      } else {
        setShowLoginModal(true);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Заполните все поля');
      return;
    }

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Добро пожаловать!');
      setShowLoginModal(false);
      router.push('/query');
    }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password) {
      toast.error('Заполните все поля');
      return;
    }

    if (password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Регистрация успешна! Проверьте email для подтверждения.');
      setShowRegisterModal(false);
      setShowLoginModal(true);
    }
    setAuthLoading(false);
  };

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
    setEmail('');
    setPassword('');
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
    setEmail('');
    setPassword('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showLoginModal) {
        handleLogin();
      } else if (showRegisterModal) {
        handleRegister();
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <Loader2 className="animate-spin" size={24} />
          <span>Загрузка...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <AnimatePresence>
        {/* Модальное окно логина */}
        {showLoginModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="form-box"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <LogIn className="text-white" size={24} />
                </motion.div>
                <h1>Добро пожаловать!</h1>
                <p className="text-gray-600 mt-2">Войдите в свой аккаунт для продолжения</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="Введите ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={authLoading}
                    className="pl-12"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Введите ваш пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={authLoading}
                    className="pl-12"
                  />
                </div>

                <motion.button 
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="btn btn-primary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="loading-spinner" size={18} />
                      Вход...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Войти в систему
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-600">
                    Нет аккаунта?{' '}
                    <button 
  onClick={switchToRegister}
  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 px-4 rounded border-none transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
  disabled={authLoading}
>
  Зарегистрироваться
</button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Модальное окно регистрации */}
        {showRegisterModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="form-box"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <UserPlus className="text-white" size={24} />
                </motion.div>
                <h1>Создать аккаунт</h1>
                <p className="text-gray-600 mt-2">Зарегистрируйтесь для доступа к системе</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="Введите ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={authLoading}
                    className="pl-12"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Создайте пароль (мин. 6 символов)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={authLoading}
                    className="pl-12"
                  />
                </div>

                <motion.button 
                  onClick={handleRegister}
                  disabled={authLoading}
                  className="btn btn-primary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="loading-spinner" size={18} />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Создать аккаунт
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-600">
                    Уже есть аккаунт?{' '}
                    <button 
                      onClick={switchToLogin}
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      disabled={authLoading}
                    >
                      Войти
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}