// Stoppa: stessa sala da gioco della briscola (carte napoletane, inviti, chat, voce), regole sue (punti piccoli, punto grosso, stoppata).
import briscola from "./briscola.js";
export default (args) => briscola({ ...args, gioco: "stoppa" });
