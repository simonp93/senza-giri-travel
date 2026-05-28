const form = document.getElementById('tripForm');
const result = document.getElementById('result');
const output = document.getElementById('promptOutput');
const copyButton = document.getElementById('copyPrompt');

const resultTitle = document.querySelector('#result h2');
let lastItineraryText = '';

function get(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function valueOf(id) {
  return get(id) || 'Non specificato';
}

function selectedInterests() {
  const checked = Array.from(document.querySelectorAll('input[name="interest"]:checked'));
  return checked.map(item => item.value);
}

function splitLines(text) {
  return text.split('\n').map(line => line.trim()).filter(Boolean);
}

function dateRange(start, end) {
  const dates = [];
  if (!start || !end) return dates;
  const current = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (current <= last && dates.length < 14) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function datePart(datetimeValue) {
  return datetimeValue ? datetimeValue.slice(0, 10) : '';
}

function timePart(datetimeValue) {
  return datetimeValue ? datetimeValue.slice(11, 16) : '';
}

function getTripDays() {
  const arrivalDate = datePart(get('arrival'));
  const departureDate = datePart(get('departure'));
  const dates = dateRange(arrivalDate, departureDate);
  if (dates.length) return dates;
  return [null, null, null];
}

function formatDate(date, index) {
  if (!date) return `Giorno ${index + 1}`;
  return date.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes, 0, 0);
  return date.toTimeString().slice(0, 5);
}

function estimateVisit(place) {
  const p = place.toLowerCase();
  if (p.includes('terme') || p.includes('therme')) return 240;
  if (p.includes('museo') || p.includes('museum') || p.includes('palazzo') || p.includes('parlamento')) return 120;
  if (p.includes('ristorante') || p.includes('pranzo') || p.includes('cena') || p.includes('bere') || p.includes('food')) return 90;
  if (p.includes('bar') || p.includes('rooftop') || p.includes('locale')) return 90;
  if (p.includes('parco') || p.includes('park')) return 75;
  return 60;
}

function categoryOf(place) {
  const p = place.toLowerCase();
  if (p.includes('terme') || p.includes('therme')) return 'Esperienza lunga';
  if (p.includes('ristorante') || p.includes('pranzo') || p.includes('cena') || p.includes('bere')) return 'Food';
  if (p.includes('bar') || p.includes('rooftop') || p.includes('club') || p.includes('locale')) return 'Sera';
  if (p.includes('museo') || p.includes('ateneo') || p.includes('parlamento') || p.includes('chiesa')) return 'Cultura';
  if (p.includes('parco')) return 'Relax';
  return 'Tappa';
}

function extractPlacesFromSources(text) {
  const candidates = [];
  const lines = splitLines(text);
  lines.forEach(line => {
    const cleaned = line.replace(/https?:\/\/\S+/g, '').trim();
    const chunks = cleaned.split(/[,;•|-]/).map(x => x.trim()).filter(Boolean);
    chunks.forEach(chunk => {
      const words = chunk.split(' ');
      const hasCapital = /[A-ZÀ-Ú][a-zà-ú]+/.test(chunk);
      if (hasCapital && words.length <= 6 && chunk.length > 3) candidates.push(chunk);
    });
  });
  return [...new Set(candidates)].slice(0, 8);
}

function getCapacity() {
  const pace = get('pace');
  if (pace === 'Rilassato') return 3;
  if (pace === 'Intenso') return 6;
  return 4;
}

function distributePlaces(places, days, capacity) {
  const dayPlans = days.map(() => []);
  const longPlaces = [];
  const normalPlaces = [];
  const eveningPlaces = [];
  places.forEach(place => {
    const lower = place.toLowerCase();
    if (lower.includes('terme') || lower.includes('therme')) longPlaces.push(place);
    else if (lower.includes('bar') || lower.includes('locale') || lower.includes('rooftop') || lower.includes('club') || lower.includes('cena')) eveningPlaces.push(place);
    else normalPlaces.push(place);
  });
  longPlaces.forEach((place, i) => {
    const target = Math.min(days.length - 1, Math.max(0, Math.floor(days.length / 2) + i));
    dayPlans[target].push(place);
  });
  normalPlaces.forEach(place => {
    const target = dayPlans.map((items, index) => ({ index, score: items.length })).sort((a, b) => a.score - b.score)[0].index;
    if (dayPlans[target].length < capacity) dayPlans[target].push(place);
    else dayPlans[(target + 1) % days.length].push(place);
  });
  eveningPlaces.forEach((place, i) => dayPlans[i % days.length].push(place));
  return dayPlans;
}

function parseBookings(text) {
  return splitLines(text).map(line => ({ raw: line }));
}

function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildItinerary() {
  const destination = valueOf('destination');
  const hotel = valueOf('hotel');
  const transport = valueOf('transport');
  const interests = selectedInterests();
  const basePlaces = splitLines(get('places'));
  const sourcePlaces = extractPlacesFromSources(get('sources'));
  const places = [...new Set([...basePlaces, ...sourcePlaces])];
  const days = getTripDays();
  const capacity = getCapacity();
  const bookings = parseBookings(get('bookings'));
  const dayPlans = distributePlaces(places, days, capacity);

  const warnings = [];
  if (!get('arrival') || !get('departure')) warnings.push('Inserisci arrivo e partenza volo per calcolare correttamente i giorni.');
  if (!places.length) warnings.push('Aggiungi almeno qualche tappa: l’app può costruire il giro solo se ha luoghi da distribuire.');
  if (sourcePlaces.length) warnings.push(`Ho estratto automaticamente ${sourcePlaces.length} possibili tappe dalle note/fonti.`);
  if (places.length > days.length * capacity) warnings.push('Il viaggio sembra pieno: alcune giornate potrebbero essere intense.');

  let text = `ITINERARIO SENZA GIRI - ${destination}\n`;
  text += `Base: ${hotel}\n`;
  text += `Arrivo volo: ${valueOf('arrival')}\n`;
  text += `Partenza volo: ${valueOf('departure')}\n`;
  text += `Mezzi: ${transport}\n`;
  text += `Interessi: ${interests.length ? interests.join(', ') : 'non specificati'}\n\n`;

  const html = [];
  html.push(`<div class="summary-card"><h3>${destination}</h3><p><strong>Base:</strong> ${hotel}<br><strong>Arrivo volo:</strong> ${valueOf('arrival')}<br><strong>Partenza volo:</strong> ${valueOf('departure')}<br><strong>Mezzi:</strong> ${transport}<br><strong>Interessi:</strong> ${interests.length ? interests.join(', ') : 'non specificati'}</p></div>`);

  if (warnings.length) {
    html.push('<div class="alerts"><h3>Alert</h3>');
    warnings.forEach(w => html.push(`<p>⚠️ ${w}</p>`));
    html.push('</div>');
  }

  dayPlans.forEach((items, index) => {
    const dateLabel = formatDate(days[index], index);
    let current = '09:30';
    if (index === 0 && timePart(get('arrival'))) current = addMinutes(timePart(get('arrival')), 90);
    if (index === days.length - 1 && timePart(get('departure')) && current > timePart(get('departure'))) current = '09:00';

    text += `GIORNO ${index + 1} - ${dateLabel}\n`;
    text += `Partenza consigliata: ${hotel}\n`;

    html.push(`<article class="day-card"><div class="day-head"><span>Giorno ${index + 1}</span><h3>${dateLabel}</h3></div>`);
    html.push(`<div class="timeline"><div class="timeline-item base"><time>${current}</time><div><strong>Partenza dalla base</strong><p>${hotel}</p></div></div>`);

    if (!items.length) {
      text += `- Giornata libera: aggiungi tappe oppure usala come margine.\n`;
      html.push(`<div class="timeline-item"><time>libero</time><div><strong>Giornata leggera</strong><p>Aggiungi tappe o usa questa giornata come margine.</p></div></div>`);
    }

    items.forEach((place, placeIndex) => {
      const travel = placeIndex === 0 ? 20 : 18;
      current = addMinutes(current, travel);
      const visit = estimateVisit(place);
      const category = categoryOf(place);
      const end = addMinutes(current, visit);
      const query = `${place} ${destination}`;
      text += `- ${current} / ${end}: ${place} (${category}, visita circa ${visit} min, spostamento stimato ${travel} min)\n`;
      html.push(`<div class="timeline-item"><time>${current}</time><div><strong>${place}</strong><p>${category} · visita circa ${visit} min · spostamento stimato ${travel} min</p><a href="${mapsLink(query)}" target="_blank" rel="noopener">Apri su Google Maps</a></div></div>`);
      current = end;
    });

    current = addMinutes(current, 20);
    text += `Rientro/pausa consigliata: ${current}.\n\n`;
    html.push(`<div class="timeline-item base"><time>${current}</time><div><strong>Rientro o pausa</strong><p>Momento cuscinetto per relax o spostamento serale.</p></div></div>`);
    html.push('</div></article>');
  });

  if (bookings.length) {
    text += `PRENOTAZIONI DA RISPETTARE\n`;
    bookings.forEach(b => { text += `- ${b.raw}\n`; });
    html.push('<div class="bookings-card"><h3>Prenotazioni inserite</h3>');
    bookings.forEach(b => html.push(`<p>📌 ${b.raw}</p>`));
    html.push('</div>');
  }

  text += `\nNota: questa e una pianificazione automatica demo. Verifica distanze reali e orari di apertura.`;
  return { html: html.join(''), text };
}

function buildPrompt() {
  return `Dati viaggio per ottimizzazione:\nDestinazione: ${valueOf('destination')}\nHotel/base: ${valueOf('hotel')}\nArrivo volo: ${valueOf('arrival')}\nPartenza volo: ${valueOf('departure')}\nRitmo: ${valueOf('pace')}\nMezzi: ${valueOf('transport')}\nInteressi: ${selectedInterests().join(', ') || 'non specificati'}\n\nTappe:\n${valueOf('places')}\n\nPrenotazioni:\n${valueOf('bookings')}\n\nFonti e note:\n${valueOf('sources')}\n\nNote personali:\n${valueOf('extraNotes')}`;
}

function showItinerary() {
  const plan = buildItinerary();
  lastItineraryText = plan.text;
  output.value = buildPrompt();
  result.classList.remove('hidden');
  resultTitle.textContent = 'Itinerario generato';
  const itineraryBox = document.getElementById('itineraryBox');
  itineraryBox.innerHTML = plan.html;
  output.classList.add('hidden');
  result.scrollIntoView({ behavior: 'smooth' });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  showItinerary();
});

copyButton.addEventListener('click', async () => {
  const text = lastItineraryText || output.value || buildPrompt();
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = 'Copiato!';
  } catch (error) {
    output.classList.remove('hidden');
    output.value = text;
    output.select();
    document.execCommand('copy');
    copyButton.textContent = 'Copiato!';
  }
  setTimeout(() => { copyButton.textContent = 'Copia dati'; }, 1600);
});
