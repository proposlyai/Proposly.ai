// ProposlyAI v6.0 — Final Build
import { useState, useEffect, useRef } from "react";

// ── Mobile hook ──
function useW(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:900);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
}

// ── Constants ──
const C={bg:"#080714",card:"#13112e",border:"#1e1c38",accent:"#6C63FF",soft:"#a78bfa",text:"#e8e6ff",muted:"#5a5880"};
const FREE_LIMIT=3;


// ── Supabase Config ──
const SB_URL="https://efbvxsruayapnwejivqa.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYnZ4c3J1YXlhcG53ZWppdnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTc4MjYsImV4cCI6MjA5ODI5MzgyNn0.eNyIoGx1P3c9099zFFEcOCFb1DuB1mH23PeWWQuW7CQ";
const ADMIN_SECRET="proposlyai_admin_2025";
async function sbFetch(path,method="GET",body=null){
  const res=await fetch(SB_URL+path,{method,headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY},body:body?JSON.stringify(body):null});
  return res.json();
}
async function getSpots(){try{const d=await sbFetch("/rest/v1/spots?select=count&id=eq.1");return d[0]?.count??1000;}catch{return 1000;}}
async function decreaseSpot(){try{const c=await getSpots();if(c<=0)return 0;const n=c-1;await sbFetch("/rest/v1/spots?id=eq.1","PATCH",{count:n});return n;}catch{return null;}}
async function adminSetSpots(n,secret){if(secret!==ADMIN_SECRET)return{error:"Wrong secret"};try{await sbFetch("/rest/v1/spots?id=eq.1","PATCH",{count:parseInt(n)});return{success:true};}catch(e){return{error:e.message};}}
async function initSpots(){try{const d=await sbFetch("/rest/v1/spots?select=count&id=eq.1");if(!d||d.length===0)await sbFetch("/rest/v1/spots","POST",{id:1,count:1000});}catch{}}

// ── Auth Store ──
const Auth={
  get:()=>{try{const u=localStorage.getItem("pai_user");return u?JSON.parse(u):null;}catch{return null;}},
  set:(u)=>{try{localStorage.setItem("pai_user",JSON.stringify(u));}catch{}},
  clear:()=>{try{["pai_user","pai_usage","pai_history","pai_onboarded"].forEach(k=>localStorage.removeItem(k));}catch{}},
  getUsage:()=>{try{return parseInt(localStorage.getItem("pai_usage")||"0");}catch{return 0;}},
  incUsage:()=>{try{const n=(parseInt(localStorage.getItem("pai_usage")||"0")+1);localStorage.setItem("pai_usage",n);return n;}catch{return 1;}},
  resetUsage:()=>{try{localStorage.setItem("pai_usage","0");}catch{}},
  getHistory:()=>{try{const h=localStorage.getItem("pai_history");return h?JSON.parse(h):[];}catch{return[];}},
  addHistory:(item)=>{try{const h=Auth.getHistory();h.unshift({...item,id:Date.now(),date:new Date().toLocaleString()});localStorage.setItem("pai_history",JSON.stringify(h.slice(0,30)));}catch{}},
  clearHistory:()=>{try{localStorage.setItem("pai_history","[]");}catch{}},
  isOnboarded:()=>{try{return !!localStorage.getItem("pai_onboarded");}catch{return false;}},
  setOnboarded:()=>{try{localStorage.setItem("pai_onboarded","1");}catch{}},
  // Referral
  getReferralCode:()=>{try{const u=Auth.get();if(!u)return null;let c=localStorage.getItem("pai_ref");if(!c){c=u.email.split("@")[0].replace(/[^a-z0-9]/gi,"")+Math.floor(1000+Math.random()*9000);localStorage.setItem("pai_ref",c);}return c;}catch{return null;}},
  // Feedback
  saveFeedback:(toolId,rating,comment)=>{try{const f=JSON.parse(localStorage.getItem("pai_feedback")||"{}");f[toolId]={rating,comment,date:new Date().toISOString()};localStorage.setItem("pai_feedback",JSON.stringify(f));}catch{}},
  getFeedback:()=>{try{return JSON.parse(localStorage.getItem("pai_feedback")||"{}");}catch{return{};}},
  // Changelog seen
  getLastSeen:()=>{try{return localStorage.getItem("pai_changelog_seen")||"";}catch{return"";}},
  setLastSeen:(v)=>{try{localStorage.setItem("pai_changelog_seen",v);}catch{}},
  getSpots:()=>{try{return parseInt(localStorage.getItem("pai_spots")||"1000");}catch{return 1000;}},
  useSpot:()=>{try{const s=Math.max(0,(parseInt(localStorage.getItem("pai_spots")||"1000")-1));localStorage.setItem("pai_spots",s);return s;}catch{return 999;}},
  isClosed:()=>{try{return parseInt(localStorage.getItem("pai_spots")||"1000")<=0;}catch{return false;}},
};

