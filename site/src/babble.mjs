// ES module entry for the web module. It runs engine.js (which sets globalThis.Babble) and re-exports the API.
import './engine.js';
const B = globalThis.Babble;
export const { version, render, toWav, play, styles } = B;
export default B;
