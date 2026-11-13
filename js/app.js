
// =========================================================
// 1. FIREBASE IMPORT
// =========================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getDatabase,
    ref,
    onValue,
    set as dbSet,
    off as dbOff,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =========================================================
// 2. FIREBASE CONFIGURATION
// =========================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyAxPO-OEL2cnlQstspnjkyIq-3VOzYK8KM",

    authDomain:
        "greenhouse-firebase-56abd.firebaseapp.com",

    databaseURL:
        "https://greenhouse-firebase-56abd-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "greenhouse-firebase-56abd",

    storageBucket:
        "greenhouse-firebase-56abd.firebasestorage.app",

    messagingSenderId:
        "347929965464",

    appId:
        "1:347929965464:web:36e778ff71f8a370b431ed"

};


// =========================================================
// 3. FIREBASE INITIALIZATION
// =========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);


// =========================================================
// 4. FIREBASE AUTH PERSISTENCE
// =========================================================

setPersistence(
    auth,
    browserLocalPersistence
)
    .then(() => {

        console.log(
            "Firebase Auth persistence aktif"
        );

    })
    .catch((error) => {

        console.error(
            "Auth persistence error:",
            error
        );

    });


// =========================================================
// 5. DOM ELEMENTS
// =========================================================

// -------------------------
// Login
// -------------------------

const loginPage =
    document.getElementById("loginPage");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("emailInput");

const passwordInput =
    document.getElementById("passwordInput");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const logoutButton =
    document.getElementById("logoutButton");


// -------------------------
// Dashboard
// -------------------------

const dashboardPage =
    document.getElementById("dashboardPage");


// -------------------------
// Sensor
// -------------------------

const temp =
    document.getElementById("temp");

const hum =
    document.getElementById("hum");


// -------------------------
// Blower & Heater Status
// -------------------------

const blowerStatus =
    document.getElementById("blowerStatus");

const heaterStatus =
    document.getElementById("heaterStatus");

const fanIcon =
    document.getElementById("fanIcon");

const heaterIcon =
    document.getElementById("heaterIcon");


// -------------------------
// Controls
// -------------------------

const heaterSwitch =
    document.getElementById("heaterSwitch");

const blowerSwitch =
    document.getElementById("blowerSwitch");

const relaySwitch =
    heaterSwitch || document.getElementById("relaySwitch");


// -------------------------
// Event Log
// -------------------------

const eventLog =
    document.getElementById("eventLog");


// -------------------------
// History
// -------------------------

const historyTableBody =
    document.getElementById(
        "historyTableBody"
    );

const historyTable =
    document.getElementById(
        "historyTable"
    );

const downloadHistoryButton =
    document.getElementById(
        "downloadHistoryButton"
    );
const resetHistoryButton =
document.getElementById(
    "resetHistoryButton"
);


// =========================================================
// 6. APPLICATION STATE
// =========================================================

let greenhouse = {

    temperature: 0,

    humidity: 0,

    blower: false,

    heater: false

};


let historyData = {};

// =========================================================
// RESET PROTECTION
// =========================================================

// Reset hanya boleh dilakukan setelah download Excel
let historyDownloadedForReset = false;

// =========================================================
// RESET BUTTON STATE
// =========================================================

function updateResetButtonState() {

    if (!resetHistoryButton) {
        return;
    }

    resetHistoryButton.disabled =
        !historyDownloadedForReset;

    if (historyDownloadedForReset) {

        resetHistoryButton.title =
            "History sudah didownload. Reset tersedia.";

    } else {

        resetHistoryButton.title =
            "Download history terlebih dahulu sebelum reset.";

    }

}


// Current listener

let currentRef = null;

let currentListenerCallback = null;

let currentRefListenerActive = false;


// Control listener

let controlRef = null;

let controlListenerCallback = null;

let controlListenerActive = false;


// History listener

let historyRef = null;

let historyListenerCallback = null;

let historyListenerActive = false;


// =========================================================
// 7. EVENT LOG
// =========================================================

function addLog(text) {

    if (!eventLog) {
        return;
    }

    try {

        const p =
            document.createElement("p");

        const now =
            new Date();

        p.textContent =
            now.toLocaleTimeString(
                "id-ID"
            ) +
            " - " +
            text;

        eventLog.prepend(p);


        // Maksimal 8 event

        while (
            eventLog.children.length > 8
        ) {

            eventLog.removeChild(
                eventLog.lastChild
            );

        }

    } catch (error) {

        console.error(
            "addLog error:",
            error
        );

    }

}


