/* ========== PRO DASHBOARD JS ========== */

/* ---------- Utilities ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function el(tag, attrs = {}) { const d = document.createElement(tag); Object.assign(d, attrs); return d; }

function now() { return new Date().toLocaleString(); }
function addLog(msg) {
  const logs = JSON.parse(localStorage.getItem('logs')||'[]');
  logs.unshift({ time: new Date().toISOString(), text: msg });
  localStorage.setItem('logs', JSON.stringify(logs));
  renderLogs();
}

/* ---------- Storage seeds (demo) ---------- */
if (!localStorage.getItem('users')) {
  const seedUsers = [
    { id:1, name:"John Doe", email:"john@mail.com", role:"admin", joined:"2025-01-02" },
    { id:2, name:"Sarah Lee", email:"sarah@mail.com", role:"manager", joined:"2025-03-12" },
    { id:3, name:"Mike Yang", email:"mike@mail.com", role:"staff", joined:"2025-07-21" }
  ];
  localStorage.setItem('users', JSON.stringify(seedUsers));
}
if (!localStorage.getItem('products')) {
  const seedProducts = [
    { id:1, pname:"Smart Watch", price:120, category:"Gadgets", img:"" },
    { id:2, pname:"Headphones", price:60, category:"Audio", img:"" }
  ];
  localStorage.setItem('products', JSON.stringify(seedProducts));
}
if (!localStorage.getItem('theme')) localStorage.setItem('theme','light');

/* ---------- RBAC (role-based) ---------- */
let currentRole = localStorage.getItem('role') || 'admin';
$('#roleSelect').value = currentRole;
function applyRole() {
  currentRole = $('#roleSelect').value;
  localStorage.setItem('role', currentRole);
  // hide admin-only
  $$('.admin-only').forEach(el => el.style.display = (currentRole === 'admin') ? '' : 'none');
  addLog(`Role changed to ${currentRole}`);
}
$('#roleSelect').addEventListener('change', applyRole);
applyRole();

/* ---------- Sidebar collapse ---------- */
const sidebar = $('#sidebar'), main = document.querySelector('.main');
$('#collapseBtn').addEventListener('click', ()=> {
  sidebar.classList.toggle('collapsed');
  main.classList.toggle('collapsed');
});

/* ---------- Page routing ---------- */
$$('.nav-link').forEach(btn => btn.addEventListener('click', ()=>{
  $$('.nav-link').forEach(n=>n.classList.remove('active'));
  btn.classList.add('active');
  const page = btn.dataset.page;
  showPage(page);
}));
function showPage(page){
  $$('.page').forEach(p => p.classList.remove('active-page'));
  const target = $(`#${page}`);
  if (target) {
    target.classList.add('active-page');
    $('.page-title').innerText = page.charAt(0).toUpperCase()+page.slice(1);
  }
}

/* ---------- Theme (dark) ---------- */
const themeToggle = $('#themeToggle');
function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
themeToggle.addEventListener('click', ()=>{
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  addLog(`Theme: ${isDark ? 'dark' : 'light'}`);
});
applyTheme();

/* ---------- Notifications (demo) ---------- */
const notifBtn = $('#notifBtn'), notifList = $('#notifList'), notifBadge = $('#notifBadge');
let notifications = JSON.parse(localStorage.getItem('notifications')||'[]');
function pushNotification(text) {
  notifications.unshift({ text, time: new Date().toISOString(), read:false });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  renderNotifs();
  addLog(`Notification: ${text}`);
}
function renderNotifs(){
  notifList.innerHTML = '';
  notifications.slice(0,6).forEach(n=>{
    const p = el('p'); p.textContent = `${new Date(n.time).toLocaleString()} — ${n.text}`;
    notifList.appendChild(p);
  });
  const unread = notifications.filter(n=>!n.read).length;
  notifBadge.textContent = unread;
  notifBadge.style.display = unread ? 'inline-block' : 'none';
}
notifBtn.addEventListener('click', ()=>{
  notifList.style.display = notifList.style.display === 'block' ? 'none' : 'block';
  notifications = notifications.map(n=>({ ...n, read:true }));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  renderNotifs();
});
renderNotifs();

