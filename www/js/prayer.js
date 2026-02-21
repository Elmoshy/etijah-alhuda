/**
 * PrayerCalc — حساب مواقيت الصلاة بدون إنترنت
 * Based on standard astronomical algorithm (Praytimes.org method)
 * يدعم كل طرق الحساب المستخدمة في aladhan.com
 */
const PrayerCalc = (() => {
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  /* ── طرق الحساب ── */
  const METHODS = {
    1:  { fajr: 18,   isha: 17,   ishaMin: null }, // MWL
    2:  { fajr: 15,   isha: 15,   ishaMin: null }, // ISNA
    3:  { fajr: 18,   isha: 17,   ishaMin: null }, // Iraq-MWL
    4:  { fajr: 18.5, isha: null, ishaMin: 90   }, // أم القرى
    5:  { fajr: 19.5, isha: 17.5, ishaMin: null }, // الهيئة المصرية
    7:  { fajr: 17.7, isha: 14,   ishaMin: null }, // طهران
    8:  { fajr: 19.5, isha: null, ishaMin: 90   }, // الخليج
    9:  { fajr: 18,   isha: 17.5, ishaMin: null }, // الكويت
    10: { fajr: 18,   isha: null, ishaMin: 90   }, // قطر
    11: { fajr: 20,   isha: 18,   ishaMin: null }, // سنغافورة
    12: { fajr: 12,   isha: 12,   ishaMin: null }, // فرنسا UOIF
    13: { fajr: 18,   isha: 17,   ishaMin: null }, // تركيا
  };

  /* ── المنطقة الزمنية لكل دولة ── */
  // null = يأخذ التوقيت من الجهاز تلقائياً (مهم للدول اللي عندها توقيت صيفي)
  const COUNTRY_TZ = {
    "Egypt": null,        // UTC+2 شتاء / UTC+3 صيف — من الجهاز
    "Saudi Arabia": 3,
    "United Arab Emirates": 4,
    "Kuwait": 3, "Qatar": 3, "Bahrain": 3, "Oman": 4,
    "Jordan": null,       // UTC+2/+3
    "Lebanon": null,      // UTC+2/+3
    "Palestine": null,    // UTC+2/+3
    "Syria": null,        // UTC+2/+3
    "Iraq": 3,
    "Yemen": 3,
    "Morocco": null,      // UTC+0/+1
    "Algeria": 1,
    "Tunisia": 1,
    "Libya": 2,
    "Sudan": 3,
  };

  /* ── تحويل التاريخ ← رقم جوليان ── */
  function toJD(date) {
    const Y = date.getFullYear(), M = date.getMonth() + 1, D = date.getDate();
    return 367*Y - Math.floor(7*(Y + Math.floor((M+9)/12))/4) +
           Math.floor(275*M/9) + D + 1721013.5;
  }

  /* ── موقع الشمس (ميل + معادلة الوقت) ── */
  function sunPos(jd) {
    const d  = jd - 2451545.0;
    const g  = 357.529 + 0.98560028 * d;          // الشذوذ الوسطي
    const q  = 280.459 + 0.98564736 * d;          // الطول الوسطي
    const L  = q + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD);
    const e  = 23.439 - 0.00000036 * d;           // ميل مستوى الانقلاب
    const RA = Math.atan2(Math.cos(e*RAD)*Math.sin(L*RAD), Math.cos(L*RAD)) * DEG;
    const D  = Math.asin(Math.sin(e*RAD) * Math.sin(L*RAD)) * DEG; // الميل
    const EqT = (q - RA) / 15;                    // معادلة الوقت (ساعة)
    return { D, EqT };
  }

  /* ── وقت منتصف النهار ── */
  function midDay(jd, lon, tz) {
    const { EqT } = sunPos(jd);
    return 12 - EqT - lon/15 + tz;
  }

  /* ── وقت زاوية الشمس تحت الأفق ── */
  function angleTime(decl, lat, angle, md, dir) {
    const cosH = (-Math.sin(angle*RAD) - Math.sin(lat*RAD)*Math.sin(decl*RAD)) /
                 (Math.cos(lat*RAD) * Math.cos(decl*RAD));
    if (Math.abs(cosH) > 1) return null; // لا يحدث (قطبي)
    const h = Math.acos(cosH) * DEG / 15;
    return dir === 'ccw' ? md - h : md + h;
  }

  /* ── وقت العصر (شافعي: ظل=1، حنفي: ظل=2) ── */
  function asrTime(decl, lat, factor, md) {
    const angle = -Math.atan(1 / (factor + Math.tan(Math.abs(lat - decl)*RAD))) * DEG;
    return angleTime(decl, lat, angle, md, 'cw');
  }

  /* ── تحويل الرقم العشري ← hh:mm ── */
  function toHHMM(h) {
    if (h === null || isNaN(h)) return '00:00';
    h = ((h % 24) + 24) % 24;
    const hh = Math.floor(h);
    let mm = Math.round((h - hh) * 60);
    const fh = mm === 60 ? hh + 1 : hh;
    mm = mm === 60 ? 0 : mm;
    return String(fh % 24).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
  }

  /* ════════════════════════════════
     الدالة الرئيسية
     date  : Date object
     lat   : خط عرض
     lon   : خط طول
     methodNum : رقم طريقة الحساب
     countryEn : اسم الدولة بالإنجليزية
  ════════════════════════════════ */
  function calculate(date, lat, lon, methodNum, countryEn) {
    const m  = METHODS[methodNum] || METHODS[5];
    const tzFixed = COUNTRY_TZ[countryEn];
    const tz = (tzFixed !== null && tzFixed !== undefined)
               ? tzFixed
               : -(new Date().getTimezoneOffset() / 60); // من الجهاز تلقائياً
    const jd = toJD(date);
    const { D: decl } = sunPos(jd);
    const md = midDay(jd, lon, tz);

    const fajr    = angleTime(decl, lat, m.fajr,  md, 'ccw');
    const sunrise = angleTime(decl, lat, 0.833,    md, 'ccw');
    const dhuhr   = md + 0.0333;
    const asr     = asrTime(decl, lat, 1, md);
    const maghrib = angleTime(decl, lat, 0.833,    md, 'cw');
    const isha    = (m.ishaMin && maghrib !== null)
                    ? maghrib + m.ishaMin / 60
                    : angleTime(decl, lat, m.isha, md, 'cw');

    return {
      Fajr:    toHHMM(fajr),
      Sunrise: toHHMM(sunrise),
      Dhuhr:   toHHMM(dhuhr),
      Asr:     toHHMM(asr),
      Maghrib: toHHMM(maghrib),
      Isha:    toHHMM(isha),
    };
  }

  return { calculate };
})();
