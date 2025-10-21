const API = location.origin;  // same origin
let token=null, role=null, name=null;

const $ = s => document.querySelector(s);
const show = id => { document.querySelectorAll("main > section").forEach(x=>x.classList.add("hidden")); $(id).classList.remove("hidden"); };
const nav = $("#nav"); const loginView = $("#loginView");
const views = { form:"#formView", mine:"#mineView", dash:"#dashView", users:"#usersView" };

// --- auth ---
function setAuth(t, r, n){
  token=t; role=r; name=n;
  localStorage.setItem("auth", JSON.stringify({t,r,n}));
  nav.classList.remove("hidden");
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  loginView.classList.add("hidden");
}
function loadAuth(){
  const a = JSON.parse(localStorage.getItem("auth")||"null");
  if(!a) return;
  token=a.t; role=a.r; name=a.n;
  nav.classList.remove("hidden");
  $(".role-sup").classList.toggle("hidden", !(role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare"));
  $(".role-admin").classList.toggle("hidden", role!=="admin");
  loginView.classList.add("hidden");
  
  // Initialize notification system for logged in users
  if (!window.notificationSystem) {
    window.notificationSystem = new NotificationSystem();
  }
}
loadAuth();

// nav events
nav.addEventListener("click", e=>{
  if(e.target.dataset.view){
    const v = e.target.dataset.view;
    if(v==="form") renderForm();
    if(v==="mine") loadMine();
    if(v==="dash") loadDash();
    if(v==="users") loadUsers();
    show(views[v]);
  }
});
$("#logout").onclick = ()=>{ 
  if (window.notificationSystem) {
    window.notificationSystem.cleanup();
    window.notificationSystem = null;
  }
  localStorage.removeItem("auth"); 
  location.reload(); 
};

$("#loginBtn").onclick = async ()=>{
  $("#loginMsg").classList.add("hidden");
  const body = { username: $("#lu").value.trim(), password: $("#lp").value };
  const res = await fetch(API+"/api/auth/login",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const js = await res.json();
  if(!res.ok){ $("#loginMsg").textContent=js.error||"Fel"; $("#loginMsg").classList.remove("hidden"); return; }
  setAuth(js.token, js.role, js.name);
  
  // Initialize notification system on login
  if (!window.notificationSystem) {
    window.notificationSystem = new NotificationSystem();
  }
  
  renderForm(); show(views.form);
};

// MSAL Authentication
let msalConfig = null;

// Load MSAL configuration
async function loadMSALConfig() {
  try {
    const response = await fetch(API + "/api/auth/msal-config");
    if (response.ok) {
      msalConfig = await response.json();
      return true;
    }
  } catch (error) {
    console.log("MSAL not configured");
  }
  return false;
}

// MSAL Login Button
$("#msalLoginBtn").onclick = async () => {
  try {
    $("#loginMsg").classList.add("hidden");
    
    // Check if MSAL is configured
    if (!msalConfig && !(await loadMSALConfig())) {
      $("#loginMsg").textContent = "Microsoft autentisering inte konfigurerad";
      $("#loginMsg").classList.remove("hidden");
      return;
    }
    
    // Load MSAL library dynamically
    if (typeof msal === 'undefined') {
      await loadMSALScript();
    }
    
    // Initialize MSAL
    const msalInstance = new msal.PublicClientApplication({
      auth: {
        clientId: msalConfig.clientId,
        authority: msalConfig.authority,
        redirectUri: msalConfig.redirectUri
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      }
    });
    
    await msalInstance.initialize();
    
    // Login with popup
    const loginRequest = {
      scopes: ["https://graph.microsoft.com/User.Read"],
      prompt: "select_account"
    };
    
    const response = await msalInstance.loginPopup(loginRequest);
    
    // Exchange token with backend
    const exchangeResponse = await fetch(API + "/api/auth/msal-exchange", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ accessToken: response.accessToken })
    });
    
    const exchangeResult = await exchangeResponse.json();
    
    if (!exchangeResponse.ok) {
      $("#loginMsg").textContent = exchangeResult.error || "Autentisering misslyckades";
      $("#loginMsg").classList.remove("hidden");
      return;
    }
    
    // Set authentication
    setAuth(exchangeResult.token, exchangeResult.user.role, exchangeResult.user.name);
    
    // Initialize notification system on login
    if (!window.notificationSystem) {
      window.notificationSystem = new NotificationSystem();
    }
    
    renderForm(); 
    show(views.form);
    
  } catch (error) {
    console.error("MSAL login error:", error);
    $("#loginMsg").textContent = "Inloggning misslyckades: " + error.message;
    $("#loginMsg").classList.remove("hidden");
  }
};

