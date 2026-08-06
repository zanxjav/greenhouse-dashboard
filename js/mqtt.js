// =============================
// MQTT CONFIG
// =============================
const broker =
'wss://05c19929ecfa4843b02b7ef1156a7cb0.s1.eu.hivemq.cloud:8884/mqtt';

const options = {

    username: 'greenhouse',

    password: 'itera123',

    clean: true,

    reconnectPeriod: 2000,

    connectTimeout: 10000,

    clientId:
        'dashboard_' +
        Math.random().toString(16).substr(2,8)

};

// =============================
// CONNECT
// =============================
const client = mqtt.connect(
    broker,
    options
);

// =============================
// CONNECTED
// =============================
client.on("connect",()=>{

    console.log("MQTT CONNECTED");
    console.log(client.options.clientId);

    document.querySelector(".connection").innerHTML =
    "<span class='dot'></span> Online";

    addLog("MQTT Connected");

    client.subscribe("greenhouse/relay");
    client.subscribe("greenhouse/data");
    client.subscribe("greenhouse/relay");
});

// =============================
// RECONNECT
// =============================
client.on("reconnect",()=>{

    console.log("MQTT RECONNECTING...");
    addLog("MQTT Reconnecting...");

});

// =============================
// DISCONNECT
// =============================
client.on("close",()=>{

    console.log("MQTT DISCONNECTED");

    document.querySelector(".connection").innerHTML =
    "<span class='dot'></span> Offline";

});

// =============================
// OFFLINE
// =============================
client.on("offline",()=>{

    console.log("MQTT OFFLINE");
    addLog("MQTT Offline");

});

// =============================
// ERROR
// =============================
client.on("error",(err)=>{

    console.log(err);

});

// =============================
// RECEIVE
// =============================
client.on("message",(topic,message)=>{

    const value = message.toString();

    console.log("TOPIC :", topic);
    console.log("PAYLOAD :", value);

    if(topic === "greenhouse/data"){

        const data = JSON.parse(value);

        greenhouse.temperature = data.temperature;
        greenhouse.humidity = data.humidity;
        greenhouse.blower = data.relay;

        updateDashboard();

    }

    else if(topic === "greenhouse/relay"){

        greenhouse.blower = (value === "ON");

        updateDashboard();

    }

});

// =============================
// RELAY SWITCH
// =============================
document
.getElementById("relaySwitch")
.addEventListener("change", function () {

    if (!client.connected) {
        addLog("MQTT belum terkoneksi!");
        this.checked = !this.checked;
        return;
    }

    const cmd = this.checked ? "ON" : "OFF";

    client.publish(
        "greenhouse/relay",
        cmd,
        { qos: 1 },
        function(err){

            if(err){
                addLog("Gagal kirim relay");
                console.log(err);
            }else{
                addLog("Relay -> " + cmd);
            }

        }

    );

});