// =========================================================
// 8. HISTORY DATE FORMAT
// =========================================================

function formatHistoryDate(timestamp) {

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return {

            date: "-",

            time: "-"

        };

    }

    return {

        date:
            date.toLocaleDateString(
                "id-ID"
            ),

        time:
            date.toLocaleTimeString(
                "id-ID"
            )

    };

}


// =========================================================
// 9. RENDER HISTORY
// =========================================================

function renderHistory(data) {

    if (!historyTableBody) {

        console.warn(
            "historyTableBody tidak ditemukan"
        );

        return;

    }


    historyData =
        data || {};


    historyTableBody.innerHTML =
        "";


    let entries =
        Object.entries(
            historyData
        );


    // =====================================================
    // EMPTY HISTORY
    // =====================================================

    if (
        entries.length === 0
    ) {

        historyTableBody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="history-empty">

                        <i
                            class="fa-solid fa-database"
                        ></i>

                        <p>
                            Belum ada data history
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    // =====================================================
    // SORT TERBARU -> TERATAS
    // =====================================================

    entries.sort(
        (a, b) => {

            const timeA =
                Number(
                    a[1]?.timestamp ||
                    a[0]
                );

            const timeB =
                Number(
                    b[1]?.timestamp ||
                    b[0]
                );

            return timeB - timeA;

        }
    );


    // =====================================================
    // RENDER TABLE ROW
    // =====================================================

    entries.forEach(
        ([key, item]) => {

            if (!item) {
                return;
            }


            const row =
                document.createElement(
                    "tr"
                );


            const timestamp =
                item.timestamp ||
                Number(key);


            const formatted =
                formatHistoryDate(
                    timestamp
                );


            const temperature =
                Number(
                    item.temperature ?? 0
                );


            const humidity =
                Number(
                    item.humidity ?? 0
                );


            const blower =
                Boolean(
                    item.blower
                );


            const blowerClass =
                blower
                    ? "history-blower-on"
                    : "history-blower-off";


            row.innerHTML = `

                <td>
                    ${formatted.date}
                </td>

                <td>
                    ${formatted.time}
                </td>

                <td>
                    ${temperature.toFixed(1)} °C
                </td>

                <td>
                    ${humidity.toFixed(0)} %
                </td>

                <td>

                    <span
                        class="${blowerClass}"
                    >
                        ${blower ? "ON" : "OFF"}
                    </span>

                </td>

            `;


            historyTableBody.appendChild(
                row
            );

        }
    );


    if (historyTable) {

        historyTable.style.display =
            "table";

    }

}


// =========================================================
// 10. DOWNLOAD HISTORY AS REAL EXCEL (.XLSX)
// =========================================================

function downloadHistoryExcel() {

    try {

        // -------------------------------------------------
        // CEK LIBRARY XLSX
        // -------------------------------------------------

        if (typeof XLSX === "undefined") {

            console.error(
                "Library XLSX tidak ditemukan"
            );

            alert(
                "Library Excel belum tersedia. Silakan refresh halaman."
            );

            return;

        }


        // -------------------------------------------------
        // AMBIL HISTORY
        // -------------------------------------------------

        const entries =
            Object.entries(
                historyData || {}
            );


        if (entries.length === 0) {

            addLog(
                "Tidak ada data history untuk didownload"
            );

            alert(
                "Belum ada data history yang dapat didownload."
            );

            return;

        }


        // -------------------------------------------------
        // SORT LAMA -> TERBARU
        // -------------------------------------------------

        entries.sort(
            (a, b) => {

                const timeA =
                    Number(
                        a[1]?.timestamp ||
                        a[0]
                    );

                const timeB =
                    Number(
                        b[1]?.timestamp ||
                        b[0]
                    );

                return timeA - timeB;

            }
        );


        // -------------------------------------------------
        // DATA EXCEL
        // -------------------------------------------------

        const excelData = [

            [
                "Tanggal",
                "Jam",
                "Temperature (°C)",
                "Humidity (%)",
                "Blower"
            ]

        ];


        entries.forEach(
            ([key, item]) => {

                if (!item) {
                    return;
                }


                const timestamp =
                    item.timestamp ||
                    Number(key);


                const formatted =
                    formatHistoryDate(
                        timestamp
                    );


                const temperature =
                    Number(
                        item.temperature ?? 0
                    );


                const humidity =
                    Number(
                        item.humidity ?? 0
                    );


                const blower =
                    Boolean(
                        item.blower
                    );


                excelData.push([

                    formatted.date,

                    formatted.time,

                    temperature,

                    humidity,

                    blower
                        ? "ON"
                        : "OFF"

                ]);

            }
        );


        // -------------------------------------------------
        // WORKSHEET
        // -------------------------------------------------

        const worksheet =
            XLSX.utils.aoa_to_sheet(
                excelData
            );


        worksheet["!cols"] = [

            { wch: 16 },
            { wch: 14 },
            { wch: 22 },
            { wch: 18 },
            { wch: 12 }

        ];


        // -------------------------------------------------
        // WORKBOOK
        // -------------------------------------------------

        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "History"
        );


        // -------------------------------------------------
        // FILE NAME
        // -------------------------------------------------

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        const filename =
            `Greenhouse_History_${year}-${month}-${day}.xlsx`;


        // -------------------------------------------------
        // DOWNLOAD
        // -------------------------------------------------

        XLSX.writeFile(
            workbook,
            filename
        );


        // -------------------------------------------------
        // IZINKAN RESET
        // -------------------------------------------------

        historyDownloadedForReset =
            true;


        updateResetButtonState();


        addLog(
            "History berhasil didownload sebagai Excel"
        );


        addLog(
            "Reset History sekarang tersedia"
        );


        console.log(
            "Excel berhasil dibuat:",
            filename
        );


    } catch (error) {

        console.error(
            "Gagal membuat file Excel:",
            error
        );


        addLog(
            "Gagal membuat file Excel"
        );


        alert(
            "Gagal membuat file Excel."
        );

    }

}