/* ---------- Modal system ---------- */
const modal = $('#modal'), modalBody = $('#modalBody'), modalTitle = $('#modalTitle'), modalSave = $('#modalSave'), modalCancel = $('#modalCancel');
function openModal(title, bodyHtml, onSave){
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  modalBody.appendChild(bodyHtml);
  modal.style.display = 'flex';
  const saveHandler = ()=>{ onSave(); closeModal(); };
  modalSave.onclick = saveHandler;
  modalCancel.onclick = closeModal;
}
function closeModal(){ modal.style.display = 'none'; modalBody.innerHTML = ''; modalSave.onclick = null; }

/* ---------- Users CRUD + table with search, sort, pagination ---------- */
let users = JSON.parse(localStorage.getItem('users')||'[]');
let usersState = { page:1, perPage:5, sortBy:null, sortDir:1, filter:'' };

function saveUsers(){ localStorage.setItem('users', JSON.stringify(users)); renderUsers(); }
function addUser(data){ data.id = Date.now(); users.unshift(data); saveUsers(); addLog(`User added: ${data.name}`); }
function updateUser(id, data){ users = users.map(u=>u.id===id?{...u,...data}:u); saveUsers(); addLog(`User updated: ${data.name}`); }
function deleteUser(id){ const u = users.find(x=>x.id===id); users = users.filter(u=>u.id!==id); saveUsers(); addLog(`User deleted: ${u?.name||id}`); }

