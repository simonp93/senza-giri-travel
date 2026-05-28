const form = document.getElementById('tripForm');
const result = document.getElementById('result');
const output = document.getElementById('promptOutput');
const copyButton = document.getElementById('copyPrompt');

function valueOf(id) {
  return document.getElementById(id).value.trim() || 'Non specificato';
}

function selectedInterests() {
  const checked = Array.from(document.querySelectorAll('input[name="interest"]:checked'));
  if (checked.length === 0) return 'Non specificati';
  return checked.map(item => item.value).join(', ');
}

function buildPrompt() {
  return `Sei un travel planner esperto.

Crea un itinerario sequenziale e realistico per questo viaggio.

Obiettivo principale:
Evitare giri inutili, raggruppare le tappe per zona e rispettare gli orari fissi.

Dati viaggio:
- Destinazione: ${valueOf('destination')}
- Data inizio: ${valueOf('startDate')}
- Data fine: ${valueOf('endDate')}
- Hotel/base: ${valueOf('hotel')}
- Arrivo: ${valueOf('arrival')}
- Partenza: ${valueOf('departure')}
- Ritmo viaggio: ${valueOf('pace')}
- Mezzi preferiti: ${valueOf('transport')}
- Interessi: ${selectedInterests()}

Tappe desiderate:
${valueOf('places')}

Prenotazioni o orari fissi:
${valueOf('bookings')}

Note da TikTok, Pinterest, blog o articoli:
${valueOf('sources')}

Note personali:
${valueOf('extraNotes')}

Regole:
1. Organizza le giornate in ordine logico e sequenziale.
2. Parti e termina considerando hotel, arrivo e partenza.
3. Raggruppa tappe vicine tra loro.
4. Evita avanti e indietro inutili tra zone lontane.
5. Rispetta le prenotazioni e gli orari fissi.
6. Inserisci tempi indicativi di visita e spostamento.
7. Segnala tappe troppo lontane o giornate troppo piene.
8. Suggerisci alternative vicine quando una tappa non è comoda.
9. Scrivi l'itinerario in forma sequenziale, non tabellare.
10. Aggiungi dettagli pratici, curiosità utili e consigli di spostamento.

Output richiesto:
- riepilogo del viaggio;
- itinerario giorno per giorno;
- tappe in ordine;
- tempi stimati;
- consigli pratici;
- eventuali criticità;
- alternative vicine.`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  output.value = buildPrompt();
  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth' });
});

copyButton.addEventListener('click', async () => {
  if (!output.value) return;

  try {
    await navigator.clipboard.writeText(output.value);
    copyButton.textContent = 'Copiato!';
    setTimeout(() => {
      copyButton.textContent = 'Copia prompt';
    }, 1600);
  } catch (error) {
    output.select();
    document.execCommand('copy');
    copyButton.textContent = 'Copiato!';
    setTimeout(() => {
      copyButton.textContent = 'Copia prompt';
    }, 1600);
  }
});
