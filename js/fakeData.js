/*
=========================================
ESP32 SIMULATION
=========================================
*/

let greenhouse = {
    temperature: 0,
    humidity: 0,
    relay: false
};


/*
=========================================
Generate Fake Sensor
=========================================
*/

setInterval(()=>{

    greenhouse.temperature += (Math.random()-0.5)*1.2;

    greenhouse.humidity += (Math.random()-0.5)*4;

    greenhouse.temperature=Math.max(20,Math.min(40,greenhouse.temperature));

    greenhouse.humidity=Math.max(40,Math.min(95,greenhouse.humidity));

},2000);