
const uuid = require('uuid');

// const genId = (len=5) => uuid().replace(/-/g, '').slice(0,len);
// const genMessage = () => console.log(`[EXEC] ${Date.now()}: ${genId(3)}`);
const runApp = async function() {
  while(true) {
    const rnd = Math.random();
    if (rnd * rnd > 0.8) { throw new Error('Crash') }

    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1e3)))
  }
}

const startTime = Date.now();
runApp().catch(error => console.log(`Crashed after ${Date.now() - startTime} ms`));