// Load MSAL library dynamically
function loadMSALScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize MSAL configuration on page load
loadMSALConfig();

// --- FORM (återanvänder logiken från MVP: risk & checklist) ---
function formHTML(){
  return `
  <h2>Ny riskbedömning</h2>
  <div class="grid2">
    <label>Datum<input type="date" id="f_datum"></label>
    <label>Namn<input id="f_namn" value="${name||''}"></label>
    <label>Team<input id="f_team"></label>
    <label>Plats<input id="f_plats"></label>
  </div>
  <label>Arbetsuppgift<input id="f_task" placeholder="Kort beskrivning"></label>

  <div class="grid3" style="margin-top:8px">
    <label>Sannolikhet (1–5)<input type="number" id="f_s" min="1" max="5" value="1"></label>
    <label>Konsekvens (1–5)<input type="number" id="f_k" min="1" max="5" value="1"></label>
    <label>Riskpoäng<input id="f_r" readonly></label>
  </div>
  <label>Identifierade risker<textarea id="f_risks" rows="3"></textarea></label>

  <h3>Checklista</h3>
  <div id="f_list"></div>
  <p id="f_warn" class="warn hidden">Minst ett svar är Nej – kräver arbetsledarens godkännande.</p>

  <h3>Åtgärder</h3>
  <textarea id="f_actions" rows="3" placeholder="Spärra av, LOTO, skyltning, fallskydd, mät/ventilera ..."></textarea>

  <h3>Bilder och Dokumentation</h3>
  <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
    Ladda upp bilder av arbetsmiljön, utrustning eller andra relevanta förhållanden för bedömningen.
  </p>
  ${window.imageUploadManager ? window.imageUploadManager.createImageUploadHTML() : '<div>Bilduppladdning laddas...</div>'}

  <div class="grid2">
    <label>Behövs ytterligare åtgärder?
      <select id="f_further"><option>Nej</option><option>Ja</option></select>
    </label>
    <label>Behövs full riskanalys framåt?
      <select id="f_fullrisk"><option>Nej</option><option>Ja</option></select>
    </label>
  </div>

  <h3>Godkännande</h3>
  <div class="grid3">
    <label>Kan arbetet utföras säkert?
      <select id="f_safe"><option>Ja</option><option>Nej</option></select>
    </label>
    <label>Arbetsledare<input id="f_leader"></label>
    <label>Signatur/Initialer<input id="f_sign"></input></label>
  </div>

  <div style="margin-top:10px">
    <button id="f_submit">Skicka</button>
    <span id="f_msg"></span>
  </div>
  `;
}
function renderForm(){
  $("#formView").innerHTML = formHTML();
  const list = $("#f_list");
  const Q = [
    "Risker/resternergier bedömda (Safety Placard som stöd)?",
    "Fallrisker eliminerade?",
    "Kläm-/skär-/kraftrisker hanterade?",
    "Rätt verktyg/PPE tillgängligt?",
    "Tillstånd/behörighet (heta arbeten/slutna utrymmen) klart?",
    "Snubbel/olja/lösa föremål undanröjda?",
    "Avspärrningar/kommunikation/skyltning klar?",
    "Utrustning i gott skick för lyft/lastsäkring?",
    "Nödvändig utrustning kontrollerad före användning?",
    "Känt var nödstopp/utrymning/ögondusch finns?"
  ];
  Q.forEach((q,i)=>{
    const row=document.createElement("div"); row.className="grid3";
    row.innerHTML=`<label style="grid-column:1/3">${q}</label>
      <label><select id="q${i}"><option></option><option>Ja</option><option>Nej</option></select></label>`;
    list.appendChild(row);
  });
  const calc=()=>{ const s=+$("#f_s").value||1, k=+$("#f_k").value||1, r=s*k; $("#f_r").value=r;
    const anyNej = Q.some((_,i)=>($("#q"+i).value==="Nej")); $("#f_warn").classList.toggle("hidden",!anyNej);
  };
  ["f_s","f_k"].forEach(id=>$("#"+id).addEventListener("input",calc));
  list.addEventListener("change",calc); calc();

  $("#f_submit").onclick = async ()=>{
    const checklist = Q.map((_,i)=>$("#q"+i).value||"");
    
    // Get uploaded images if image upload manager is available
    const uploadedImages = window.imageUploadManager ? window.imageUploadManager.getUploadedImages() : [];
    
    const body = {
      date: $("#f_datum").value,
      worker_name: $("#f_namn").value,
      team: $("#f_team").value,
      location: $("#f_plats").value,
      task: $("#f_task").value,
      risk_s: +$("#f_s").value, risk_k: +$("#f_k").value,
      risks: $("#f_risks").value, checklist,
      actions: $("#f_actions").value,
      further: $("#f_further").value, fullrisk: $("#f_fullrisk").value,
      safe: $("#f_safe").value,
      leader: $("#f_leader").value, signature: $("#f_sign").value,
      images: uploadedImages.map(img => ({
        name: img.name,
        size: img.size,
        type: img.type,
        url: img.url
      }))
    };
    const res = await fetch(API+"/api/assessments",{method:"POST",
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify(body)});
    const js = await res.json();
    const msg=$("#f_msg");
    if(!res.ok){ msg.className="warn"; msg.textContent=js.error||"Fel"; return; }
    msg.className="ok"; msg.textContent=`Skickad. ID ${js.id}, risk=${js.riskScore}`;
    
    // Clear uploaded images after successful submission
    if (window.imageUploadManager) {
      window.imageUploadManager.clearImages();
    }
    
    // Show success notification
    if (window.showNotification) {
      window.showNotification('Riskbedömning skickad framgångsrikt! 🎉', 'success');
    }
  };
}

