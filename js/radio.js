// ════════════════════════════════════════════════════
//  RADIO — بث مباشر إذاعة القرآن
// ════════════════════════════════════════════════════
const RADIO_URL = "https://stream.radiojar.com/8s5u5tpdtwzuv";

function startRadio() {
  RADIO.audio.pause();
  RADIO.audio.src = RADIO_URL;
  RADIO.audio.play().then(() => {
    RADIO.playing = true;
    updateRadioUI(true);
  }).catch(() => {
    RADIO.playing = false;
    showRadioToast("⚠️ تعذّر الاتصال بالبث");
  });
}

function stopRadio() {
  RADIO.audio.pause();
  RADIO.audio.src = "";
  RADIO.playing = false;
  updateRadioUI(false);
}

function updateRadioUI(playing) {
  const fab = document.getElementById("radioFab");
  const dot = document.getElementById("radioDot");
  const icon = document.getElementById("radioFabIcon");
  if (!fab) return;
  if (playing) {
    fab.classList.add("playing");
    if (dot) dot.classList.add("on");
    if (icon) icon.className = "fa-solid fa-stop";
    showRadioToast("🎙️ إذاعة القرآن الكريم — بث مباشر");
  } else {
    fab.classList.remove("playing");
    if (dot) dot.classList.remove("on");
    if (icon) icon.className = "fa-solid fa-radio";
    showRadioToast("⏹ تم إيقاف البث");
  }
}

function toggleRadio() {
  if (RADIO.playing) stopRadio();
  else startRadio();
}

let _radioToastTimer = null;
function showRadioToast(msg) {
  let toast = document.getElementById("radioToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "radioToast";
    toast.className = "radio-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(_radioToastTimer);
  _radioToastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
