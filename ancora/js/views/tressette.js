// Tressette: stessa sala da gioco della briscola (carte napoletane, inviti, chat), regole sue.
import briscola from "./briscola.js";
export default (args) => briscola({ ...args, gioco: "tressette" });
