// pages/api/export.js
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { prompt, filters } = req.body;
  const { user } = await supabase.auth.getUser();

  // Проверка авторизации
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Проверка trial-лимита
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData.role === 'trial') {
    const { count } = await supabase.from('requests').select('id', { count: 'exact' }).eq('user_id', user.id);
    if (count >= 1) {
      return res.status(403).json({ error: 'Trial limit reached' });
    }
  }

  // Отправка запроса на n8n
  const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, filters, user_id: user.id }),
  });

  const { fileUrl } = await response.json();
  res.status(200).json({ fileUrl });
}