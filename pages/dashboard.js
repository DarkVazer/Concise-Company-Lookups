import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', user.user.id)
          .order('created_at', { ascending: false });
        setRequests(data || []);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div>
      <h1>История запросов</h1>
      {requests.length === 0 ? (
        <p>Нет запросов</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Промпт</th>
              <th>Фильтры</th>
              <th>Файл</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{new Date(request.created_at).toLocaleString()}</td>
                <td>{request.prompt || '-'}</td>
                <td>{JSON.stringify(request.filters)}</td>
                <td>
                  {request.file_url ? (
                    <a href={request.file_url}>Скачать</a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}