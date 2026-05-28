const form = document.getElementById('tripForm');
const result = document.getElementById('result');
const itineraryBox = document.getElementById('itineraryBox');
const copyButton = document.getElementById('copyPrompt');
const output = document.getElementById('promptOutput');

let lastText = '';

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

function getInterests() {
  return Array.from(document.querySelectorAll('input[name="interest"]:checked')).map(item => item.value);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function collectData() {
  return {
    destination: getValue('destination'),
    hotel: getValue('hotel'),
    arrival: getValue('arrival'),
    departure: getValue('departure'),
    places: getValue('places'),
    bookings: getValue('bookings'),
    sources: getValue('sources'),
    pace: getValue('pace'),
    transport: getValue('transport'),
    interests: getInterests(),
    extraNotes: getValue('extraNotes')
  };
}

function showMessage(title, message) {
  result.classList.remove('hidden');
  itineraryBox.innerHTML = `<div class="alerts"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
  result.scrollIntoView({ behavior: 'smooth' });
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  showMessage('AI non ancora collegata', 'La demo finta e stata rimossa. Ora serve collegare il backend AI su Vercel: il sito non inventa piu itinerari con regole locali.');

  lastText = JSON.stringify(collectData(), null, 2);
  output.value = lastText;
});

copyButton.addEventListener('click', async () => {
  if (!lastText) lastText = JSON.stringify(collectData(), null, 2);
  await navigator.clipboard.writeText(lastText);
  copyButton.textContent = 'Copiato!';
  setTimeout(() => { copyButton.textContent = 'Copia itinerario'; }, 1600);
});