// ── Keyframes ──
// ── FOUNDING MEMBERS BANNER (Supabase) ──
const TOTAL_SPOTS=1000;
function FoundingBanner({paymentUrl}){
  const [spots,setSpots]=useState(1000);
  const [loading,setLoading]=useState(true);
  const [claiming,setClaiming]=useState(false);
  const closed=spots<=0;
  const pct=Math.min(100,Math.round(((TOTAL_SPOTS-spots)/TOTAL_SPOTS)*100));
  const barColor=spots<=100?"linear-gradient(90deg,#ff4444,#ff6b8a)":spots<=300?"linear-gradient(90deg,#f59e0b,#fbbf24)":"linear-gradient(90deg,#10b981,#34d399)";
  const borderColor=spots<=100?"#ff444466":spots<=300?"#f59e0b66":"#10b98166";
  useEffect(()=>{initSpots().then(()=>getSpots().then(n=>{setSpots(n);setLoading(false);}));const id=setInterval(()=>getSpots().then(n=>setSpots(n)),30000);return()=>clearInterval(id);},[]);
  const handleClaim=async()=>{setClaiming(true);const n=await decreaseSpot();if(n!==null)setSpots(n);window.open(paymentUrl,"_blank");setClaiming(false);};
  if(loading)return(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20,textAlign:"center",color:C.muted,fontSize:13}}>Loading offer...</div>);
  if(closed)return(<div style={{background:"#1a0a0a",border:"1.5px solid #ff444466",borderRadius:16,padding:"24px 20px",marginBottom:20,textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>🔒</div><div style={{fontSize:15,fontWeight:800,color:"#ff6b8a",marginBottom:6}}>Founding Member Offer Closed</div><div style={{fontSize:13,color:"#5a5880"}}>All 1,000 lifetime spots claimed. Now $19/month.</div></div>);
  return(
    <div style={{background:"linear-gradient(135deg,#0a1a0d,#0a1220)",border:`1.5px solid ${borderColor}`,borderRadius:16,padding:"18px 20px",marginBottom:20,animation:"kFadeUp 0.5s ease both",boxShadow:`0 0 40px ${borderColor}33`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:24,display:"inline-block",animation:"kBounce 2s ease-in-out infinite"}}>🚀</span>
          <div><div style={{fontSize:14,fontWeight:900,color:"#fff"}}>Founding Member Offer</div><div style={{fontSize:11,color:"#5a5880"}}>First 1,000 only · Closes forever after</div></div>
        </div>
        <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
          <div style={{fontSize:26,fontWeight:900,color:spots<=100?"#ff6b8a":spots<=300?"#fbbf24":"#10b981",letterSpacing:"-1px"}}>{spots.toLocaleString()}</div>
          <div style={{fontSize:10,color:"#5a5880",textTransform:"uppercase",letterSpacing:"0.06em"}}>spots left</div>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:"#5a5880"}}>{TOTAL_SPOTS-spots} of {TOTAL_SPOTS} claimed</span><span style={{fontSize:11,fontWeight:700,color:spots<=100?"#ff6b8a":spots<=300?"#fbbf24":"#10b981"}}>{pct}% full</span></div>
        <div style={{height:7,background:"#1e1c38",borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",borderRadius:6,width:`${Math.max(1,pct)}%`,background:barColor,transition:"width 1.2s ease"}}/></div>
      </div>
      <div style={{background:"#ffffff08",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:"#5a5880",textDecoration:"line-through"}}>$19/month forever</div><div style={{fontSize:20,fontWeight:900,color:"#fff"}}>$29 <span style={{fontSize:12,color:"#10b981",fontWeight:700}}>one-time lifetime</span></div></div>
        <div style={{background:"#10b98122",border:"1px solid #10b98155",borderRadius:8,padding:"6px 10px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:800,color:"#10b981"}}>SAVE</div><div style={{fontSize:16,fontWeight:900,color:"#10b981"}}>95%+</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:14}}>
        {["All 12 AI tools","Lifetime access","All future tools","No monthly fees","Priority support","Founding badge 🏅"].map((f,i)=>(<div key={i} style={{fontSize:12,color:"#ccc8f0",display:"flex",alignItems:"center",gap:6}}><span style={{color:"#10b981",flexShrink:0,fontSize:10}}>✓</span>{f}</div>))}
      </div>
      <button onClick={handleClaim} disabled={claiming} style={{width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",fontSize:15,fontWeight:800,cursor:claiming?"not-allowed":"pointer",fontFamily:"inherit",animation:"kPulse 2.5s ease-in-out infinite",transition:"transform 0.2s"}} onMouseEnter={e=>{if(!claiming)e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>e.currentTarget.style.transform="none"}>{claiming?"Opening checkout...":"🚀 Claim Lifetime Access — $29"}</button>
      <div style={{textAlign:"center",fontSize:11,color:"#5a5880",marginTop:8}}>{spots<=50?`⚡ Only ${spots} spots left!`:"✓ One-time payment · Instant access · 30-day refund"}</div>
    </div>
  );
}

// ── ADMIN PANEL ──
function AdminPanel({onClose}){
  const [spots,setSpots]=useState("");
  const [current,setCurrent]=useState(null);
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);
  useEffect(()=>{getSpots().then(n=>setCurrent(n));},[]);
  const update=async(delta)=>{setLoading(true);setMsg("");const n=delta==="set"?parseInt(spots):Math.max(0,(current||0)+delta);const res=await adminSetSpots(n,ADMIN_SECRET);if(res.error)setMsg("❌ "+res.error);else{setMsg(`✅ Set to ${n}`);setCurrent(n);setSpots("");}setLoading(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"#000000cc",backdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0d0b22",border:"1.5px solid #6C63FF66",borderRadius:20,width:"100%",maxWidth:360,padding:"28px 24px",animation:"kPop 0.3s ease both",boxShadow:"0 32px 80px #00000088"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>🔐 Admin Panel</div><div style={{fontSize:11,color:C.muted}}>Spots Manager</div></div>
          <span onClick={onClose} style={{color:C.muted,cursor:"pointer",fontSize:22}}>×</span>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Current Spots</div>
          <div style={{fontSize:44,fontWeight:900,color:"#10b981",letterSpacing:"-2px"}}>{current??"-"}</div>
          <div style={{fontSize:11,color:C.muted}}>of 1,000 total</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
          {[[-1,"−1","#ff6b8a"],[-10,"−10","#ff4444"],[+1,"+1","#10b981"],[+10,"+10","#059669"],[+50,"+50","#6C63FF"],[-50,"−50","#f59e0b"]].map(([d,l,c])=>(<button key={l} onClick={()=>update(d)} disabled={loading} style={{padding:"10px 4px",borderRadius:9,border:`1px solid ${c}44`,background:`${c}15`,color:c,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={spots} onChange={e=>setSpots(e.target.value)} placeholder="Set exact..." type="number" style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:14,padding:"10px 12px",fontFamily:"inherit",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={()=>update("set")} disabled={!spots||loading} style={{padding:"10px 16px",borderRadius:9,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Set</button>
        </div>
        {msg&&<div style={{fontSize:13,color:msg.includes("✅")?"#10b981":"#ff6b8a",marginBottom:12,fontWeight:600,textAlign:"center"}}>{msg}</div>}
        <button onClick={()=>getSpots().then(n=>{setCurrent(n);setMsg(`✅ ${n} spots`);})} style={{width:"100%",padding:"10px",borderRadius:9,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>🔄 Refresh</button>
      </div>
    </div>
  );
}


function InjectKF(){
  useEffect(()=>{
    if(!document.querySelector('meta[name="viewport"]')){const m=document.createElement("meta");m.name="viewport";m.content="width=device-width,initial-scale=1";document.head.appendChild(m);}
    const el=document.createElement("style");el.id="fskf";
    el.textContent=`
      *{box-sizing:border-box;}
      @keyframes kFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes kPulse{0%,100%{box-shadow:0 0 20px 3px #6C63FF44,0 4px 28px #6C63FF22}50%{box-shadow:0 0 40px 10px #a78bfa66,0 4px 48px #6C63FF44}}
      @keyframes kOrb1{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-18px)}}
      @keyframes kOrb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-22px,22px)}}
      @keyframes kShimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
      @keyframes kDot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}
      @keyframes kSlide{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
      @keyframes kPop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
      @keyframes kFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes kGrad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes kBorder{0%,100%{border-color:#6C63FF33}50%{border-color:#a78bfaaa}}
      @keyframes kAccordion{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes k3dCard{0%{transform:perspective(600px) rotateX(6deg) translateY(20px);opacity:0}100%{transform:perspective(600px) rotateX(0deg) translateY(0);opacity:1}}
      @keyframes k3dFloat{0%,100%{transform:perspective(800px) rotateX(2deg) rotateY(-2deg) translateY(0px)}50%{transform:perspective(800px) rotateX(-2deg) rotateY(2deg) translateY(-6px)}}
      @keyframes kWiggle{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
      @keyframes kBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      @keyframes kCounter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes kTabIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
      @keyframes kRing{0%,100%{box-shadow:0 0 0 0 #6C63FF44}50%{box-shadow:0 0 0 6px #6C63FF00}}
      ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#2a2850;border-radius:4px;}
      html{scroll-behavior:smooth;}
      .pai-card-3d{animation:k3dCard 0.6s ease both;}
      .pai-float-3d{animation:k3dFloat 6s ease-in-out infinite;}
      @keyframes kWiggle{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
      @keyframes kBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes kCounter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#2a2850;border-radius:4px;}
      html{scroll-behavior:smooth;}
      @keyframes kModalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes kOverlay{from{opacity:0}to{opacity:1}}
      @keyframes kShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
      input,textarea,select,button{-webkit-tap-highlight-color:transparent;}
      textarea{font-size:16px!important;}
    `;
    if(!document.getElementById("fskf"))document.head.appendChild(el);
    return()=>{const e=document.getElementById("fskf");if(e)e.remove();};
  },[]);
  return null;
}

// ── Tools ──
const TOOLS=[
  {id:"proposal",icon:"✍️",label:"Proposal Writer",desc:"Win-ready proposals in seconds",color:"#6C63FF",
   fields:[{key:"jobDesc",label:"Job Description",type:"textarea",placeholder:"Paste the job posting here…"},{key:"name",label:"Your Name",type:"input",placeholder:"Alex Johnson"},{key:"skills",label:"Key Skills",type:"input",placeholder:"React, Node.js, UI/UX"},{key:"tone",label:"Tone",type:"select",options:["Professional","Friendly & Warm","Bold & Confident","Concise & Direct"]}],
   prompt:(f)=>`Write a compelling winning proposal for "${f.name||"Alex"}" with skills "${f.skills||"development"}" applying for: "${f.jobDesc}". Tone: ${f.tone}. Strong hook, why perfect, approach, CTA. Under 280 words. Human not templated.`,
  },
  {id:"rate",icon:"💰",label:"Rate Calculator",desc:"Stop undercharging — know your worth",color:"#10b981",
   fields:[{key:"role",label:"Your Role",type:"input",placeholder:"Full-stack developer, Graphic designer…"},{key:"experience",label:"Experience",type:"select",options:["0–1 years","2–3 years","4–6 years","7–10 years","10+ years"]},{key:"location",label:"Location",type:"input",placeholder:"USA, India, UK, Remote…"},{key:"hours",label:"Hours/Week",type:"select",options:["10–20 hrs","20–30 hrs","30–40 hrs","40+ hrs"]}],
   prompt:(f)=>`Freelance pricing strategist. "${f.role||"Freelancer"}" with "${f.experience}" in "${f.location||"Remote"}" available "${f.hours}". Give: 1) Hourly rate range, 2) Project pricing (3 examples), 3) Monthly income potential, 4) How to raise rates, 5) One bold tip.`,
  },
  {id:"outreach",icon:"📧",label:"Cold Outreach",desc:"Land clients who didn't post a job",color:"#f59e0b",
   fields:[{key:"targetClient",label:"Target Client",type:"input",placeholder:"SaaS startups, E-commerce brands…"},{key:"yourRole",label:"What You Do",type:"input",placeholder:"I build Webflow sites for SaaS companies"},{key:"valueOffer",label:"Your Unique Value",type:"input",placeholder:"I increased a client's conversion by 40%"},{key:"tone",label:"Tone",type:"select",options:["Professional","Casual & Direct","Bold","Warm & Personal"]}],
   prompt:(f)=>`Cold outreach for freelancer who does "${f.yourRole||"freelance work"}", targets "${f.targetClient||"startups"}", offers "${f.valueOffer||"great results"}". Tone: ${f.tone}. Under 120 words. Focuses on their pain. Soft CTA. Also write a LinkedIn version (under 50 words).`,
  },
  {id:"invoice",icon:"🧾",label:"Invoice Generator",desc:"Professional invoices that get paid fast",color:"#3b82f6",
   fields:[{key:"freelancerName",label:"Your Name",type:"input",placeholder:"Alex Johnson / AlexDev LLC"},{key:"clientName",label:"Client Name",type:"input",placeholder:"Acme Corp"},{key:"projectDesc",label:"Services",type:"textarea",placeholder:"Website redesign, 3 pages, logo design…"},{key:"amount",label:"Total Amount ($)",type:"input",placeholder:"2500"}],
   prompt:(f)=>`Professional freelance invoice as plain text. Freelancer: "${f.freelancerName||"Alex"}", Client: "${f.clientName||"Client"}", Services: "${f.projectDesc||"Freelance services"}", Amount: $${f.amount||"0"}. Include: Invoice #, Date, Due Date (Net 14), itemized table, subtotal, tax (0%), total, payment instructions, thank-you note.`,
  },
  {id:"scope",icon:"📋",label:"Project Scope",desc:"Prevent scope creep before it starts",color:"#ec4899",
   fields:[{key:"projectType",label:"Project Type",type:"input",placeholder:"Mobile app, Marketing website…"},{key:"clientGoal",label:"Client's Goal",type:"textarea",placeholder:"What does the client want to achieve?"},{key:"timeline",label:"Timeline",type:"select",options:["1–2 weeks","2–4 weeks","1–2 months","2–3 months","3+ months"]},{key:"budget",label:"Budget ($)",type:"input",placeholder:"5000"}],
   prompt:(f)=>`Project scope document. Type: "${f.projectType||"project"}", Goal: "${f.clientGoal||"results"}", Timeline: "${f.timeline}", Budget: $${f.budget||"TBD"}. Include: Overview, Goals, Deliverables, Out of scope, Timeline phases, Revision policy, Change request process.`,
  },
  {id:"casestudy",icon:"🌟",label:"Case Study",desc:"Turn past work into client magnets",color:"#8b5cf6",
   fields:[{key:"projectName",label:"Project Name",type:"input",placeholder:"Redesigned Acme Corp's website"},{key:"problem",label:"Problem You Solved",type:"textarea",placeholder:"Their site had 80% bounce rate…"},{key:"solution",label:"What You Did",type:"textarea",placeholder:"Redesigned UX, improved load speed…"},{key:"result",label:"The Result",type:"input",placeholder:"Conversions up 45%, bounce rate dropped to 30%"}],
   prompt:(f)=>`Portfolio case study. Project: "${f.projectName||"project"}", Problem: "${f.problem||"issues"}", Solution: "${f.solution||"solved it"}", Result: "${f.result||"great outcome"}". Format: 1) Punchy headline, 2) Challenge, 3) Approach, 4) Results (metrics bolded), 5) Testimonial request. Under 300 words.`,
  },
  {id:"salescoach",icon:"🤖",label:"AI Sales Coach",desc:"Handle objections & close more clients",color:"#ef4444",
   fields:[{key:"objection",label:"Client Said",type:"select",options:["Too expensive / over budget","I'll think about it","Maybe later","I found someone cheaper","Need to ask my boss","Portfolio isn't strong enough","We'll do it in-house"]},{key:"context",label:"Project Context",type:"input",placeholder:"Logo design, $800 budget…"},{key:"relationship",label:"Relationship",type:"select",options:["First conversation","Already had a call","Sent proposal","We've worked before"]}],
   prompt:(f)=>`Sales coach for freelancers. Client said: "${f.objection}" about "${f.context||"project"}". Stage: "${f.relationship}". Give: 1) Why they REALLY said this, 2) Three replies (Firm/Soft/Creative, each under 60 words), 3) One thing NOT to say, 4) Follow-up if they go silent.`,
  },
  {id:"websiteaudit",icon:"🔍",label:"Website Audit",desc:"Generate a pro audit report for any site",color:"#06b6d4",
   fields:[{key:"websiteUrl",label:"Website URL",type:"input",placeholder:"https://example.com"},{key:"businessType",label:"Business Type",type:"input",placeholder:"Local restaurant, SaaS startup…"},{key:"auditGoal",label:"Your Goal",type:"select",options:["Send to prospect as free value","Pitch a redesign","Pitch SEO services","Pitch social media","General audit"]}],
   prompt:(f)=>`Website audit report for "${f.websiteUrl||"a website"}" — "${f.businessType||"business"}" — goal: "${f.auditGoal}". Include: 1) Executive Summary, 2) Critical Issues (5-7: speed/mobile/SEO/UX/CTA/trust/security), 3) Opportunity Score X/10, 4) Quick Wins (3 fixable in a week), 5) Services to pitch, 6) Client-facing closing hook. Feel like a real $200 audit.`,
  },
  {id:"followup",icon:"🔔",label:"Follow-up Drafter",desc:"Perfect nudges that get replies",color:"#f97316",
   fields:[{key:"situation",label:"What Happened?",type:"select",options:["Sent proposal — no reply (3 days)","Sent proposal — no reply (1 week)","Had a call — went quiet","Sent invoice — not paid","No testimonial yet","Client ghosted mid-project"]},{key:"clientName",label:"Client Name",type:"input",placeholder:"John / Acme Corp"},{key:"projectContext",label:"Project Context",type:"input",placeholder:"Website redesign, mobile app…"},{key:"tone",label:"Tone",type:"select",options:["Warm & Friendly","Professional & Direct","Firm but Polite","Casual"]}],
   prompt:(f)=>`Follow-up messages. Situation: "${f.situation}" for "${f.clientName||"client"}" re: "${f.projectContext||"project"}". Tone: ${f.tone}. Generate: 1) WhatsApp/text (under 80 words), 2) Email with subject line, 3) LinkedIn (under 50 words), 4) What to do if still no reply.`,
  },
  {id:"redflag",icon:"🚨",label:"Red Flag Detector",desc:"Know if a client is worth your time",color:"#ff4444",
   fields:[{key:"jobPost",label:"Job Posting / Message",type:"textarea",placeholder:"Paste the full job description or client message…"},{key:"budget",label:"Budget Mentioned ($)",type:"input",placeholder:"500 or 'flexible'"},{key:"yourRate",label:"Your Hourly Rate ($)",type:"input",placeholder:"50"}],
   prompt:(f)=>`Freelance protection expert. Analyze for red flags: "${f.jobPost}". Budget: "${f.budget||"not mentioned"}". Rate: $${f.yourRate||"unknown"}/hr. Give: 1) Safety Score X/10, 2) Red Flags (🔴High/🟡Medium/🟢None), 3) Green Flags, 4) Verdict (Take it/Caution/Avoid), 5) One protective clause to add.`,
  },
  {id:"roast",icon:"🔥",label:"Roast My Proposal",desc:"AI tears it apart & rewrites it better",color:"#ff6b35",
   fields:[
     {key:"proposal",label:"Your Proposal",type:"textarea",placeholder:"Paste your full proposal here — be brave…"},
     {key:"jobContext",label:"What Was the Job?",type:"input",placeholder:"React developer for SaaS dashboard, $3000 budget"},
     {key:"result",label:"Did You Win It?",type:"select",options:["Don't know yet","Yes — I won it","No — I lost it","No reply"]},
   ],
   prompt:(f)=>`You are a brutally honest but helpful freelance proposal coach. Roast this proposal: "${f.proposal}". Job context: "${f.jobContext||"not specified"}". Result: "${f.result}". Structure your response as: 1) SCORE: X/10 with one brutal one-liner, 2) WHAT'S KILLING IT 💀 (3-4 specific problems, be blunt), 3) WHAT ACTUALLY WORKS ✅ (be fair, find the good parts), 4) THE REWRITE 🔥 (rewrite the opening paragraph only, make it 10x better), 5) TOP 3 RULES to never break again. Be direct, witty, not mean. The goal is to help them win.`,
  },
  {id:"latepayment",icon:"💸",label:"Late Payment Chaser",desc:"Get paid without burning bridges",color:"#f43f5e",
   fields:[
     {key:"clientName",label:"Client Name",type:"input",placeholder:"John Smith / Acme Corp"},
     {key:"amount",label:"Amount Owed ($)",type:"input",placeholder:"1500"},
     {key:"daysOverdue",label:"Days Overdue",type:"select",options:["7 days","14 days","21 days","30 days","45+ days"]},
     {key:"previousAttempts",label:"Previous Attempts",type:"select",options:["First reminder","Second reminder — no reply","Third — final warning","They promised but didn't pay"]},
   ],
   prompt:(f)=>`You are a freelance payment recovery expert. Write payment chaser messages for client "${f.clientName||"the client"}" who owes $${f.amount||"X"}, is ${f.daysOverdue} overdue, and this is the ${f.previousAttempts}. Generate ALL 3 of these: 1) 📱 WhatsApp message (under 60 words, friendly but firm), 2) 📧 Email (with subject line, professional, escalating tone matching the attempt number), 3) 📋 Final Notice (if 30+ days: formal letter tone with mention of next steps like late fees or legal). Also add: 4) One tip for preventing this with future clients. Never aggressive, always professional.`,
  },
];

// ── Reusable UI ──
function Orb({style,anim}){return <div style={{position:"fixed",borderRadius:"50%",pointerEvents:"none",zIndex:0,filter:"blur(65px)",animation:`${anim} ease-in-out infinite`,...style}}/>;}

function Shimmer(){return <div style={{padding:"4px 0"}}>{[100,80,92,65,85,55,75].map((w,i)=>(<div key={i} style={{height:13,borderRadius:7,marginBottom:13,width:`${w}%`,background:"linear-gradient(90deg,#1a1835 0%,#2d2960 40%,#1a1835 80%)",backgroundSize:"700px 100%",animation:`kShimmer 1.6s ${i*0.07}s infinite linear`}}/>))}</div>;}

function Dots(){return <div style={{display:"flex",alignItems:"center",gap:10,marginTop:14,color:C.soft,fontSize:13,fontWeight:500}}><div style={{display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.soft})`,animation:`kDot 1.3s ${i*0.18}s ease-in-out infinite`}}/>)}</div>Generating…</div>;}

function CopyBtn({text}){
  const [done,setDone]=useState(false);
  const fb=()=>{const ta=document.createElement("textarea");ta.value=text;ta.style.cssText="position:fixed;top:-9999px;opacity:0;";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");setDone(true);setTimeout(()=>setDone(false),2000);}catch{}document.body.removeChild(ta);};
  const go=()=>navigator.clipboard?.writeText(text).then(()=>{setDone(true);setTimeout(()=>setDone(false),2000);}).catch(fb)||fb();
  return <button onClick={go} style={{padding:"7px 18px",borderRadius:8,border:`1.5px solid ${done?"#a78bfa":C.accent}`,background:done?`linear-gradient(135deg,${C.accent},${C.soft})`:"transparent",color:done?"#fff":C.accent,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",animation:done?"kPop 0.4s ease":"none"}}>{done?"✓ Copied!":"Copy"}</button>;
}

// ── DOWNLOAD BUTTON ──
function DownloadBtn({text,toolName}){
  const dl=()=>{
    const blob=new Blob([text],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`${toolName.replace(/\s+/g,"-").toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return <button onClick={dl} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"transparent",color:C.muted,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.soft;e.currentTarget.style.color=C.soft;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
    ↓ Save
  </button>;
}

// ── ONBOARDING MODAL ──
function OnboardingModal({onDone}){
  const [step,setStep]=useState(0);
  const steps=[
    {icon:"👋",title:"Welcome to ProposlyAI",sub:"Your AI-powered freelance command center.",desc:"13 tools to write proposals, close clients, get paid, and grow your business — all in one place."},
    {icon:"⚡",title:"How it works",sub:"Simple 3-step process.",desc:"1. Pick a tool from the grid\n2. Fill in your details\n3. Hit Generate — your document is ready in seconds. Copy or download it instantly."},
    {icon:"🎁",title:"You get 3 free generations",sub:"No credit card needed.",desc:"Start with the Proposal Writer or Red Flag Detector. Upgrade to Pro anytime for unlimited access to all 13 tools."},
  ];
  const s=steps[step];
  const isLast=step===steps.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:"#000000bb",backdropFilter:"blur(8px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.accent}66`,borderRadius:22,padding:"40px 28px",width:"100%",maxWidth:400,animation:"kPop 0.4s ease both",boxShadow:`0 0 80px ${C.accent}22`,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>{s.icon}</div>
        <div style={{fontSize:11,fontWeight:700,color:C.soft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{s.sub}</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,letterSpacing:"-0.5px",marginBottom:12,lineHeight:1.2}}>{s.title}</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.75,marginBottom:28,whiteSpace:"pre-line"}}>{s.desc}</p>
        {/* Step dots */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?20:7,height:7,borderRadius:4,background:i===step?C.accent:C.border,transition:"all 0.3s"}}/>)}
        </div>
        <button onClick={()=>isLast?(Auth.setOnboarded(),onDone()):setStep(s=>s+1)} style={{width:"100%",padding:"14px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",animation:"kPulse 2.5s ease-in-out infinite"}}>
          {isLast?"Let\'s go → ✨":"Next →"}
        </button>
        {step>0&&<div onClick={()=>setStep(s=>s-1)} style={{marginTop:12,color:C.muted,fontSize:13,cursor:"pointer"}}>← Back</div>}
        <div onClick={()=>{Auth.setOnboarded();onDone();}} style={{marginTop:8,color:C.muted,fontSize:12,cursor:"pointer",opacity:0.6}}>Skip</div>
      </div>
    </div>
  );
}

// ── HISTORY PANEL ──
function HistoryPanel({onClose,onRestore}){
  const [history,setHistory]=useState(Auth.getHistory());
  const [preview,setPreview]=useState(null);
  const clear=()=>{Auth.clearHistory();setHistory([]);setPreview(null);};
  return(
    <div style={{position:"fixed",inset:0,background:"#000000aa",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.border}`,borderRadius:"22px 22px 16px 16px",width:"100%",maxWidth:560,maxHeight:"80vh",display:"flex",flexDirection:"column",animation:"kFadeUp 0.3s ease both"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:15,fontWeight:800,color:"#fff"}}>📂 Generation History</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {history.length>0&&<span onClick={clear} style={{fontSize:12,color:"#ff6b8a",cursor:"pointer",fontWeight:600}}>Clear all</span>}
            <span onClick={onClose} style={{fontSize:20,color:C.muted,cursor:"pointer",lineHeight:1}}>×</span>
          </div>
        </div>
        {/* List */}
        <div style={{overflowY:"auto",flex:1,padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {history.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:14}}>No generations yet. Start creating!</div>}
          {history.map(h=>(
            <div key={h.id} onClick={()=>setPreview(preview?.id===h.id?null:h)} style={{background:preview?.id===h.id?`${C.accent}15`:C.card,border:`1px solid ${preview?.id===h.id?C.accent+"66":C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:preview?.id===h.id?10:0}}>
                <div>
                  <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{h.toolIcon} {h.toolName}</span>
                  <span style={{fontSize:11,color:C.muted,marginLeft:10}}>{h.date}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {preview?.id===h.id&&<><CopyBtn text={h.output}/><DownloadBtn text={h.output} toolName={h.toolName}/></>}
                </div>
              </div>
              {preview?.id===h.id&&<pre style={{color:"#ccc8f0",fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0,maxHeight:200,overflowY:"auto",background:C.bg,borderRadius:8,padding:12}}>{h.output}</pre>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── REFERRAL PANEL ──
const REFERRAL_PERKS=["1 free month for you","1 free month for your friend","Stacks up to 12 months free"];
function ReferralPanel({user,onClose}){
  const code=Auth.getReferralCode()||"YOURCODE";
  const link=`https://proposlyai.com?ref=${code}`;
  const [copied,setCopied]=useState(false);
  const copy=()=>{
    const fb=()=>{const ta=document.createElement("textarea");ta.value=link;ta.style.cssText="position:fixed;top:-9999px;opacity:0;";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}document.body.removeChild(ta);};
    navigator.clipboard?.writeText(link).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(fb)||fb();
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#000000aa",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.accent}66`,borderRadius:22,padding:"36px 28px",width:"100%",maxWidth:420,animation:"kPop 0.4s ease both",boxShadow:`0 0 80px ${C.accent}22`,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🎁</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,letterSpacing:"-0.5px",marginBottom:8}}>Refer & Earn Free Months</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.75,marginBottom:20}}>Share ProposlyAI with a fellow freelancer. You both get 1 free month when they sign up.</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
          {REFERRAL_PERKS.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#ccc8f0",background:C.card,borderRadius:10,padding:"10px 14px"}}><span style={{color:"#10b981",fontWeight:700}}>{i+1}.</span>{p}</div>)}
        </div>
        <div style={{background:C.bg,border:`1.5px solid ${C.accent}44`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{flex:1,fontSize:13,color:C.soft,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</span>
          <button onClick={copy} style={{padding:"6px 14px",borderRadius:8,background:copied?`linear-gradient(135deg,${C.accent},${C.soft})`:"transparent",border:`1px solid ${C.accent}`,color:copied?"#fff":C.accent,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",whiteSpace:"nowrap"}}>{copied?"✓ Copied!":"Copy link"}</button>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{const t=`Hey! I've been using ProposlyAI to write proposals, handle objections & chase payments. Try it free → ${link}`;const fb=()=>{const ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;top:-9999px;opacity:0;";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");}catch{}document.body.removeChild(ta);};navigator.clipboard?.writeText(t).catch(fb)||fb();}} style={{flex:1,padding:"11px",borderRadius:10,background:C.card,border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>📋 Copy message</button>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Done ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── FEEDBACK WIDGET ──
function FeedbackWidget({toolId,toolName,onDone}){
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [sent,setSent]=useState(false);
  const submit=()=>{if(!rating)return;Auth.saveFeedback(toolId,rating,comment);setSent(true);setTimeout(onDone,1800);};
  if(sent)return <div style={{textAlign:"center",padding:"16px",color:"#10b981",fontSize:14,fontWeight:600,animation:"kFadeUp 0.3s ease"}}>✅ Thanks for your feedback!</div>;
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginTop:12,animation:"kFadeUp 0.3s ease both"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:10}}>How was this output? <span style={{color:C.muted,fontWeight:500}}>(takes 5 sec)</span></div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{v:1,e:"😕",l:"Poor"},{v:2,e:"😐",l:"OK"},{v:3,e:"😊",l:"Good"},{v:4,e:"🤩",l:"Great"}].map(r=>(
          <button key={r.v} onClick={()=>setRating(r.v)} style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1.5px solid ${rating===r.v?C.accent+"88":C.border}`,background:rating===r.v?`${C.accent}18`:C.bg,cursor:"pointer",fontFamily:"inherit",transition:"all 0.18s"}}>
            <div style={{fontSize:20}}>{r.e}</div>
            <div style={{fontSize:10,color:rating===r.v?C.soft:C.muted,fontWeight:600,marginTop:2}}>{r.l}</div>
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Optional: what could be better?" style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none",resize:"none",height:60,boxSizing:"border-box",marginBottom:10}}/>
      <button onClick={submit} disabled={!rating} style={{width:"100%",padding:"10px",borderRadius:9,background:rating?`linear-gradient(135deg,${C.accent},${C.soft})`:"#1e1c38",border:"none",color:rating?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:rating?"pointer":"not-allowed",fontFamily:"inherit",transition:"all 0.2s"}}>Submit Feedback</button>
    </div>
  );
}

// ── CHANGELOG MODAL ──
const CHANGELOG=[
  {version:"v1.3",date:"Jun 2025",tag:"NEW",color:"#10b981",items:["🎁 Referral program — earn free months","👍 Feedback widget on every output","📋 Public roadmap launched","🔔 Changelog notifications"]},
  {version:"v1.2",date:"May 2025",tag:"UPDATE",color:"#6C63FF",items:["📂 Generation history (last 30 saved)","↓ Download outputs as .txt","👋 Onboarding flow for new users","📬 Email reminder banner"]},
  {version:"v1.1",date:"Apr 2025",tag:"TOOLS",color:"#f59e0b",items:["🔥 Roast My Proposal added","💸 Late Payment Chaser added","🚨 Red Flag Detector added","📱 Full mobile optimisation"]},
  {version:"v1.0",date:"Mar 2025",tag:"LAUNCH",color:"#a78bfa",items:["✍️ Proposal Writer","💰 Rate Calculator","📧 Cold Outreach","🧾 Invoice Generator + 6 more tools"]},
];
function ChangelogModal({onClose}){
  useEffect(()=>Auth.setLastSeen(CHANGELOG[0].version),[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000000aa",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.border}`,borderRadius:22,width:"100%",maxWidth:480,maxHeight:"80vh",display:"flex",flexDirection:"column",animation:"kFadeUp 0.3s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>📋 What's New</div><div style={{fontSize:12,color:C.muted}}>ProposlyAI changelog</div></div>
          <span onClick={onClose} style={{fontSize:22,color:C.muted,cursor:"pointer",lineHeight:1}}>×</span>
        </div>
        <div style={{overflowY:"auto",padding:"16px 24px",display:"flex",flexDirection:"column",gap:20}}>
          {CHANGELOG.map((c,i)=>(
            <div key={i}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{c.version}</span>
                <span style={{background:`${c.color}22`,border:`1px solid ${c.color}66`,color:c.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,letterSpacing:"0.06em"}}>{c.tag}</span>
                <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{c.date}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {c.items.map((item,j)=><div key={j} style={{fontSize:13,color:"#ccc8f0",paddingLeft:8,borderLeft:`2px solid ${c.color}44`,paddingTop:2,paddingBottom:2}}>{item}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PUBLIC ROADMAP ──
const ROADMAP=[
  {status:"live",label:"Live",color:"#10b981",items:["Proposal Writer","Rate Calculator","Cold Outreach","Invoice Generator","Project Scope","Case Study Writer","AI Sales Coach","Website Audit","Follow-up Drafter","Red Flag Detector","Roast My Proposal","Late Payment Chaser"]},
  {status:"building",label:"Building Now",color:"#f59e0b",items:["Upwork Profile Optimizer","Discovery Call Script","Weekly Client Update","Testimonial Request Generator"]},
  {status:"planned",label:"Planned",color:"#6C63FF",items:["Browser Extension","Mobile App","Multi-language support","Zapier integration","Team collaboration","Affiliate dashboard"]},
];
function RoadmapModal({onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000000aa",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.border}`,borderRadius:22,width:"100%",maxWidth:500,maxHeight:"82vh",display:"flex",flexDirection:"column",animation:"kFadeUp 0.3s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>🗺️ Product Roadmap</div><div style={{fontSize:12,color:C.muted}}>Vote with your wallet — most-used tools ship first</div></div>
          <span onClick={onClose} style={{fontSize:22,color:C.muted,cursor:"pointer",lineHeight:1}}>×</span>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:20}}>
          {ROADMAP.map((lane,i)=>(
            <div key={i}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:lane.color,boxShadow:`0 0 8px ${lane.color}`}}/>
                <span style={{fontSize:12,fontWeight:700,color:lane.color,textTransform:"uppercase",letterSpacing:"0.08em"}}>{lane.label}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {lane.items.map((item,j)=>(
                  <div key={j} style={{background:C.card,border:`1px solid ${lane.color}33`,borderRadius:9,padding:"8px 12px",fontSize:12,color:"#ccc8f0",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:lane.color,fontSize:10}}>●</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{textAlign:"center",padding:"12px",background:`${C.accent}10`,border:`1px solid ${C.accent}33`,borderRadius:12,fontSize:13,color:C.muted}}>
            💡 <span style={{color:"#ccc8f0"}}>Want something added?</span> Email us at <span style={{color:C.soft}}>hello@proposlyai.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TIER 4: LIVE CHAT WIDGET ──
function LiveChat(){
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{from:"bot",text:"👋 Hi! I\'m the ProposlyAI support bot. How can I help you today?",t:Date.now()}]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const INTENTS=[
    {keys:["price","cost","how much","plan","paid","subscription","charge","fee"],a:"We have 2 plans:\n\n🆓 Free — 3 generations, no card needed\n⚡ Pro — $19/mo, unlimited generations, all 12 tools, 7-day free trial\n\nNo hidden fees. Cancel anytime."},
    {keys:["trial","free trial","7 day","7-day","try"],a:"Your 7-day free trial gives full Pro access — all 12 tools, unlimited generations. You won't be charged until the trial ends. Cancel with one click before then. No credit card needed to start Free! 🎉"},
    {keys:["cancel","cancell","stop","end subscription"],a:"Cancel anytime from your dashboard — no forms, no phone calls, no guilt. Your access continues until the end of your billing period. We also offer a 30-day money-back guarantee."},
    {keys:["refund","money back","guarantee"],a:"Yes! 30-day money-back guarantee, no questions asked. Email hello@proposlyai.com and we'll refund you within 24 hours."},
    {keys:["tool","feature","what can","what do","include","how many"],a:"ProposlyAI has 12 tools:\n\n✍️ Proposal Writer\n💰 Rate Calculator\n📧 Cold Outreach\n🧾 Invoice Generator\n📋 Project Scope\n🌟 Case Study\n🤖 AI Sales Coach\n🔍 Website Audit\n🔔 Follow-up Drafter\n🚨 Red Flag Detector\n🔥 Roast My Proposal\n💸 Late Payment Chaser\n\nNew tools added monthly!"},
    {keys:["upwork","fiverr","toptal","freelance platform","platform"],a:"ProposlyAI works for any freelance platform — Upwork, Fiverr, Toptal, LinkedIn, direct clients. The Proposal Writer and Red Flag Detector are especially popular with Upwork freelancers. 🚀"},
    {keys:["proposal","write proposal","proposal writer"],a:"The Proposal Writer is our most popular tool! Paste any job description, add your name and skills, pick a tone, and get a winning proposal in seconds. Freelancers using it report 2-3x higher win rates."},
    {keys:["invoice","payment","get paid"],a:"The Invoice Generator creates professional invoices instantly. Fill in your name, client, services, and amount — it handles the formatting, payment terms, and thank-you note for you."},
    {keys:["rate","charge","how much should","pricing","undercharge"],a:"The Rate Calculator analyzes your role, experience, location, and hours to give you a specific hourly rate range, project pricing examples, and monthly income potential. Most users discover they're undercharging!"},
    {keys:["red flag","bad client","scam","avoid client"],a:"The Red Flag Detector analyzes any job posting and scores it 1-10 for safety. It flags lowball budgets, scope creep risks, payment red flags, and unrealistic deadlines — then tells you exactly what to watch out for."},
    {keys:["roast","improve proposal","bad proposal","proposal score"],a:"Roast My Proposal is brutally honest and super helpful! Paste your proposal, get a score out of 10, see what's killing it, what works, and a rewritten opening paragraph. Freelancers love it — and share it everywhere."},
    {keys:["late payment","unpaid","client won't pay","chase"],a:"The Late Payment Chaser generates WhatsApp messages, emails with subject lines, and formal notices for overdue payments — all matched to how many days overdue and which reminder you're on. One user recovered $2,400 with it!"},
    {keys:["secure","privacy","data","safe","store"],a:"Your privacy is our priority. Generated outputs are NOT stored on our servers after delivery. We only keep your account info (email, usage count). No selling data, no ads. Ever."},
    {keys:["help","support","contact","problem","issue","bug"],a:"We're here to help! Email hello@proposlyai.com — we typically reply within 2 hours. You can also check the FAQ section on the main page for quick answers."},
    {keys:["hi","hello","hey","good","how are","what's up","sup"],a:"Hey there! 👋 I'm the ProposlyAI assistant. I can help with questions about our tools, plans, billing, or anything else. What would you like to know?"},
  ];
  const send=async()=>{
    const txt=input.trim(); if(!txt) return;
    setMsgs(m=>[...m,{from:"user",text:txt,t:Date.now()}]);
    setInput(""); setTyping(true);
    await new Promise(r=>setTimeout(r,700+Math.random()*500));
    const tl=txt.toLowerCase();
    const match=INTENTS.find(i=>i.keys.some(k=>tl.includes(k)));
    const reply=match?match.a:"That's a great question! I may not have the exact answer, but you can email hello@proposlyai.com for detailed help. We reply within 2 hours. ⚡ Is there anything else I can help with?";
    setTyping(false);
    setMsgs(m=>[...m,{from:"bot",text:reply,t:Date.now()}]);
  };
  return(
    <>
      {/* Chat button */}
      <button onClick={()=>setOpen(o=>!o)} style={{position:"fixed",bottom:80,right:16,width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:22,cursor:"pointer",zIndex:900,boxShadow:`0 4px 24px ${C.accent}66`,animation:"kPulse 3s ease-in-out infinite",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        {open?"×":"💬"}
      </button>
      {/* Chat window */}
      {open&&(
        <div style={{position:"fixed",bottom:88,right:16,width:320,maxWidth:"calc(100vw - 32px)",background:"#14122e",border:`1.5px solid ${C.accent}44`,borderRadius:18,zIndex:901,boxShadow:`0 8px 48px #00000088`,animation:"kFadeUp 0.3s ease both",display:"flex",flexDirection:"column",maxHeight:420}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.soft})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>ProposlyAI Support</div><div style={{fontSize:11,color:"#10b981"}}>● Online — replies in seconds</div></div>
            <span onClick={()=>setOpen(false)} style={{marginLeft:"auto",color:C.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8,minHeight:200}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start",animation:"kFadeUp 0.25s ease"}}>
                <div style={{maxWidth:"82%",background:m.from==="user"?`linear-gradient(135deg,${C.accent},${C.soft})`:"#1e1c38",color:"#fff",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 13px",fontSize:13,lineHeight:1.6}}>{m.text}</div>
              </div>
            ))}
            {typing&&<div style={{display:"flex",gap:4,padding:"8px 12px",background:"#1e1c38",borderRadius:"14px 14px 14px 4px",width:"fit-content"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`kDot 1.3s ${i*0.18}s infinite`}}/>)}
            </div>}
            <div ref={endRef}/>
          </div>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything…" style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,padding:"8px 12px",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <button onClick={send} style={{width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── TIER 4: TESTIMONIALS SECTION ──
const TESTIMONIALS=[
  {name:"Sarah K.",role:"Freelance UX Designer",avatar:"S",color:"#6C63FF",text:"The Proposal Writer helped me win my first $5,000 project on Upwork. I was terrible at writing proposals before. Now I close 1 in 3.",stars:5},
  {name:"Marcus T.",role:"Full-Stack Developer",avatar:"M",color:"#10b981",text:"The Red Flag Detector saved me from a nightmare client. Flagged 4 red flags I completely missed. Worth every penny of the subscription.",stars:5},
  {name:"Priya R.",role:"Copywriter & SEO Consultant",avatar:"P",color:"#f59e0b",text:"Late Payment Chaser recovered $2,400 I thought I\'d lost. Client paid within 24 hours of the email it generated. Unreal.",stars:5},
  {name:"James O.",role:"Video Editor",avatar:"J",color:"#ec4899",text:"I used the Rate Calculator and realized I was undercharging by $35/hour. Raised my rates immediately. Clients didn\'t even push back.",stars:5},
  {name:"Aisha M.",role:"Social Media Manager",avatar:"A",color:"#8b5cf6",text:"The AI Sales Coach is gold. Client said \'too expensive\' and the comeback it generated actually closed the deal. I was shocked.",stars:5},
  {name:"David L.",role:"Brand Identity Designer",avatar:"D",color:"#06b6d4",text:"Roast My Proposal is brutal and brilliant. It rewrote my opener and my win rate jumped from 15% to 40% in one month.",stars:5},
];
function TestimonialsSection(){
  const w=useW();const mb=w<640;
  return(
    <div style={{marginTop:80}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{display:"inline-block",background:"#1a1835",border:`1px solid ${C.accent}44`,color:C.soft,fontSize:11,fontWeight:700,padding:"5px 16px",borderRadius:20,letterSpacing:"0.08em",marginBottom:16}}>TESTIMONIALS</div>
        <h2 style={{fontSize:"clamp(22px,4vw,34px)",fontWeight:900,color:"#fff",letterSpacing:"-1px",marginBottom:10}}>Freelancers are winning more</h2>
        <p style={{color:C.muted,fontSize:15,margin:0}}>Real results from real freelancers using ProposlyAI.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mb?"1fr":w<900?"1fr 1fr":"repeat(3,1fr)",gap:14}}>
        {TESTIMONIALS.map((t,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 18px",animation:`kFadeUp 0.5s ${i*0.08}s ease both`,transition:"border-color 0.3s,transform 0.3s,box-shadow 0.3s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+"55";e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 10px 32px ${t.color}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{display:"flex",gap:2,marginBottom:12}}>{[...Array(t.stars)].map((_,j)=><span key={j} style={{color:"#fbbf24",fontSize:14}}>★</span>)}</div>
            <p style={{color:"#ccc8f0",fontSize:13,lineHeight:1.75,marginBottom:16,margin:"0 0 16px"}}>"{t.text}"</p>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${t.color},${t.color}88)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,flexShrink:0}}>{t.avatar}</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{t.name}</div><div style={{fontSize:11,color:C.muted}}>{t.role}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TIER 4: ANALYTICS WIDGET (in dashboard) ──
function AnalyticsWidget(){
  const history=Auth.getHistory();
  const feedback=Auth.getFeedback();
  const toolCounts={};
  history.forEach(h=>{toolCounts[h.toolName]=(toolCounts[h.toolName]||0)+1;});
  const sorted=Object.entries(toolCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const total=history.length;
  const rated=Object.keys(feedback).length;
  if(total===0)return(<div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:13}}>No generations yet — start creating to see your stats!</div>);
  return(
    <div style={{marginTop:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["🔢","Total",total],["⭐","Rated",rated],["🔥","Top Tool",sorted[0]?sorted[0][0].split(" ")[0]:"—"]].map(([e,l,v])=>(
          <div key={l} style={{background:C.bg,borderRadius:10,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:20}}>{e}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff",animation:"kCounter 0.5s ease"}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
          </div>
        ))}
      </div>
      {sorted.length>0&&(<>
        <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8}}>Most Used Tools</div>
        {sorted.map(([name,count],i)=>(
          <div key={i} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#ccc8f0"}}>{name}</span>
              <span style={{fontSize:12,color:C.soft,fontWeight:700}}>{count}x</span>
            </div>
            <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${C.accent},${C.soft})`,width:`${Math.min(100,(count/total)*100*2)}%`,transition:"width 0.8s ease"}}/>
            </div>
          </div>
        ))}
      </>)}
    </div>
  );
}

// ── TIER 5: TERMS & PRIVACY MODAL ──
function LegalModal({type,onClose}){
  const isTerms=type==="terms";
  const content=isTerms?[
    ["Acceptance","By using ProposlyAI, you agree to these Terms. If you disagree, please do not use the service."],
    ["Use License","You may use outputs generated by ProposlyAI for any commercial or personal purpose. No attribution required."],
    ["Free Tier Limits","Free accounts are limited to 3 AI generations. Usage is tracked per account and resets monthly on paid plans."],
    ["Subscriptions","Pro and Agency plans are billed monthly. You may cancel at any time. We offer a 30-day money-back guarantee."],
    ["Prohibited Use","You may not use ProposlyAI to generate spam, fraudulent proposals, or content that violates applicable laws."],
    ["Limitation of Liability","ProposlyAI provides AI-generated content as-is. We are not liable for outcomes resulting from use of generated content."],
    ["Changes","We may update these Terms at any time. Continued use constitutes acceptance of updated terms."],
  ]:[
    ["Data We Collect","We collect your email address, usage data, and generated content to provide and improve the service."],
    ["How We Use Data","Your data is used to authenticate your account, track usage limits, and improve AI output quality."],
    ["Data Storage","Account data is stored securely. Generated outputs are not stored on our servers after delivery."],
    ["Third Parties","We use Stripe for payments and Supabase for authentication. These providers have their own privacy policies."],
    ["Cookies","We use essential cookies for authentication. No advertising or tracking cookies are used."],
    ["Your Rights","You may request deletion of your account and associated data at any time by emailing hello@proposlyai.com."],
    ["Contact","Privacy questions: privacy@proposlyai.com"],
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"#000000bb",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.border}`,borderRadius:22,width:"100%",maxWidth:520,maxHeight:"82vh",display:"flex",flexDirection:"column",animation:"kPop 0.35s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{isTerms?"📄 Terms of Service":"🔒 Privacy Policy"}</div>
          <span onClick={onClose} style={{fontSize:22,color:C.muted,cursor:"pointer",lineHeight:1}}>×</span>
        </div>
        <div style={{overflowY:"auto",padding:"16px 24px",display:"flex",flexDirection:"column",gap:16}}>
          <p style={{color:C.muted,fontSize:13,margin:0}}>Last updated: June 2025</p>
          {content.map(([title,text],i)=>(
            <div key={i}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:5}}>{i+1}. {title}</div>
              <div style={{fontSize:13,color:"#aaa8d0",lineHeight:1.7}}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,textAlign:"center"}}>
          <button onClick={onClose} style={{padding:"10px 32px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Got it ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── EMAIL NOTIFICATION BANNER ──
function EmailBanner({user,onDismiss}){
  const [email,setEmail]=useState(user?.email||"");
  const [sent,setSent]=useState(false);
  const send=()=>{if(email.includes("@")){setSent(true);setTimeout(onDismiss,2500);}};
  if(sent) return(
    <div style={{background:"#10b98122",border:"1px solid #10b98166",borderRadius:12,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:10,animation:"kFadeUp 0.3s ease"}}>
      <span style={{fontSize:18}}>✅</span>
      <span style={{color:"#6ee7b7",fontSize:13,fontWeight:600}}>You\'re in! We\'ll remind you before your trial ends.</span>
    </div>
  );
  return(
    <div style={{background:`${C.accent}12`,border:`1px solid ${C.accent}44`,borderRadius:12,padding:"14px 16px",marginBottom:16,animation:"kFadeUp 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>📬 Get trial reminders</span>
          <span style={{fontSize:12,color:C.muted,marginLeft:8}}>We\'ll email you 2 days before trial ends</span>
        </div>
        <span onClick={onDismiss} style={{color:C.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>×</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
          style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none"}}
          onFocus={e=>{e.target.style.borderColor=C.accent;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        <button onClick={send} style={{padding:"8px 16px",borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Notify me</button>
      </div>
    </div>
  );
}

function Fld({field,value,onChange}){
  const base={width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:15,padding:"11px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.25s,box-shadow 0.25s"};
  const fo=e=>{e.target.style.borderColor=C.accent;e.target.style.boxShadow="0 0 0 3px #6C63FF22";};
  const bl=e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";};
  return(
    <div style={{marginBottom:15}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:7}}>{field.label}</label>
      {field.type==="textarea"?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} onFocus={fo} onBlur={bl} style={{...base,resize:"vertical",minHeight:90,lineHeight:1.65}}/>
      :field.type==="select"?<select value={value} onChange={e=>onChange(e.target.value)} onFocus={fo} onBlur={bl} style={{...base,cursor:"pointer"}}>{field.options.map(o=><option key={o}>{o}</option>)}</select>
      :<input value={value} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder} onFocus={fo} onBlur={bl} style={base}/>}
    </div>
  );
}

// ── AUTH MODAL ──
function AuthModal({mode:initMode,onAuth,onClose}){
  const [mode,setMode]=useState(initMode||"login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [shake,setShake]=useState(false);

  const doShake=()=>{setShake(true);setTimeout(()=>setShake(false),500);};

  const submit=async()=>{
    if(!email.trim()||!pass.trim()){setErr("Please fill in all fields.");doShake();return;}
    if(!email.includes("@")){setErr("Please enter a valid email.");doShake();return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");doShake();return;}
    if(mode==="signup"&&!name.trim()){setErr("Please enter your name.");doShake();return;}
    setLoading(true);setErr("");
    // Simulate auth — swap this block with Supabase in production:
    // const {data,error} = await supabase.auth.signInWithPassword({email,password:pass})
    await new Promise(r=>setTimeout(r,900));
    const user={name:mode==="signup"?name:email.split("@")[0],email,plan:"free",joinedAt:new Date().toISOString()};
    Auth.set(user);
    if(mode==="signup") Auth.resetUsage();
    setLoading(false);
    onAuth(user);
  };

  const googleAuth=async()=>{
    // Swap with: await supabase.auth.signInWithOAuth({provider:"google"})
    setLoading(true);
    await new Promise(r=>setTimeout(r,700));
    const user={name:"Google User",email:"user@gmail.com",plan:"free",joinedAt:new Date().toISOString()};
    Auth.set(user);Auth.resetUsage();
    setLoading(false);onAuth(user);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#00000088",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"kOverlay 0.2s ease"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.accent}66`,borderRadius:22,padding:"36px 28px",width:"100%",maxWidth:400,animation:`kModalIn 0.3s ease both`,boxShadow:`0 0 80px ${C.accent}22`,...(shake?{animation:"kShake 0.4s ease"}:{})}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.accent},${C.soft})`,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${C.accent}55`,marginBottom:14}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="14" height="18" rx="3" fill="#0D0B1E" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.7"/><rect x="6" y="6" width="8" height="2" rx="1" fill="#fff"/><rect x="6" y="10" width="6" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.5"/><path d="M18,1 L19.4,5.2 L23,6.5 L19.4,7.8 L18,12 L16.6,7.8 L13,6.5 L16.6,5.2 Z" fill="#fff"/></svg>
          </div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:22,letterSpacing:"-0.5px",margin:0}}>
            {mode==="login"?"Welcome back":"Create your account"}
          </h2>
          <p style={{color:C.muted,fontSize:14,marginTop:6,marginBottom:0}}>{mode==="login"?"Sign in to ProposlyAI":"Free forever. No credit card needed."}
          </p>
        </div>

        {/* Google btn */}
        <button onClick={googleAuth} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,border:`1.5px solid ${C.border}`,background:C.card,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18,transition:"border-color 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent+"66"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{flex:1,height:1,background:C.border}}/>
          <span style={{color:C.muted,fontSize:12}}>or</span>
          <div style={{flex:1,height:1,background:C.border}}/>
        </div>

        {/* Fields */}
        {mode==="signup"&&<Fld field={{key:"name",label:"Your Name",type:"input",placeholder:"Alex Johnson"}} value={name} onChange={setName}/>}
        <Fld field={{key:"email",label:"Email",type:"input",placeholder:"you@email.com"}} value={email} onChange={setEmail}/>
        <Fld field={{key:"pass",label:"Password",type:"input",placeholder:"Min 6 characters"}} value={pass} onChange={setPass}/>

        {err&&<div style={{color:"#ff6b8a",fontSize:13,marginBottom:12,fontWeight:500,animation:"kFadeUp 0.2s ease"}}>⚠ {err}</div>}

        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.75:1,animation:loading?"none":"kPulse 2.5s ease-in-out infinite",transition:"transform 0.2s",marginBottom:16}}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
          {loading?"Please wait…":mode==="login"?"Sign In →":"Create Free Account →"}
        </button>

        <div style={{textAlign:"center",fontSize:13,color:C.muted}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("");}} style={{color:C.soft,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"Sign up free":"Sign in"}</span>
        </div>
      </div>
    </div>
  );
}

// ── PAYWALL MODAL ──
function PaywallModal({onClose,onUpgrade}){
  return(
    <div style={{position:"fixed",inset:0,background:"#00000088",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"kOverlay 0.2s ease"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#14122e",border:`1.5px solid ${C.accent}66`,borderRadius:22,padding:"36px 28px",width:"100%",maxWidth:400,animation:"kModalIn 0.3s ease both",boxShadow:`0 0 80px ${C.accent}22`,textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>⚡</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,letterSpacing:"-0.5px",marginBottom:8}}>You've used your 3 free generations</h2>
        <p style={{color:C.muted,fontSize:14,marginBottom:24,lineHeight:1.7}}>Upgrade to Pro to unlock all 10 tools with unlimited generations. Cancel anytime.</p>

        {/* Mini pricing */}
        <div style={{background:C.card,border:`1.5px solid ${C.accent}88`,borderRadius:16,padding:"20px 22px",marginBottom:20,boxShadow:`0 0 30px ${C.accent}22`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.soft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Pro Plan</div>
          <div style={{fontSize:38,fontWeight:900,color:"#fff",letterSpacing:"-1px",lineHeight:1}}>$19<span style={{fontSize:15,color:C.muted,fontWeight:500}}>/mo</span></div>
          <div style={{fontSize:13,color:C.muted,marginTop:4,marginBottom:16}}>7-day free trial — no charge today</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
            {["Unlimited generations","All 10 tools unlocked","Priority AI speed","New tools monthly"].map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#ccc8f0"}}><span style={{color:"#10b981"}}>✓</span>{f}</div>
            ))}
          </div>
        </div>

        <button onClick={onUpgrade} style={{width:"100%",padding:"15px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 0 28px ${C.accent}44`,animation:"kPulse 2.5s ease-in-out infinite",marginBottom:12}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          ✨ Start 7-Day Free Trial
        </button>
        <div onClick={onClose} style={{color:C.muted,fontSize:13,cursor:"pointer"}}>Maybe later</div>
      </div>
    </div>
  );
}

// ── USER DASHBOARD ──
function UserDashboard({user,usage,onLogout,onUpgrade,onClose}){
  const isPro=user?.plan==="pro";
  const pct=Math.min((usage/FREE_LIMIT)*100,100);
  const [tab,setTab]=useState("overview");
  const [preview,setPreview]=useState(null);
  const history=Auth.getHistory();
  const remaining=Math.max(0,FREE_LIMIT-usage);
  const w=useW();const mb=w<500;

  const TABS=[
    {id:"overview",icon:"⚡",label:"My Account"},
    {id:"history",icon:"📂",label:"History"},
    {id:"roadmap",icon:"🗺️",label:"Roadmap"},
    {id:"changelog",icon:"✦",label:"What's New"},
  ];

  return(
    <div style={{position:"fixed",inset:0,background:"#000000bb",backdropFilter:"blur(10px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0d0b22",border:`1.5px solid ${C.accent}66`,borderRadius:24,width:"100%",maxWidth:500,maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"k3dCard 0.4s cubic-bezier(0.34,1.56,0.64,1) both",boxShadow:`0 40px 100px #00000099,0 0 80px ${C.accent}22,inset 0 1px 0 #ffffff11`}}>

        {/* ── TOP HEADER ── */}
        <div style={{background:"linear-gradient(135deg,#16143c 0%,#0d0b22 100%)",borderRadius:"24px 24px 0 0",padding:"20px 20px 0",borderBottom:`1px solid ${C.border}`}}>

          {/* User row */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            {/* Avatar with 3d float */}
            <div style={{width:46,height:46,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.soft})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",flexShrink:0,boxShadow:`0 0 0 3px ${C.accent}33,0 8px 24px ${C.accent}44`,animation:"k3dFloat 5s ease-in-out infinite"}}>
              {(user?.name||"U")[0].toUpperCase()}
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#fff",fontWeight:800,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
              <div style={{color:C.muted,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div>
            </div>

            {/* Plan badge */}
            <div style={{background:isPro?`linear-gradient(135deg,${C.accent},${C.soft})`:"#1a1835",color:isPro?"#fff":C.muted,fontSize:10,fontWeight:800,padding:"5px 11px",borderRadius:20,letterSpacing:"0.07em",flexShrink:0,boxShadow:isPro?`0 0 16px ${C.accent}55`:"none",border:isPro?"none":`1px solid ${C.border}`}}>
              {isPro?"⚡ PRO":"FREE"}
            </div>

            <span onClick={onClose} style={{color:C.muted,cursor:"pointer",fontSize:22,lineHeight:1,padding:"0 2px"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=C.muted}>×</span>
          </div>

          {/* Credit bar — always visible */}
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                {isPro?"✨ Credits":"🎁 Free Credits"}
              </span>
              <span style={{fontSize:12,fontWeight:800,color:isPro?"#10b981":remaining===0?"#ff6b8a":C.soft}}>
                {isPro?"Unlimited":""+remaining+" remaining"}
              </span>
            </div>
            <div style={{height:5,background:C.border,borderRadius:6,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:6,transition:"width 0.7s ease",
                width:isPro?"100%":`${pct}%`,
                background:isPro?"linear-gradient(90deg,#10b981,#34d399)":remaining===0?"linear-gradient(90deg,#ff4444,#ff6b8a)":`linear-gradient(90deg,${C.accent},${C.soft})`}}/>
            </div>
            {!isPro&&remaining===0&&<div style={{fontSize:11,color:"#ff6b8a",marginTop:5,fontWeight:600}}>All free credits used · Upgrade to continue</div>}
            {!isPro&&remaining>0&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>{usage} of {FREE_LIMIT} used · <span style={{color:C.soft,cursor:"pointer",fontWeight:600}} onClick={onUpgrade}>Upgrade for unlimited →</span></div>}
            {isPro&&<div style={{fontSize:11,color:"#10b981",marginTop:5,fontWeight:600}}>All 12 tools · Unlimited generations · Active</div>}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {TABS.map(t=>{
              const on=tab===t.id;
              const hasNew=t.id==="changelog"&&Auth.getLastSeen()!==CHANGELOG[0].version;
              return(
                <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==="changelog")Auth.setLastSeen(CHANGELOG[0].version);}} style={{padding:mb?"8px 10px":"9px 14px",border:"none",background:"transparent",color:on?"#fff":C.muted,fontSize:mb?11:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",borderBottom:`2.5px solid ${on?C.accent:"transparent"}`,transition:"all 0.2s",whiteSpace:"nowrap",position:"relative",flexShrink:0}}>
                  {t.icon} {t.label}
                  {hasNew&&<span style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"kPulse 1.5s infinite"}}/>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB BODY ── */}
        <div style={{overflowY:"auto",flex:1}}>

          {/* ══ MY ACCOUNT TAB ══ */}
          {tab==="overview"&&(
            <div style={{padding:"18px 20px",animation:"kTabIn 0.3s ease both"}}>

              {/* Stats grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                {[
                  ["🔢",history.length||usage,"Generations"],
                  ["🛠️",isPro?"12":"1","Tools"],
                  ["📅",new Date(user?.joinedAt||Date.now()).toLocaleDateString("en",{month:"short",year:"numeric"}),"Joined"],
                ].map(([icon,val,label])=>(
                  <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center",transition:"border-color 0.2s,transform 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent+"55";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:15,fontWeight:900,color:"#fff",letterSpacing:"-0.5px",animation:"kCounter 0.5s ease"}}>{val}</div>
                    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:2}}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Analytics */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Tool Usage Analytics</div>
                <AnalyticsWidget/>
              </div>

              {/* Upgrade CTA */}
              {!isPro&&(
                <button onClick={onUpgrade} style={{width:"100%",padding:"13px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:10,boxShadow:`0 4px 24px ${C.accent}44`,animation:"kPulse 2.5s ease-in-out infinite",transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  ✨ Upgrade to Pro — $19/mo · 7-Day Free Trial
                </button>
              )}

              {/* Sign out */}
              <button onClick={onLogout} style={{width:"100%",padding:"11px",borderRadius:12,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff6b8a55";e.currentTarget.style.color="#ff6b8a";e.currentTarget.style.background="#ff6b8a08";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent";}}>
                → Sign Out
              </button>
            </div>
          )}

          {/* ══ HISTORY TAB ══ */}
          {tab==="history"&&(
            <div style={{padding:"18px 20px",animation:"kTabIn 0.3s ease both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:12,color:C.muted,fontWeight:600}}>📂 {history.length} saved · last 30 kept</span>
                {history.length>0&&<span onClick={()=>{Auth.clearHistory();setPreview(null);window.location.reload();}} style={{fontSize:12,color:"#ff6b8a",cursor:"pointer",fontWeight:700}}>Clear all</span>}
              </div>
              {history.length===0
                ?<div style={{textAlign:"center",padding:"44px 20px",color:C.muted,fontSize:14,lineHeight:1.8}}>
                    <div style={{fontSize:36,marginBottom:12}}>📭</div>
                    No generations yet.<br/>
                    <span style={{fontSize:12}}>Start using any tool — outputs auto-save here.</span>
                  </div>
                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {history.map((h,i)=>{
                    const open=preview?.id===h.id;
                    return(
                      <div key={h.id} onClick={()=>setPreview(open?null:h)} style={{background:open?`${C.accent}10`:C.card,border:`1.5px solid ${open?C.accent+"66":C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all 0.2s",animation:`kFadeUp 0.3s ${i*0.03}s ease both`,boxShadow:open?`0 0 20px ${C.accent}18`:"none"}}
                        onMouseEnter={e=>{if(!open)e.currentTarget.style.borderColor=C.accent+"44";}}
                        onMouseLeave={e=>{if(!open)e.currentTarget.style.borderColor=C.border;}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{h.toolIcon} {h.toolName}</span>
                            <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{h.date}</span>
                          </div>
                          <span style={{color:C.muted,fontSize:11,transition:"transform 0.2s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>▼</span>
                        </div>
                        {open&&(
                          <div style={{marginTop:12,animation:"kTabIn 0.25s ease"}}>
                            <pre style={{color:"#ccc8f0",fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:"0 0 10px",maxHeight:160,overflowY:"auto",background:C.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>{h.output}</pre>
                            <div style={{display:"flex",gap:8}}>
                              <CopyBtn text={h.output}/>
                              <DownloadBtn text={h.output} toolName={h.toolName}/>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}

          {/* ══ ROADMAP TAB ══ */}
          {tab==="roadmap"&&(
            <div style={{padding:"18px 20px",animation:"kTabIn 0.3s ease both"}}>
              <p style={{color:C.muted,fontSize:13,marginBottom:18,lineHeight:1.65}}>Your usage shapes what ships next. Most-used tools get built first.</p>
              {ROADMAP.map((lane,i)=>(
                <div key={i} style={{marginBottom:20,animation:`kFadeUp 0.4s ${i*0.1}s ease both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:lane.color,boxShadow:`0 0 10px ${lane.color}`,flexShrink:0,animation:lane.status==="building"?"kBounce 1.8s ease-in-out infinite":"none"}}/>
                    <span style={{fontSize:11,fontWeight:800,color:lane.color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{lane.label}</span>
                    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${lane.color}33,transparent)`}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {lane.items.map((item,j)=>(
                      <div key={j} style={{background:C.bg,border:`1px solid ${lane.color}33`,borderRadius:9,padding:"8px 11px",fontSize:12,color:"#ccc8f0",display:"flex",alignItems:"center",gap:7,animation:`kFadeUp 0.3s ${j*0.04}s ease both`,transition:"border-color 0.2s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=lane.color+"77"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=lane.color+"33"}>
                        <span style={{color:lane.color,fontSize:9,flexShrink:0}}>●</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{textAlign:"center",padding:"12px 16px",background:`${C.accent}0A`,border:`1px solid ${C.accent}33`,borderRadius:11,fontSize:13,color:C.muted}}>
                💡 Want a feature? <a href="mailto:hello@proposlyai.com" style={{color:C.soft,textDecoration:"none",fontWeight:600}}>hello@proposlyai.com</a>
              </div>
            </div>
          )}

          {/* ══ WHAT'S NEW TAB ══ */}
          {tab==="changelog"&&(
            <div style={{padding:"18px 20px",animation:"kTabIn 0.3s ease both"}}>
              {CHANGELOG.map((c,i)=>(
                <div key={i} style={{marginBottom:20,animation:`kFadeUp 0.4s ${i*0.08}s ease both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontSize:13,fontWeight:900,color:"#fff"}}>{c.version}</span>
                    <span style={{background:`${c.color}22`,border:`1px solid ${c.color}55`,color:c.color,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:6,letterSpacing:"0.06em"}}>{c.tag}</span>
                    {i===0&&<span style={{background:"#ef444422",border:"1px solid #ef444466",color:"#ff6b8a",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6}}>NEW</span>}
                    <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{c.date}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {c.items.map((item,j)=>(
                      <div key={j} style={{fontSize:13,color:"#ccc8f0",padding:"8px 12px",background:C.bg,borderRadius:8,borderLeft:`3px solid ${c.color}`,animation:`kFadeUp 0.3s ${j*0.04}s ease both`,lineHeight:1.5}}>{item}</div>
                    ))}
                  </div>
                  {i<CHANGELOG.length-1&&<div style={{height:1,background:C.border,margin:"18px 0 -2px"}}/>}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


// ── TOOL PANEL ──
function ToolPanel({tool,user,usage,onUsed,onPaywall}){
  const [form,setForm]=useState(Object.fromEntries(tool.fields.map(f=>[f.key,f.type==="select"?f.options[0]:""])));
  const [out,setOut]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [showFeedback,setShowFeedback]=useState(false);
  const isPro=user?.plan==="pro";

  const run=async()=>{
    if(!user){onPaywall("auth");return;}
    if(!isPro&&usage>=FREE_LIMIT){onPaywall("limit");return;}
    const empty=tool.fields.find(f=>f.type!=="select"&&!form[f.key]?.trim());
    if(empty){setErr(`Please fill in "${empty.label}"`);return;}
    setErr("");setLoading(true);setOut("");
    try{
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({prompt:tool.prompt(form)})});
      const data=await res.json();
      const result=data.content?.map(b=>b.text||"").join("")||"Could not generate. Try again.";
      setOut(result);
      Auth.addHistory({toolName:tool.label,toolIcon:tool.icon,output:result});
      if(!isPro) onUsed();
      setTimeout(()=>setShowFeedback(true),800);
    }catch{setErr("Something went wrong. Please try again.");}
    setLoading(false);
  };

  return(
    <div style={{animation:"kFadeUp 0.5s ease both"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:16}}>
        {tool.fields.map(f=><Fld key={f.key} field={f} value={form[f.key]} onChange={v=>setForm(p=>({...p,[f.key]:v}))}/>)}
        {err&&<div style={{color:"#ff6b8a",fontSize:13,marginBottom:10,fontWeight:500}}>⚠ {err}</div>}
        <button onClick={run} disabled={loading} style={{width:"100%",padding:"15px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${tool.color},${C.soft})`,color:"#fff",fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.7:1,animation:loading?"none":"kPulse 2.5s ease-in-out infinite",transition:"transform 0.2s"}}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
          {loading?"Generating…":`✨ Generate ${tool.label}`}
        </button>
        {loading&&<Dots/>}
      </div>
      {(out||loading)&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",animation:"kFadeUp 0.4s ease both",boxShadow:`0 0 40px ${tool.color}18`}}>
          <div style={{background:C.bg,padding:"14px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.09em",textTransform:"uppercase"}}>✦ Output</span>
            {out&&<div style={{display:"flex",gap:8}}><CopyBtn text={out}/><DownloadBtn text={out} toolName={tool.label}/></div>}
          </div>
          <div style={{padding:22,background:C.bg}}>
            {loading?<Shimmer/>:<pre key={out.slice(0,20)} style={{color:"#ccc8f0",fontSize:14,lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0,animation:"kSlide 0.35s ease both"}}>{out}</pre>}
          </div>
        </div>
      )}
      {showFeedback&&out&&<FeedbackWidget toolId={tool.id} toolName={tool.label} onDone={()=>setShowFeedback(false)}/>}
    </div>
  );
}

// ── PRICING & FAQ (condensed) ──
const PLANS=[
  {name:"Free",price:"0",period:"",desc:"Try before you commit",color:"#1e1c38",accent:"#5a5880",cta:"Start Free — No Card",ctaBg:"transparent",ctaColor:"#a78bfa",ctaBorder:"#6C63FF55",popular:false,
   features:["3 AI generations total","Proposal Writer only","Copy & download outputs","No credit card required"],
   missing:["Rate Calculator","Cold Outreach","All 12 tools","Generation history","Priority support"]},
  {name:"Pro",price:"29",period:" once",desc:"Lifetime · First 1,000 only 🔥",color:"#6C63FF",accent:"#a78bfa",cta:"🚀 Claim Lifetime — $29 once",ctaBg:"linear-gradient(135deg,#6C63FF,#a78bfa)",ctaColor:"#fff",ctaBorder:"transparent",popular:true,
   features:["Unlimited AI generations","All 12 tools unlocked","Generation history (30 saves)","Download outputs as .txt","Priority AI speed","Email support","Cancel anytime"],
   missing:[]},
];

function PricingSection({onUpgrade}){
  const [hov,setHov]=useState(null);const w=useW();const mb=w<640;
  return(
    <div style={{marginTop:80}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <div style={{display:"inline-block",background:"#1a1835",border:`1px solid ${C.accent}44`,color:C.soft,fontSize:11,fontWeight:700,padding:"5px 16px",borderRadius:20,letterSpacing:"0.08em",marginBottom:16}}>PRICING</div>
        <h2 style={{fontSize:"clamp(24px,4vw,36px)",fontWeight:900,color:"#fff",letterSpacing:"-1px",marginBottom:10,lineHeight:1.2}}>Simple pricing.<br/><span style={{background:`linear-gradient(90deg,${C.soft},${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>No surprises.</span></h2>
        <p style={{color:C.muted,fontSize:15,margin:0}}>Cancel anytime. 7-day free trial on Pro.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mb?"1fr":"repeat(2,1fr)",gap:mb?12:16,marginBottom:20}}>
        {PLANS.map((p,i)=>(
          <div key={p.name} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{background:p.popular?"linear-gradient(160deg,#16143a,#1c1a44)":C.card,border:`1.5px solid ${hov===i||p.popular?p.color+"99":C.border}`,borderRadius:18,padding:"28px 22px",position:"relative",transition:"transform 0.25s,box-shadow 0.25s",transform:hov===i||p.popular?"translateY(-4px)":"none",boxShadow:p.popular?`0 0 50px ${p.color}28`:hov===i?`0 8px 32px ${p.color}18`:"none",animation:`kFadeUp 0.5s ${i*0.1}s ease both`}}>
            {p.popular&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${C.accent},${C.soft})`,color:"#fff",fontSize:11,fontWeight:800,padding:"5px 18px",borderRadius:20,whiteSpace:"nowrap",boxShadow:`0 0 20px ${C.accent}66`,letterSpacing:"0.05em"}}>✦ MOST POPULAR</div>}
            <div style={{fontSize:12,fontWeight:700,color:p.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{p.name}</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:2,marginBottom:4}}><span style={{fontSize:44,fontWeight:900,color:"#fff",letterSpacing:"-2px",lineHeight:1}}>${p.price}</span><span style={{fontSize:15,color:C.muted,fontWeight:500,marginBottom:6}}>{p.period}</span></div>
            <div style={{fontSize:13,color:C.muted,marginBottom:22}}>{p.desc}</div>
            <button onClick={()=>{if(p.name==="Pro")onUpgrade();}} style={{width:"100%",padding:"13px",borderRadius:11,background:p.ctaBg,border:`1.5px solid ${p.ctaBorder||p.color+"66"}`,color:p.ctaColor,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:22,boxShadow:p.popular?`0 0 20px ${C.accent}44`:"none",animation:p.popular?"kPulse 2.5s ease-in-out infinite":"none"}}>{p.cta}</button>
            <div style={{height:1,background:C.border,marginBottom:18}}/>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {p.features.map(f=><div key={f} style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:"#ccc8f0"}}><span style={{color:"#10b981",flexShrink:0}}>✓</span>{f}</div>)}
              {p.missing.map(f=><div key={f} style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:C.muted,textDecoration:"line-through",opacity:0.45}}><span style={{flexShrink:0}}>✕</span>{f}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",padding:"16px 20px",background:C.card,borderRadius:12,border:`1px solid ${C.border}`,color:C.muted,fontSize:13}}>🔒 <strong style={{color:"#ccc8f0"}}>30-day money-back guarantee.</strong> Not happy? Full refund, no questions asked.</div>
    </div>
  );
}

const FAQS=[
  {q:"Is there really a free plan?",a:"Yes — 3 AI generations, no credit card needed. Try the Proposal Writer and see results before committing to anything."},
  {q:"How does the 7-day free trial work?",a:"Sign up for Pro, use all 10 tools for 7 days with no charge. If you love it, you're billed $19/month. Cancel anytime before that with one click."},
  {q:"How is this different from ChatGPT?",a:"ProposlyAI has expert prompts tuned specifically for freelancers. You'd spend hours prompt-engineering ChatGPT for the same quality. We've done that work for you."},
  {q:"Does it work for all types of freelancers?",a:"Yes — developers, designers, copywriters, video editors, SEO specialists, social media managers. All tools work across niches."},
  {q:"Can I use the outputs commercially?",a:"Absolutely. Every document, proposal, email, and invoice you generate is 100% yours."},
  {q:"What if I want to cancel?",a:"Cancel anytime from your account settings — no forms, no phone calls, no guilt trips."},
  {q:"Is my data private?",a:"We don't store your inputs or generated outputs. Each generation is processed in real time and discarded immediately."},
];

function FAQSection({onUpgrade}){
  const [open,setOpen]=useState(null);
  return(
    <div style={{marginTop:80}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{display:"inline-block",background:"#1a1835",border:`1px solid ${C.accent}44`,color:C.soft,fontSize:11,fontWeight:700,padding:"5px 16px",borderRadius:20,letterSpacing:"0.08em",marginBottom:16}}>FAQ</div>
        <h2 style={{fontSize:"clamp(22px,4vw,34px)",fontWeight:900,color:"#fff",letterSpacing:"-1px",marginBottom:10}}>Got questions?</h2>
        <p style={{color:C.muted,fontSize:15,margin:0}}>Everything you need to know before signing up.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {FAQS.map((f,i)=>{const isOpen=open===i;return(
          <div key={i} onClick={()=>setOpen(isOpen?null:i)} style={{background:C.card,border:`1.5px solid ${isOpen?C.accent+"66":C.border}`,borderRadius:14,padding:"18px 22px",cursor:"pointer",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:isOpen?`0 0 24px ${C.accent}18`:"none"}}
            onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.borderColor=C.accent+"44";}}
            onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.borderColor=C.border;}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
              <span style={{fontSize:14,fontWeight:700,color:isOpen?"#fff":"#ccc8f0",lineHeight:1.4,flex:1}}>{f.q}</span>
              <span style={{fontSize:20,color:isOpen?C.soft:C.muted,flexShrink:0,transition:"transform 0.25s",transform:isOpen?"rotate(45deg)":"none",display:"inline-block",lineHeight:1}}>+</span>
            </div>
            {isOpen&&<div style={{marginTop:14,fontSize:14,color:C.muted,lineHeight:1.8,animation:"kAccordion 0.3s ease both",borderTop:`1px solid ${C.border}`,paddingTop:14}}>{f.a}</div>}
          </div>
        );})}
      </div>
      <div style={{textAlign:"center",marginTop:60,padding:"36px 16px",background:"linear-gradient(135deg,#14123a,#1c1840)",borderRadius:22,border:`1px solid ${C.accent}44`,boxShadow:`0 0 70px ${C.accent}12`}}>
        <div style={{fontSize:11,fontWeight:700,color:C.soft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>Ready to earn more?</div>
        <h3 style={{fontSize:"clamp(20px,3vw,30px)",fontWeight:900,color:"#fff",letterSpacing:"-0.5px",marginBottom:12,lineHeight:1.2}}>Join freelancers who close<br/>more clients with AI</h3>
        <p style={{color:C.muted,fontSize:14,marginBottom:28}}>Start free. No credit card. Results in 30 seconds.</p>
        <button onClick={onUpgrade} style={{padding:"15px 44px",borderRadius:13,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 0 32px ${C.accent}55`,animation:"kPulse 2.5s ease-in-out infinite",width:"100%",maxWidth:320,touchAction:"manipulation"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          ✨ Start Free — No Card Needed
        </button>
      </div>
      <div style={{textAlign:"center",marginTop:40,paddingBottom:20,color:C.muted,fontSize:12}}>© 2025 ProposlyAI · Built for freelancers · Made with ✦ AI</div>
    </div>
  );
}

// ── MAIN APP ──
export default function App(){
  const [active,setActive]=useState(0);
  const [user,setUser]=useState(()=>Auth.get());
  const [usage,setUsage]=useState(()=>Auth.getUsage());
  const [modal,setModal]=useState(null);
  const [showHistory,setShowHistory]=useState(false);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showEmailBanner,setShowEmailBanner]=useState(false);
  const [showReferral,setShowReferral]=useState(false);
  const [showChangelog,setShowChangelog]=useState(false);
  const [showRoadmap,setShowRoadmap]=useState(false);
  const hasNewChangelog=Auth.getLastSeen()!==CHANGELOG[0].version;
  const [legalModal,setLegalModal]=useState(null);
  const isPro=user?.plan==="pro";
  const [paymentUrl]=useState("https://proposlyai.gumroad.com/l/lifetime");
  const [showAdmin,setShowAdmin]=useState(()=>{try{return new URLSearchParams(window.location.search).get("admin")===ADMIN_SECRET;}catch{return false;}}); // 🔴 Replace with your Gumroad link
  const w=useW();const mb=w<640;

  const handleAuth=(u)=>{setUser(u);setUsage(Auth.getUsage());setModal(null);if(!Auth.isOnboarded())setShowOnboarding(true);else setShowEmailBanner(true);};
  const handleLogout=()=>{Auth.clear();setUser(null);setUsage(0);setModal(null);};
  const handleUsed=()=>{const n=Auth.incUsage();setUsage(n);};
  const handlePaywall=(type)=>setModal(type==="auth"?"login":"paywall");
  const handleUpgrade=()=>{
    // Swap with: window.location.href = stripeCheckoutUrl
    if(user){const u={...user,plan:"pro"};Auth.set(u);setUser(u);}
    else setModal("login");
    setModal(null);
  };


  return(
    <>
      <InjectKF/>
      {modal==="login"&&<AuthModal mode="login" onAuth={handleAuth} onClose={()=>setModal(null)}/>}
      {modal==="signup"&&<AuthModal mode="signup" onAuth={handleAuth} onClose={()=>setModal(null)}/>}
      {modal==="paywall"&&<PaywallModal onClose={()=>setModal(null)} onUpgrade={handleUpgrade}/>}
      {modal==="dashboard"&&<UserDashboard user={user} usage={usage} onLogout={handleLogout} onUpgrade={()=>{setModal("paywall");}} onClose={()=>setModal(null)}/>}

      {showOnboarding&&<OnboardingModal onDone={()=>{setShowOnboarding(false);setShowEmailBanner(true);}}/>}
      {showReferral&&<ReferralPanel user={user} onClose={()=>setShowReferral(false)}/>}
      {/* Changelog & Roadmap now inside Dashboard tabs */}
      {legalModal&&<LegalModal type={legalModal} onClose={()=>setLegalModal(null)}/>}
      {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
      <LiveChat/>
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:80,position:"relative",overflow:"hidden"}}>
        <Orb style={{width:450,height:450,top:"-100px",left:"-120px",background:"radial-gradient(circle,#6C63FF18 0%,transparent 70%)"}} anim="kOrb1 10s"/>
        <Orb style={{width:350,height:350,bottom:"60px",right:"-80px",background:"radial-gradient(circle,#a78bfa12 0%,transparent 70%)"}} anim="kOrb2 13s"/>

        {/* ── HEADER ── */}
        <div style={{background:"linear-gradient(135deg,#12102a,#080714)",borderBottom:`1px solid ${C.border}`,padding:mb?"12px 14px":"18px 28px",display:"flex",alignItems:"center",gap:10,position:"relative",zIndex:10}}>
          <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.accent},${C.soft})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 22px ${C.accent}66`,animation:"kFloat 3s ease-in-out infinite",flexShrink:0}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="14" height="18" rx="3" fill="#0D0B1E" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.7"/><rect x="6" y="6" width="8" height="2" rx="1" fill="#fff"/><rect x="6" y="10" width="6" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.5"/><rect x="6" y="13" width="7" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.35"/><path d="M18,1 L19.4,5.2 L23,6.5 L19.4,7.8 L18,12 L16.6,7.8 L13,6.5 L16.6,5.2 Z" fill="#fff"/></svg>
          </div>
          <div>
            <span style={{fontSize:mb?17:19,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Proposly<span style={{background:`linear-gradient(90deg,${C.soft},${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI</span></span>
            {!mb&&<span style={{fontSize:11,color:C.muted,marginLeft:10,fontWeight:500}}>Freelancer Suite</span>}
          </div>

          {/* Header right — auth area */}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {!isPro&&(
              <div style={{background:"#1a1835",border:`1px solid ${C.accent}44`,color:C.soft,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,letterSpacing:"0.04em",animation:"kBorder 3s ease-in-out infinite",whiteSpace:"nowrap",cursor:"pointer"}} onClick={()=>setModal("paywall")}>
                {user?(isPro?"⚡ Pro":"🎁 "+Math.max(0,FREE_LIMIT-usage)+"/"+FREE_LIMIT+" free"):"12 AI Tools"}
              </div>
            )}
            {isPro&&<div style={{background:`linear-gradient(135deg,${C.accent},${C.soft})`,color:"#fff",fontSize:10,fontWeight:800,padding:"4px 12px",borderRadius:20,letterSpacing:"0.04em"}}>⚡ PRO</div>}
                        {user?(
              <button onClick={()=>setModal("dashboard")} title="My Dashboard" style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit",flexShrink:0,boxShadow:`0 0 14px ${C.accent}55`,transition:"transform 0.2s,box-shadow 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)";e.currentTarget.style.boxShadow=`0 0 22px ${C.accent}88`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 0 14px ${C.accent}55`;}}>
                {user.name[0].toUpperCase()}
              </button>
            ):(
              <button onClick={()=>setModal("login")} style={{padding:"7px 14px",borderRadius:9,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                Sign In
              </button>
            )}
          </div>
        </div>

        <div style={{maxWidth:900,margin:"0 auto",padding:mb?"20px 12px 0":"36px 16px 0",position:"relative",zIndex:1}}>

          {/* ── HERO ── */}
          <div style={{textAlign:"center",marginBottom:mb?24:36,animation:"kFadeUp 0.6s ease both"}}>
            <h1 style={{fontSize:mb?"26px":"clamp(24px,4vw,40px)",fontWeight:900,color:"#fff",lineHeight:1.13,letterSpacing:"-1.2px",marginBottom:10}}>
              Your complete<br/>
              <span style={{background:`linear-gradient(90deg,${C.soft},${C.accent},#c084fc,${C.soft})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"kGrad 4s linear infinite"}}>AI Freelancer Suite</span>
            </h1>
            <p style={{color:C.muted,fontSize:mb?14:15,margin:0}}>12 tools. Every document you need. Zero effort.</p>
            {!user&&(
              <div style={{marginTop:16,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>setModal("signup")} style={{padding:"10px 24px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.soft})`,border:"none",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",animation:"kPulse 3s ease-in-out infinite"}}>Start Free →</button>
                <button onClick={()=>setModal("login")} style={{padding:"10px 20px",borderRadius:10,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
              </div>
            )}
          </div>

          {!isPro&&<FoundingBanner paymentUrl={paymentUrl} onClaim={()=>window.open(paymentUrl,"_blank")}/> }
          {showEmailBanner&&user&&usage>=1&&<EmailBanner user={user} onDismiss={()=>setShowEmailBanner(false)}/>}
          {/* ── TOOL NAV ── */}
          {/* 3D perspective container */}
          <div style={{display:"grid",gridTemplateColumns:mb?"repeat(2,1fr)":"repeat(5,1fr)",gap:8,marginBottom:mb?16:28}}>
            {TOOLS.map((t,i)=>{
              const on=active===i;
              return(
                <button key={t.id} onClick={()=>setActive(i)} style={{padding:mb?"10px 4px":"12px 6px",borderRadius:12,border:`1.5px solid ${on?t.color+"88":C.border}`,background:on?`${t.color}15`:C.card,cursor:"pointer",fontFamily:"inherit",transition:"all 0.25s",boxShadow:on?`0 0 24px ${t.color}33,inset 0 0 12px ${t.color}0A`:"none",animation:`kFadeUp 0.5s ${i*0.04}s ease both`,minHeight:mb?76:84,touchAction:"manipulation",transform:on?"translateY(-2px)":"none"}}
                  onMouseEnter={e=>{if(!on){e.currentTarget.style.borderColor=t.color+"55";e.currentTarget.style.background=`${t.color}0A`;}e.currentTarget.style.transform=on?"translateY(-2px)":"translateY(-3px) scale(1.03)";}}
                  onMouseLeave={e=>{if(!on){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}e.currentTarget.style.transform=on?"translateY(-2px)":"none";}}>
                  <div style={{fontSize:mb?18:20,marginBottom:4}}>{t.icon}</div>
                  <div style={{fontSize:mb?10:11,fontWeight:700,color:on?t.color:C.muted,lineHeight:1.3}}>{t.label}</div>
                </button>
              );
            })}
          </div>

          {/* ── ACTIVE TOOL HEADER ── */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:mb?"12px 14px":"14px 18px",background:C.card,borderRadius:13,border:`1px solid ${TOOLS[active].color}44`,boxShadow:`0 0 24px ${TOOLS[active].color}18`}}>
            <span style={{fontSize:mb?22:26}}>{TOOLS[active].icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:mb?14:16,fontWeight:800,color:"#fff"}}>{TOOLS[active].label}</div>
              <div style={{fontSize:mb?12:13,color:C.muted}}>{TOOLS[active].desc}</div>
            </div>
            {/* Usage badge in tool header */}
            {!isPro&&user&&(
              <div style={{background:usage>=FREE_LIMIT?"#ff444422":"#6C63FF15",border:`1px solid ${usage>=FREE_LIMIT?"#ff4444":"#6C63FF"}44`,color:usage>=FREE_LIMIT?"#ff6b8a":C.soft,fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:8,whiteSpace:"nowrap"}}>
                {usage}/{FREE_LIMIT} used
              </div>
            )}
          </div>

          <ToolPanel key={active} tool={TOOLS[active]} user={user} usage={usage} onUsed={handleUsed} onPaywall={handlePaywall}/>
          <TestimonialsSection/>
          <PricingSection onUpgrade={()=>setModal(user?"paywall":"signup")}/>
          <FAQSection onUpgrade={()=>setModal(user?"paywall":"signup")}/>
        </div>
      </div>
    </>
  );
}
