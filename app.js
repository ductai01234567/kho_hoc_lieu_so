/* ===== CẤU HÌNH: đổi tài khoản admin ở đây ===== */
const ADMIN = { user: "admin", pass: "123456" };
/* =============================================== */

const COLORS = { 6: "#0f5c7a", 7: "#2f8f6b", 8: "#c9791a", 9: "#8a3f6b" };
const mkLessons = () => [{ title: "Bài 1: Tên bài học", slides: "", video: "" }];
const DEF = {
  site: { name: "Kho học liệu số", logo: "", intro: "Nơi các em xem bài giảng, video thực hành và thông tin của trường. Chọn một mục bên dưới để bắt đầu." },
  teachers: [{ name: "Thầy/Cô Nguyễn Văn A", photo: "", desc: "Giáo viên bộ môn. Hãy cập nhật đoạn giới thiệu ngắn ở trang Quản trị." }],
  place: { desc: "Giới thiệu ngắn về địa điểm của trường.", address: "Hà Nội, Việt Nam", map: "" },
  grades: Object.fromEntries([6, 7, 8, 9].map(g => [g, { desc: `Bài giảng dành cho học sinh lớp ${g}.`, cover: "", lessons: mkLessons() }]))
};

let D = JSON.parse(JSON.stringify(DEF));
let isAdmin = sessionStorage.getItem("adm") === "1";
let atab = "site", lessonTab = "ly-thuyet";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const idOf = u => (u.match(/\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/) || [])[1];

function imgUrl(u) {
  if (!u) return "";
  if (u.includes("drive.google.com") && idOf(u)) return `https://drive.google.com/thumbnail?id=${idOf(u)}&sz=w1000`;
  return u;
}
function embed(u) {
  if (!u) return "";
  u = u.trim();
  const m = u.match(/<iframe[^>]+src="([^"]+)"/); if (m) return m[1];
  const id = idOf(u);
  if (u.includes("docs.google.com/presentation") && id) return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`;
  if (u.includes("drive.google.com") && id) return `https://drive.google.com/file/d/${id}/preview`;
  if (/\.pptx?(\?|$)/i.test(u)) return "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(u);
  return u;
}
function mapSrc(p) {
  const e = embed(p.map || "");
  if (e) return e;
  return p.address ? `https://maps.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed` : "";
}
const frame = (u, t) => u ? `<div class="frame"><iframe src="${esc(embed(u))}" title="${esc(t)}" allowfullscreen loading="lazy"></iframe></div>` : `<div class="empty">Chưa có nội dung.</div>`;
const logoHtml = () => D.site.logo ? `<img class="logo" src="${esc(imgUrl(D.site.logo))}" alt="Logo">` : `<span class="logo">${esc(D.site.name[0] || "K")}</span>`;