// =========================================================
// RESET HISTORY
// =========================================================

async function resetHistory() {

    if (!resetHistoryButton) {
        return;
    }


    // -------------------------------------------------
    // SECURITY CHECK
    // -------------------------------------------------

    if (!historyDownloadedForReset) {

        alert(
            "Download data history ke Excel terlebih dahulu sebelum melakukan reset."
        );

        return;

    }


    // -------------------------------------------------
    // CEK DATA
    // -------------------------------------------------

    const entries =
        Object.entries(
            historyData || {}
        );


    if (entries.length === 0) {

        alert(
            "Tidak ada data history yang perlu direset."
        );


        historyDownloadedForReset =
            false;


        updateResetButtonState();

        return;

    }


    // -------------------------------------------------
    // KONFIRMASI
    // -------------------------------------------------

    const confirmed =
        confirm(
            "⚠️ RESET HISTORY\n\n" +
            "Pastikan file Excel sudah berhasil didownload.\n\n" +
            "Semua data History lama akan dihapus dari Firebase.\n\n" +
            "Data sensor saat ini TIDAK akan dihapus.\n\n" +
            "Lanjutkan reset?"
        );


    if (!confirmed) {

        addLog(
            "Reset History dibatalkan"
        );

        return;

    }


    // -------------------------------------------------
    // DISABLE BUTTON
    // -------------------------------------------------

    resetHistoryButton.disabled =
        true;


    const originalHTML =
        resetHistoryButton.innerHTML;


    resetHistoryButton.innerHTML = `

        <i
            class="fa-solid fa-spinner fa-spin"
        ></i>

        <span>
            Resetting...
        </span>

    `;


    try {

        // -------------------------------------------------
        // HAPUS HISTORY FIREBASE
        // -------------------------------------------------

        const historyDatabaseRef =
            ref(
                database,
                "greenhouse/history"
            );


        await remove(
            historyDatabaseRef
        );


        // -------------------------------------------------
        // CLEAR LOCAL DATA
        // -------------------------------------------------

        historyData = {};


        renderHistory(
            {}
        );


        // -------------------------------------------------
        // KUNCI RESET LAGI
        // -------------------------------------------------

        historyDownloadedForReset =
            false;


        updateResetButtonState();


        // -------------------------------------------------
        // LOG
        // -------------------------------------------------

        addLog(
            "History berhasil direset"
        );


        console.log(
            "Firebase history berhasil dihapus"
        );


        alert(
            "History berhasil direset."
        );


    } catch (error) {

        console.error(
            "Reset history error:",
            error
        );


        addLog(
            "Gagal mereset history"
        );


        alert(
            "Gagal mereset history.\n\n" +
            "Silakan coba lagi."
        );


        // Excel sudah pernah didownload,
        // jadi reset tetap boleh dicoba lagi.

        historyDownloadedForReset =
            true;


    } finally {

        resetHistoryButton.innerHTML =
            originalHTML;


        updateResetButtonState();

    }

}

