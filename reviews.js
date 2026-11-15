(function(){
var API='/api/reviews',KEY=null,T0=Date.now(),adminOK=false,admin=/[?&]admin\b/.test(location.search);
var lists=[].slice.call(document.querySelectorAll('[data-rv-list]')),avgs=[].slice.call(document.querySelectorAll('[data-rv-avg]')),form=document.querySelector('[data-rv-form]');
try{KEY=sessionStorage.getItem('rvk')}catch(e){}
var css=document.createElement('style');
css.textContent='.rvlive .rvst{color:var(--gold);letter-spacing:.14em;font-size:1.1rem;margin-bottom:.6rem}.rvlive .meta{color:var(--mute);font-size:.9rem;margin:.2rem 0 0}.rvlive button{margin-top:1rem;font:inherit;padding:.4rem .9rem;border-radius:99px;border:1px solid var(--line);background:none;color:var(--ink);cursor:pointer}.sp{display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:.15rem}.sp input{position:absolute;opacity:0;width:1px;height:1px}.sp label{font-size:2rem;line-height:1;cursor:pointer;color:var(--line);font-weight:400}.sp input:checked~label,.sp label:hover,.sp label:hover~label{color:var(--gold)}.sp input:focus-visible+label{outline:3px solid var(--acc);border-radius:6px}.rvempty{color:var(--mute);grid-column:1/-1}';
document.head.appendChild(css);
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function card(r){
var c=el('figure','card s3 rvlive');c.style.margin='0';
var s=el('div','rvst','\u2605'.repeat(r.rating)+'\u2606'.repeat(5-r.rating));s.setAttribute('aria-label',r.rating+' out of 5 stars');c.appendChild(s);
var p=el('p','',r.text);p.style.color='var(--ink)';c.appendChild(p);
var f=el('figcaption'),n=el('h3','',r.name);n.style.cssText='margin:1rem 0 0;font-size:1.05rem';f.appendChild(n);
var m=[r.brand,r.country].filter(Boolean).join(', ');
f.appendChild(el('p','meta',(m?m+' \u2013 ':'')+new Date(r.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})));
if(adminOK){var b=el('button','','Delete this review');b.type='button';b.onclick=function(){
if(!confirm('Delete this review?'))return;
fetch(API,{method:'DELETE',headers:{'Content-Type':'application/json','x-admin-key':KEY},body:JSON.stringify({id:r.id})}).then(function(x){
if(x.status===401){try{sessionStorage.removeItem('rvk')}catch(e){}KEY=null;adminOK=false;alert('Wrong admin key.');load();return}load()})};f.appendChild(b)}
c.appendChild(f);return c}
function render(rs){
lists.forEach(function(l){l.textContent='';if(!rs.length){l.appendChild(el('p','rvempty','New reviews from clients will appear here.'));return}rs.forEach(function(r){l.appendChild(card(r))})});
var t=rs.length?(rs.reduce(function(a,r){return a+r.rating},0)/rs.length).toFixed(1)+' out of 5 from '+rs.length+(rs.length===1?' review':' reviews'):'';
avgs.forEach(function(a){a.textContent=t})}
function load(){fetch(API,{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){render(j.reviews||[])}).catch(function(){lists.forEach(function(l){l.textContent='Reviews are loading. Please refresh in a moment.'})})}
if(form){var st=form.querySelector('[data-rv-status]');form.addEventListener('submit',function(e){
e.preventDefault();var d=new FormData(form),btn=form.querySelector('button[type=submit]');
btn.disabled=true;st.textContent='Posting your review\u2026';
fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.get('name'),brand:d.get('brand'),country:d.get('country'),text:d.get('text'),rating:d.get('rating'),website:d.get('website'),t:T0})})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){
btn.disabled=false;if(x.ok){form.reset();T0=Date.now();st.textContent='Thank you! Your review is now live.';load()}else{st.textContent=x.j.error||'Something went wrong. Please try again.'}})
.catch(function(){btn.disabled=false;st.textContent='Something went wrong. Please try again.'})})}
function bar(){var d=el('div','','Admin mode ');d.style.cssText='position:fixed;left:1rem;bottom:1rem;z-index:60;display:flex;gap:.6rem;align-items:center;padding:.5rem .9rem;border-radius:99px;background:var(--gold);color:#05140E;font-weight:700;font-size:.9rem';var b=el('button','','Log out');b.type='button';b.style.cssText='border:0;border-radius:99px;padding:.25rem .7rem;font:inherit;cursor:pointer';b.onclick=function(){try{sessionStorage.removeItem('rvk')}catch(e){}location.href=location.pathname+location.hash};d.appendChild(b);document.body.appendChild(d)}
function check(cb){fetch(API,{method:'DELETE',headers:{'Content-Type':'application/json','x-admin-key':KEY||''},body:'{}'}).then(function(x){cb(x.status!==401)}).catch(function(){cb(false)})}
if(admin){if(!KEY){KEY=prompt('Admin key')||''}
if(!KEY){admin=false;load()}else{check(function(ok){if(ok){adminOK=true;try{sessionStorage.setItem('rvk',KEY)}catch(e){}bar()}else{KEY=null;try{sessionStorage.removeItem('rvk')}catch(e){}alert('Wrong admin key.');admin=false}load()})}}
else{load()}
})();
