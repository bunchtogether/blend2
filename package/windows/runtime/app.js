
const runApp = async function () {
  while (true) { //eslint-disable-line
    // const rnd = Math.random();
    // if (rnd * rnd > 0.8) { throw new Error('Crash'); }
    const sleepTime = Math.floor(Math.random() * 1e3);
    console.log(`Sleeping for ${sleepTime} ms`); // eslint-disable-line
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
  }
};

const startTime = Date.now();
runApp().catch((error) => console.log(`Crashed after ${Date.now() - startTime} ms`)); //eslint-disable-line