// --- list helpers
function table(rows, canApprove=false){
  const tr = r => `<tr>
    <td>${r.id}</td><td>${r.date?.slice(0,10)||""}</td>
    <td>${r.worker_name}</td><td>${r.location||""}</td><td>${r.task||""}</td>
    <td>${r.risk_score} ${badge(r.risk_score)}</td>
    <td><span class="status-badge status-${r.status?.toLowerCase()}">${r.status||'Submitted'}</span></td>
    <td>${r.created_by_name||""}</td>
    <td>
      ${canApprove && r.status==='Pending' ? `
        <button data-approve="${r.id}" class="btn-approve" title="Godkänn">✓</button>
        <button data-reject="${r.id}" class="btn-reject" title="Avvisa">✗</button>
      `:''} 
      <button data-pdf="${r.id}" title="PDF">📄</button>
      ${canApprove ? `<button data-sp="${r.id}" title="SharePoint">📤</button>`:''} 
    </td>
  </tr>`;
  return `<table class="table">
    <thead><tr><th>ID</th><th>Datum</th><th>Namn</th><th>Plats</th><th>Uppgift</th><th>Risk</th><th>Status</th><th>Skapad av</th><th>Åtgärder</th></tr></thead>
    <tbody>${rows.map(tr).join("")}</tbody>
  </table>`;
}
function badge(score){
  if(score<=4) return `<span class="badge low">Låg</span>`;
  if(score<=9) return `<span class="badge mid">Medel</span>`;
  return `<span class="badge high">Hög</span>`;
}