function renderUsers(){
  const tbody = $('#usersTable tbody'); tbody.innerHTML = '';
  // filter & sort
  let list = users.filter(u => (u.name+u.email+u.role).toLowerCase().includes(usersState.filter.toLowerCase()));
  if (usersState.sortBy) list.sort((a,b)=>{
    const A = (a[usersState.sortBy]||'').toString().toLowerCase();
    const B = (b[usersState.sortBy]||'').toString().toLowerCase();
    return A>B ? usersState.sortDir : -usersState.sortDir;
  });
  // pagination
  const total = list.length;
  const start = (usersState.page-1)*usersState.perPage;
  const pageItems = list.slice(start, start+usersState.perPage);

  pageItems.forEach(u=>{
    const tr = el('tr');
    tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${u.joined}</td>
      <td>
        <button class="btn mini" data-id="${u.id}" data-action="edit">Edit</button>
        <button class="btn mini danger" data-id="${u.id}" data-action="del">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // pagination controls
  const totalPages = Math.max(1, Math.ceil(total / usersState.perPage));
  const pg = $('#usersPagination'); pg.innerHTML = '';
  for(let i=1;i<=totalPages;i++){
    const b = el('button'); b.className='btn mini'; b.textContent = i; if(i===usersState.page) b.style.fontWeight='700';
    b.addEventListener('click', ()=> { usersState.page=i; renderUsers(); });
    pg.appendChild(b);
  }

  // attach actions
  $$('#usersTable button').forEach(btn=>{
    const id = Number(btn.dataset.id);
    if (btn.dataset.action==='edit') btn.addEventListener('click', ()=> openEditUser(id));
    if (btn.dataset.action==='del') btn.addEventListener('click', ()=> { if(confirm('Delete user?')) { deleteUser(id); }});
  });

  // update dashboard stat
  $('#statUsers').textContent = users.length;
  localStorage.setItem('users', JSON.stringify(users));
}

function openAddUser(){
  const form = el('div');
  form.innerHTML = `
    <label>Name</label><input id="u_name" placeholder="Full name" />
    <label>Email</label><input id="u_email" placeholder="email@example.com" />
    <label>Role</label><select id="u_role"><option>admin</option><option>manager</option><option>staff</option></select>
    <label>Joined</label><input id="u_joined" type="date" />
  `;
  openModal('Add User', form, ()=>{
    const data = { name:$('#u_name').value.trim(), email:$('#u_email').value.trim(), role:$('#u_role').value, joined:$('#u_joined').value || new Date().toISOString().slice(0,10) };
    if(!data.name||!data.email) return alert('Name & email required.');
    addUser(data); renderUsers(); closeModal();
  });
}

function openEditUser(id){
  const u = users.find(x=>x.id===id);
  if(!u) return alert('User not found');
  const form = el('div');
  form.innerHTML = `
    <label>Name</label><input id="u_name" value="${u.name}" />
    <label>Email</label><input id="u_email" value="${u.email}" />
    <label>Role</label><select id="u_role"><option ${u.role==='admin'?'selected':''}>admin</option><option ${u.role==='manager'?'selected':''}>manager</option><option ${u.role==='staff'?'selected':''}>staff</option></select>
    <label>Joined</label><input id="u_joined" type="date" value="${u.joined}" />
  `;
  openModal('Edit User', form, ()=>{
    const data = { name:$('#u_name').value.trim(), email:$('#u_email').value.trim(), role:$('#u_role').value, joined:$('#u_joined').value };
    updateUser(id,data); renderUsers(); closeModal();
  });
}

/* ---------- Products (CRUD + image preview + search + pagination + sort) ---------- */
let products = JSON.parse(localStorage.getItem('products')||'[]');
let productsState = { page:1, perPage:5, sortBy:null, sortDir:1, filter:'' };

function saveProducts(){ localStorage.setItem('products', JSON.stringify(products)); renderProducts(); }
function addProduct(d){ d.id=Date.now(); products.unshift(d); saveProducts(); addLog(`Product added: ${d.pname}`); }
function updateProduct(id,d){ products = products.map(p=>p.id===id?{...p,...d}:p); saveProducts(); addLog(`Product updated: ${d.pname}`); }
function deleteProduct(id){ const p = products.find(x=>x.id===id); products = products.filter(x=>x.id!==id); saveProducts(); addLog(`Product deleted: ${p?.pname||id}`); }

function renderProducts(){
  const tbody = $('#productsTable tbody'); tbody.innerHTML='';
  let list = products.filter(p => (p.pname+p.category+(p.price||'')).toString().toLowerCase().includes(productsState.filter.toLowerCase()));
  if (productsState.sortBy) list.sort((a,b)=>{
    const A = (a[productsState.sortBy]||'').toString().toLowerCase();
    const B = (b[productsState.sortBy]||'').toString().toLowerCase();
    return A>B ? productsState.sortDir : -productsState.sortDir;
  });
  const total=list.length;
  const start=(productsState.page-1)*productsState.perPage;
  const items=list.slice(start, start+productsState.perPage);
  items.forEach(p=>{
    const tr = el('tr');
    tr.innerHTML = `<td>${p.pname}</td><td>$${p.price}</td><td>${p.category}</td>
      <td>${p.img?'<img src="'+p.img+'" alt="img">':'—'}</td>
      <td>
        <button class="btn mini" data-id="${p.id}" data-action="edit">Edit</button>
        <button class="btn mini danger" data-id="${p.id}" data-action="del">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  // pagination
  const totalPages = Math.max(1, Math.ceil(total / productsState.perPage));
  const pg = $('#productsPagination'); pg.innerHTML = '';
  for(let i=1;i<=totalPages;i++){
    const b = el('button'); b.className='btn mini'; b.textContent = i; if(i===productsState.page) b.style.fontWeight='700';
    b.addEventListener('click', ()=> { productsState.page=i; renderProducts(); });
    pg.appendChild(b);
  }
  $$('#productsTable button').forEach(btn=>{
    const id=Number(btn.dataset.id);
    if(btn.dataset.action==='edit') btn.addEventListener('click', ()=> openEditProduct(id));
    if(btn.dataset.action==='del') btn.addEventListener('click', ()=> { if(confirm('Delete product?')) deleteProduct(id); });
  });

  $('#statProducts').textContent = products.length;
  localStorage.setItem('products', JSON.stringify(products));
}

function openAddProduct(){
  const form = el('div');
  form.innerHTML = `
    <label>Name</label><input id="p_name" placeholder="Product name" />
    <label>Price</label><input id="p_price" type="number" placeholder="0" />
    <label>Category</label><input id="p_cat" placeholder="Category" />
    <label>Image (optional)</label><input id="p_img" type="file" accept="image/*" />
    <div id="p_preview"></div>
  `;
  const inputFileHandler = () => {
    const file = $('#p_img').files[0];
    if(!file) { $('#p_preview').innerHTML=''; return; }
    const reader = new FileReader();
    reader.onload = e => $('#p_preview').innerHTML = `<img src="${e.target.result}" style="max-width:120px;border-radius:8px">`;
    reader.readAsDataURL(file);
  };

  openModal('Add Product', form, ()=>{
    const name=$('#p_name').value.trim(), price=Number($('#p_price').value), cat=$('#p_cat').value.trim();
    if(!name||!cat) return alert('Name & category required');
    const file = $('#p_img').files[0];
    if(file){
      const fr = new FileReader();
      fr.onload = e => { addProduct({pname:name,price,category:cat,img:e.target.result}); renderProducts(); };
      fr.readAsDataURL(file);
    } else {
      addProduct({pname:name,price,category:cat,img:''});
    }
  });
  $('#p_img').addEventListener('change', inputFileHandler);
}

function openEditProduct(id){
  const p = products.find(x=>x.id===id);
  if(!p) return alert('Product not found');
  const form = el('div');
  form.innerHTML = `
    <label>Name</label><input id="p_name" value="${p.pname}" />
    <label>Price</label><input id="p_price" type="number" value="${p.price}" />
    <label>Category</label><input id="p_cat" value="${p.category}" />
    <label>Image (optional)</label><input id="p_img" type="file" accept="image/*" />
    <div id="p_preview">${p.img?'<img src="'+p.img+'" style="max-width:120px;border-radius:8px">':''}</div>
  `;
  const previewHandler = ()=>{
    const file = $('#p_img').files[0];
    if(!file) return;
    const fr = new FileReader();
    fr.onload = e => $('#p_preview').innerHTML = `<img src="${e.target.result}" style="max-width:120px;border-radius:8px">`;
    fr.readAsDataURL(file);
  };
  openModal('Edit Product', form, ()=>{
    const name=$('#p_name').value.trim(), price=Number($('#p_price').value), cat=$('#p_cat').value.trim();
    const file = $('#p_img').files[0];
    if(file){
      const fr=new FileReader();
      fr.onload = e => { updateProduct(id,{pname:name,price,category:cat,img:e.target.result}); renderProducts(); };
      fr.readAsDataURL(file);
    } else { updateProduct(id,{pname:name,price,category:cat,img:p.img}); }
  });
  $('#p_img').addEventListener('change', previewHandler);
}

/* ---------- Sorting handlers ---------- */
$$('th[data-sort]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.sort;
    // choose which table this header belongs to
    const table = th.closest('table');
    if (table.id === 'usersTable') {
      usersState.sortBy = key; usersState.sortDir = (usersState.sortDir||1)*-1; renderUsers();
    } else if (table.id === 'productsTable') {
      productsState.sortBy = key; productsState.sortDir = (productsState.sortDir||1)*-1; renderProducts();
    }
  });
});

/* ---------- Search handlers ---------- */
$('#userSearch').addEventListener('input', e=> { usersState.filter = e.target.value; usersState.page=1; renderUsers(); });
$('#productSearch').addEventListener('input', e=> { productsState.filter = e.target.value; productsState.page=1; renderProducts(); });
$('#globalSearch').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  // quick highlight action: show matches count via notifs
  const ucount = users.filter(u => (u.name+u.email).toLowerCase().includes(q)).length;
  const pcount = products.filter(p => (p.pname+p.category).toLowerCase().includes(q)).length;
  $('#notifDemo').textContent = `Matches — Users: ${ucount}, Products: ${pcount}`;
});

/* ---------- CSV Export ---------- */
function toCSV(rows){
  return rows.map(r => r.map(v => `"${(v+'').replace(/"/g,'""')}"`).join(',')).join('\n');
}
function downloadCSV(filename, rows){
  const blob = new Blob([toCSV(rows)],{type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}
$('#exportUsersBtn').addEventListener('click', ()=>{
  const rows = [['Name','Email','Role','Joined'], ...users.map(u=>[u.name,u.email,u.role,u.joined])];
  downloadCSV('users.csv', rows);
  addLog('Exported users CSV');
});
$('#exportProductsBtn').addEventListener('click', ()=>{
  const rows = [['Name','Price','Category'], ...products.map(p=>[p.pname,p.price,p.category])];
  downloadCSV('products.csv', rows);
  addLog('Exported products CSV');
});

/* ---------- Event bindings for Add buttons ---------- */
$('#addUserBtn').addEventListener('click', openAddUser);
$('#addProductBtn').addEventListener('click', openAddProduct);

/* ---------- Logs rendering ---------- */
function renderLogs(){
  const list = JSON.parse(localStorage.getItem('logs')||'[]');
  const ul = $('#logList'); ul.innerHTML = '';
  list.slice(0,200).forEach(l=>{
    const li=el('li'); li.textContent = `${new Date(l.time).toLocaleString()} — ${l.text}`; ul.appendChild(li);
  });
}
renderLogs();

/* ---------- Clear data ---------- */
$('#clearDataBtn').addEventListener('click', ()=>{
  if(confirm('Clear all demo local data?')) {
    localStorage.clear(); location.reload();
  }
});

/* ---------- Simple activity notifier demo ---------- */
setInterval(()=> {
  const sample = ["New order received","Server backup completed","New user signed up","Low inventory warning"];
  const text = sample[Math.floor(Math.random()*sample.length)];
  pushNotification(text);
}, 45000); // every 45s (demo)

/* ---------- Charts (Chart.js) ---------- */
const salesCtx = $('#salesChart').getContext('2d');
const usersCtx = $('#usersChart').getContext('2d');
let salesChart = new Chart(salesCtx, {
  type:'line',
  data:{ labels:[], datasets:[{ label:'Sales', data:[], tension:0.3, fill:true }]},
  options:{ responsive:true, maintainAspectRatio:false }
});
let usersChart = new Chart(usersCtx, {
  type:'bar',
  data:{ labels:[], datasets:[{ label:'New Users', data:[] }]},
  options:{ responsive:true, maintainAspectRatio:false }
});
const chartSets = {
  daily: { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data:[120,180,90,160,220,140,200] },
  weekly:{ labels:['W1','W2','W3','W4'], data:[800,950,700,1200] },
  monthly:{ labels:['Jan','Feb','Mar','Apr','May','Jun'], data:[3200,4000,3600,4500,5000,4800] }
};

function updateCharts(range='daily'){
  const cs = chartSets[range];
  salesChart.data.labels = cs.labels;
  salesChart.data.datasets[0].data = cs.data;
  salesChart.update();

  usersChart.data.labels = cs.labels;
  usersChart.data.datasets[0].data = cs.data.map(n => Math.round(n/10));
  usersChart.update();

  // update sales stat mock
  $('#statSales').textContent = '$' + cs.data.reduce((a,b)=>a+b,0).toLocaleString();
}
$('#chartRange').addEventListener('change', e=> updateCharts(e.target.value));
$('#refreshUsersChart').addEventListener('click', ()=> updateCharts($('#chartRange').value));
updateCharts($('#chartRange').value);

/* ---------- Initial render ---------- */
renderUsers(); renderProducts(); renderLogs();

/* ---------- Attach table header sortability (per-table) ---------- */
$$('th[data-sort]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const table = th.closest('table');
    const key = th.dataset.sort;
    if (table.id==='usersTable') {
      usersState.sortBy = key; usersState.sortDir = (usersState.sortDir||1)*-1; renderUsers();
    } else {
      productsState.sortBy = key; productsState.sortDir = (productsState.sortDir||1)*-1; renderProducts();
    }
  });
});

/* ---------- Quick actions: row click, keyboard ---------- */
document.addEventListener('keydown', e=>{
  if (e.key === 'Escape') closeModal();
});

/* ---------- Initial stats ---------- */
$('#statUsers').textContent = users.length;
$('#statProducts').textContent = products.length;

/* Final log to indicate loaded */
addLog('Dashboard loaded');
