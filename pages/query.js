import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, Filter, MessageSquare, FileText, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export default function Query() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('filter'); // 'filter' или 'prompt'
  
  // Состояние для промпта
  const [prompt, setPrompt] = useState('');
  const [promptResults, setPromptResults] = useState([]);
  const [promptLoading, setPromptLoading] = useState(false);
  
  // Состояние для фильтров
  const [filters, setFilters] = useState({
    region: '',
    name: '',
    inn: '',
    okved_code: ''
  });
  const [filterResults, setFilterResults] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Состояние для предпросмотра
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Состояние для экспорта
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  
  // Отладка
  console.log('Export dropdown state:', exportDropdownOpen);
  
  // Refs для таблиц
  const tableRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const exportDropdownRef2 = useRef(null);
  const exportDropdownRef3 = useRef(null);
  
  const router = useRouter();
  const resultsRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideAnyDropdown = [exportDropdownRef, exportDropdownRef2, exportDropdownRef3]
        .every(ref => !ref.current || !ref.current.contains(event.target));
      
      if (isOutsideAnyDropdown) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Функция для добавления возможности изменения размера столбцов
  useEffect(() => {
    const addResizeListeners = () => {
      const table = tableRef.current;
      if (!table) return;

      const cols = table.querySelectorAll('th');
      let isResizing = false;
      let currentCol = null;
      let startX = 0;
      let startWidth = 0;

      const onMouseDown = (e, col) => {
        if (e.offsetX > col.offsetWidth - 8) {
          isResizing = true;
          currentCol = col;
          startX = e.pageX;
          startWidth = col.offsetWidth;
          document.body.style.cursor = 'col-resize';
          e.preventDefault();
        }
      };

      const onMouseMove = (e) => {
        if (!isResizing || !currentCol) return;
        
        const diff = e.pageX - startX;
        const newWidth = Math.max(50, startWidth + diff);
        currentCol.style.width = newWidth + 'px';
        currentCol.style.minWidth = newWidth + 'px';
      };

      const onMouseUp = () => {
        if (isResizing) {
          isResizing = false;
          currentCol = null;
          document.body.style.cursor = 'default';
        }
      };

      cols.forEach(col => {
        col.addEventListener('mousedown', (e) => onMouseDown(e, col));
        col.style.cursor = 'default';
        
        col.addEventListener('mousemove', (e) => {
          if (e.offsetX > col.offsetWidth - 8) {
            col.style.cursor = 'col-resize';
          } else {
            col.style.cursor = 'default';
          }
        });
      });

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        cols.forEach(col => {
          col.removeEventListener('mousedown', onMouseDown);
          col.removeEventListener('mousemove', () => {});
        });
      };
    };

    // Добавляем слушатели с небольшой задержкой, чтобы таблица успела отрендериться
    const timer = setTimeout(addResizeListeners, 100);
    return () => clearTimeout(timer);
  }, [promptResults, filterResults, preview]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handlePreview = async () => {
    try {
      let query = supabase.from('companies').select('*');
      
      // Применяем фильтры если они заданы
      if (filters.region) {
        query = query.ilike('region', `%${filters.region}%`);
      }
      if (filters.okved_code) {
        query = query.ilike('okved_code', `%${filters.okved_code}%`);
      }
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      if (filters.inn) {
        query = query.ilike('inn', `%${filters.inn}%`);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) {
        console.error('Preview error:', error);
        toast.error('Ошибка при получении предпросмотра');
        return;
      }
      
      setPreview(data || []);
      setShowPreview(true);
      setPromptResults([]);
      setFilterResults([]);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Ошибка при получении предпросмотра');
    }
  };

  const handleFilterSubmit = async () => {
    // Проверяем, что хотя бы один фильтр заполнен
    const hasFilters = filters.region || filters.name || filters.inn || filters.okved_code;
    if (!hasFilters) {
      toast.error('Заполните хотя бы один фильтр');
      return;
    }
    
    setFilterLoading(true);
    
    try {
      // Готовим данные для отправки (только заполненные поля)
      const filterData = {};
      if (filters.region) filterData.region = filters.region;
      if (filters.name) filterData.name = filters.name;
      if (filters.inn) filterData.inn = filters.inn;
      if (filters.okved_code) filterData.okved_code = filters.okved_code;
      
      // Отправляем фильтры и ID пользователя на n8n
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_filter_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: filterData,
          userId: user.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Получены данные от n8n (фильтры):', data);
        
        // Проверяем, что данные - это массив
        if (Array.isArray(data)) {
          setFilterResults(data);
          setPromptResults([]);
          setShowPreview(false);
          setPreview([]);
        } else {
          console.error('Неожиданный формат данных:', data);
          toast.error('Получен неожиданный формат данных');
        }
      } else {
        const errorText = await response.text();
        console.error('Ошибка ответа:', response.status, errorText);
        toast.error(`Ошибка при отправке запроса: ${response.status}`);
      }
    } catch (error) {
      console.error('Filter submit error:', error);
      toast.error(`Ошибка при отправке запроса: ${error.message}`);
    } finally {
      setFilterLoading(false);
    }
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      toast.error('Введите промпт');
      return;
    }
    
    setPromptLoading(true);
    
    try {
      // Отправляем промпт и ID пользователя на n8n
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_prompt_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          userId: user.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Получены данные от n8n (промпт):', data);
        
        // Проверяем, что данные - это массив
        if (Array.isArray(data)) {
          setPromptResults(data);
          setFilterResults([]);
          setShowPreview(false);
          setPreview([]);
        } else {
          console.error('Неожиданный формат данных:', data);
          toast.error('Получен неожиданный формат данных');
        }
      } else {
        const errorText = await response.text();
        console.error('Ошибка ответа:', response.status, errorText);
        toast.error(`Ошибка при отправке запроса: ${response.status}`);
      }
    } catch (error) {
      console.error('Prompt submit error:', error);
      toast.error(`Ошибка при отправке запроса: ${error.message}`);
    } finally {
      setPromptLoading(false);
    }
  };

  const clearResults = () => {
    setPromptResults([]);
    setFilterResults([]);
    setShowPreview(false);
    setPreview([]);
  };

  // Функции экспорта
  const getCurrentResults = () => {
    if (promptResults.length > 0) return promptResults;
    if (filterResults.length > 0) return filterResults;
    if (showPreview && preview.length > 0) return preview;
    return [];
  };

  const exportToCSV = () => {
    const data = getCurrentResults();
    if (data.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    const csvData = data.map(company => ({
      'Название': company.name || '',
      'ИНН': company.inn || '',
      'Регион': company.region || '',
      'Код ОКВЭД': company.okved_code || '',
      'Дата актуальности': company.actuality_date 
        ? new Date(company.actuality_date).toLocaleDateString('ru-RU')
        : ''
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const fileName = `companies_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
    
    toast.success(`Данные экспортированы в ${fileName}`);
    setExportDropdownOpen(false);
  };

  const exportToExcel = () => {
    const data = getCurrentResults();
    if (data.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    const excelData = data.map(company => ({
      'Название': company.name || '',
      'ИНН': company.inn || '',
      'Регион': company.region || '',
      'Код ОКВЭД': company.okved_code || '',
      'Дата актуальности': company.actuality_date 
        ? new Date(company.actuality_date).toLocaleDateString('ru-RU')
        : ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компании');
    
    const fileName = `companies_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success(`Данные экспортированы в ${fileName}`);
    setExportDropdownOpen(false);
  };

  // Добавить useEffect для автоскролла
  useEffect(() => {
    if (
      (promptResults && promptResults.length > 0) ||
      (filterResults && filterResults.length > 0) ||
      (showPreview && preview && preview.length > 0)
    ) {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          clearInterval(interval);
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [promptResults, filterResults, preview, showPreview]);

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
    <div className="main-page">
      {/* Навигационная панель */}
      <motion.div 
        className="nav-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={() => router.push('/dashboard')}>
          История
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
          <h1>Поиск компаний</h1>
          <p>Найдите нужные компании с помощью фильтров или ИИ-поиска</p>
        </motion.div>

        {/* Переключатель режимов */}
        <motion.div 
          className="mode-toggle-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button 
            className={mode === 'filter' ? 'active' : ''}
            onClick={() => setMode('filter')}
          >
            <Filter size={18} />
            Фильтр
          </button>
          <button 
            className={mode === 'prompt' ? 'active' : ''}
            onClick={() => setMode('prompt')}
          >
            <MessageSquare size={18} />
            Промпт
          </button>
        </motion.div>

        {/* Контейнер поиска */}
        <div className="search-section">
          <AnimatePresence mode="wait">
            {/* Контейнер фильтров */}
            {mode === 'filter' && (
              <motion.div 
                key="filter"
                className="search-container"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2>Фильтры поиска</h2>
                <div className="filter-grid">
                  <input
                    type="text"
                    placeholder="Регион или город"
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    disabled={filterLoading}
                  />
                  <input
                    type="text"
                    placeholder="Название организации"
                    value={filters.name}
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    disabled={filterLoading}
                  />
                  <input
                    type="text"
                    placeholder="ИНН"
                    value={filters.inn}
                    onChange={(e) => setFilters({ ...filters, inn: e.target.value })}
                    disabled={filterLoading}
                  />
                  <input
                    type="text"
                    placeholder="Код деятельности (ОКВЭД)"
                    value={filters.okved_code}
                    onChange={(e) => setFilters({ ...filters, okved_code: e.target.value })}
                    disabled={filterLoading}
                  />
                </div>
                <div className="filter-buttons">
                  <button 
                    onClick={handleFilterSubmit} 
                    className="btn btn-primary"
                    disabled={filterLoading}
                  >
                    {filterLoading ? (
                      <>
                        <Loader2 className="loading-spinner" size={16} />
                        Поиск...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        Найти компании
                      </>
                    )}
                  </button>
                  <button onClick={handlePreview} className="btn btn-secondary">
                    Предпросмотр (20 записей)
                  </button>
                </div>
              </motion.div>
            )}

            {/* Контейнер промпта */}
            {mode === 'prompt' && (
              <motion.div 
                key="prompt"
                className="search-container"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2>Поиск по промту</h2>
                <textarea
                  className="prompt-input"
                  placeholder="Опишите, какие компании вы ищете на естественном языке..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={promptLoading}
                />
                <button 
                  onClick={handlePromptSubmit} 
                  disabled={promptLoading}
                  className="btn btn-primary"
                >
                  {promptLoading ? (
                    <>
                      <Loader2 className="loading-spinner" size={16} />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Получить результат
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Кнопка очистки */}
        <AnimatePresence>
          {(promptResults.length > 0 || filterResults.length > 0 || showPreview) && (
            <motion.div 
              className="clear-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button onClick={clearResults} className="clear-button">
                <X size={16} />
                Очистить результаты
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Результаты */}
        <div className="results-section">
          <AnimatePresence mode="wait">
            {/* Результаты промпта */}
            {promptResults.length > 0 && (
              <motion.div 
                key="prompt-results"
                className="results-container-main"
                ref={resultsRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="results-header">
                  <div className="results-info">
                    <h2>Результаты поиска по промпту</h2>
                    <p>Найдено компаний: <strong>{promptResults.length}</strong></p>
                  </div>
                  <div className="results-actions">
                    <div className="export-dropdown" ref={exportDropdownRef}>
                      <button 
                        className="btn btn-export"
                        onClick={() => {
                          console.log('Кнопка экспорта нажата (промпт):', exportDropdownOpen);
                          setExportDropdownOpen(!exportDropdownOpen);
                        }}
                      >
                        <Download size={16} />
                        Экспорт
                      </button>
                      {exportDropdownOpen && (
                        <div className="export-menu open">
                          <button onClick={exportToCSV}>
                            <FileText size={16} />
                            Скачать CSV
                          </button>
                          <button onClick={exportToExcel}>
                            <FileSpreadsheet size={16} />
                            Скачать Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table ref={tableRef}>
                    <thead>
                      <tr>
                        <th className="company-name">Название</th>
                        <th className="company-inn">ИНН</th>
                        <th className="company-region">Регион</th>
                        <th className="company-okved">Код ОКВЭД</th>
                        <th className="company-date">Дата актуальности</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promptResults.map((company, index) => (
                        <motion.tr 
                          key={company.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <td className="company-name">
                            {company.name || '-'}
                          </td>
                          <td className="company-inn">{company.inn || '-'}</td>
                          <td className="company-region">{company.region || '-'}</td>
                          <td className="company-okved">{company.okved_code || '-'}</td>
                          <td className="company-date">
                            {company.actuality_date 
                              ? new Date(company.actuality_date).toLocaleDateString('ru-RU')
                              : '-'
                            }
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Результаты фильтров */}
            {filterResults.length > 0 && (
              <motion.div 
                key="filter-results"
                className="results-container-main"
                ref={resultsRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="results-header">
                  <div className="results-info">
                    <h2>Результаты поиска по фильтрам</h2>
                    <p>Найдено компаний: <strong>{filterResults.length}</strong></p>
                  </div>
                  <div className="results-actions">
                    <div className="export-dropdown" ref={exportDropdownRef2}>
                      <button 
                        className="btn btn-export"
                        onClick={() => {
                          console.log('Кнопка экспорта нажата (фильтры):', exportDropdownOpen);
                          setExportDropdownOpen(!exportDropdownOpen);
                        }}
                      >
                        <Download size={16} />
                        Экспорт
                      </button>
                      {exportDropdownOpen && (
                        <div className="export-menu open">
                          <button onClick={exportToCSV}>
                            <FileText size={16} />
                            Скачать CSV
                          </button>
                          <button onClick={exportToExcel}>
                            <FileSpreadsheet size={16} />
                            Скачать Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table ref={tableRef}>
            <thead>
              <tr>
                        <th className="company-name">Название</th>
                        <th className="company-inn">ИНН</th>
                        <th className="company-region">Регион</th>
                        <th className="company-okved">Код ОКВЭД</th>
                        <th className="company-date">Дата актуальности</th>
              </tr>
            </thead>
            <tbody>
                      {filterResults.map((company, index) => (
                        <motion.tr 
                          key={company.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <td className="company-name">
                            {company.name || '-'}
                          </td>
                          <td className="company-inn">{company.inn || '-'}</td>
                          <td className="company-region">{company.region || '-'}</td>
                          <td className="company-okved">{company.okved_code || '-'}</td>
                          <td className="company-date">
                            {company.actuality_date 
                              ? new Date(company.actuality_date).toLocaleDateString('ru-RU')
                              : '-'
                            }
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Предпросмотр */}
            {showPreview && preview.length > 0 && (
              <motion.div 
                key="preview-results"
                className="results-container-main"
                ref={resultsRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="results-header">
                  <div className="results-info">
                    <h2>Предпросмотр результатов</h2>
                    <p>Показано {preview.length} из первых 20 записей</p>
                  </div>
                  <div className="results-actions">
                    <div className="export-dropdown" ref={exportDropdownRef3}>
                      <button 
                        className="btn btn-export"
                        onClick={() => {
                          console.log('Кнопка экспорта нажата (предпросмотр):', exportDropdownOpen);
                          setExportDropdownOpen(!exportDropdownOpen);
                        }}
                      >
                        <Download size={16} />
                        Экспорт
                      </button>
                      {exportDropdownOpen && (
                        <div className="export-menu open">
                          <button onClick={exportToCSV}>
                            <FileText size={16} />
                            Скачать CSV
                          </button>
                          <button onClick={exportToExcel}>
                            <FileSpreadsheet size={16} />
                            Скачать Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table ref={tableRef}>
                    <thead>
                      <tr>
                        <th className="company-name">Название</th>
                        <th className="company-inn">ИНН</th>
                        <th className="company-region">Регион</th>
                        <th className="company-okved">Код ОКВЭД</th>
                </tr>
                    </thead>
                    <tbody>
                      {preview.map((company, index) => (
                        <motion.tr 
                          key={company.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <td className="company-name">{company.name || '-'}</td>
                          <td className="company-inn">{company.inn || '-'}</td>
                          <td className="company-region">{company.region || '-'}</td>
                          <td className="company-okved">{company.okved_code || '-'}</td>
                        </motion.tr>
              ))}
            </tbody>
          </table>
                </div>
              </motion.div>
            )}

            {/* Сообщение об отсутствии результатов предпросмотра */}
            {showPreview && preview.length === 0 && (
              <motion.div 
                key="no-preview"
                className="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h3>Результаты не найдены</h3>
                <p>По заданным фильтрам компании не найдены. Попробуйте изменить критерии поиска.</p>
              </motion.div>
            )}

            {/* Приветственное сообщение */}
            {!showPreview && promptResults.length === 0 && filterResults.length === 0 && (
              <motion.div 
                key="welcome"
                className="welcome-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h3>Добро пожаловать в систему поиска компаний!</h3>
                <p>Выберите режим поиска выше:</p>
                <div className="mode-info">
                  <motion.div 
                    className="mode-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4>🔍 Фильтр</h4>
                    <p>Точный поиск по региону, названию, ИНН и коду ОКВЭД</p>
                  </motion.div>
                  <motion.div 
                    className="mode-card"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4>💬 Промпт</h4>
                    <p>Поиск по описанию на естественном языке с помощью ИИ</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}