async function loadMine(){
  const res = await fetch(API+"/api/assessments?mine=1",{headers:{Authorization:'Bearer '+token}});
  const rows = await res.json();
  $("#mineTable").innerHTML = table(rows,false);
}
async function loadDash(){
  const st = await fetch(API+"/api/assessments/stats",{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
  $("#stats").innerHTML = `
    <div>Totalt: <b>${st.total||0}</b></div>
    <div>Öppna: <b>${st.open||0}</b></div>
    <div>Låg: <b>${st.low||0}</b> • Medel: <b>${st.mid||0}</b> • Hög: <b>${st.high||0}</b>
  `;
  const all = await fetch(API+"/api/assessments",{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
  const canApprove = (role==="supervisor"||role==="superintendent"||role==="admin"||role==="arbetsledare");
  $("#allTable").innerHTML = table(all, canApprove);
  $("#allTable").onclick = async (e)=>{
  const id = e.target?.dataset?.approve;
  const rejectId = e.target?.dataset?.reject;
  const pdfId = e.target?.dataset?.pdf;
  const spId  = e.target?.dataset?.sp;

  if (id) {
    await fetch(API+`/api/assessments/${id}/approve`,{method:"POST",headers:{Authorization:'Bearer '+token}});
    window.showNotification('Riskbedömning godkänd! Användaren har meddelats.', 'success');
    loadDash(); return;
  }
  if (rejectId) {
    const reason = prompt('Anledning till avvisning (valfritt):');
    await fetch(API+`/api/assessments/${rejectId}/reject`,{
      method:"POST",
      headers:{Authorization:'Bearer '+token, 'Content-Type':'application/json'},
      body: JSON.stringify({reason})
    });
    window.showNotification('Riskbedömning avvisad! Användaren har meddelats.', 'info');
    loadDash(); return;
  }
  if (pdfId) {
    window.open(API+`/api/assessments/${pdfId}/pdf?auth=${token}`,'_blank');
    return;
  }
  if (spId) {
    const res = await fetch(API+`/api/assessments/${spId}/upload`,{method:"POST",headers:{Authorization:'Bearer '+token}});
    const js = await res.json();
    if(res.ok){ alert("Uppladdad till SharePoint:\n"+js.webUrl); } else { alert("Fel vid uppladdning"); }
    return;
  }
};

}
$("#refreshDash").onclick = loadDash;

// --- Users (Admin)
async function loadUsers(){
  if(role!=="admin") return;
  const res = await fetch(API+"/api/users",{headers:{Authorization:'Bearer '+token}});
  const rows = await res.json();
  $("#usersTable").innerHTML = `
    <table class="table"><thead><tr><th>ID</th><th>Namn</th><th>Användare</th><th>Roll</th><th>Aktiv</th><th>Ändra</th><th>Radera</th></tr></thead>
    <tbody>
    ${rows.map(r=>`<tr>
      <td>${r.id}</td><td>${r.name}</td><td>${r.username}</td><td>${r.role}</td><td>${r.active? "Ja":"Nej"}</td>
      <td><button data-edit="${r.id}">Ändra</button></td>
      <td><button data-del="${r.id}">Radera</button></td>
    </tr>`).join("")}
    </tbody></table>
  `;
  $("#usersTable").onclick = async e=>{
    if(e.target.dataset.del){
      const id = +e.target.dataset.del;
      await fetch(API+"/api/users/"+id,{method:"DELETE",headers:{Authorization:'Bearer '+token}});
      loadUsers();
    }
    if(e.target.dataset.edit){
      const id = +e.target.dataset.edit;
      const name = prompt("Nytt namn:"); if(!name) return;
      const role = prompt("Roll (underhall/supervisor/superintendent/admin/arbetsledare):");
      const active = prompt("Aktiv? (1/0):","1");
      await fetch(API+"/api/users/"+id,{method:"PUT",
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body: JSON.stringify({name,role,active:+active})
      });
      loadUsers();
    }
  };
}
$("#addUser").onclick = async ()=>{
  const body = {
    name: $("#u_name").value.trim(),
    username: $("#u_user").value.trim(),
    password: $("#u_pass").value,
    role: $("#u_role").value,
    active: +$("#u_active").value
  };
  const res = await fetch(API+"/api/users",{method:"POST",headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(res.ok){ loadUsers(); } else { alert("Kunde inte skapa användare"); }
};