// =========================================================
// 11. DOWNLOAD BUTTON
// =========================================================

downloadHistoryButton?.addEventListener(
    "click",
    downloadHistoryExcel
);

resetHistoryButton?.addEventListener(
    "click",
    resetHistory
);

// Reset harus terkunci saat awal
updateResetButtonState();


// =========================================================
// 12. START HISTORY LISTENER
// =========================================================

function startHistoryListener() {

    if (
        historyListenerActive
    ) {

        return;

    }


    historyRef =
        ref(
            database,
            "greenhouse/history"
        );


    historyListenerCallback =
        (snapshot) => {

            try {

                const data =
                    snapshot.val();


                renderHistory(
                    data
                );


                console.log(
                    "History Firebase:",
                    data
                );

            } catch (error) {

                console.error(
                    "Render history error:",
                    error
                );

            }

        };


    onValue(

        historyRef,

        historyListenerCallback,

        (error) => {

            console.error(
                "History Firebase error:",
                error
            );


            addLog(
                "Gagal membaca history"
            );

        }

    );


    historyListenerActive =
        true;


    console.log(
        "Firebase History listener aktif"
    );

}


// =========================================================
// 13. STOP HISTORY LISTENER
// =========================================================

function stopHistoryListener() {

    if (
        !historyListenerActive ||
        !historyRef ||
        !historyListenerCallback
    ) {

        return;

    }


    dbOff(
        historyRef,
        "value",
        historyListenerCallback
    );


    historyRef = null;

    historyListenerCallback = null;

    historyListenerActive = false;


    console.log(
        "Firebase History listener dihentikan"
    );

}


// =========================================================
// 14. CHART.JS
// =========================================================

let tempChart = null;

let humChart = null;


// =========================================================
// TEMPERATURE CHART
// =========================================================

const tempCanvas =
    document.getElementById(
        "tempChart"
    );


if (tempCanvas) {

    tempChart =
        new Chart(
            tempCanvas,
            {

                type: "line",

                data: {

                    labels: [],

                    datasets: [

                        {

                            label:
                                "Temperature",

                            data: [],

                            borderColor:
                                "#22c55e",

                            backgroundColor:
                                "rgba(34,197,94,0.15)",

                            fill: true,

                            tension: 0.4,

                            pointRadius: 2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: false,

                    scales: {

                        y: {

                            min: 20,

                            max: 40,

                            ticks: {

                                color:
                                    "#ffffff"

                            },

                            grid: {

                                color:
                                    "#334155"

                            }

                        },

                        x: {

                            ticks: {

                                color:
                                    "#ffffff"

                            },

                            grid: {

                                color:
                                    "#334155"

                            }

                        }

                    },

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#ffffff"

                            }

                        }

                    }

                }

            }
        );

}


// =========================================================
// HUMIDITY CHART
// =========================================================

const humCanvas =
    document.getElementById(
        "humChart"
    );


if (humCanvas) {

    humChart =
        new Chart(
            humCanvas,
            {

                type: "line",

                data: {

                    labels: [],

                    datasets: [

                        {

                            label:
                                "Humidity",

                            data: [],

                            borderColor:
                                "#38bdf8",

                            backgroundColor:
                                "rgba(56,189,248,0.15)",

                            fill: true,

                            tension: 0.4,

                            pointRadius: 2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: false,

                    scales: {

                        y: {

                            min: 40,

                            max: 100,

                            ticks: {

                                color:
                                    "#ffffff"

                            },

                            grid: {

                                color:
                                    "#334155"

                            }

                        },

                        x: {

                            ticks: {

                                color:
                                    "#ffffff"

                            },

                            grid: {

                                color:
                                    "#334155"

                            }

                        }

                    },

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#ffffff"

                            }

                        }

                    }

                }

            }
        );

}


