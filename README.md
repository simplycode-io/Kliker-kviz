# Kviz Aplikacija za Hackathon

Ova aplikacija je jednostavna web-bazirana kviz aplikacija za testiranje dece za preliminarno takmičenje na vašem hackathonu.

## Funkcionalnosti

- Dete unosi ime i prezime
- Klikne "Start" i počinje odbrojavanje od 15 minuta
- Odgovara na 20 pitanja biranjem jednog od četiri ponuđena odgovora
- Nakon završetka, rezultati se čuvaju u bazi podataka
- Kasnije možete napraviti backend za prikaz rezultata u tabeli

## Instalacija i Pokretanje

1. Instalirajte Node.js sa [nodejs.org](https://nodejs.org/) ili koristeći Homebrew: `brew install node`

2. Instalirajte zavisnosti:
   ```
   npm install
   ```

3. Pokrenite server:
   ```
   npm start
   ```

4. Otvorite browser i idite na `http://localhost:3000`

## Struktura Projekta

- `server.js` - Node.js server sa Express.js
- `public/index.html` - HTML stranica za kviz
- `public/admin.html` - Admin panel za upravljanje kvizovima
- `public/leaderboard.html` - Rang lista sa rezultatima
- `public/style.css` - CSS stilovi
- `public/script.js` - JavaScript logika za kviz
- `public/admin.js` - JavaScript logika za admin panel
- `public/leaderboard.js` - JavaScript logika za rang listu
- `public/i18n.js` - Internacionalizacija (srpski/engleski)
- `quizzes.json` - JSON fajl sa kvizovima i pitanjima
- `results.json` - JSON fajl sa rezultatima takmičara

## Upravljanje Kvizovima

- Admin panel je dostupan na `/admin.html` (lozinka: `tajna123`)
- Možete kreirati nove kvizove, kopirati postojeće i dodavati/brisati pitanja
- Svaki kviz ima jedinstvenu URL adresu sa `?quizId=` parametrom

## Rezultati

- Rezultati se čuvaju u `results.json` fajlu
- Dostupni su na rang listi `/leaderboard.html`
- Sortiraju se po broju tačnih odgovora i vremenu

## Napomene

- Timer je fiksiran na 15 minuta
- Aplikacija podržava više kvizova istovremeno
- Podrška za srpski i engleski jezik