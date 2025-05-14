const { resolve } = require('path');

const flog = require('./dist/index.cjs').default

//flog.style('cyan bold underline italic', 'Hello, World!');



async function main(){

    //Use Spinners to wait for single promise
    flog.loader(new Promise(resolve=>setTimeout(()=>resolve(), 1300)),'Waiting for response.');
    flog.loader(new Promise(resolve=>setTimeout(()=>resolve(), 1500)), 'Waiting for response', 'Response Received', 'Request Failed'); //Custom success and fail messages.
    // ⚠️ Do not use await while passing promise to loader function. flog.loader(await fetch...) ❌

    //Using multiple promises for Percentage Animation
    const responses = await flog.loader([
        new Promise(resolve=>setTimeout(()=>resolve({data: '...'}), 2300)),
        new Promise(resolve=>setTimeout(()=>resolve({data: '...'}), 2700)),
        new Promise((resolve, reject)=>setTimeout(()=>reject({error: '...'}), 3000)),
        new Promise(resolve=>setTimeout(()=>resolve({data: '...'}), 3300)),
        //Other operations
    ], 'Updating Data...');
    console.log('Responses:', responses);
}
main();
