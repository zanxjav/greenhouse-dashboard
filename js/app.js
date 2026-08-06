

let greenhouse={

temperature:0,

humidity:0,

blower:false

}

/*
=========================================
ELEMENT
=========================================
*/

const temp=document.getElementById("temp");

const hum=document.getElementById("hum");

const blower=document.getElementById("blowerStatus");

const relay=document.getElementById("relaySwitch");

const fan=document.getElementById("fanIcon");

const log=document.getElementById("eventLog");


/*
=========================================
ADD LOG
=========================================
*/

function addLog(text){

    const p=document.createElement("p");

    const now=new Date();

    p.innerHTML=
    now.toLocaleTimeString()+
    " - "+
    text;

    log.prepend(p);

    if(log.children.length>8){

        log.removeChild(log.lastChild);

    }

}

/*
=========================================
UPDATE DASHBOARD
=========================================
*/

console.log("temp :", temp);
console.log("hum :", hum);
console.log("blower :", blower);
console.log("relay :", relay);
console.log("fan :", fan);

function updateDashboard(){

    temp.innerHTML =
    greenhouse.temperature.toFixed(1)+" °C";

    hum.innerHTML =
    greenhouse.humidity.toFixed(0)+" %";

    blower.innerHTML =
    greenhouse.blower ? "ON" : "OFF";

    relay.checked =
    greenhouse.blower;

    fan.style.color =
    greenhouse.blower ? "#22c55e" : "#94a3b8";

    const time = new Date().toLocaleTimeString();

    tempChart.data.labels.push(time);
    humChart.data.labels.push(time);

    tempChart.data.datasets[0].data.push(greenhouse.temperature);
    humChart.data.datasets[0].data.push(greenhouse.humidity);

    if(tempChart.data.labels.length > 15){

    tempChart.data.labels.shift();
    humChart.data.labels.shift();

    tempChart.data.datasets[0].data.shift();
    humChart.data.datasets[0].data.shift();

}

tempChart.update();
humChart.update();

}


/*
=========================================
TEMPERATURE CHART
=========================================
*/

const tempChart = new Chart(document.getElementById("tempChart"),{

    type:"line",

    data:{

        labels:[],

        datasets:[{

            label:"Temperature",

            data:[],

            borderColor:"#22c55e",

            backgroundColor:"rgba(34,197,94,0.2)",

            fill:true,

            tension:0.4

        }]

    },

    options:{

        responsive:true,

        animation:false,

        scales:{

            y:{

                min:20,

                max:40,

                ticks:{
                    color:"white"
                },

                grid:{
                    color:"#334155"
                }

            },

            x:{

                ticks:{
                    color:"white"
                },

                grid:{
                    color:"#334155"
                }

            }

        },

        plugins:{

            legend:{

                labels:{
                    color:"white"
                }

            }

        }

    }

});


/*
=========================================
HUMIDITY CHART
=========================================
*/

const humChart = new Chart(document.getElementById("humChart"),{

    type:"line",

    data:{

        labels:[],

        datasets:[{

            label:"Humidity",

            data:[],

            borderColor:"#38bdf8",

            backgroundColor:"rgba(56,189,248,0.2)",

            fill:true,

            tension:0.4

        }]

    },

    options:{

        responsive:true,

        animation:false,

        scales:{

            y:{

                min:40,

                max:100,

                ticks:{
                    color:"white"
                },

                grid:{
                    color:"#334155"
                }

            },

            x:{

                ticks:{
                    color:"white"
                },

                grid:{
                    color:"#334155"
                }

            }

        },

        plugins:{

            legend:{

                labels:{
                    color:"white"
                }

            }

        }

    }

});
