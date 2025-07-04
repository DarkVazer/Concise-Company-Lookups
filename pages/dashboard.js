import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      
      setUser(user);
      
      // Загружаем запросы пользователя
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching requests:', error);
        toast.error('Ошибка загрузки истории запросов');
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    };
    
    checkUserAndFetchRequests();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'processing':
        return <Clock size={16} className="text-yellow-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Завершен';
      case 'processing':
        return 'Обработка';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFilters = (filters) => {
    if (!filters) return '-';
    const filterObj = typeof filters === 'string' ? JSON.parse(filters) : filters;
    const filterParts = [];
    
    if (filterObj.region) filterParts.push(`Регион: ${filterObj.region}`);
    if (filterObj.name) filterParts.push(`Название: ${filterObj.name}`);
    if (filterObj.inn) filterParts.push(`ИНН: ${filterObj.inn}`);
    if (filterObj.okved_code) filterParts.push(`ОКВЭД: ${filterObj.okved_code}`);
    
    return filterParts.length > 0 ? filterParts.join(', ') : '-';
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
          <span>Загрузка истории...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="main-page">
      {/* Навигационная панель */}
      <motion.div 
        className="nav-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={() => router.push('/query')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={18} />
          Поиск
        </button>
        <button onClick={handleLogout}>Выйти</button>
      </motion.div>

      <div className="main-content">
        {/* Заголовок */}
        <motion.div 
          className="page-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>История запросов</h1>
          <p>Просматривайте и управляйте своими поисковыми запросами</p>
        </motion.div>

        <AnimatePresence>
          {requests.length === 0 ? (
            <motion.div 
              key="empty"
              className="welcome-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Search className="text-white" size={32} />
                </motion.div>
                <h3>Нет запросов</h3>
                <p>Вы еще не делали запросов. Перейдите в раздел поиска, чтобы начать работу.</p>
                <motion.button 
                  onClick={() => router.push('/query')}
                  className="btn btn-primary mt-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search size={18} />
                  Начать поиск
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="table"
              className="results-container-main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="results-header">
                <div className="results-info">
                  <h2>Ваши запросы</h2>
                  <p>Всего запросов: <strong>{requests.length}</strong></p>
                </div>
              </div>
              
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th className="company-date">Дата</th>
                      <th className="company-name">Промпт</th>
                      <th className="company-region">Фильтры</th>
                      <th className="company-inn">Файл</th>
                      <th className="company-okved">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => (
                      <motion.tr 
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <td className="company-date">
                          {new Date(request.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="company-name">
                          <div className="max-w-xs truncate" title={request.prompt || '-'}>
                            {request.prompt || '-'}
                          </div>
                        </td>
                        <td className="company-region">
                          <div className="max-w-xs truncate" title={formatFilters(request.filters)}>
                            {formatFilters(request.filters)}
                          </div>
                        </td>
                        <td className="company-inn">
                          {request.file_url ? (
                            <motion.a 
                              href={request.file_url}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Download size={14} />
                              Скачать
                            </motion.a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="company-okved">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {getStatusText(request.status)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}