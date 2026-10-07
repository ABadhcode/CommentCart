const $=id=>document.getElementById(id);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RX={
promo:/dm (me )?for|check (my|our) (page|profile)|link in bio|use code|discount code|follow (me|for)|giveaway|whatsapp me|telegram/i,
link:/\blink\b|where (can i|to) buy|which app|kahan (se )?(mil|le)|link (do|pls|plz)/i,
alt:/instead|better than|alternative|cheaper|try the|vs\.? |switch(ed)? to|kaun sa better/i,
cmp:/kharab|bekar|don'?t buy|dont buy|waste|tore|torn|broke|broken|came off|returned|not good|poor|jam|stopped working|faded|defect|fake|scam|cheap quality|disappoint|worst|flimsy|leak|overpriced|refund|weak/i,
exp:/\bused\b|using|bought|ordered|received|\bowned?\b|since|been using|have been|got it|purchased|\d+\s*(day|week|month|year)s?/i,
pos:/good|great|love|comfortable|sturdy|worth|nice|amazing|best|mast|accha|badiya|solid|perfect|happy|recommend|value for money|works? well|fits/i,
q:/\?|anyone|kitne ka|price kya|size|which one/i,
long:/(\d+|one|two|three|four|five|six|few)\s*(months?|years?|weeks?)|since (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|last|\d)|every ?day|daily|still (works|going|using)/i};
const TH={'Quality and durability':/quality|durab|stitch|zip|strap|broke|tore|torn|material|build|flimsy|jam|fade|weak|sturdy|defect/i,
'Price and value':/₹|rs\.?\s?\d|price|worth|value|expensive|overpriced|cheap|kitne ka|under \d+/i,
'Delivery and returns':/deliver|shipping|arrived|packag|return|refund|replace|warranty|service/i,
'Size and fit':/\bsize|\bfit|big enough|too (big|small)|small|large/i,
'Performance':/battery|speed|slow|lag|sound|camera|performance|works?|noise|heating|bass/i,
'Looks vs ads':/\breel\b|looks? (nothing|different)|colou?r|photo|as shown|advert|ad\b/i,
'Comfort':/comfort|soft|heavy|light|ergonom/i};
function local(t){
 const s=t.trim(),flat=s.replace(/[\s\W_]/g,'');
 let k,m;
 if(RX.promo.test(s))k='promo';
 else if(flat.length<2||/^(nice|wow|ok|first|great|good)\W*$/i.test(s))k='spam';
 else if(RX.alt.test(s))k='alternative';
 else if(RX.cmp.test(s))k='complaint';
 else if(RX.exp.test(s)&&RX.pos.test(s)||RX.exp.test(s))k='experience';
 else if(RX.link.test(s))k='link';
 else if(RX.q.test(s))k='question';
 else if(RX.pos.test(s))k='praise';
 else k='other';
 const re={complaint:RX.cmp,experience:RX.exp,praise:RX.pos,alternative:RX.alt,link:RX.link,promo:RX.promo}[k];
 m=re&&s.match(re);
 const neg=RX.cmp.test(s),pos=RX.pos.test(s)&&!neg;
 return{t:s,k,themes:Object.keys(TH).filter(x=>TH[x].test(s)),phrase:m?m[0]:'',pos,neg,long:RX.long.test(s),price:(s.match(/(₹|rs\.?\s?)\s?\d[\d,]*/i)||[])[0]||''};
}
function parse(txt){return txt.split(/\n+/).map(l=>l.trim()).filter(l=>l.length>1&&!/^(reply|like|\d+\s*(likes?|replies)|view \d+ repl\w+|\d+\s?[smhdwy]|see translation|hide|edited|author|pinned)$/i.test(l)).slice(0,200)}
let items=[],verdictAI='',altAI=[],engine='offline rules',persona='researcher',theme=null,pname='';
async function runAI(list){
 const sample=window.claude?await window.claude.use('sample'):null;if(!sample)throw{code:'unavailable'};
 const prompt=`You analyse social-media comments about a product${pname?` ("${pname}")`:''}. Use ONLY the comments given; never invent facts.
Return JSON: {"verdict":"2 plain sentences: what buyers love and what they warn about, with counts if clear","alternatives":[{"name":"","note":"short, from comments"}],"items":[{"i":0,"kind":"spam|promo|link|question|complaint|experience|praise|alternative|other","sentiment":"pos|neg|neutral","long_term":false,"themes":["short theme"],"phrase":"exact 2-6 word substring that carries the meaning"}]}
kind rules: promo = sellers or accounts advertising; experience = first-hand use; spam = emoji-only, empty praise, follow-for-follow. One item per comment.
COMMENTS:\n`+list.map((c,i)=>i+': '+c.t.slice(0,300)).join('\n');
 return sample.json(prompt,{modelTier:'quick',cache:false});
}
function merge(r){
 verdictAI=r.verdict||'';altAI=(r.alternatives||[]).slice(0,5);
 (r.items||[]).forEach(a=>{const it=items[a.i];if(!it)return;
  const kinds=['spam','promo','link','question','complaint','experience','praise','alternative','other'];
  if(kinds.includes(a.kind))it.k=a.kind;
  it.pos=a.sentiment==='pos';it.neg=a.sentiment==='neg';it.long=!!a.long_term;
  if(a.themes&&a.themes.length)it.themes=a.themes.slice(0,3);
  if(a.phrase&&it.t.toLowerCase().includes(a.phrase.toLowerCase()))it.phrase=a.phrase;});
}
function hl(it,t){let s=esc(it.t);if(!it.phrase)return s;const p=esc(it.phrase);const i=s.toLowerCase().indexOf(p.toLowerCase());return i<0?s:s.slice(0,i)+'<mark>'+s.slice(i,i+p.length)+'</mark>'+s.slice(i+p.length)}
const real=()=>items.filter(i=>i.k!=='spam'&&i.k!=='promo');
const by=k=>items.filter(i=>i.k===k);
function themeCounts(f){const m={};items.filter(f).forEach(i=>i.themes.forEach(t=>m[t]=(m[t]||0)+1));return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function quotes(a,cls,n,sub){return a.slice(0,n).map(i=>`<p class="q ${cls}">${hl(i)}${sub?`<small>${sub(i)}</small>`:''}</p>`).join('')||'<p class="hint">Nothing found in these comments.</p>'}
function render(){
 const R=real(),exp=items.filter(i=>i.k==='experience'),cmp=by('complaint'),asks=by('link'),alts=by('alternative');
 const loves=items.filter(i=>i.pos&&(i.k==='experience'||i.k==='praise'));
 const prices=[...new Set(items.map(i=>i.price).filter(Boolean))];
 const trust=R.length?Math.round(100*exp.length/R.length):0;
 $('stats').innerHTML=`<div><b>${items.length}</b><small>comments read</small></div><div><b>${R.length}</b><small>useful</small></div><div><b>${by('spam').length}</b><small>noise hidden</small></div><div><b>${by('promo').length}</b><small>flagged promotional</small></div><div><b>${trust}%</b><small>first-hand experiences</small></div>`;
 const topC=themeCounts(i=>i.k==='complaint')[0];
 $('verdict').textContent=verdictAI||`${loves.length} comments are positive and ${cmp.length} report problems${topC?`, most often about ${topC[0].toLowerCase()}`:''}. ${exp.length} are first-hand experiences.`;
 const chips=(f)=>themeCounts(f).map(([t,n])=>`<button class="th" data-th="${esc(t)}" aria-pressed="${theme===t}">${esc(t)}<i>${n}</i></button>`).join('')||'<p class="hint">No clear theme yet.</p>';
 const B={
 love:`<section><h3>What users love</h3>${quotes(loves,'good',3)}</section>`,
 cmp:`<section><h3>Common complaints</h3><div>${chips(i=>i.k==='complaint')}</div>${quotes(cmp,'bad',2)}</section>`,
 exp:`<section><h3>Real experiences and long-term feedback</h3>${quotes([...exp.filter(i=>i.long),...exp.filter(i=>!i.long)],'good',4,i=>i.long?'Long-term use':'')}</section>`,
 alt:`<section><h3>Alternatives people mention</h3>${altAI.length?altAI.map(a=>`<p class="q warn"><b>${esc(a.name||'')}</b> ${esc(a.note||'')}</p>`).join(''):quotes(alts,'warn',3)}</section>`,
 trust:`<section><h3>Trust signals</h3><p class="q">${exp.length} of ${R.length} useful comments describe first-hand use.</p><p class="q ${by('promo').length?'bad':''}">${by('promo').length} promotional comments flagged and left out of experience counts.</p><p class="q">${exp.filter(i=>i.long).length} comments report use over weeks or months.</p></section>`,
 buy:`<section><h3>Where to buy and price</h3><p class="q">${asks.length} people asked for a link or where to buy.</p><p class="q">Prices mentioned: ${prices.length?esc(prices.join(', ')):'none'}.</p><p class="hint">Use the platform search links above to find the seller.</p></section>`,
 neg:`<section><h3>Negatives first</h3>${quotes(cmp,'bad',5)}</section>`};
 const order={researcher:['exp','cmp','alt','love','trust','buy'],shopper:['buy','love','alt','cmp','exp','trust'],skeptic:['neg','trust','exp','cmp','alt','buy']}[persona];
 $('cols').innerHTML=order.map(k=>B[k]).join('');
 document.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{theme=theme===b.dataset.th?null:b.dataset.th;render();const h=$('feed').querySelector('.hit');if(h)h.scrollIntoView({block:'nearest'})});
 $('feed').innerHTML=items.map(i=>{const hit=theme&&i.themes.includes(theme);return `<div class="c ${theme?(hit?'hit':'dim'):''}"><em class="k-${i.k}">${i.k==='alternative'?'comparison':i.k}</em><span>${hl(i)}</span></div>`}).join('');
 $('out').style.display='block';
}
async function analyse(){
 const list=parse($('cm').value);pname=$('pname').value.trim();
 if(list.length<3){$('msg').textContent='Paste at least 3 comments, one per line.';return}
 items=list.map(local);verdictAI='';altAI=[];theme=null;engine='offline rules';
 $('go').disabled=true;$('msg').textContent='Reading comments…';
 try{merge(await runAI(items));engine='Claude'}catch(e){
  $('msg').textContent=e.code==='not_granted'||e.code==='unavailable'?'Used the built-in offline rules.':'Claude could not finish, so offline rules were used.'}
 $('go').disabled=false;if(engine==='Claude')$('msg').textContent='Done.';
 $('engine').textContent='Engine: '+engine;render();$('out').scrollIntoView({behavior:'smooth',block:'start'});
}
$('go').onclick=analyse;
$('demo').onclick=()=>{$('pname').value='Mini sling bag';upd();$('cm').value=`Link?? where can I buy this
🔥🔥🔥
DM for 50% off, check my page
Used it for 6 months, zip still works. Fits phone, wallet and keys.
Worth ₹799?
Don't buy it. Strap tore in 2 months.
Anyone tried this? Quality looks cheap
Better than the Wildcraft one I had, and cheaper
Follow for follow ❤️
Ordered last week. Delivery took 9 days, bag is good though.
Size?? is it big enough for a 6.7 inch phone
Stitching came off after a month. Returned it.
Try the Decathlon one instead, ₹649 and sturdier
Using it daily for college, strap is comfy
Quality is not good, zip jammed twice
Is there a cheaper alternative?
Bought 3 months ago. Colour faded a bit but fine for ₹799.
Waste of money, looks nothing like the reel
Which app has it? link pls
Been using since June, zip is the weak part. Okay for the price.
Great bag, love it
Alternative under ₹500?`;$('msg').textContent='Sample comments written for this demo. Press Analyse.'};
function upd(){const q=encodeURIComponent($('pname').value.trim());
 if(!q){$('links').innerHTML='';$('linkhint').style.display='';return}
 $('linkhint').style.display='none';
 $('links').innerHTML=[['YouTube reviews',`https://www.youtube.com/results?search_query=${q}+review`],['Reddit',`https://www.reddit.com/search/?q=${q}`],['TikTok',`https://www.tiktok.com/search?q=${q}`],['Instagram posts',`https://www.google.com/search?q=${q}+site%3Ainstagram.com`]].map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${n}</a>`).join('')}
$('pname').addEventListener('input',upd);
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{persona=b.dataset.p;document.querySelectorAll('[data-p]').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
$('exp').onclick=()=>{ const cm=by('complaint'),ex=by('experience');
 const md=`# CommentCart insights${pname?': '+pname:''}\n\n${$('verdict').textContent}\n\n- Comments read: ${items.length}\n- Useful: ${real().length}\n- Noise: ${by('spam').length}, promotional flagged: ${by('promo').length}\n\n## Complaints\n${cm.map(i=>'- '+i.t).join('\n')||'None'}\n\n## Real experiences\n${ex.map(i=>'- '+i.t).join('\n')||'None'}\n\n## Alternatives\n${by('alternative').map(i=>'- '+i.t).join('\n')||'None'}\n`;
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));a.download='commentcart-insights.md';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