/* ===== Trang cho học sinh ===== */
const views = {
  home() {
    const t = D.teachers[0];
    return `<section class="hero"><h1>${esc(D.site.name)}</h1><p>${esc(D.site.intro)}</p></section>
    <nav class="menu">
      <a href="#/bai-giang">Bài giảng <span>Lớp 6, 7, 8, 9</span></a>
      <a href="#/giao-vien">Giáo viên <span>${D.teachers.length} giáo viên</span></a>
      <a href="#/dia-diem">Địa điểm <span>Xem bản đồ</span></a>
    </nav>
    ${t ? `<section class="sec"><h2>Giáo viên</h2><div class="row"><img class="ava" src="${esc(imgUrl(t.photo))}" alt="" onerror="this.style.visibility='hidden'"><div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p></div></div><a href="#/giao-vien">Xem tất cả</a></section>` : ""}
    <section class="sec"><h2>Địa điểm</h2><p>${esc(D.place.desc)}</p><a href="#/dia-diem">Xem bản đồ</a></section>`;
  },
  grades() {
    return `<h1>Bài giảng</h1><p>Chọn khối lớp để xem danh sách bài học.</p><div class="grades">${[6, 7, 8, 9].map(g => {
      const c = D.grades[g].cover;
      return `<a class="g" href="#/bai-giang/${g}"><div class="cv" style="--c:${COLORS[g]};${c ? `background-image:url('${esc(imgUrl(c))}')` : ""}">${c ? "" : "Lớp " + g}</div><b>Lớp ${g}</b></a>`;
    }).join("")}</div>`;
  },
  grade(g) {
    const G = D.grades[g]; if (!G) return views.grades();
    return `<a class="crumb" href="#/bai-giang">‹ Bài giảng</a><h1>Lớp ${g}</h1><p>${esc(G.desc)}</p>
    <ul class="lessons">${G.lessons.map((l, i) => `<li><a href="#/bai-giang/${g}/${i}">${esc(l.title)}</a></li>`).join("") || '<li class="empty">Chưa có bài học.</li>'}</ul>`;
  },
  lesson(g, i) {
    const l = (D.grades[g] || {}).lessons?.[i]; if (!l) return views.grade(g);
    const ly = lessonTab === "ly-thuyet";
    return `<a class="crumb" href="#/bai-giang/${g}">‹ Lớp ${g}</a><h1>${esc(l.title)}</h1>
    <div class="seg"><button data-tab="ly-thuyet" class="${ly ? "on" : ""}">Lý thuyết</button><button data-tab="thuc-hanh" class="${ly ? "" : "on"}">Thực hành</button></div>
    ${ly ? frame(l.slides, "Bản trình chiếu") : frame(l.video, "Video thực hành")}
    ${(ly ? l.slides : l.video) ? `<p class="note" style="margin-top:10px"><a href="${esc((ly ? l.slides : l.video))}" target="_blank" rel="noopener">Mở trong tab mới</a> nếu không xem được.</p>` : ""}`;
  },
  teachers() {
    return `<h1>Giáo viên</h1>${D.teachers.map(t => `<section class="sec"><div class="row"><img class="ava" src="${esc(imgUrl(t.photo))}" alt="" onerror="this.style.visibility='hidden'"><h3>${esc(t.name)}</h3></div><p>${esc(t.desc)}</p></section>`).join("")}`;
  },
  place() {
    const s = mapSrc(D.place);
    return `<h1>Địa điểm</h1><p>${esc(D.place.desc)}</p>${D.place.address ? `<p><b>Địa chỉ:</b> ${esc(D.place.address)}</p>` : ""}
    ${s ? `<div class="map"><iframe src="${esc(s)}" title="Bản đồ" loading="lazy" allowfullscreen></iframe></div>` : '<div class="empty">Chưa có bản đồ.</div>'}
    ${D.place.address ? `<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(D.place.address)}">Mở Google Maps</a>` : ""}`;
  },
  account() {
    if (isAdmin) return `<h1>Tài khoản</h1><div class="sec"><p>Bạn đang đăng nhập với quyền quản trị.</p><a class="btn" href="#/admin">Vào trang quản trị</a> <button class="btn sec2" data-act="logout">Đăng xuất</button></div>`;
    return `<h1>Tài khoản</h1>
    <div class="sec"><h2>Học sinh</h2><p>Học sinh không cần đăng nhập, chỉ cần vào xem nội dung.</p><a class="btn" href="#/bai-giang">Vào xem bài giảng</a></div>
    <div class="sec"><h2>Quản trị viên</h2><label for="u">Tên đăng nhập</label><input id="u" autocomplete="username"><label for="p">Mật khẩu</label><input id="p" type="password" autocomplete="current-password"><div class="bar"><button class="btn" data-act="login">Đăng nhập</button></div></div>`;
  }
};

/* ===== Trang quản trị ===== */
const fld = (label, path, val, type = "text") => `<label>${label}</label>` + (type === "area" ? `<textarea data-p="${path}">${esc(val)}</textarea>` : `<input data-p="${path}" value="${esc(val)}">`);
const imgFld = (label, path, val) => `<label>${label} (dán link hoặc chọn ảnh)</label><input data-p="${path}" value="${esc(val && val.startsWith("data:") ? "(ảnh đã tải lên)" : val)}"><input type="file" accept="image/*" data-img="${path}" style="margin-top:6px">`;

function adminView() {
  if (!isAdmin) return `<div class="empty">Bạn cần đăng nhập quản trị. <a href="#/tai-khoan">Đăng nhập</a></div>`;
  const tabs = [["site", "Chung"], ["teachers", "Giáo viên"], ["place", "Địa điểm"], [6, "Lớp 6"], [7, "Lớp 7"], [8, "Lớp 8"], [9, "Lớp 9"]];
  let body = "";
  if (atab === "site") body = fld("Tên trang", "site.name", D.site.name) + imgFld("Logo", "site.logo", D.site.logo) + fld("Giới thiệu", "site.intro", D.site.intro, "area");
  else if (atab === "teachers") body = D.teachers.map((t, i) => `<div class="sec"><h3>Giáo viên ${i + 1}</h3>${fld("Họ tên", `teachers.${i}.name`, t.name)}${imgFld("Ảnh", `teachers.${i}.photo`, t.photo)}${fld("Mô tả ngắn", `teachers.${i}.desc`, t.desc, "area")}<div class="bar"><button class="btn del sm" data-act="del-t" data-i="${i}">Xóa</button></div></div>`).join("") + `<button class="btn" data-act="add-t">+ Thêm giáo viên</button>`;
  else if (atab === "place") body = fld("Mô tả ngắn", "place.desc", D.place.desc, "area") + fld("Địa chỉ", "place.address", D.place.address) + fld("Mã nhúng Google Maps (không bắt buộc)", "place.map", D.place.map, "area") + `<p class="note">Nếu để trống, trang sẽ tự hiển thị bản đồ theo địa chỉ. Muốn chính xác hơn: Google Maps → Chia sẻ → Nhúng bản đồ → sao chép HTML rồi dán vào đây.</p>`;
  else { const g = atab, G = D.grades[g];
    body = fld("Mô tả lớp", `grades.${g}.desc`, G.desc, "area") + imgFld("Ảnh bìa sách giáo khoa", `grades.${g}.cover`, G.cover) +
      G.lessons.map((l, i) => `<div class="sec"><h3>Bài ${i + 1}</h3>${fld("Tên bài", `grades.${g}.lessons.${i}.title`, l.title)}${fld("Link bản trình chiếu (Google Drive / Google Slides)", `grades.${g}.lessons.${i}.slides`, l.slides)}${fld("Link video thực hành (Google Drive)", `grades.${g}.lessons.${i}.video`, l.video)}<div class="bar"><button class="btn del sm" data-act="del-l" data-i="${i}">Xóa bài</button></div></div>`).join("") + `<button class="btn" data-act="add-l">+ Thêm bài học</button>`; }
  return `<h1>Quản trị</h1>
  <div class="sec"><b>Cách đăng nội dung lên web:</b><p class="note">1) Sửa nội dung bên dưới → 2) bấm "Tải data.json" → 3) tải file đó lên GitHub (thay file data.json cũ). Học sinh sẽ thấy nội dung mới sau ít phút.</p>
  <div class="bar"><button class="btn" data-act="export">Tải data.json</button><label class="btn sec2" style="margin:0">Mở data.json<input type="file" accept=".json" data-import hidden></label><button class="btn sec2" data-act="logout">Đăng xuất</button></div></div>
  <div class="atabs">${tabs.map(([k, n]) => `<button data-at="${k}" class="${String(atab) === String(k) ? "on" : ""}">${n}</button>`).join("")}</div>${body}`;
}