// =========================================================
// 15. UPDATE DASHBOARD
// =========================================================

function updateDashboard() {

    try {

        // -------------------------------------------------
        // Temperature
        // -------------------------------------------------

        if (temp) {

            temp.textContent =
                greenhouse.temperature.toFixed(
                    1
                ) +
                " °C";

        }


        // -------------------------------------------------
        // Humidity
        // -------------------------------------------------

        if (hum) {

            hum.textContent =
                greenhouse.humidity.toFixed(
                    0
                ) +
                " %";

        }


        // -------------------------------------------------
        // Blower
        // -------------------------------------------------

        if (blowerStatus) {

            blowerStatus.textContent =
                greenhouse.blower
                    ? "ON"
                    : "OFF";

        }


        // -------------------------------------------------
        // Fan icon
        // -------------------------------------------------

        if (fanIcon) {

            fanIcon.style.color =
                greenhouse.blower
                    ? "#22c55e"
                    : "#94a3b8";

        }


        // -------------------------------------------------
        // Blower toggle
        // -------------------------------------------------

        if (blowerSwitch) {

            blowerSwitch.checked =
                greenhouse.blower;

        }


        // -------------------------------------------------
        // Heater
        // -------------------------------------------------

        if (heaterStatus) {

            heaterStatus.textContent =
                greenhouse.heater
                    ? "ON"
                    : "OFF";

        }


        // -------------------------------------------------
        // Heater icon
        // -------------------------------------------------

        if (heaterIcon) {

            heaterIcon.style.color =
                greenhouse.heater
                    ? "#f97316"
                    : "#94a3b8";

        }


        // -------------------------------------------------
        // Heater toggle
        // -------------------------------------------------

        if (heaterSwitch) {

            heaterSwitch.checked =
                greenhouse.heater;

        }


        // -------------------------------------------------
        // Current time
        // -------------------------------------------------

        const time =
            new Date().toLocaleTimeString(
                "id-ID"
            );


        // -------------------------------------------------
        // Temperature Chart
        // -------------------------------------------------

        if (tempChart) {

            tempChart.data.labels.push(
                time
            );


            tempChart.data.datasets[0]
                .data.push(
                    greenhouse.temperature
                );


            if (
                tempChart.data.labels.length > 15
            ) {

                tempChart.data.labels.shift();

                tempChart.data.datasets[0]
                    .data.shift();

            }


            tempChart.update(
                "none"
            );

        }


        // -------------------------------------------------
        // Humidity Chart
        // -------------------------------------------------

        if (humChart) {

            humChart.data.labels.push(
                time
            );


            humChart.data.datasets[0]
                .data.push(
                    greenhouse.humidity
                );


            if (
                humChart.data.labels.length > 15
            ) {

                humChart.data.labels.shift();

                humChart.data.datasets[0]
                    .data.shift();

            }


            humChart.update(
                "none"
            );

        }

    } catch (error) {

        console.error(
            "updateDashboard error:",
            error
        );

    }

}


// =========================================================
// 16. START CURRENT DATA LISTENER
// =========================================================

