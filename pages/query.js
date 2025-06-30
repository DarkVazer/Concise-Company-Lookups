import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Query() {
  const [prompt, setPrompt] = useState('');
  const [filters, setFilters] = useState({ region: '', revenue: '', okved: '' });
  const [preview, setPreview] = useState([]);

  const handlePreview = async () => {
    const { data } = await supabase.from('companies').select('*').limit(20);
    setPreview(data);
  };

  const handleExport = async () => {
    const response = await fetch('/api/export', {
      method: 'POST',
      body: JSON.stringify({ prompt, filters }),
    });
    const { fileUrl } = await response.json();
    window.location.href = fileUrl;
  };

  return (
    <div>
      <input placeholder="Промпт" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <input placeholder="Регион" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
      <button onClick={handlePreview}>Предпросмотр</button>
      {preview.length > 0 && (
        <table>
          {preview.map((company) => (
            <tr key={company.id}>
              <td>{company.inn}</td>
              <td>{company.region}</td>
            </tr>
          ))}
        </table>
      )}
      <button onClick={handleExport}>Сформировать выгрузку</button>
    </div>
  );
}