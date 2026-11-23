const p = require('/opt/npm-tools/node_modules/puppeteer');
const C = [
 ["08-ricette-in-eredita","panettone.jpg","Il ricettario di casa","Le tue ricette, in eredità.","Le dosi giuste, i trucchi, la tua voce mentre le spieghi. Per chi verrà dopo.","Scopri Ancora","50% 40%"],
 ["09-storia-in-eredita","compiti.jpg","Per chi conta davvero","La tua storia, in eredità ai nipoti.","Le scelte, le avventure, il tuo modo di vedere le cose. Raccontate da te.","Scopri Ancora","22% 30%"],
 ["10-ricordi-ai-nipoti","nonna-nipote.jpg","Il regalo che resta","I tuoi ricordi, da lasciare ai nipoti.","Foto, voci e storie in un posto solo vostro. E a fine anno, un libro.","Regalala · 99 € <s>129 €</s>","45% 40%"],
 ["11-all-infinito","foto.jpg","Ancora, e ancora","I tuoi ricordi, all'infinito.","Non più in una scatola o persi in un telefono: al sicuro, solo per la tua famiglia.","Inizia gratis","40% 50%"],
 ["12-scrigno","colazione.jpg","Lo scrigno della famiglia","Foto, voci, storie, ricette. Tutto in un posto.","Il posto dove la tua famiglia mette quello che conta. E cresce ogni giorno con voi.","Scopri Ancora","50% 50%"],
 ["13-mille-chat","selfie.jpg","Più di una chat di gruppo","Non perdere più un ricordo tra mille chat.","Ogni foto, ogni vocale, ogni storia ha il suo posto. Per persona, per anno.","Inizia gratis","72% 40%"],
 ["14-nipoti-dei-nipoti","letto.jpg","Le storie di famiglia","Le storie dei nonni, ascoltate dai nipoti dei nipoti.","Registrate una volta, restano lì. Con la voce di chi le racconta.","Regala la storia della tua famiglia","50% 35%"],
];
const NATALE = new Set(["10-ricordi-ai-nipoti","14-nipoti-dei-nipoti"]);
(async () => {
  const b = await p.launch({ args: ['--no-sandbox'] });
  for (const [w, h, suff, fs, bot] of [[1080, 1350, "feed", 92, 70], [1080, 1920, "storia", 104, 230]]) {
    const pg = await b.newPage(); await pg.setViewport({ width: w, height: h });
    await pg.goto('http://localhost:8766/c.html', { waitUntil: 'networkidle0' });
    for (const [n, img, occh, t, s, cta, pos] of C) {
      await pg.evaluate((a) => {
        document.body.style.setProperty('--w', a.w + 'px'); document.body.style.setProperty('--h', a.h + 'px');
        document.body.style.setProperty('--fs', a.fs + 'px'); document.body.style.setProperty('--bot', a.bot + 'px'); document.body.style.setProperty('--top', (a.h > 1500 ? 200 : 56) + 'px');
        const c = document.getElementById('c'); c.style.backgroundImage = `url(unsplash/${a.img})`; c.style.backgroundPosition = a.pos;
        document.getElementById('occh').textContent = a.occh; document.getElementById('t').textContent = a.t;
        document.getElementById('s').textContent = a.s; document.getElementById('cta').innerHTML = a.cta + ' →';
        const ch = document.getElementById('chip'); ch.textContent = a.natale ? 'Prezzo di lancio fino a Natale' : ''; ch.style.display = a.natale ? '' : 'none';
      }, { w, h, fs, bot, img, occh, t, s, cta, pos, natale: NATALE.has(n) });
      await pg.evaluate(async () => { await document.fonts.ready; const i = new Image(); i.src = getComputedStyle(document.getElementById('c')).backgroundImage.slice(5, -2); await i.decode(); });
      await pg.screenshot({ path: `/tmp/crea/out/${n}-${suff}.jpg`, type: 'jpeg', quality: 90 });
    }
  }
  await b.close();
})();
