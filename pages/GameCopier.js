import { useState } from 'react';

export default function GameCopier() {
  const [msg, setMsg] = useState('');

  const sendMessage = async () => {
    if (!msg) return alert('Wpisz coś!');

    const res = await fetch('/api/sendWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    alert(data.message);
    setMsg('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Wklej coś do tabeli:</h2>
      <table border="1">
        <tbody>
          <tr>
            <td contentEditable="true" onInput={e => setMsg(e.currentTarget.innerText)}>
              Tu wklej tekst
            </td>
          </tr>
        </tbody>
      </table>
      <br />
      <button onClick={sendMessage}>Release</button>
    </div>
  );
}
