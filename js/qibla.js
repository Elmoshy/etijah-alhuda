// ════════════════════════════════════════════════════
//  QIBLA
// ════════════════════════════════════════════════════
function initQibla(){}
function findQibla(){
  if(!navigator.geolocation){document.getElementById("qiblaResult").innerHTML="<p>⚠️ المتصفح لا يدعم تحديد الموقع</p>";return;}
  document.getElementById("qiblaResult").innerHTML="<p style='color:var(--tx3)'>⏳ جاري تحديد الموقع...</p>";
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude, lng=pos.coords.longitude;
    const angle=calcQibla(lat,lng);
    showCompass(angle,lat,lng);
  },()=>{document.getElementById("qiblaResult").innerHTML="<p>⚠️ تعذّر تحديد الموقع</p>";});
}
function calcQibla(lat,lng){
  const ML=21.3891*Math.PI/180,MLg=39.8579*Math.PI/180;
  const ul=lat*Math.PI/180,ulg=lng*Math.PI/180;
  const dLg=MLg-ulg;
  const y=Math.sin(dLg)*Math.cos(ML);
  const x=Math.cos(ul)*Math.sin(ML)-Math.sin(ul)*Math.cos(ML)*Math.cos(dLg);
  return (Math.atan2(y,x)*180/Math.PI+360)%360;
}
function showCompass(angle,lat,lng){
  document.getElementById("qiblaResult").style.display="none";
  document.getElementById("compassWrap").style.display="block";
  const canvas=document.getElementById("compassCanvas"),ctx=canvas.getContext("2d");
  drawCompass(ctx,canvas.width,angle);
  document.getElementById("qiblaInfo").innerHTML=`
    <div class="info-row">🕋 اتجاه القبلة: <strong>${Math.round(angle)}°</strong></div>
    <div class="info-row">📍 موقعك: <strong>${lat.toFixed(4)}, ${lng.toFixed(4)}</strong></div>
    <small style="color:var(--tx3)">زاوية من الشمال عكس عقارب الساعة</small>`;
  if(window.DeviceOrientationEvent){
    window.addEventListener("deviceorientation",e=>{
      const h=e.alpha||0; ctx.clearRect(0,0,canvas.width,canvas.height); drawCompass(ctx,canvas.width,angle-h);
    });
  }
}
function drawCompass(ctx,size,angle){
  const cx=size/2,cy=size/2,r=size/2-12;
  ctx.clearRect(0,0,size,size);
  // bg
  ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  const isDark=document.body.classList.contains("dark")||!document.body.classList.contains("light");
  grad.addColorStop(0,isDark?"#1a1a28":"#f0e8d5"); grad.addColorStop(1,isDark?"#12121c":"#fffaf0");
  ctx.fillStyle=grad; ctx.fill();
  ctx.strokeStyle="#c9a84c"; ctx.lineWidth=2; ctx.stroke();
  // dirs
  const dirs=["ش","شرق","ج","غرب"];
  dirs.forEach((d,i)=>{
    const a=(i*90-90)*Math.PI/180;
    ctx.fillStyle="#c9a84c"; ctx.font="bold 13px Cairo,sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(d,cx+(r-22)*Math.cos(a),cy+(r-22)*Math.sin(a));
  });
  // needle
  const a=(angle-90)*Math.PI/180;
  const tx=cx+(r-48)*Math.cos(a),ty=cy+(r-48)*Math.sin(a);
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(tx,ty);
  ctx.strokeStyle="#c9a84c";ctx.lineWidth=3;ctx.lineCap="round";ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,5,0,2*Math.PI);ctx.fillStyle="#c9a84c";ctx.fill();
  ctx.font="18px serif"; ctx.fillText("🕋",tx,ty);
}
