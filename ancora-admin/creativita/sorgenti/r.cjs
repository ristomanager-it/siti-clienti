const p = require('/opt/npm-tools/node_modules/puppeteer');
const C = [
 ["01-storie-di-casa","colazione.jpg","Una domanda a settimana","Le storie di casa, raccontate da chi le ha vissute.","Ognuno risponde quando vuole, anche a voce. E a fine anno diventa un libro.","Regala la storia della tua famiglia","50% 50%"],
 ["02-tu-che-avresti-fatto","compiti.jpg","Per chi conta davvero","«Nonno, tu che avresti fatto?»","Le sue storie, le sue scelte, il suo modo di ragionare. In un posto solo vostro.","Scopri Ancora","22% 30%"],
 ["03-scatola","foto.jpg","Il cloud dei tuoi ricordi","Le foto di famiglia meritano più di una scatola.","Foto, video, voci e storie al sicuro, solo per voi. Niente pubblicità, niente estranei.","Inizia gratis","40% 50%"],
 ["04-regalo-natale","nonna-nipote.jpg","Il regalo di Natale che resta","La storia della tua famiglia.","Un anno per raccontarla insieme. E alla fine la tenete in mano: un libro, un film, le voci.","Regalala · 99 € <s>129 €</s>","45% 40%"],
 ["05-facile","selfie.jpg","Facile come una chat","Anche per il nonno.","Foto, storie e vocali in un posto solo della famiglia. Glielo fate vedere voi, poi va da solo.","Inizia gratis","72% 40%"],
 ["06-ricette","panettone.jpg","Il ricettario di casa","Le ricette di famiglia, con la voce di chi le fa.","Le dosi giuste, i trucchi, le storie dietro ogni piatto. Per sempre in famiglia.","Scopri Ancora","50% 40%"],
 ["07-buonanotte","letto.jpg","Le storie di famiglia","Le storie della buonanotte, raccontate da chi c'era.","Registrate una volta, si riascoltano tutte le sere. Anche quando i nonni sono lontani.","Regala la storia della tua famiglia","50% 35%"],
];
const NATALE = new Set(["01-storie-di-casa","04-regalo-natale","07-buonanotte"]);
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