function startDatabaseListener() {

    if (
        currentRefListenerActive
    ) {

        return;

    }


    currentRef =
        ref(
            database,
            "greenhouse/current"
        );


    currentListenerCallback =
        (snapshot) => {

            try {

                const data =
                    snapshot.val();


                if (!data) {

                    console.warn(
                        "greenhouse/current kosong"
                    );

                    return;

                }


                greenhouse.temperature =
                    Number(
                        data.temperature ?? 0
                    );


                greenhouse.humidity =
                    Number(
                        data.humidity ?? 0
                    );


                greenhouse.blower =
                    Boolean(
                        data.blower
                    );


                greenhouse.heater =
                    Boolean(
                        data.heater !== undefined
                            ? data.heater
                            : data.relay
                    );


                updateDashboard();

            } catch (error) {

                console.error(
                    "Current data error:",
                    error
                );

            }

        };


    onValue(

        currentRef,

        currentListenerCallback,

        (error) => {

            console.error(
                "Firebase current error:",
                error
            );


            addLog(
                "Gagal membaca data sensor"
            );

        }

    );


    currentRefListenerActive =
        true;

    console.log(
        "Firebase Current listener aktif"
    );


    // -------------------------------------------------
    // Control Listener (Keep switches synchronized)
    // -------------------------------------------------

    if (!controlListenerActive) {

        controlRef =
            ref(
                database,
                "greenhouse/control"
            );

        controlListenerCallback =
            (snapshot) => {

                try {

                    const controlData =
                        snapshot.val();

                    if (!controlData) {
                        return;
                    }

                    if (controlData.heater !== undefined || controlData.relay !== undefined) {
                        const hVal = Boolean(controlData.heater !== undefined ? controlData.heater : controlData.relay);
                        if (heaterSwitch && !heaterSwitch.disabled) {
                            heaterSwitch.checked = hVal;
                        }
                    }

                    if (controlData.blower !== undefined) {
                        const bVal = Boolean(controlData.blower);
                        if (blowerSwitch && !blowerSwitch.disabled) {
                            blowerSwitch.checked = bVal;
                        }
                    }

                } catch (err) {
                    console.error("Control listener error:", err);
                }

            };

        onValue(
            controlRef,
            controlListenerCallback
        );

        controlListenerActive = true;

        console.log("Firebase Control listener aktif");

    }

}


// =========================================================
// 17. STOP CURRENT DATA LISTENER
// =========================================================

function stopDatabaseListener() {

    if (
        currentRefListenerActive &&
        currentRef &&
        currentListenerCallback
    ) {

        dbOff(
            currentRef,
            "value",
            currentListenerCallback
        );

        currentRef = null;
        currentListenerCallback = null;
        currentRefListenerActive = false;
        console.log("Firebase Current listener dihentikan");

    }

    if (
        controlListenerActive &&
        controlRef &&
        controlListenerCallback
    ) {

        dbOff(
            controlRef,
            "value",
            controlListenerCallback
        );

        controlRef = null;
        controlListenerCallback = null;
        controlListenerActive = false;
        console.log("Firebase Control listener dihentikan");

    }

}


// =========================================================
// 18. HEATER CONTROL (OLD BUTTON RENAMED)
// =========================================================

heaterSwitch?.addEventListener(
    "change",
    async () => {

        const newValue =
            heaterSwitch.checked;


        const heaterRef =
            ref(
                database,
                "greenhouse/control/heater"
            );

        const relayRef =
            ref(
                database,
                "greenhouse/control/relay"
            );


        heaterSwitch.disabled =
            true;


        try {

            await Promise.all([
                dbSet(heaterRef, newValue),
                dbSet(relayRef, newValue)
            ]);


            addLog(
                "Heater diubah menjadi " +
                (
                    newValue
                        ? "ON"
                        : "OFF"
                )
            );


            console.log(
                "Heater command:",
                newValue
            );

        } catch (error) {

            console.error(
                "Heater write error:",
                error
            );


            addLog(
                "Gagal mengubah status heater"
            );


            heaterSwitch.checked =
                greenhouse.heater;

        } finally {

            heaterSwitch.disabled =
                false;

        }

    }
);


// =========================================================
// 18b. BLOWER CONTROL (NEW BUTTON BELOW OLD)
// =========================================================

blowerSwitch?.addEventListener(
    "change",
    async () => {

        const newValue =
            blowerSwitch.checked;


        const blowerRef =
            ref(
                database,
                "greenhouse/control/blower"
            );


        blowerSwitch.disabled =
            true;


        try {

            await dbSet(
                blowerRef,
                newValue
            );


            addLog(
                "Blower diubah menjadi " +
                (
                    newValue
                        ? "ON"
                        : "OFF"
                )
            );


            console.log(
                "Blower command:",
                newValue
            );

        } catch (error) {

            console.error(
                "Blower write error:",
                error
            );


            addLog(
                "Gagal mengubah status blower"
            );


            blowerSwitch.checked =
                greenhouse.blower;

        } finally {

            blowerSwitch.disabled =
                false;

        }

    }
);


// =========================================================
// 19. LOGIN
// =========================================================

loginForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (loginError) {

            loginError.textContent =
                "";

        }


        const email =
            emailInput?.value
                ?.trim() || "";


        const password =
            passwordInput?.value || "";


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !email ||
            !password
        ) {

            if (loginError) {

                loginError.textContent =
                    "Email dan password wajib diisi.";

            }

            return;

        }


        // -------------------------------------------------
        // LOADING
        // -------------------------------------------------

        if (loginButton) {

            loginButton.disabled =
                true;


            loginButton.innerHTML = `

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                <span>
                    Login...
                </span>

            `;

        }


        try {

            console.log(
                "Mencoba login:",
                email
            );


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            console.log(
                "Login Firebase berhasil"
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            if (loginError) {

                switch (
                    error.code
                ) {

                    case "auth/invalid-credential":

                        loginError.textContent =
                            "Email atau password salah.";

                        break;


                    case "auth/invalid-email":

                        loginError.textContent =
                            "Format email tidak valid.";

                        break;


                    case "auth/user-not-found":

                        loginError.textContent =
                            "Akun tidak ditemukan.";

                        break;


                    case "auth/wrong-password":

                        loginError.textContent =
                            "Password salah.";

                        break;


                    case "auth/too-many-requests":

                        loginError.textContent =
                            "Terlalu banyak percobaan. Coba lagi nanti.";

                        break;


                    case "auth/network-request-failed":

                        loginError.textContent =
                            "Koneksi internet bermasalah.";

                        break;


                    default:

                        loginError.textContent =
                            "Login gagal: " +
                            (
                                error.code ||
                                "unknown-error"
                            );

                        break;

                }

            }

        } finally {

            if (loginButton) {

                loginButton.disabled =
                    false;


                loginButton.innerHTML = `

                    <i
                        class="fa-solid fa-right-to-bracket"
                    ></i>

                    <span>
                        Login
                    </span>

                `;

            }

        }

    }
);


// =========================================================
// 20. LOGOUT
// =========================================================

logoutButton?.addEventListener(
    "click",
    async () => {

        if (logoutButton) {

            logoutButton.disabled =
                true;

        }


        try {

            addLog(
                "Logout..."
            );


            await signOut(
                auth
            );


            console.log(
                "Logout Firebase berhasil"
            );


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            addLog(
                "Logout gagal"
            );


            if (logoutButton) {

                logoutButton.disabled =
                    false;

            }

        }

    }
);


// =========================================================
// 21. AUTH STATE
// =========================================================

onAuthStateChanged(
    auth,
    (user) => {

        console.log(
            "Auth state:",
            user
                ? user.email
                : "BELUM LOGIN"
        );


        // =================================================
        // USER LOGIN
        // =================================================

        if (user) {

            console.log(
                "Authenticated:",
                user.email
            );


            console.log(
                "UID:",
                user.uid
            );


            // Hide login

            if (loginPage) {

                loginPage.style.display =
                    "none";

            }


            // Show dashboard

            if (dashboardPage) {

                dashboardPage.style.display =
                    "block";

            }


            // Clear error

            if (loginError) {

                loginError.textContent =
                    "";

            }


            // Start Firebase listeners

            startDatabaseListener();

            startHistoryListener();


            // Initial update

            updateDashboard();


            addLog(
                "Login berhasil"
            );

        }


        // =================================================
        // USER LOGOUT / BELUM LOGIN
        // =================================================

        else {

            console.log(
                "User belum login"
            );


            // Stop listeners

            stopDatabaseListener();

            stopHistoryListener();


            // Hide dashboard

            if (dashboardPage) {

                dashboardPage.style.display =
                    "none";

            }


            // Show login

            if (loginPage) {

                loginPage.style.display =
                    "flex";

            }


            // Reset password

            if (passwordInput) {

                passwordInput.value =
                    "";

            }


            // Enable logout

            if (logoutButton) {

                logoutButton.disabled =
                    false;

            }

        }

    }
);


// =========================================================
// 22. INITIAL MESSAGE
// =========================================================

console.log(
    "================================="
);

console.log(
    "GREENHOUSE DASHBOARD STARTED"
);

console.log(
    "Firebase Auth + RTDB aktif"
);

console.log(
    "History Excel XLSX aktif"
);

console.log(
    "================================="
);


// =========================================================
// 23. SCADA VISUALS & DYNAMIC DAY/NIGHT AMBIENCE
// =========================================================

