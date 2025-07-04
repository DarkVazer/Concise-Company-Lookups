# Система поиска компаний

Веб-приложение для поиска компаний с возможностью фильтрации по различным критериям и поиска по естественному языку.

## Функциональность

### Авторизация
- При первом посещении сайта появляется модальное окно для входа
- Возможность регистрации новых пользователей
- Автоматическое перенаправление авторизованных пользователей на страницу поиска
- Сохранение состояния авторизации

### Поиск компаний
Система предоставляет два режима поиска:

#### 1. Фильтр
- Поиск по названию города
- Поиск по коду ОКВЭД
- Поиск по названию организации
- Предпросмотр результатов (ограничен 20 записями)

#### 2. Промпт
- Поиск по описанию на естественном языке
- Интеграция с n8n для обработки промптов
- Отправка промпта и ID пользователя на внешний сервис

### История запросов
- Просмотр всех предыдущих запросов пользователя
- Статусы выполнения запросов
- Возможность скачивания результатов

## Технические детали

### Стек технологий
- **Frontend**: Next.js, React
- **Backend**: Supabase (PostgreSQL, Auth)
- **Стили**: CSS modules
- **Интеграция**: n8n webhooks

### Структура страниц
- `/` - Главная страница с модальным окном авторизации
- `/login` - Страница входа (резервная)
- `/register` - Страница регистрации (резервная)
- `/query` - Основная страница поиска
- `/dashboard` - История запросов пользователя

### Переменные окружения
Создайте файл `.env.local` с следующими переменными:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Настройте переменные окружения в `.env.local`

3. Запустите приложение:
```bash
npm run dev
```

4. Откройте http://localhost:3000 в браузере

## Структура базы данных

### Таблица companies
- `id` - уникальный идентификатор
- `inn` - ИНН компании
- `name` - название компании
- `city` - город
- `okved` - код ОКВЭД
- `region` - регион

### Таблица requests
- `id` - уникальный идентификатор
- `user_id` - ID пользователя
- `prompt` - текст промпта
- `filters` - JSON с фильтрами
- `status` - статус выполнения
- `file_url` - ссылка на результат
- `created_at` - дата создания

## API endpoints

### n8n Integration
POST запрос на webhook с данными:
```json
{
  "prompt": "текст промпта",
  "userId": "id_пользователя"
}
```