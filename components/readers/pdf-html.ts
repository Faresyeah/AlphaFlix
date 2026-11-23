/**
 * صفحة HTML تعرض PDF عبر pdf.js داخل WebView.
 * - يُرسل التطبيق ملف الـ PDF كـ base64 على دفعات (__chunk) ثم يستدعي __open.
 * - تُرسل الصفحة رسائل JSON إلى التطبيق: ready | loaded | page | error.
 * - الأوامر من التطبيق: __goto(n) و __zoom(z).
 */
export const PDFJS_VERSION = "3.11.174";
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

export const PDF_VIEWER_HTML = `<!doctype html>
<html lang="ar"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
<style>
html,body{margin:0;padding:0;background:#050505;color:#C4C4C4;font-family:sans-serif;-webkit-text-size-adjust:100%}
body{overflow-x:auto}
#pages{display:flex;flex-direction:column;align-items:center;gap:6px;padding:62px 0 86px;box-sizing:border-box}
.page{background:#fff;position:relative;overflow:hidden}
.page canvas{display:block;width:100%;height:100%}
</style></head>
<body><div id="pages"></div>
<script src="${CDN}/pdf.min.js" onerror="send({type:'error',reason:'cdn'})"></script>
<script>
function send(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
var parts=[],pdf=null,total=0,zoom=1,ratio=1.4,rendered={},io=null,vis={},cur=1,timer=null,tasks={};
var container=document.getElementById('pages');

function pageWidth(){return Math.round(document.documentElement.clientWidth*zoom)}

function layout(){
  var w=pageWidth();
  container.style.width=w+'px';
  var els=container.children;
  for(var i=0;i<els.length;i++){
    var r=(els[i].__ratio||ratio);
    els[i].style.width=w+'px';els[i].style.height=Math.round(w*r)+'px';
  }
}

function renderPage(n){
  if(!pdf||rendered[n]||tasks[n])return;
  tasks[n]=true;
  pdf.getPage(n).then(function(page){
    var el=container.children[n-1];
    if(!el){delete tasks[n];return}
    var base=page.getViewport({scale:1});
    el.__ratio=base.height/base.width;
    var w=pageWidth();
    el.style.width=w+'px';el.style.height=Math.round(w*el.__ratio)+'px';
    var dpr=Math.min(window.devicePixelRatio||1,2.5);
    var vp=page.getViewport({scale:(w/base.width)*dpr});
    var c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);
    return page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise.then(function(){
      if(!tasks[n])return;
      el.innerHTML='';el.appendChild(c);rendered[n]=true;delete tasks[n];page.cleanup();
    });
  }).catch(function(){delete tasks[n]});
}

function release(n){
  var el=container.children[n-1];
  if(el&&rendered[n]){el.innerHTML='';delete rendered[n]}
  delete tasks[n];
}

function observe(){
  if(io)io.disconnect();
  io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      var n=+e.target.dataset.n;
      if(e.isIntersecting){renderPage(n)}else{release(n)}
    });
  },{rootMargin:'120% 0px 120% 0px'});
  for(var i=0;i<container.children.length;i++)io.observe(container.children[i]);
  var pio=new IntersectionObserver(function(entries){
    entries.forEach(function(e){vis[+e.target.dataset.n]=e.intersectionRatio});
    var best=cur,bv=-1;
    Object.keys(vis).forEach(function(k){if(vis[k]>bv+0.001){bv=vis[k];best=+k}});
    if(bv>0&&best!==cur){cur=best;clearTimeout(timer);timer=setTimeout(function(){send({type:'page',page:cur,total:total})},200)}
  },{threshold:[0,0.15,0.3,0.5,0.7,0.9,1]});
  for(var j=0;j<container.children.length;j++)pio.observe(container.children[j]);
}

window.__chunk=function(s){parts.push(s)};

window.__open=function(startPage){
  try{
    var bin=atob(parts.join(''));parts=[];
    var data=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)data[i]=bin.charCodeAt(i);
    bin=null;
    fetch('${CDN}/pdf.worker.min.js').then(function(r){return r.text()}).then(function(t){
      return URL.createObjectURL(new Blob([t],{type:'text/javascript'}));
    }).catch(function(){return '${CDN}/pdf.worker.min.js'}).then(function(workerSrc){
      pdfjsLib.GlobalWorkerOptions.workerSrc=workerSrc;
      return pdfjsLib.getDocument({data:data}).promise;
    }).then(function(doc){
      pdf=doc;total=doc.numPages;
      return doc.getPage(1).then(function(p){var v=p.getViewport({scale:1});ratio=v.height/v.width});
    }).then(function(){
      for(var n=1;n<=total;n++){
        var d=document.createElement('div');d.className='page';d.dataset.n=n;container.appendChild(d);
      }
      layout();observe();
      send({type:'loaded',total:total});
      var sp=Math.max(1,Math.min(total,startPage||1));
      setTimeout(function(){window.__goto(sp,true)},50);
    }).catch(function(e){send({type:'error',reason:'parse',message:String(e&&e.message||e)})});
  }catch(e){send({type:'error',reason:'parse',message:String(e&&e.message||e)})}
};

window.__goto=function(n,instant){
  n=Math.max(1,Math.min(total||1,n));
  var el=container.children[n-1];
  if(!el)return;
  cur=n;
  var top=el.getBoundingClientRect().top+window.scrollY-56;
  window.scrollTo({top:top,behavior:instant?'auto':'smooth'});
  send({type:'page',page:n,total:total});
};

window.__zoom=function(z){
  z=Math.max(1,Math.min(3,z));
  var before=cur;zoom=z;
  Object.keys(rendered).forEach(function(k){release(+k)});
  layout();observe();
  setTimeout(function(){window.__goto(before,true)},30);
};

setTimeout(function(){
  if(typeof pdfjsLib==='undefined')send({type:'error',reason:'cdn'});
},0);
window.addEventListener('load',function(){
  if(typeof pdfjsLib!=='undefined')send({type:'ready'});else send({type:'error',reason:'cdn'});
});
</script></body></html>`;
