const fs=require("fs");
const https=require("https");
const http=require("http");
const API_BASE = process.env.API_BASE || "https://api.yessgo.org";
function headRequest(url){
  return new Promise(resolve=>{
    try{
      const lib = url.startsWith("http:") ? http : https;
      const req = lib.request(url, { method: "HEAD" }, res=>{
        resolve({ url, status: res.statusCode });
      });
      req.on("error", err=> resolve({ url, status: "ERR", err: String(err.message) }));
      req.setTimeout(8000, ()=>{ req.destroy(); resolve({ url, status: "TIMEOUT" }); });
      req.end();
    } catch(e){ resolve({ url, status: "ERR", err: String(e) }); }
  });
}
(async ()=>{
 try{
  const raw = fs.readFileSync('partners_sample.json','utf8');
  const json = JSON.parse(raw || '[]');
  const list = Array.isArray(json) ? json : (json.items || json.data || []);
  if(!list || list.length===0){ console.log('No partners found in response'); process.exit(0); }
  for(const p of list){
    const id = p.id || p._id || p.name || '<no-id>';
    const candidates=[];
    if(p.logoUrl) candidates.push(p.logoUrl);
    if(p.logo_url) candidates.push(p.logo_url);
    if(p.logo){ if(typeof p.logo === 'string') candidates.push(p.logo); else if(p.logo.url) candidates.push(p.logo.url); }
    if(p.imageUrl) candidates.push(p.imageUrl);
    if(p.image_url) candidates.push(p.image_url);
    if(p.image){ if(typeof p.image === 'string') candidates.push(p.image); else if(p.image.url) candidates.push(p.image.url); }
    if(Array.isArray(p.images) && p.images.length>0) candidates.push(p.images[0]);
    if(p.avatar) candidates.push(p.avatar);
    if(p.logo_path) candidates.push(p.logo_path);
    const uniq = Array.from(new Set(candidates.map(x=>String(x)))).filter(x=>x && x!=='undefined' && x!=='null');
    if(uniq.length===0){ console.log(id, '->', 'no-candidates'); continue; }
    for(const c of uniq){
      let resolved = c;
      if(resolved.startsWith('//')) resolved = 'https:' + resolved;
      else if(resolved.startsWith('/')) resolved = API_BASE.replace(/\/$/, '') + resolved;
      else if(!resolved.startsWith('http://') && !resolved.startsWith('https://')) resolved = API_BASE.replace(/\/$/, '') + '/' + resolved.replace(/^\/+/, '');
      const r = await headRequest(resolved);
      console.log(id, 'candidate->', c, 'resolved->', r.url, 'status->', r.status);
    }
  }
 }catch(e){ console.error('ERROR', e); }
 process.exit(0);
})();
