/* Candy Cane Lane — reusable story player (Days 5, 10, 15, 20, 23) */
(function(){
"use strict";
var STORIES = {
  "5":  {title:"Pip and the Great Gingerbread Escape"},
  "10": {title:"Penny and the Peppermint Puzzle"},
  "15": {title:"Candy and the Sugar Plum Wish"},
  "20": {title:"The Nutcracker Who Forgot How to March"},
  "23": {title:"The Christmas Eve Secret of Candy Cane Lane"}
};
var day = document.body.getAttribute("data-day");
var story = STORIES[day];
var BASE = "../story/media/";

/* ===== Safe return link (same rules as Days 1, 4 and 8) ===== */
var SHOP_URL = "";
var ALLOWED_RETURN_HOSTS = ["canva.site", "canva.com", "canva.link"];
var RETURN_KEY = "candycanelane-return-url";
function validReturnUrl(raw){
  try{
    if(!raw || raw.length>500) return null;
    var u = new URL(raw);
    if(u.protocol!=="https:" || u.username || u.password) return null;
    var h = u.hostname.toLowerCase();
    if(!ALLOWED_RETURN_HOSTS.some(function(a){ return h===a || h.endsWith("."+a); })) return null;
    return u.href;
  }catch(e){ return null; }
}
function readParam(name){
  try{
    var q = new URLSearchParams(location.search).get(name);
    if(q) return q;
    return new URLSearchParams(location.hash.replace(/^#/,"")).get(name);
  }catch(e){ return null; }
}
function resolveReturnUrl(){
  var fromLink = validReturnUrl(readParam("return"));
  if(fromLink){ try{ localStorage.setItem(RETURN_KEY, fromLink); }catch(e){} return fromLink; }
  var fromRef = null;
  try{ if(document.referrer) fromRef = validReturnUrl(new URL(document.referrer).origin + "/"); }catch(e){}
  if(fromRef){ try{ if(!localStorage.getItem(RETURN_KEY)) localStorage.setItem(RETURN_KEY, fromRef); }catch(e){} }
  var remembered = null;
  try{ remembered = validReturnUrl(localStorage.getItem(RETURN_KEY)); }catch(e){}
  return remembered || fromRef || validReturnUrl(SHOP_URL);
}
var RETURN_URL = resolveReturnUrl();

function $(id){ return document.getElementById(id); }
var ICON_PLAY  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="4.5" height="16" rx="1.5" fill="currentColor"/></svg>';

function fmt(t){
  if(!isFinite(t) || t<0) return "–:––";
  t = Math.floor(t); return Math.floor(t/60) + ":" + ("0"+(t%60)).slice(-2);
}

function init(){
  if(!story){ document.body.innerHTML = "<p style='padding:30px;text-align:center'>Story not found.</p>"; return; }
  document.title = "Day " + day + " · " + story.title + " · Candy Cane Lane";
  $("dayLabel").textContent = "Day " + day + " · Candy Cane Lane";
  $("storyTitle").textContent = story.title;
  var img = $("cover");
  img.src = BASE + "day" + day + "-1280.webp";
  img.srcset = BASE + "day" + day + "-1280.webp 1280w, " + BASE + "day" + day + "-2400.webp 2400w";
  img.sizes = "(max-width: 1120px) 100vw, 1120px";
  img.alt = "Illustration for " + story.title;

  var audio = $("audio");
  audio.src = BASE + "day" + day + ".mp3";
  var playBtn = $("playBtn"), big = $("bigPlay"), seek = $("seek"), status = $("status");
  var seeking = false;

  function setPlaying(on){
    playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    playBtn.setAttribute("aria-label", on ? "Pause the story" : "Play the story");
    big.classList.toggle("hide", on || audio.currentTime > 0);
  }
  function update(){
    var d = audio.duration, t = audio.currentTime;
    $("cur").textContent = fmt(t);
    $("dur").textContent = fmt(d);
    if(!seeking && isFinite(d) && d>0){ seek.value = Math.round(t/d*1000); }
    seek.style.setProperty("--p", (seek.value/10) + "%");
  }
  function toggle(){
    if(audio.paused){
      if(audio.ended) audio.currentTime = 0;
      var p = audio.play();
      status.textContent = "";
      if(p && p.catch) p.catch(function(){ status.textContent = "Tap Play again to start the story."; setPlaying(false); });
    } else { audio.pause(); }
  }
  playBtn.addEventListener("click", toggle);
  big.addEventListener("click", toggle);
  $("replayBtn").addEventListener("click", function(){
    audio.currentTime = 0; update();
    if(audio.paused){ toggle(); }
  });
  seek.addEventListener("input", function(){
    seeking = true;
    seek.style.setProperty("--p", (seek.value/10) + "%");
    if(isFinite(audio.duration)) $("cur").textContent = fmt(seek.value/1000*audio.duration);
  });
  seek.addEventListener("change", function(){
    if(isFinite(audio.duration)) audio.currentTime = seek.value/1000*audio.duration;
    seeking = false; update();
  });
  audio.addEventListener("play", function(){ setPlaying(true); });
  audio.addEventListener("pause", function(){ setPlaying(false); });
  audio.addEventListener("ended", function(){ setPlaying(false); status.textContent = "The End. Tap Replay to hear it again."; seek.value = 1000; update(); });
  audio.addEventListener("waiting", function(){ status.textContent = "Loading the story…"; });
  audio.addEventListener("playing", function(){ status.textContent = ""; });
  audio.addEventListener("error", function(){ status.textContent = "The story couldn't load. Please check your connection and refresh the page."; });
  ["timeupdate","loadedmetadata","durationchange","seeked"].forEach(function(ev){ audio.addEventListener(ev, update); });
  document.addEventListener("keydown", function(e){
    if(e.code === "Space" && e.target === document.body){ e.preventDefault(); toggle(); }
  });
  setPlaying(false); update();

  if("mediaSession" in navigator && window.MediaMetadata){
    try{
      navigator.mediaSession.metadata = new MediaMetadata({title: story.title, artist: "Candy Cane Lane · Day " + day,
        artwork:[{src: BASE + "day" + day + "-1280.webp", sizes:"1280x720", type:"image/webp"}]});
      navigator.mediaSession.setActionHandler("play", function(){ audio.play(); });
      navigator.mediaSession.setActionHandler("pause", function(){ audio.pause(); });
    }catch(e){}
  }

  $("backBtn").addEventListener("click", function(){
    try{ audio.pause(); }catch(e){}
    if((window.opener||document.referrer)&&history.length<=1){ try{ window.close(); }catch(e){} setTimeout(function(){ if(RETURN_URL){ window.location.assign(RETURN_URL); } else { $("backModal").classList.add("on"); } },400); return; } if(RETURN_URL){ window.location.assign(RETURN_URL); return; }
    if(window.opener){ try{ window.close(); }catch(e){} }
    $("backModal").classList.add("on");
  });
  $("backOk").addEventListener("click", function(){ $("backModal").classList.remove("on"); });
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