/* ===== Router ===== */
function render() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  const [r, a, b] = h;
  const key = r || "";
  document.querySelectorAll("#nav a").forEach(x => x.classList.toggle("on", x.dataset.r === (key === "admin" ? "tai-khoan" : key)));
  $("#brand").innerHTML = logoHtml() + `<span>${esc(D.site.name)}</span>`;
  document.title = D.site.name;
  let html;
  if (key === "bai-giang") html = !a ? views.grades() : b === undefined ? views.grade(a) : views.lesson(a, +b);
  else if (key === "giao-vien") html = views.teachers();
  else if (key === "dia-diem") html = views.place();
  else if (key === "tai-khoan") html = views.account();
  else if (key === "admin") html = adminView();
  else html = views.home();
  $("#app").innerHTML = html;
  window.scrollTo(0, 0);
}

/* ===== Lưu & tiện ích ===== */
const toast = m => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2200); };
const draft = () => { try { localStorage.setItem("khlsDraft", JSON.stringify(D)); } catch (e) { toast("Bộ nhớ đầy, hãy dùng link ảnh thay vì tải ảnh."); } };
function setPath(p, v) { const k = p.split("."); let o = D; k.slice(0, -1).forEach(x => o = o[x]); o[k.at(-1)] = v; }
function shrink(file, cb) {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", .75)); }; im.src = r.result; };
  r.readAsDataURL(file);
}

document.addEventListener("input", e => { const p = e.target.dataset.p; if (p) { setPath(p, e.target.value); draft(); } });
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.img) shrink(t.files[0], d => { setPath(t.dataset.img, d); draft(); render(); toast("Đã tải ảnh"); });
  if ("import" in t.dataset) { const r = new FileReader(); r.onload = () => { try { D = JSON.parse(r.result); draft(); render(); toast("Đã mở file"); } catch { toast("File không hợp lệ"); } }; r.readAsText(t.files[0]); }
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act],[data-tab],[data-at]"); if (!t) return;
  const { act, tab, at, i } = t.dataset;
  if (tab) { lessonTab = tab; render(); return; }
  if (at) { atab = at; render(); return; }
  if (act === "login") { if ($("#u").value === ADMIN.user && $("#p").value === ADMIN.pass) { isAdmin = true; sessionStorage.setItem("adm", "1"); loadData().then(() => location.hash = "#/admin"); } else toast("Sai tên đăng nhập hoặc mật khẩu"); }
  if (act === "logout") { isAdmin = false; sessionStorage.removeItem("adm"); loadData().then(() => location.hash = "#/"); }
  if (act === "add-t") { D.teachers.push({ name: "Họ tên", photo: "", desc: "" }); draft(); render(); }
  if (act === "del-t" && confirm("Xóa giáo viên này?")) { D.teachers.splice(i, 1); draft(); render(); }
  if (act === "add-l") { D.grades[atab].lessons.push({ title: "Bài mới", slides: "", video: "" }); draft(); render(); }
  if (act === "del-l" && confirm("Xóa bài học này?")) { D.grades[atab].lessons.splice(i, 1); draft(); render(); }
  if (act === "export") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 2)], { type: "application/json" })); a.download = "data.json"; a.click(); }
});

async function loadData() {
  let d = null;
  try { const r = await fetch("data.json?v=" + Date.now()); if (r.ok) d = await r.json(); } catch { }
  if (isAdmin) { try { const s = localStorage.getItem("khlsDraft"); if (s) d = JSON.parse(s); } catch { } }
  D = Object.assign(JSON.parse(JSON.stringify(DEF)), d || {});
  render();
}
window.addEventListener("hashchange", render);
loadData();
