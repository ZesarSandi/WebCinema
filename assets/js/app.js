/* app.js — Central UI behaviors for the site
 - Modal manager (open/close)
 - DataTable class (render, add, edit, delete, persist via localStorage)
 - Drag/drop & image preview support is integrated for data-barang modal
 - Sortable headers
*/
(function(){
  'use strict';

  // --- Utilities ---
  const qs = (s,el=document)=>el.querySelector(s);
  const qsa = (s,el=document)=>Array.from(el.querySelectorAll(s));
  const on = (el,ev,fn)=>el && el.addEventListener(ev,fn);

  // Simple Toast
  function toast(msg, timeout=2500){
    let t = document.createElement('div');
    t.className = 'site-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),240) }, timeout);
  }

  // --- Modal Manager (generic) ---
  function Modal(el){
    this.el = el;
    this.overlay = qs('.modal-overlay', el);
    this.closeBtns = qsa('[data-close], .modal-close', el);
    this.openTriggers = qsa('[data-open="'+(el.id||'')+'"]');
    this.init();
  }
  Modal.prototype.init = function(){
    const el = this.el;
    this.openTriggers.forEach(btn=>on(btn,'click',()=>this.open()));
    this.closeBtns.forEach(btn=>on(btn,'click',()=>this.close()));
    if(this.overlay) on(this.overlay,'click',()=>this.close());
  }
  Modal.prototype.open = function(){ this.el.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  Modal.prototype.close = function(){ this.el.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  // --- DataTable ---
  class DataTable {
    constructor(table, opts={}){
      this.table = table;
      this.tbody = qs('tbody', table);
      this.storageKey = opts.storageKey || table.dataset.storageKey || null;
      this.columns = opts.columns || null; // optional mapping of columns
      this.form = opts.form || null; // optional modal form element
      this.data = [];
      this.editId = null;
      this.init();
    }

    init(){
      if(this.storageKey) this.load();
      else this.loadFromDom();
      this.render();
      this.attachEvents();
    }

    load(){
      try{ this.data = JSON.parse(localStorage.getItem(this.storageKey)) || []; }
      catch(e){ this.data = []; }
      if(!this.data.length) this.loadFromDom();
      // defaults for pagination & filter
      this.filterText = '';
      this.pageSize = 10;
      this.currentPage = 1;

      // restore metadata (sort, pageSize, page)
      try{
        const meta = JSON.parse(localStorage.getItem(this.storageKey+':meta')||'{}');
        if(meta.pageSize) this.pageSize = meta.pageSize;
        if(meta.page) this.currentPage = meta.page;
        if(meta.sort && meta.sort.key){ // try to reapply sort classes and sorting
          const key = meta.sort.key; const dir = meta.sort.dir || 'asc';
          const th = qsa('thead th', this.table).find(t=>t.dataset.key===key);
          if(th){ th.classList.add(dir==='asc'?'sort-asc':'sort-desc'); this.data.sort((a,b)=>{ let va=(a[key]||'').toString().toLowerCase(); let vb=(b[key]||'').toString().toLowerCase(); if(key==='tanggal'){ va = parseDateForSort(va); vb = parseDateForSort(vb); } if(va<vb) return dir==='asc'?-1:1; if(va>vb) return dir==='asc'?1:-1; return 0 }); }
        }
      }catch(e){}
    }

    save(){ if(this.storageKey) localStorage.setItem(this.storageKey, JSON.stringify(this.data)); // update counts globally when items changed
        try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} }

    loadFromDom(){ // read existing rows as initial dataset
      this.data = [];
      const rows = this.tbody ? Array.from(this.tbody.rows) : [];
      rows.forEach((r,i)=>{
        const cells = r.cells;
        const obj = {
          id: Date.now()+i,
          nama:(cells[2]&&cells[2].textContent.trim())||'',
          kondisi:(cells[3]&&cells[3].textContent.trim())||'',
          jenis:(cells[4]&&cells[4].textContent.trim())||'',
          tanggal:(cells[5]&&cells[5].textContent.trim())||'',
          code:(cells[6]&&cells[6].textContent.trim())||'',
          img:(cells[1]&&cells[1].querySelector('img')?cells[1].querySelector('img').src:'')
        };
        this.data.push(obj);
      });
      this.save();
    }

    render(){
      if(!this.tbody) return;
      // apply filter
      const filtered = this.getFilteredData();
      // pagination
      const total = filtered.length;
      const pageSize = this.pageSize || 10;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if(this.currentPage > totalPages) this.currentPage = totalPages;
      const start = (this.currentPage - 1) * pageSize;
      const visible = filtered.slice(start, start + pageSize);

      this.tbody.innerHTML = '';
      visible.forEach((item, idx)=>{
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.innerHTML = this.rowHtml(item, start + idx + 1);
        this.tbody.appendChild(tr);
      });

      // render pagination
      this.renderPagination(totalPages);

      // persist view meta (current page, pageSize, sort)
      if(this.storageKey && typeof this.saveMeta==='function') this.saveMeta();
    }

    rowHtml(item, no){
      // expects fields: id, img, nama, kondisi, jenis, tanggal, code
      return `
        <td>${no}</td>
        <td><img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.nama)}"></td>
        <td>${escapeHtml(item.nama)}</td>
        <td><span class="kondisi ${escapeHtml(item.kondisi)}">${escapeHtml(capitalize(item.kondisi))}</span></td>
        <td>${escapeHtml(item.jenis)}</td>
        <td>${escapeHtml(item.tanggal)}</td>
        <td class="col-kode">${escapeHtml(item.code || '')}</td>
        <td class="table-actions">
          <button type="button" class="btn btn-outline action-edit">Edit</button>
          <button type="button" class="btn btn-outline action-delete" style="border-color:var(--danger);color:var(--danger)">Hapus</button>
          <button type="button" class="btn btn-outline btn-print-label">Cetak Label</button>
        </td>
      `;
    }

    renderPagination(totalPages){
      if(!this.paginationEl) return; this.paginationEl.innerHTML = '';
      const createBtn = (label,page,active=false,disabled=false)=>{ const b=document.createElement('button'); b.textContent=label; b.className = 'page-btn'+(active?' active':'')+(disabled?' disabled':''); b.disabled = !!disabled; b.dataset.page = page; b.addEventListener('click', ()=>{ this.currentPage=page; this.render(); }); return b };

      // hide pager when only one page
      if(totalPages<=1){ this.paginationEl.style.display='none'; return } else { this.paginationEl.style.display='flex' }

      // prev
      this.paginationEl.appendChild(createBtn('«', Math.max(1,this.currentPage-1), false, this.currentPage<=1));

      // first page
      const pushPage = (i)=>{ if(i<1 || i>totalPages) return; this.paginationEl.appendChild(createBtn(i, i, i===this.currentPage)); };
      pushPage(1);

      // range around current
      let start = Math.max(2, this.currentPage-2);
      let end = Math.min(totalPages-1, this.currentPage+2);
      if(start>2){ const s = document.createElement('span'); s.className='ellipsis'; s.textContent='…'; this.paginationEl.appendChild(s); }
      for(let i=start;i<=end;i++) pushPage(i);
      if(end<totalPages-1){ const s = document.createElement('span'); s.className='ellipsis'; s.textContent='…'; this.paginationEl.appendChild(s); }

      // last page
      if(totalPages>1) pushPage(totalPages);

      // next
      this.paginationEl.appendChild(createBtn('»', Math.min(totalPages,this.currentPage+1), false, this.currentPage>=totalPages));
    }

    attachEvents(){
      // delegate edit/delete/print label
      on(this.tbody,'click', (e)=>{
        const edit = e.target.closest('.action-edit');
        const del = e.target.closest('.action-delete');
        const print = e.target.closest('.btn-print-label');
        if(edit){ this.openEdit(edit.closest('tr').dataset.id); }
        if(del){ this.confirmDelete(del.closest('tr').dataset.id); }
        if(print){ const id = print.closest('tr').dataset.id; const item = this.data.find(x=>String(x.id)===String(id)); if(item) openLabelModal(item); }
      });
      // attach sortable headers
      qsa('thead th.sortable', this.table).forEach(th=>{
        on(th,'click', ()=> this.sortBy(th.dataset.key, th));
      });

      // toolbar controls
      const wrapper = this.table.closest('.table-wrap') || this.table.parentElement;
      if(wrapper){
        this.searchEl = qs('.table-search', wrapper);
        this.pageSizeEl = qs('.page-size', wrapper);
        this.exportEl = qs('.btn-export', wrapper);
        this.paginationEl = qs('.table-pagination', wrapper.parentElement) || qs('.table-pagination', wrapper);
        if(this.searchEl) on(this.searchEl,'input', debounce((e)=>{ this.filterText = (e.target.value||'').trim().toLowerCase(); this.currentPage=1; this.render(); }, 200));
        if(this.pageSizeEl){ this.pageSizeEl.value = this.pageSize || 10; on(this.pageSizeEl,'change', (e)=>{ this.pageSize = parseInt(e.target.value,10)||10; this.currentPage=1; this.render(); }); }
        if(this.exportEl) on(this.exportEl,'click', ()=> this.exportCSV());
      }
    }

    add(item){
      // ensure unique code and QR
      if(!item.code) item.code = generateCode();
      item.qr = generateQRForCode(item.code);
      // if server available, send to API
      if(window.API_BASE){
        const payload = Object.assign({}, item);
        fetch(window.API_BASE + '/api/items', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).then(r=>r.ok? r.json():Promise.reject()).then(data=>{
          const serverItem = Object.assign({}, payload);
          serverItem.id = data.id || serverItem.id || Date.now();
          serverItem.img = data.img_url || serverItem.img;
          serverItem.qr = data.qr_url || serverItem.qr;
          this.data.push(serverItem); this.save(); this.render(); toast('Item ditambahkan (server)');
        }).catch(()=>{ item.id = Date.now(); this.data.push(item); this.save(); this.render(); toast('Item ditambahkan (offline)'); });
        return;
      }
      item.id = Date.now(); this.data.push(item); this.save(); this.render(); toast('Item ditambahkan');
    }
    update(id, item){ const i = this.data.findIndex(x=>String(x.id)===String(id)); if(i>-1){ item.id = this.data[i].id; // preserve or generate code
        if(!item.code) item.code = this.data[i].code || generateCode(); if(!item.qr) item.qr = generateQRForCode(item.code);
        // if server available, update server
        if(window.API_BASE){ const payload = Object.assign({}, item); fetch(window.API_BASE + '/api/items/' + id, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).then(r=>r.ok? r.json():Promise.reject()).then(data=>{ this.data[i] = Object.assign({}, payload); this.data[i].img = data.img_url || payload.img; this.save(); this.render(); toast('Item diperbarui (server)'); }).catch(()=>{ this.data[i] = item; this.save(); this.render(); toast('Item diperbarui (offline)'); }); return; }
        this.data[i] = item; this.save(); this.render(); toast('Item diperbarui'); } }
    async confirmDelete(id){ const ok = await showConfirm('Hapus item ini?'); if(ok) this.deleteId(id); }
    deleteId(id){ this.data = this.data.filter(x=>String(x.id)!==String(id)); this.save(); this.render(); toast('Item dihapus'); }

    getFilteredData(){ const f = (this.filterText||'').toLowerCase(); if(!f) return this.data.slice(); return this.data.filter(x=>{ return Object.keys(x).some(k=>String(x[k]||'').toLowerCase().includes(f)); }); }

    exportCSV(){ const rows = this.getFilteredData(); const headers = ['No','Nama','Kondisi','Jenis','Tanggal','Img']; let csv = headers.join(',') + '\n'; rows.forEach((r,i)=>{ const vals=[i+1, r.nama, r.kondisi, r.jenis, r.tanggal, r.img]; csv += vals.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n'; }); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (this.storageKey || 'export') + '.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('CSV diunduh'); }

    saveMeta(){ try{ const meta = JSON.parse(localStorage.getItem(this.storageKey+':meta')||'{}'); meta.pageSize = this.pageSize || 10; meta.page = this.currentPage || 1; const th = qsa('thead th.sort-asc', this.table)[0] || qsa('thead th.sort-desc', this.table)[0]; if(th){ meta.sort = {key: th.dataset.key, dir: th.classList.contains('sort-asc')?'asc':'desc'} } localStorage.setItem(this.storageKey+':meta', JSON.stringify(meta)); }catch(e){} }


    openEdit(id){ const item = this.data.find(x=>String(x.id)===String(id)); if(!item) return; if(!this.form) return; this.editId = id; // populate form
      this.form.querySelector('[name="nama"]').value = item.nama || '';
      this.form.querySelector('[name="kondisi"]').value = item.kondisi || 'baik';
      this.form.querySelector('[name="jenis"]').value = item.jenis || '';
      this.form.querySelector('[name="tanggal"]').value = formatInputDate(item.tanggal) || '';
      // image: if data URL set preview else set foto_url
      const fotoUrl = this.form.querySelector('[name="foto_url"]');
      const preview = qs('#foto_preview');
      if(item.img){ if(item.img.startsWith('data:')){ showPreview(item.img); if(fotoUrl) fotoUrl.value = ''; } else { clearPreview(); if(fotoUrl) fotoUrl.value = item.img } }
      // open modal
      const modalEl = qs('#modal-tambah'); if(modalEl) modalEl.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
      // update submit button text
      const submitBtn = this.form.querySelector('[type="submit"]'); if(submitBtn) submitBtn.textContent = 'Perbarui';
    }

    sortBy(key, th){ if(!key) return; const current = th.classList.contains('sort-asc') ? 'asc' : (th.classList.contains('sort-desc') ? 'desc' : null); // clear others
      qsa('thead th.sortable', this.table).forEach(h=>h.classList.remove('sort-asc','sort-desc'));
      const dir = current==='asc' ? 'desc' : 'asc'; th.classList.add(dir==='asc'?'sort-asc':'sort-desc');
      this.data.sort((a,b)=>{
        let va = (a[key]||'').toString().toLowerCase();
        let vb = (b[key]||'').toString().toLowerCase();
        if(key==='tanggal'){ // assume format dd-mm-yyyy or yyyy-mm-dd stored
          va = parseDateForSort(va); vb = parseDateForSort(vb);
        }
        if(va<vb) return dir==='asc'?-1:1; if(va>vb) return dir==='asc'?1:-1; return 0;
      });
      // persist last sort
      if(this.storageKey){ try{ const meta = JSON.parse(localStorage.getItem(this.storageKey+':meta')||'{}'); meta.sort = {key,dir}; localStorage.setItem(this.storageKey+':meta', JSON.stringify(meta)); }catch(e){} }
      this.render();
    }
  }

  // --- Utilities ---
  function capitalize(s){ return s? s.charAt(0).toUpperCase()+s.slice(1):'' }
  function escapeHtml(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
  function formatInputDate(s){ // accept dd-mm-yyyy -> yyyy-mm-dd for input type date
    if(!s) return '';
    if(/\d{2}-\d{2}-\d{4}/.test(s)){ const [d,m,y]=s.split('-'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }
    if(/\d{4}-\d{2}-\d{2}/.test(s)) return s; return s;
  }
  function parseDateForSort(s){ if(!s) return ''; if(/\d{2}-\d{2}-\d{4}/.test(s)){ const [d,m,y]=s.split('-'); return `${y}${m}${d}` } if(/\d{4}-\d{2}-\d{2}/.test(s)) return s.replace(/-/g,''); return s }
  function inputValueToDisplayDate(v){ if(!v) return ''; const parts = v.split('-'); if(parts.length===3){ return `${parts[2]}-${parts[1]}-${parts[0]}` } return v }
  function diffDays(a,b){ try{ const da = new Date(a); const db = new Date(b); const diff = Math.round((new Date(db) - new Date(da)) / (24*3600*1000)); return Math.abs(diff); }catch(e){ return '-'; } }

  // update item and loan counts in dashboard and data-barang
  function animateAndSet(el, text){ if(!el) return; const prev = el.textContent; if(String(prev) === String(text)) return; el.textContent = text; el.classList.remove('animate'); // restart
      // force reflow then add
      void el.offsetWidth; el.classList.add('animate'); // remove after animation
      const onEnd = ()=>{ el.classList.remove('animate'); el.removeEventListener('animationend', onEnd); }; el.addEventListener('animationend', onEnd);
  }
  function updateCounts(){ try{ let items = JSON.parse(localStorage.getItem('dataBarang')||'[]') || []; const loans = JSON.parse(localStorage.getItem('peminjaman')||'[]') || []; // fallback: if no items in storage but data-barang table present, count DOM rows
      const domTable = qs('.data-barang table'); let domCount = 0; if(domTable){ domCount = qsa('tbody tr', domTable).length; if(items.length===0 && domCount>0){ // don't overwrite storage, just use DOM count for display
          // keep items as empty but we'll use domCount below
        } }
      const displayCount = items.length || domCount || 0;
      const totalEl = qs('#total-items-count'); const cardEl = qs('#card-items-count'); const dashTotalItems = qs('#dashboard-total-items'); const dashTotalLoans = qs('#dashboard-total-loans'); const dashActiveCompleted = qs('#dashboard-active-completed'); const sidebarBadge = qs('#sidebar-items-count'); animateAndSet(totalEl, displayCount); animateAndSet(cardEl, displayCount); animateAndSet(dashTotalItems, displayCount); if(sidebarBadge) sidebarBadge.textContent = displayCount; animateAndSet(dashTotalLoans, loans.length || 0); const active = loans.filter(x=>String(x.status||'').toLowerCase()==='aktif').length; const completed = loans.length - active; animateAndSet(dashActiveCompleted, `${active} / ${completed}`); }catch(e){ console.error('updateCounts error', e); } }
  window.updateCounts = updateCounts;

  // --- Image preview utilities used by data-barang modal (global) ---
  function showPreview(src){ const p = qs('#foto_preview'); if(!p) return; p.setAttribute('aria-hidden','false'); p.innerHTML = '<img src="'+escapeHtml(src)+'" alt="Preview">'; }
  function clearPreview(){ const p = qs('#foto_preview'); if(!p) return; p.setAttribute('aria-hidden','true'); p.innerHTML = ''; }

// --- confirm modal helper ---
    function ensureConfirmModal(){
      let modal = qs('#modal-confirm');
      if(modal) return modal;
      modal = document.createElement('div'); modal.className='modal'; modal.id='modal-confirm'; modal.setAttribute('aria-hidden','true');
      modal.innerHTML = `<div class="modal-overlay" data-close></div><div class="modal-panel" role="dialog" aria-modal="true"><header class="modal-header"><h3 id="modal-confirm-title">Konfirmasi</h3><button class="modal-close" aria-label="Tutup">×</button></header><div class="modal-body"><p id="modal-confirm-text"></p></div><div class="modal-actions"><button class="btn btn-outline" data-close>Batalkan</button><button class="btn btn-primary" id="modal-confirm-ok">Hapus</button></div></div>`;
      document.body.appendChild(modal);
      new Modal(modal);
      return modal;
    }

    function showConfirm(message){ return new Promise(resolve=>{
      const modal = ensureConfirmModal(); qs('#modal-confirm-text').textContent = message; modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const onOk = ()=>{ clean(); resolve(true) }; const onClose = ()=>{ clean(); resolve(false) };
      const okBtn = qs('#modal-confirm-ok'); const closers = qsa('[data-close], .modal-close', modal);
      okBtn.addEventListener('click', onOk, {once:true}); closers.forEach(c=>c.addEventListener('click', onClose, {once:true}));
      function clean(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    }); }

    // --- QR helpers & label modal ---
    function generateCode(){ return 'ITEM-'+Math.floor(Date.now()/1000); }
    function generateQRForCode(code){
      try{
        const base = (location.origin && location.origin!=='null') ? (location.origin + location.pathname.replace(/\/[^\/]*$/,'')) : (location.href.replace(/[^\/]*$/,''));
        const url = base + 'peminjaman.html?code=' + encodeURIComponent(code);
        return 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(url);
      }catch(e){ return '' }
    }

    function openLabelModal(item){ const modal = qs('#modal-label'); if(!modal) return; const img = qs('#label-qr-img'); const codeEl = qs('#label-code-text'); img.src = item.qr || generateQRForCode(item.code); codeEl.textContent = item.code || ''; modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const printBtn = qs('#label-print'); // attach once
      const doPrint = ()=>{
        const w = window.open('','_blank'); w.document.write(`<html><head><title>Label ${escapeHtml(item.code||'')}</title><style>body{font-family:Arial;padding:20px;text-align:center}img{max-width:260px}</style></head><body><h3>${escapeHtml(item.code||'')}</h3><img src="${escapeHtml(item.qr||generateQRForCode(item.code))}" alt="QR"><p>Scan untuk pinjam</p></body></html>`); w.document.close(); w.focus(); w.print(); setTimeout(()=>w.close(),500);
      };
      // remove previous listener by replacing node
      const np = printBtn.cloneNode(true); printBtn.parentNode.replaceChild(np, printBtn); on(np,'click', doPrint);
    }

    // initialize modals on page
    qsa('.modal').forEach(m=>new Modal(m));

    // helper to find item by code (tries API then localStorage)
    const API_BASE = window.API_BASE || '';
    function findItemByCode(code){ if(!code) return Promise.resolve(null); if(API_BASE){ return fetch(API_BASE + '/api/items?code=' + encodeURIComponent(code)).then(r=>r.ok? r.json():null).then(d=>{ if(!d) return null; if(Array.isArray(d)) return d[0]||null; return d; }).catch(()=>null); }
      try{ const arr = JSON.parse(localStorage.getItem('dataBarang')||'[]'); const it = arr.find(x=>String(x.code||'')===String(code)); return Promise.resolve(it||null); }catch(e){ return Promise.resolve(null); } }

    // Setup DataTable for data-barang (if exists)
    const dbTable = qs('.data-barang table');
    if(dbTable){ dbTable.dataset.storageKey = dbTable.dataset.storageKey || 'dataBarang';
      // mark sortable headers
      qsa('thead th', dbTable).forEach(th=>{ const key = th.dataset.key || th.className || ''; if(['col-nama','col-jenis','col-tgl','col-kondisi'].some(k=>th.classList.contains(k))) th.classList.add('sortable'), th.dataset.key = th.dataset.key || (th.classList.contains('col-nama')?'nama':(th.classList.contains('col-jenis')?'jenis':(th.classList.contains('col-tgl')?'tanggal':'kondisi')));
      });
      const form = qs('#form-tambah');
      const dt = new DataTable(dbTable, {storageKey:'dataBarang', form:form}); try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){}

      // drag & drop already handled by previous code; wire file input and handlers to set current image data
      const dropzone = qs('#dropzone'); const fileInput = qs('#foto_file'); let currentImageData = null;
      if(dropzone){
        ['dragenter','dragover'].forEach(ev=>on(dropzone,ev,e=>{ e.preventDefault(); dropzone.classList.add('dragover'); }));
        ['dragleave','drop'].forEach(ev=>on(dropzone,ev,e=>{ e.preventDefault(); dropzone.classList.remove('dragover'); }));
        on(dropzone,'drop', e=>{ const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f) readFileAndPreview(f); });
        on(qs('.btn-file'),'click', ()=> fileInput.click());
        on(fileInput,'change', e=>{ if(e.target.files && e.target.files[0]) readFileAndPreview(e.target.files[0]); });
      }

      // Wire the "+ Tambah Barang" button: reset form/preview and open modal
      const addBtn = qs('.btn-add');
      if(addBtn){
        on(addBtn,'click', ()=>{
          if(form){ form.reset(); clearPreview(); currentImageData = null; const sub = form.querySelector('[type="submit"]'); if(sub) sub.textContent = 'Simpan'; }
          if(dt) dt.editId = null;
          const modalEl = qs('#modal-tambah'); if(modalEl) modalEl.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
        });
      }

      function readFileAndPreview(file){ if(!file.type.startsWith('image/')){ alert('Mohon pilih file gambar.'); return; } const r = new FileReader(); r.onload = function(ev){ currentImageData = ev.target.result; showPreview(currentImageData); }; r.readAsDataURL(file); if(qs('[name="foto_url"]')) qs('[name="foto_url"]').value = '' }

      // Handle form submit for add/update
      on(form,'submit', function(e){ e.preventDefault(); const formData = new FormData(form); const nama = (formData.get('nama')||'').trim(); const kondisi = formData.get('kondisi')||'baik'; const jenis = (formData.get('jenis')||'').trim(); const tanggal = formData.get('tanggal')||''; const foto_url = (formData.get('foto_url')||'').trim() || null; // pick preview data first
        const img = currentImageData || foto_url || '';
        if(!img){ alert('Mohon sertakan foto'); return }
        const payload = {img:img,nama:nama,kondisi:kondisi,jenis:jenis,tanggal:inputValueToDisplayDate(tanggal)};
        // if dt.editId present in dt instance, handle update; else add
        if(dt.editId){ dt.update(dt.editId, payload); } else { dt.add(payload); }
        // cleanup
        clearPreview(); currentImageData = null; dt.editId = null; form.reset(); qs('#modal-tambah').setAttribute('aria-hidden','true'); document.body.style.overflow='';
      });

    } // end if(dbTable)

    // --- Peminjaman form handling (prefill from ?code=... and offline fallback)
    const loanSection = qs('#loan-section');
    if(loanSection){
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const formLoan = qs('#form-peminjaman');
      const itemImgEl = qs('#loan-item-img');
      const itemNameEl = qs('#loan-item-name');
      const itemCodeEl = qs('#loan-item-code');
      const itemCodeInput = qs('#loan-item-code-input');
      const tanggalPin = qs('#tanggal_pinjam');
      const selfieInput = qs('#foto_selfie');
      const selfiePreview = qs('#selfie_preview');

      function setNowDateTime(){ const d = new Date(); const local = d.toISOString().slice(0,16); if(tanggalPin) tanggalPin.value = local; }
      setNowDateTime();

      if(code){ findItemByCode(code).then(item=>{ if(item){ loanSection.style.display='block'; itemImgEl.src = item.img || 'assets/img/no-image.png'; itemNameEl.textContent = item.nama || ''; itemCodeEl.textContent = item.code || code; itemCodeInput.value = item.code || code; const nameInput = formLoan.querySelector('[name="nama_peminjam"]'); if(nameInput) nameInput.focus(); } else { toast('Kode tidak ditemukan'); } }); }

      // helper: compress dataURL to JPEG with maxWidth
      function compressDataUrl(dataUrl, maxWidth=1024, quality=0.8){ return new Promise(resolve=>{ const img = new Image(); img.onload = ()=>{ const ratio = img.width / img.height; let w = img.width; let h = img.height; if(w > maxWidth){ w = maxWidth; h = Math.round(w / ratio); } const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); ctx.drawImage(img,0,0,w,h); const out = c.toDataURL('image/jpeg', quality); resolve(out); }; img.src = dataUrl; img.onerror = ()=>resolve(dataUrl); }); }
      // expose helper for test harness
      window.compressDataUrl = compressDataUrl;

      // camera & capture logic
      const video = qs('#selfie_video'); const canvas = qs('#selfie_canvas'); const startBtn = qs('#btn-start-camera'); const captureBtn = qs('#btn-capture'); const retakeBtn = qs('#btn-retake'); const stopBtn = qs('#btn-stop-camera'); let cameraStream = null; let capturedImageData = null;
      async function startCamera(){ if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Kamera tidak tersedia pada perangkat ini'); return; } try{ cameraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}}); video.srcObject = cameraStream; video.style.display = 'block'; captureBtn.style.display='inline-block'; stopBtn.style.display='inline-block'; startBtn.style.display='none'; }catch(e){ console.error(e); toast('Tidak dapat mengakses kamera'); } }
      function stopCamera(){ if(cameraStream){ cameraStream.getTracks().forEach(t=>t.stop()); cameraStream = null; } if(video){ video.srcObject = null; video.style.display='none'; } captureBtn.style.display='none'; stopBtn.style.display='none'; startBtn.style.display='inline-block'; }
      async function captureFromVideo(){ if(!video) return; if(!canvas) return; canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480; const ctx = canvas.getContext('2d'); ctx.drawImage(video,0,0,canvas.width,canvas.height); const data = canvas.toDataURL('image/jpeg', 0.9); const compressed = await compressDataUrl(data, 1024, 0.8); capturedImageData = compressed; showCapturedImage(compressed); stopCamera(); retakeBtn.style.display='inline-block'; }
      function showCapturedImage(data){ selfiePreview.setAttribute('aria-hidden','false'); selfiePreview.innerHTML = '<img src="'+escapeHtml(data)+'" alt="Selfie">'; }
      function clearCaptured(){ capturedImageData = null; selfiePreview.setAttribute('aria-hidden','true'); selfiePreview.innerHTML = ''; retakeBtn.style.display='none'; }

      if(startBtn) on(startBtn,'click', ()=> startCamera()); if(captureBtn) on(captureBtn,'click', ()=> captureFromVideo()); if(stopBtn) on(stopBtn,'click', ()=> stopCamera()); if(retakeBtn) on(retakeBtn,'click', ()=>{ clearCaptured(); startCamera(); });

      // file fallback still works
      if(selfieInput) on(selfieInput,'change', e=>{ const f = e.target.files && e.target.files[0]; if(f){ const r = new FileReader(); r.onload = async ev=>{ const compressed = await compressDataUrl(ev.target.result, 1024, 0.8); selfiePreview.setAttribute('aria-hidden','false'); selfiePreview.innerHTML = '<img src="'+escapeHtml(compressed)+'" alt="Selfie">'; capturedImageData = compressed; }; r.readAsDataURL(f); } });

      // submit loan (prefer capturedImageData)
      on(formLoan,'submit', function(e){ e.preventDefault(); const fd = new FormData(formLoan); const loan = { id: Date.now(), item_code: fd.get('item_code'), nama: fd.get('nama_peminjam'), devisi: fd.get('devisi'), tanggal_pinjam: fd.get('tanggal_pinjam'), tanggal_kembali: fd.get('tanggal_kembali'), keterangan: fd.get('keterangan'), status: 'aktif', created_at: new Date().toISOString() };
        if(capturedImageData){ loan.photo = capturedImageData; saveLoan(loan); clearCaptured(); } else { const f = fd.get('foto_selfie'); if(f && f.size){ const reader = new FileReader(); reader.onload = ()=>{ loan.photo = reader.result; saveLoan(loan); }; reader.readAsDataURL(f); } else { saveLoan(loan); } }
      });

      // seed sample data helper (dev) — generates sample loans across months for chart testing
      function seedSampleLoans(year = (new Date()).getFullYear()){ const items = JSON.parse(localStorage.getItem('dataBarang')||'[]') || [{code:'ITEM-1',nama:'Proyektor'}, {code:'ITEM-2',nama:'Tripod'}, {code:'ITEM-3',nama:'Kamera'}]; const arr = []; for(let m=1;m<=12;m++){ const count = Math.floor(Math.random()*3)+1; for(let i=0;i<count;i++){ const it = items[(i % items.length)]; const d = new Date(year, m-1, Math.min(15, i+1), 10,0,0); const status = Math.random()>0.6?'selesai':'aktif'; arr.push({ id: Date.now()+Math.floor(Math.random()*10000), item_id: it.id||null, item_code: it.code, item_name: it.nama, nama: 'User '+(i+1), devisi: 'Divisi '+((i%3)+1), tanggal_pinjam: d.toISOString(), tanggal_kembali: status==='selesai' ? new Date(d.getTime()+3*24*3600*1000).toISOString().slice(0,10) : null, photo: '', keterangan: 'Contoh', status: status, created_at: new Date().toISOString() }); } }
        localStorage.setItem('peminjaman', JSON.stringify(arr)); toast('Data contoh diisi'); if(window.lp) window.lp.load(); if(window.r) window.r.load(); }
      // expose for test harness
      window.seedSampleLoans = seedSampleLoans;



      function saveLoan(loan){ if(window.API_BASE){ fetch(window.API_BASE + '/api/loans', {method:'POST', body: JSON.stringify(loan), headers:{'Content-Type':'application/json'}}).then(r=>r.json().then(data=>{ if(data && data.id){ toast('Peminjaman tersimpan'); formLoan.reset(); selfiePreview.innerHTML=''; loanSection.style.display='none'; try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} } else { toast('Gagal mengirim ke server'); } })).catch(()=>{ toast('Gagal mengirim ke server'); }); } else { const arr = JSON.parse(localStorage.getItem('peminjaman')||'[]'); arr.push(loan); localStorage.setItem('peminjaman', JSON.stringify(arr)); toast('Peminjaman tersimpan (offline)'); formLoan.reset(); selfiePreview.innerHTML=''; loanSection.style.display='none'; try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} } }
    }

    // --- Riwayat (loan history) class ---
    class Riwayat {
      constructor(table, opts={}){
        this.table = table;
        this.tbody = qs('tbody', table);
        this.storageKey = opts.storageKey || 'peminjaman';
        this.searchEl = qs('.table-search', table.closest('.main-inner') || document);
        this.pageSizeEl = qs('.page-size', table.closest('.main-inner') || document);
        this.exportEl = qs('.btn-export', table.closest('.main-inner') || document);
        this.perPage = parseInt(this.pageSizeEl?.value||10,10)||10;
        this.page = 1;
        this.filter = '';
        this.data = [];
        this.init();
      }
      init(){ this.load(); this.render(); this.attach(); }
      load(){ if(API_BASE){ /* would fetch from API */ return fetch(API_BASE + '/api/loans').then(r=>r.ok? r.json():[]).then(d=>{ this.data = d || []; this.applyFilter(); }).catch(()=>{ this.data = JSON.parse(localStorage.getItem(this.storageKey)||'[]') || []; this.applyFilter(); }); } else { this.data = JSON.parse(localStorage.getItem(this.storageKey)||'[]') || []; this.applyFilter(); } }
      save(){ if(API_BASE){ /* TODO: sync to server */ } localStorage.setItem(this.storageKey, JSON.stringify(this.data)); try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} }
      applyFilter(){ const f = (this.filter||'').toLowerCase(); this.filtered = !f? this.data.slice() : this.data.filter(x=>{ return [x.nama,x.devisi,x.keterangan,x.item_code].some(k=>String(k||'').toLowerCase().includes(f)); }); this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.perPage)); if(this.page>this.totalPages) this.page = this.totalPages; }
      render(){ if(!this.tbody) return; this.applyFilter(); const start = (this.page-1)*this.perPage; const visible = this.filtered.slice(start, start+this.perPage); this.tbody.innerHTML = ''; visible.forEach((row,idx)=>{ const tr = document.createElement('tr'); tr.dataset.id = row.id; const itemNameCell = '<span class="muted">'+escapeHtml(row.item_code||'')+'</span>'; tr.innerHTML = `
          <td>${start+idx+1}</td>
          <td>${escapeHtml(row.item_name||'')}</td>
          <td>${escapeHtml(row.item_code||'')}</td>
          <td>${escapeHtml(row.nama||'')}</td>
          <td>${escapeHtml(row.devisi||'')}</td>
          <td>${escapeHtml(row.tanggal_pinjam||'')}</td>
          <td>${escapeHtml(row.tanggal_kembali||'')}</td>
          <td><span class="status ${row.status==='aktif'?'aktif':(row.status==='terlambat'?'terlambat':'selesai')}">${escapeHtml(row.status||'')}</span></td>
          <td>${row.photo? '<button class="btn btn-outline btn-view-photo">Lihat</button>':'-'}</td>
          <td>${escapeHtml(row.keterangan||'')}</td>
          <td class="table-actions">${row.status==='aktif'?'<button class="btn btn-outline btn-return">Kembalikan</button>':''} <button class="btn btn-outline btn-delete" style="border-color:var(--danger);color:var(--danger)">Hapus</button></td>
        `; this.tbody.appendChild(tr); }); this.renderPagination(); }
      renderPagination(){ const wrap = this.table.closest('.table-wrap') || this.table.parentElement; let pager = wrap.querySelector('.table-pagination'); if(!pager){ pager = document.createElement('div'); pager.className='table-pagination'; wrap.insertBefore(pager, this.table); } pager.innerHTML=''; if(this.totalPages<=1) { pager.style.display='none'; return } pager.style.display='flex'; const createBtn=(t,p,active=false,disabled=false)=>{ const b=document.createElement('button'); b.textContent=t; b.className='page-btn'+(active?' active':''); b.disabled=!!disabled; b.dataset.page=p; on(b,'click', ()=>{ this.page = Number(p); this.render(); }); return b }; pager.appendChild(createBtn('«', Math.max(1,this.page-1),false,this.page<=1)); pager.appendChild(createBtn('1',1, this.page===1)); if(this.page>3) pager.appendChild(Object.assign(document.createElement('span'),{className:'ellipsis',textContent:'…'})); const start = Math.max(2,this.page-1); const end = Math.min(this.totalPages-1,this.page+1); for(let i=start;i<=end;i++) pager.appendChild(createBtn(i,i,i===this.page)); if(this.page<this.totalPages-2) pager.appendChild(Object.assign(document.createElement('span'),{className:'ellipsis',textContent:'…'})); if(this.totalPages>1) pager.appendChild(createBtn(this.totalPages,this.totalPages,this.page===this.totalPages)); pager.appendChild(createBtn('»', Math.min(this.totalPages,this.page+1),false,this.page>=this.totalPages)); }
      attach(){ on(this.table,'click', e=>{ const tr = e.target.closest('tr'); if(!tr) return; const id = tr.dataset.id; if(e.target.closest('.btn-return')) this.markReturned(id); if(e.target.closest('.btn-delete')) this.deleteLoan(id); if(e.target.closest('.btn-view-photo')) this.viewPhoto(id); }); if(this.searchEl) on(this.searchEl,'input', debounce(e=>{ this.filter = (e.target.value||'').trim(); this.page=1; this.render(); }, 200)); if(this.pageSizeEl) on(this.pageSizeEl,'change', e=>{ this.perPage = parseInt(e.target.value,10)||10; this.page=1; this.render(); }); if(this.exportEl) on(this.exportEl,'click', ()=> this.exportCSV()); }
      async markReturned(id){ const i = this.data.findIndex(x=>String(x.id)===String(id)); if(i>-1){ this.data[i].status='selesai'; // update server if available
        if(window.API_BASE){ try{ await fetch(window.API_BASE + '/api/loans/' + id, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'selesai'})}); }catch(e){} }
        this.save(); this.render(); try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} toast('Barang ditandai kembali'); } }
      async deleteLoan(id){ const ok = await showConfirm('Hapus catatan ini?'); if(!ok) return; this.data = this.data.filter(x=>String(x.id)!==String(id)); // optionally inform server
        if(window.API_BASE){ try{ await fetch(window.API_BASE + '/api/loans/' + id, {method:'DELETE'}); }catch(e){} }
        this.save(); this.render(); try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){} toast('Catatan dihapus'); }
      viewPhoto(id){ const r = this.data.find(x=>String(x.id)===String(id)); if(!r || !r.photo) return; const w = window.open('','_blank'); w.document.write(`<html><head><title>Foto Dokumentasi</title><style>body{margin:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh}img{max-width:100%;height:auto}</style></head><body><img src="${escapeHtml(r.photo)}" alt="Foto"></body></html>`); w.document.close(); }
      exportCSV(){ const rows = this.data || []; const headers = ['No','Kode','Nama','Devisi','Tanggal Pinjam','Tanggal Kembali','Status','Keterangan']; let csv = headers.join(',')+'\n'; rows.forEach((r,i)=>{ const vals=[i+1, r.item_code, r.nama, r.devisi, r.tanggal_pinjam, r.tanggal_kembali, r.status, r.keterangan]; csv += vals.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n'; }); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'riwayat-peminjaman.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('CSV diunduh'); }
    }

    // instantiate riwayat if page has it
    const riTable = qs('.table-riwayat');
    if(riTable){ window.r = new Riwayat(riTable); // apply optional search from URL param 'q'
      try{ const params = new URLSearchParams(window.location.search); const q = params.get('q'); if(q && window.r){ window.r.filter = q; if(window.r.searchEl) window.r.searchEl.value = q; window.r.render(); // highlight matching rows after render
            try{ const tb = qs('.table-riwayat tbody'); if(tb){ Array.from(tb.rows).forEach(row=>row.classList.remove('highlight')); const first = Array.from(tb.rows).find(r=> r.textContent.toLowerCase().includes(q.toLowerCase())); if(first){ first.classList.add('highlight'); first.scrollIntoView({behavior:'smooth', block:'center'}); } } }catch(e){} } }catch(e){}
      // load items to map code->name
      try{ const items = JSON.parse(localStorage.getItem('dataBarang')||'[]')||[]; window.r.data.forEach(x=>{ const it = items.find(i=>String(i.code||'')===String(x.item_code)); if(it) x.item_name = it.nama; }); window.r.render(); }catch(e){}
    }

    // --- Laporan (monthly) class ---
    class Laporan {
      constructor(table, opts={}){
        this.table = table;
        this.tbody = qs('tbody', table);
        this.storageKey = opts.storageKey || 'peminjaman';
        this.yearSelect = qs('.report-year');
        this.exportEl = qs('.btn-export', table.closest('.main-inner') || document);
        this.data = [];
        this.monthMap = {}; // key => array of loans
        this.init();
      }
      init(){ this.populateYears(); this.populateItems(); this.load(); this.attach(); }
      populateYears(){ // show +/- 2 years from current
        if(!this.yearSelect) return; const now = new Date(); const y = now.getFullYear(); this.yearSelect.innerHTML = ''; for(let i=y+1;i>=y-2;i--){ const opt = document.createElement('option'); opt.value = i; opt.textContent = i; if(i===y) opt.selected=true; this.yearSelect.appendChild(opt); } }
      populateItems(){ // fetch items from API or localStorage to populate filter
        if(!this.yearSelect) return; const sel = qs('.report-item'); if(!sel) return;
        if(window.API_BASE){ fetch(window.API_BASE + '/api/items').then(r=>r.json()).then(items=>{ sel.innerHTML = '<option value="">Semua Alat</option>'; (items||[]).forEach(it=>{ const o=document.createElement('option'); o.value = it.code || ''; o.textContent = (it.nama||'') + (it.code? ' ('+it.code+')':''); sel.appendChild(o); }); }).catch(()=>{ const items = JSON.parse(localStorage.getItem('dataBarang')||'[]')||[]; sel.innerHTML = '<option value="">Semua Alat</option>'; items.forEach(it=>{ const o=document.createElement('option'); o.value = it.code || ''; o.textContent = (it.nama||'') + (it.code? ' ('+it.code+')':''); sel.appendChild(o); }); });
        } else { const items = JSON.parse(localStorage.getItem('dataBarang')||'[]')||[]; sel.innerHTML = '<option value="">Semua Alat</option>'; items.forEach(it=>{ const o=document.createElement('option'); o.value = it.code || ''; o.textContent = (it.nama||'') + (it.code? ' ('+it.code+')':''); sel.appendChild(o); }); }
      }
      load(){ if(window.API_BASE){ fetch(window.API_BASE + '/api/loans').then(r=>r.json()).then(d=>{ this.data = d || []; this.process(); }).catch(()=>{ this.data = JSON.parse(localStorage.getItem(this.storageKey)||'[]')||[]; this.process(); }); } else { this.data = JSON.parse(localStorage.getItem(this.storageKey)||'[]')||[]; this.process(); } }
      process(){ // group by year-month
        this.monthMap = {};
        // apply item filter if set
        const selectedItem = qs('.report-item') ? qs('.report-item').value : '';
        this.data.forEach(l=>{
          if(selectedItem && String(l.item_code||'')!==String(selectedItem)) return;
          const date = new Date(l.tanggal_pinjam || l.created_at || null);
          if(!isFinite(date)) return;
          const year = date.getFullYear(); const month = (date.getMonth()+1);
          const key = `${year}-${String(month).padStart(2,'0')}`;
          this.monthMap[key] = this.monthMap[key] || []; this.monthMap[key].push(l);
        });
        this.render(); this.updateChart();
      }
      render(){ if(!this.tbody) return; const year = this.yearSelect? Number(this.yearSelect.value): (new Date()).getFullYear(); const keys = Object.keys(this.monthMap).filter(k=>k.startsWith(year+'-')).sort().reverse(); this.tbody.innerHTML = '';
        if(!keys.length){ this.tbody.innerHTML = '<tr><td colspan="6" class="muted">Tidak ada data untuk tahun ini.</td></tr>'; return; }
        keys.forEach(k=>{
          const arr = this.monthMap[k]; const total = arr.length; const returned = arr.filter(x=>x.status!=='aktif').length; const active = arr.filter(x=>x.status==='aktif').length; const overdue = arr.filter(x=>{ if(!x.tanggal_kembali) return false; try{ const dl = new Date(x.tanggal_kembali); const now = new Date(); return x.status==='aktif' && dl < now; }catch(e){ return false } }).length;
          const tr = document.createElement('tr'); tr.dataset.key = k; const [yy,mm] = k.split('-'); tr.innerHTML = `
            <td>${formatMonth(Number(mm), Number(yy))}</td>
            <td>${total}</td>
            <td>${returned}</td>
            <td>${active}</td>
            <td>${overdue}</td>
            <td class="table-actions"><button class="btn btn-outline btn-details">Detail</button> <button class="btn btn-outline btn-export-month">Export</button></td>
          `; this.tbody.appendChild(tr);
        }); }
      updateChart(){ const canvas = qs('#laporan-chart'); if(!canvas) return; try{ const ctx = canvas.getContext('2d'); const year = this.yearSelect? Number(this.yearSelect.value): (new Date()).getFullYear(); const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; const totals = []; const returned = []; const active = []; const overdue = []; for(let m=1;m<=12;m++){ const key = `${year}-${String(m).padStart(2,'0')}`; const arr = this.monthMap[key] || []; totals.push(arr.length); returned.push(arr.filter(x=>x.status!=='aktif').length); active.push(arr.filter(x=>x.status==='aktif').length); overdue.push(arr.filter(x=>{ if(!x.tanggal_kembali) return false; try{ const dl=new Date(x.tanggal_kembali); return x.status==='aktif' && dl < new Date(); }catch(e){return false}}).length); } if(window.Chart){ if(this.chart) this.chart.destroy(); this.chart = new Chart(ctx, { type: 'bar', data:{ labels: months, datasets: [ { label:'Masih Dipinjam', data: active, backgroundColor:'rgba(255,159,64,0.9)' }, { label:'Dikembalikan', data: returned, backgroundColor:'rgba(75,192,192,0.9)' }, { label:'Terlambat', data: overdue, backgroundColor:'rgba(255,99,132,0.9)' } ] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ beginAtZero:true } } } }); } }catch(e){console.error(e);} }
      exportPDF(){ const el = qs('.main-inner'); if(!el){ toast('Area laporan tidak ditemukan'); return; } html2canvas(el, { scale: 2 }).then(canvas=>{ const img = canvas.toDataURL('image/png'); try{ const { jsPDF } = window.jspdf || {}; const pdf = new jsPDF('l','pt','a4'); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = (canvas.height * pdfWidth) / canvas.width; pdf.addImage(img,'PNG',0,0,pdfWidth,pdfHeight); pdf.save('laporan.pdf'); toast('PDF diunduh'); }catch(e){ console.error(e); toast('Gagal membuat PDF'); } }); }
      attach(){ if(this.yearSelect) on(this.yearSelect,'change', ()=> { this.render(); this.updateChart(); }); const itemSel = qs('.report-item'); if(itemSel) on(itemSel,'change', ()=> this.process()); if(this.exportEl) on(this.exportEl,'click', ()=> this.exportCSV()); const pdfBtn = qs('.btn-pdf'); if(pdfBtn) on(pdfBtn,'click', ()=> this.exportPDF()); on(this.tbody,'click', e=>{ const det = e.target.closest('.btn-details'); const exp = e.target.closest('.btn-export-month'); const tr = e.target.closest('tr'); if(det){ this.openDetails(tr.dataset.key); } if(exp){ this.exportMonth(tr.dataset.key); } }); }
      openDetails(key){ const arr = this.monthMap[key] || []; const modal = qs('#modal-laporan-details'); const body = qs('#modal-laporan-body'); const title = qs('#modal-laporan-title'); title.textContent = 'Detail bulan ' + key; if(!body) return; body.innerHTML = '';
        if(!arr.length){ body.innerHTML = '<p>Tidak ada data.</p>'; modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; return; }
        const table = document.createElement('table'); table.className = 'data-table'; const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>No</th><th>Kode</th><th>Nama</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Deadline</th><th>Status</th></tr>'; table.appendChild(thead);
        const tb = document.createElement('tbody'); arr.forEach((r,i)=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(r.item_code||'')}</td><td>${escapeHtml(r.item_name||'')}</td><td>${escapeHtml(r.nama||'')}</td><td>${escapeHtml(r.tanggal_pinjam||'')}</td><td>${escapeHtml(r.tanggal_kembali||'')}</td><td>${escapeHtml(r.status||'')}</td>`; tb.appendChild(tr); }); table.appendChild(tb); body.appendChild(table);
        modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; // attach export button inside modal
        const expBtn = qs('#laporan-export-month'); try{ const newBtn = expBtn.cloneNode(true); expBtn.parentNode.replaceChild(newBtn, expBtn); on(newBtn,'click', ()=> this.exportMonth(key)); }catch(e){}
        const expPdfBtn = qs('#laporan-export-month-pdf'); try{ const newPdfBtn = expPdfBtn.cloneNode(true); expPdfBtn.parentNode.replaceChild(newPdfBtn, expPdfBtn); on(newPdfBtn,'click', ()=> this.exportMonthPDF(key)); }catch(e){}
      }
      exportMonth(key){ const arr = this.monthMap[key] || []; const headers = ['No','Kode','Nama','Peminjam','Tanggal Pinjam','Tanggal Kembali','Status','Keterangan']; let csv = headers.join(',')+'\n'; arr.forEach((r,i)=>{ const vals=[i+1, r.item_code, r.item_name, r.nama, r.tanggal_pinjam, r.tanggal_kembali, r.status, r.keterangan]; csv += vals.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n'; }); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'laporan-' + key + '.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('CSV bulan diunduh'); }
      exportCSV(){ // export all months for current year
        const year = this.yearSelect? this.yearSelect.value : (new Date()).getFullYear(); let csv = 'Bulan,Total,Dikembalikan,Masih Dipinjam,Terlambat\n'; const keys = Object.keys(this.monthMap).filter(k=>k.startsWith(year+'-')).sort(); if(!keys.length){ toast('Tidak ada data untuk diexport'); return; }
        keys.forEach(k=>{ const arr=this.monthMap[k]; const total=arr.length; const returned = arr.filter(x=>x.status!=='aktif').length; const active = arr.filter(x=>x.status==='aktif').length; const overdue = arr.filter(x=>{ if(!x.tanggal_kembali) return false; try{ const dl=new Date(x.tanggal_kembali); return x.status==='aktif' && dl < new Date(); }catch(e){return false}}).length; csv += `${k},${total},${returned},${active},${overdue}\n`; }); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='laporan-'+year+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('CSV laporan diunduh'); }
    }

    // populate dashboard recent riwayat if present and update counts
    const dashTable = qs('.dashboard-riwayat');
    if(dashTable){ try{ const tbody = qs('tbody', dashTable); const loans = JSON.parse(localStorage.getItem('peminjaman')||'[]') || []; // sort by tanggal_pinjam desc then created_at
        loans.sort((a,b)=>{ const da = new Date(a.tanggal_pinjam || a.created_at || 0); const db = new Date(b.tanggal_pinjam || b.created_at || 0); return db - da; }); const recent = loans.slice(0,5); if(!recent.length){ tbody.innerHTML = '<tr><td colspan="3" class="muted">Belum ada riwayat</td></tr>'; } else { tbody.innerHTML = ''; recent.forEach(r=>{ const tr = document.createElement('tr'); const est = r.tanggal_kembali ? diffDays(r.tanggal_pinjam, r.tanggal_kembali) + ' hari' : (r.status==='aktif' ? 'Aktif' : '-'); tr.innerHTML = `<td>${escapeHtml(r.item_name||r.item_code||'')}</td><td>${escapeHtml(r.nama||'')}</td><td>${escapeHtml(est)}</td>`; tr.addEventListener('click', ()=>{ // go to riwayat with q param = item_code
              const q = r.item_code || r.item_name || r.nama; window.location.href = 'riwayat.html?q=' + encodeURIComponent(q); }); tbody.appendChild(tr); }); }
        // update card counts
        const itemCountEl = qs('#card-items-count'); const activeCountEl = qs('#card-active-count'); try{ const items = JSON.parse(localStorage.getItem('dataBarang')||'[]') || []; if(itemCountEl) itemCountEl.textContent = items.length || 0; const activeCount = (loans.filter(x=>x.status==='aktif').length) || 0; if(activeCountEl) activeCountEl.textContent = activeCount; }catch(e){}
      }catch(e){ console.error('Dashboard riwayat render error', e); }
    }

    // instantiate laporan if present
    const lpTable = qs('.table-laporan');
    if(lpTable){ window.lp = new Laporan(lpTable); const seedBtn = qs('.btn-seed'); if(seedBtn) on(seedBtn,'click', ()=> seedSampleLoans(Number(window.lp.yearSelect.value|| (new Date()).getFullYear()))); const selfBtn = qs('#btn-selftest-laporan'); if(selfBtn) on(selfBtn,'click', ()=> window.runSelfTest()); }

    // ensure counts are populated on page load
    try{ if(typeof window.updateCounts === 'function') window.updateCounts(); }catch(e){}

    // wire self-test button on peminjaman form + global button
    const formSelfBtn = qs('#btn-selftest-form'); if(formSelfBtn) on(formSelfBtn,'click', ()=> window.runSelfTest());
    const globalSelfBtn = qs('#btn-selftest-global'); if(globalSelfBtn) on(globalSelfBtn,'click', ()=> window.runSelfTest());


    // Add export of modal detail to PDF
    Laporan.prototype.exportMonthPDF = function(key){ const arr = this.monthMap[key] || []; const modal = qs('#modal-laporan-details'); const body = qs('#modal-laporan-body'); if(!body) return; html2canvas(body, {scale:2}).then(canvas=>{ const img = canvas.toDataURL('image/png'); try{ const { jsPDF } = window.jspdf || {}; const pdf = new jsPDF('p','pt','a4'); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = (canvas.height * pdfWidth) / canvas.width; pdf.addImage(img,'PNG',0,0,pdfWidth,pdfHeight); pdf.save('laporan-' + key + '.pdf'); toast('PDF bulan diunduh'); }catch(e){ console.error(e); toast('Gagal membuat PDF'); } }); };

    // Simple self-test runner for basic feature checks
    window.runSelfTest = async function(){ const results = []; try{ // camera API
        const cam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        results.push(['Camera API', cam]);
        // helper compress
        const compressOk = typeof window.compressDataUrl === 'function';
        results.push(['compressDataUrl', compressOk]);
        if(compressOk){ try{ const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='; const out = await window.compressDataUrl(tiny, 200, 0.7); results.push(['compress run', !!(out && out.indexOf('data:image')===0)]); }catch(e){ results.push(['compress run', false]); } }
        // localStorage write/read
        try{ const key = 'test_peminjaman_' + Date.now(); localStorage.setItem(key, JSON.stringify({ok:true})); const read = JSON.parse(localStorage.getItem(key)||'null'); results.push(['localStorage write/read', !!(read && read.ok)]); localStorage.removeItem(key); }catch(e){ results.push(['localStorage write/read', false]); }
        // seed and chart update
        const seedFn = typeof window.seedSampleLoans === 'function'; results.push(['seedSampleLoans', seedFn]); if(seedFn && window.lp){ window.seedSampleLoans(); await new Promise(r=>setTimeout(r,250)); const hasData = Object.keys(window.lp.monthMap||{}).length>0; results.push(['chart data after seed', hasData]); } else { results.push(['chart data after seed', false]); }
        // libs present
        results.push(['Chart.js', !!window.Chart]); results.push(['html2canvas', typeof html2canvas === 'function']); results.push(['jsPDF', !!(window.jspdf || window.jsPDF || window.jspdf && window.jspdf.jsPDF)]);
        // export functions
        results.push(['Laporan exportMonthPDF', !!(Laporan && Laporan.prototype && typeof Laporan.prototype.exportMonthPDF === 'function')]);
      }catch(e){ console.error('Self-test error', e); results.push(['runtime', false]); }

      // prepare message
      let pass = 0; let fail = 0; let msg = 'Hasil Self-test:\n\n'; results.forEach(r=>{ const ok = !!r[1]; msg += (ok? '✅ ':'❌ ') + r[0] + '\n'; if(ok) pass++; else fail++; }); msg += `\n${pass} passed, ${fail} failed.`;
      console.log('Self-test details:', results); toast('Self-test selesai: ' + pass + ' passed, ' + fail + ' failed'); alert(msg);
    };


})();