function updateScadaTimeAmbience() {
    try {
        const now = new Date();
        const hour = now.getHours();
        const scadaContainer = document.getElementById("scadaContainer");
        const scadaTimeBadge = document.getElementById("scadaTimeBadge");
        const scadaAmbienceText = document.getElementById("scadaAmbienceText");

        let timeClass = "time-day";
        let iconClass = "fa-sun";
        let badgeLabel = "Siang";
        let ambienceDesc = "Siang (Optimal Solar Dryer)";

        if (hour >= 5 && hour < 11) {
            timeClass = "time-morning";
            iconClass = "fa-cloud-sun";
            badgeLabel = "Pagi";
            ambienceDesc = "Pagi (Pemanasan Awal)";
        } else if (hour >= 11 && hour < 15) {
            timeClass = "time-day";
            iconClass = "fa-sun";
            badgeLabel = "Siang";
            ambienceDesc = "Siang (Radiasi Maksimal)";
        } else if (hour >= 15 && hour < 18) {
            timeClass = "time-afternoon";
            iconClass = "fa-cloud-sun-rain";
            badgeLabel = "Sore";
            ambienceDesc = "Sore (Golden Hour)";
        } else {
            timeClass = "time-night";
            iconClass = "fa-moon";
            badgeLabel = "Malam";
            ambienceDesc = "Malam (Pemanas Blower)";
        }

        if (scadaContainer) {
            scadaContainer.classList.remove("time-morning", "time-day", "time-afternoon", "time-night");
            scadaContainer.classList.add(timeClass);
        }
        if (scadaTimeBadge) {
            scadaTimeBadge.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${badgeLabel}</span>`;
        }
        if (scadaAmbienceText) {
            scadaAmbienceText.textContent = ambienceDesc;
        }
    } catch (e) {
        console.error("SCADA Time Ambience Error:", e);
    }
}

function updateSCADAVisuals(data) {
    if (!data) return;
    try {
        const scadaTempVal = document.getElementById("scadaTempVal");
        const scadaHumVal  = document.getElementById("scadaHumVal");
        if (scadaTempVal && data.temperature !== undefined) {
            scadaTempVal.textContent = Number(data.temperature).toFixed(1) + " °C";
        }
        if (scadaHumVal && data.humidity !== undefined) {
            scadaHumVal.textContent = Number(data.humidity).toFixed(0) + " %";
        }

        const scadaFanBlade = document.getElementById("scadaFanBlade");
        const scadaAirflowWave = document.getElementById("scadaAirflowWave");
        const scadaBlowerTag = document.getElementById("scadaBlowerTag");
        const scadaBlowerStateText = document.getElementById("scadaBlowerStateText");

        const isBlowerOn = Boolean(data.blower);

        if (isBlowerOn) {
            if (scadaFanBlade) scadaFanBlade.classList.add("spinning");
            if (scadaAirflowWave) {
                scadaAirflowWave.classList.remove("scada-flow-off");
                scadaAirflowWave.classList.add("scada-flow-on");
            }
            if (scadaBlowerTag) {
                scadaBlowerTag.textContent = "RUNNING (ON)";
                scadaBlowerTag.setAttribute("fill", "#10b981");
            }
            if (scadaBlowerStateText) {
                scadaBlowerStateText.textContent = "Aktif (Mengeringkan)";
                scadaBlowerStateText.className = "strip-value text-green";
            }
        } else {
            if (scadaFanBlade) scadaFanBlade.classList.remove("spinning");
            if (scadaAirflowWave) {
                scadaAirflowWave.classList.remove("scada-flow-on");
                scadaAirflowWave.classList.add("scada-flow-off");
            }
            if (scadaBlowerTag) {
                scadaBlowerTag.textContent = "STANDBY (OFF)";
                scadaBlowerTag.setAttribute("fill", "#ef4444");
            }
            if (scadaBlowerStateText) {
                scadaBlowerStateText.textContent = "OFF (Mati)";
                scadaBlowerStateText.className = "strip-value text-red";
            }
        }
    } catch (e) {
        console.error("SCADA Visuals Sync Error:", e);
    }
}

// Hook updateDashboard to sync SCADA
if (typeof updateDashboard === "function") {
    const originalUpdateDashboard = updateDashboard;
    updateDashboard = function() {
        originalUpdateDashboard();
        updateSCADAVisuals(greenhouse);
        updateScadaTimeAmbience();
    };
}

updateScadaTimeAmbience();
setInterval(updateScadaTimeAmbience, 30000);
