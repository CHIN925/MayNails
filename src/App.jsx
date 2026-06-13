import { useState, useEffect, useRef, useCallback } from "react";

// ─── Admin: password prompt only once on ?admin=true load ────────────────────
const IS_ADMIN_URL = new URLSearchParams(window.location.search).get("admin") === "true";
const ADMIN_PASSWORD = "maynails2025";

// ─── Google Sheets config ────────────────────────────────────────────────────
// Replace SHEET_ID with your Google Sheet ID after setup
const SHEET_ID = "YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Orders";
async function appendToSheet(order) {
  if (SHEET_ID === "YOUR_SHEET_ID_HERE") return;
  try {
    const row = [
      new Date(order.date).toLocaleString("en-MY"),
      order.id.toUpperCase(),
      order.customer.name,
      order.customer.phone,
      order.customer.address,
      order.customer.size,
      order.items.map(i => `${i.name} x${i.qty}`).join(", "),
      `RM ${order.subtotal.toFixed(2)}`,
      `RM ${order.shipping.toFixed(2)}`,
      `RM ${order.grand.toFixed(2)}`,
      order.payMethod === "bank" ? "Bank Transfer" : "TNG eWallet",
      order.status,
      order.customer.note || "",
    ];
    await fetch(`https://script.google.com/macros/s/${SHEET_ID}/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, sheet: SHEET_NAME }),
      mode: "no-cors",
    });
  } catch {}
}

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPA_URL = "https://yzzcrgjkvcuzdlpzescy.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6emNyZ2prdmN1emRscHplc2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzkxMDIsImV4cCI6MjA5Njc1NTEwMn0.7iE8e7fwXJd5bOYFsJnDkNVtdvzg6Ri9SUhjJmAFimE";
async function dbLoad(key) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/store_data?key=eq.${key}&select=value`, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } });
    const rows = await res.json();
    if (rows?.[0]?.value && rows[0].value !== "null") return rows[0].value;
    return null;
  } catch { return null; }
}
async function dbSave(key, val) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/store_data?key=eq.${key}`, {
      method: "PATCH",
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ value: val })
    });
  } catch {}
}

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => `RM ${Number(n).toFixed(2)}`;

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Creamy Moonlight", desc: "Soft milky white with a pearl shimmer — the ultimate everyday set.", price: 28, tag: "Best Seller", sizes: "XS · S · M · L · XL", images: [] },
  { id: "p2", name: "Rose Velvet", desc: "Dusty rose matte finish, velvety texture with a romantic feel.", price: 32, tag: "New", sizes: "XS · S · M · L · XL", images: [] },
  { id: "p3", name: "Midnight Aurora", desc: "Deep navy with aurora glitter — turns heads under every light.", price: 35, tag: "Limited", sizes: "XS · S · M · L · XL", images: [] },
  { id: "p4", name: "Classic French", desc: "Timeless white-tip French tips. Never goes out of style.", price: 25, tag: "", sizes: "XS · S · M · L · XL", images: [] },
  { id: "p5", name: "Matcha Latte", desc: "Soft sage green with a glazed finish — fresh and understated.", price: 30, tag: "New", sizes: "XS · S · M · L · XL", images: [] },
  { id: "p6", name: "Candy Gradient", desc: "Pink-to-orange ombre, sweet and bold — summer's favourite.", price: 33, tag: "Limited", sizes: "XS · S · M · L · XL", images: [] },
];
const DEFAULT_GALLERY = [
  { id: "g1", image: null, label: "Creamy Moonlight", bg: "#f5f0f0" },
  { id: "g2", image: null, label: "Rose Velvet", bg: "#fce4ec" },
  { id: "g3", image: null, label: "Midnight Aurora", bg: "#e8eaf6" },
  { id: "g4", image: null, label: "Classic French", bg: "#fafafa" },
  { id: "g5", image: null, label: "Matcha Latte", bg: "#e8f5e9" },
  { id: "g6", image: null, label: "Candy Gradient", bg: "#fff3e0" },
];
const DEFAULT_SETTINGS = {
  hero: { tagline: "Press-on Nails · Swap Anytime · Salon-perfect Every Day", subtext: "No nail tech needed — gorgeous nails in 5 minutes, at home." },
  shipping: { free_threshold: 80, standard: { label: "Pos Laju", price: 7, days: "2–4 working days" }, express: { label: "Same-day (Klang Valley)", price: 18, days: "Same day" } },
  payment: { bank_name: "Maybank", bank_acc: "1234 5678 9012", bank_holder: "May Nails", tng_number: "+60 12-345 6789", tng_qr: null },
  contact: { instagram: "https://instagram.com/maynails.my", instagram_label: "@maynails.my", tiktok: "https://tiktok.com/@maynails", tiktok_label: "@maynails", email: "hello@maynails.my", hours: "Mon–Sun, 10am–10pm", note: "We ship within 24 hours of your order. DM us on Instagram or TikTok for any questions 🩷" },
  faq: [
    { id: "f1", q: "Will press-ons damage my real nails?", a: "Not at all! Press-ons attach with adhesive tabs or nail glue — no filing, no drilling. Remove them gently and your natural nails stay intact." },
    { id: "f2", q: "How do I measure my nail size?", a: "Use a ruler to measure the widest part of each nail in mm. Match to our size chart — every set includes extra sizes just in case." },
    { id: "f3", q: "How long do they last?", a: "With adhesive tabs: 3–5 days. With nail glue: up to 2 weeks. We recommend removing before sleeping to extend wear." },
    { id: "f4", q: "Can I exchange for a different size?", a: "Yes! Unused sets can be exchanged within 7 days. Just message us first to arrange." },
  ],
  guide: { title: "How to Measure & Size Guide", desc: "", images: [] },
};

// ─── Editable text ────────────────────────────────────────────────────────────
function ET({ value, onChange, multi = false, placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onChange(draft); setEditing(false); };
  if (editing) return multi
    ? <textarea autoFocus className="ei eta" value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Escape" && (setDraft(value), setEditing(false))} />
    : <input autoFocus className="ei" value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }} />;
  return <span className="ed" onClick={() => { setDraft(value); setEditing(true); }} title="Click to edit">{value || <em style={{ opacity: 0.4 }}>{placeholder || "Click to edit"}</em>}<span className="eico">✏️</span></span>;
}

// ─── Single image slot ────────────────────────────────────────────────────────
function ImgSlot({ src, onUpload, onRemove, style = {}, editMode, label = "", onClick }) {
  const ref = useRef();
  const handleClick = () => { if (editMode) { ref.current.click(); } else if (onClick) onClick(); };
  const onChange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onUpload(ev.target.result); r.readAsDataURL(f); e.target.value = ""; };
  return (
    <div style={{ ...style, position: "relative", overflow: "hidden", cursor: editMode ? "pointer" : (onClick ? "zoom-in" : "default") }} onClick={handleClick}>
      {src
        ? <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf6f6", gap: 4 }}>
            {editMode ? <><span style={{ fontSize: 28 }}>📷</span><span style={{ fontSize: 11, opacity: 0.6 }}>Upload photo</span></> : <span style={{ opacity: 0.2, fontSize: 26 }}>🖼️</span>}
          </div>}
      {src && editMode && <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 12, cursor: "pointer", color: "#b86060", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "relative", maxWidth: "95vw", maxHeight: "95vh", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={e => e.stopPropagation()}>
        <img src={images[idx]} alt="" style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10 }} />
        {images.length > 1 && (
          <>
            <button onClick={prev} style={{ position: "absolute", left: -52, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 26, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>‹</button>
            <button onClick={next} style={{ position: "absolute", right: -52, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 26, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>›</button>
            <div style={{ marginTop: 10, color: "#fff", fontSize: 12, opacity: 0.6 }}>{idx + 1} / {images.length}</div>
          </>
        )}
        <button onClick={onClose} style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );
}

// ─── Admin Login Modal ────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === ADMIN_PASSWORD) onSuccess(); else { setErr(true); setPw(""); } };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fffaf8", borderRadius: 24, width: "100%", maxWidth: 340, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #fae0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#b86060", fontStyle: "italic", fontSize: 18 }}>Admin Login 🔐</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#b86060" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={pw} autoFocus onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Enter admin password"
            style={{ width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#f0d0d0"}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" }} />
          {err && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>Wrong password. Try again.</div>}
          <button onClick={submit} style={{ width: "100%", marginTop: 14, background: "#b86060", color: "#fff", border: "none", borderRadius: 30, padding: "12px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Enter</button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, total, shipping, settings, onClose, onOrderPlaced }) {
  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState("bank");
  const [form, setForm] = useState({ name: "", phone: "", address: "", size: "", note: "" });
  const [proof, setProof] = useState(null);
  const proofRef = useRef();
  const grand = total + shipping;
  const submitOrder = () => {
    const order = { id: uid(), date: new Date().toISOString(), customer: form, items: cart, subtotal: total, shipping, grand, payMethod, proof, status: "Pending Payment" };
    onOrderPlaced(order);
    appendToSheet(order);
    setStep(3);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.38)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fffaf8", borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #fae0e0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ color: "#b86060", fontStyle: "italic", fontSize: 18 }}>{step === 3 ? "Order Placed! 🩷" : step === 2 ? "Payment" : "Your Details"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#b86060" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto" }}>
          {step === 1 && <>
            <div style={{ background: "#fdf6f6", borderRadius: 14, padding: 14, marginBottom: 18 }}>
              {cart.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a3535", padding: "3px 0" }}><span>{i.name} × {i.qty}</span><span>RM {(i.price * i.qty).toFixed(2)}</span></div>)}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a3535", padding: "6px 0", borderTop: "1px dashed #f0d0d0", marginTop: 6 }}><span>Shipping</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "#b86060" }}><span>Total</span><span>{fmt(grand)}</span></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["name", "Full name"], ["phone", "Phone / WhatsApp"], ["address", "Delivery address"], ["size", "Nail size (e.g. XS/S/M)"]].map(([k, lbl]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px" }}>{lbl}</label>
                  <input style={{ border: "1.5px solid #f0d0d0", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={lbl} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px" }}>Special requests (optional)</label>
                <textarea style={{ border: "1.5px solid #f0d0d0", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", resize: "vertical", minHeight: 60 }} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any special requests?" />
              </div>
            </div>
            <button disabled={!form.name || !form.phone || !form.address} onClick={() => setStep(2)} style={{ width: "100%", marginTop: 16, background: "#b86060", color: "#fff", border: "none", borderRadius: 30, padding: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: (!form.name || !form.phone || !form.address) ? 0.5 : 1 }}>Continue to Payment →</button>
          </>}
          {step === 2 && <>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["bank", "tng"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1.5px solid ${payMethod === m ? "#b86060" : "#f0d0d0"}`, background: payMethod === m ? "#fceaea" : "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: payMethod === m ? "#b86060" : "#5a3535", fontWeight: payMethod === m ? 700 : 400 }}>{m === "bank" ? "🏦 Bank Transfer" : "💚 TNG eWallet"}</button>
              ))}
            </div>
            <div style={{ background: "#fdf6f6", borderRadius: 14, padding: 18, border: "1px solid #f5d0d0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b86060", marginBottom: 12 }}>{payMethod === "bank" ? "Bank Transfer" : "TNG eWallet"}</div>
              {payMethod === "bank" && [["Bank", settings.payment.bank_name], ["Account No.", settings.payment.bank_acc], ["Account Name", settings.payment.bank_holder]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a3535", padding: "6px 0", borderBottom: "1px dashed #f0d0d0" }}><span>{l}</span><strong>{v}</strong></div>
              ))}
              {payMethod === "tng" && <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a3535", padding: "6px 0", borderBottom: "1px dashed #f0d0d0" }}><span>Transfer to</span><strong>{settings.payment.tng_number}</strong></div>
                {settings.payment.tng_qr && <img src={settings.payment.tng_qr} alt="QR" style={{ width: 180, height: 180, objectFit: "contain", display: "block", margin: "14px auto 0", borderRadius: 12 }} />}
              </>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#b86060", marginTop: 10 }}><span>Amount</span><span>{fmt(grand)}</span></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>Upload payment screenshot (required)</label>
              <div onClick={() => proofRef.current.click()} style={{ border: "2px dashed #e0c0c0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", minHeight: 100, background: "#fffaf8" }}>
                {proof ? <img src={proof} alt="proof" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8 }} /> : <><span style={{ fontSize: 28 }}>📸</span><span style={{ fontSize: 13, color: "#b08080" }}>Tap to upload screenshot</span></>}
              </div>
              <input ref={proofRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setProof(ev.target.result); r.readAsDataURL(f); }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: "transparent", color: "#b86060", border: "1.5px solid #b86060", borderRadius: 30, padding: 11, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              <button disabled={!proof} onClick={submitOrder} style={{ flex: 2, background: "#b86060", color: "#fff", border: "none", borderRadius: 30, padding: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: !proof ? 0.5 : 1 }}>Confirm Order ✓</button>
            </div>
          </>}
          {step === 3 && <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🩷</div>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>Thank you, {form.name}!</h3>
            <p style={{ fontSize: 14, color: "#7a5858", lineHeight: 1.8, marginBottom: 20 }}>Your order is received. We'll verify your payment and confirm via Instagram shortly.</p>
            <button onClick={onClose} style={{ background: "#b86060", color: "#fff", border: "none", borderRadius: 30, padding: "12px 28px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card (separate component to allow useState inside) ───────────────
function ProductCard({ p, editMode, onUpdate, onDelete, onAddToCart, onLightbox }) {
  const [activeImg, setActiveImg] = useState(0);
  const imgs = p.images || [];
  const fileRef = useRef();
  const addImg = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => onUpdate(p.id, "images", [...imgs, ev.target.result]); r.readAsDataURL(f); e.target.value = ""; };
  return (
    <div style={{ background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 2px 20px #f0c0c018", border: "1px solid #fae8e8", position: "relative", transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 36px #f0c0c035"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      {editMode && <button onClick={() => onDelete(p.id)} style={{ position: "absolute", top: 10, left: 10, background: "#ff6060cc", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 12, cursor: "pointer", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
      {p.tag && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.92)", color: "#b86060", fontSize: 10, padding: "3px 10px", borderRadius: 10, fontWeight: 600, zIndex: 2 }}>
        {editMode ? <ET value={p.tag} onChange={v => onUpdate(p.id, "tag", v)} /> : p.tag}
      </div>}
      {/* Main image */}
      <div style={{ width: "100%", height: 220, background: "#fdf6f6", position: "relative", overflow: "hidden" }}>
        {imgs.length > 0
          ? <img src={imgs[activeImg]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} onClick={() => onLightbox(imgs, activeImg)} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {editMode ? <><span style={{ fontSize: 32 }}>📷</span><span style={{ fontSize: 11, opacity: 0.6 }}>Upload photo below</span></> : <span style={{ opacity: 0.2, fontSize: 28 }}>🖼️</span>}
            </div>}
      </div>
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div style={{ display: "flex", gap: 5, padding: "6px 10px", background: "#fdf6f6", overflowX: "auto" }}>
          {imgs.map((src, i) => (
            <img key={i} src={src} alt="" onClick={() => setActiveImg(i)}
              style={{ width: 44, height: 44, borderRadius: 7, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: `2px solid ${i === activeImg ? "#b86060" : "transparent"}`, transition: "border-color .15s" }} />
          ))}
        </div>
      )}
      {/* Edit: upload more images */}
      {editMode && (
        <div style={{ padding: "8px 12px", background: "#fdf6f6", borderBottom: "1px solid #fae8e8" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {imgs.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={src} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                <button onClick={() => { const next = imgs.filter((_, j) => j !== i); onUpdate(p.id, "images", next); if (activeImg >= next.length) setActiveImg(Math.max(0, next.length - 1)); }}
                  style={{ position: "absolute", top: -4, right: -4, background: "#fff", border: "none", borderRadius: "50%", width: 16, height: 16, fontSize: 9, cursor: "pointer", color: "#b86060", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px #0003" }}>✕</button>
              </div>
            ))}
            <div onClick={() => fileRef.current.click()} style={{ width: 40, height: 40, borderRadius: 6, border: "1.5px dashed #e0c0c0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fff", fontSize: 18 }}>+
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={addImg} />
            </div>
          </div>
        </div>
      )}
      {/* Body */}
      <div style={{ padding: "14px 18px 18px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#2a1818", marginBottom: 6 }}>{editMode ? <ET value={p.name} onChange={v => onUpdate(p.id, "name", v)} /> : p.name}</div>
        <div style={{ fontSize: 12, color: "#8a6a6a", marginBottom: 10, lineHeight: 1.65 }}>{editMode ? <ET value={p.desc} onChange={v => onUpdate(p.id, "desc", v)} multi /> : p.desc}</div>
        <div style={{ fontSize: 11, color: "#c09090", marginBottom: 14 }}>Sizes: {editMode ? <ET value={p.sizes} onChange={v => onUpdate(p.id, "sizes", v)} /> : p.sizes}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#b86060" }}>
            <span style={{ fontSize: 12 }}>RM </span>
            {editMode ? <ET value={String(p.price)} onChange={v => onUpdate(p.id, "price", Number(v))} /> : p.price}
          </div>
          <button onClick={() => onAddToCart(p)} style={{ background: "#b86060", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MayNails() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [gallery, setGallery] = useState(DEFAULT_GALLERY);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Admin: show login once on page load if ?admin=true, then stay logged in
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(IS_ADMIN_URL);
  const [editMode, setEditMode] = useState(false);

  const [section, setSection] = useState("home");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [toast, setToast] = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, g, s, o] = await Promise.all([dbLoad("products"), dbLoad("gallery"), dbLoad("settings"), dbLoad("orders")]);
      if (p) setProducts(p.map(prod => ({ ...prod, images: prod.images || [] })));
      if (g) setGallery(g);
      if (s) setSettings(prev => ({ ...prev, ...s, guide: { ...prev.guide, ...(s.guide || {}) }, contact: { ...prev.contact, ...(s.contact || {}) } }));
      if (o) setOrders(o);
      setLoaded(true);
    })();
  }, []);

  const saveProducts = v => { setProducts(v); dbSave("products", v); };
  const saveGallery = v => { setGallery(v); dbSave("gallery", v); };
  const saveSettings = v => { setSettings(v); dbSave("settings", v); };
  const saveOrders = v => { setOrders(v); dbSave("orders", v); };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const updS = (path, val) => {
    const next = JSON.parse(JSON.stringify(settings));
    const keys = path.split("."); let cur = next;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = val;
    saveSettings(next);
  };

  // Cart
  const addToCart = p => { setCart(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]; }); showToast(`Added: ${p.name} 🛒`); };
  const removeFromCart = id => setCart(p => p.filter(i => i.id !== id));
  const adjustQty = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingFee = cartTotal >= settings.shipping.free_threshold ? 0 : settings.shipping.standard.price;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Products
  const updProduct = (id, key, val) => saveProducts(products.map(p => p.id === id ? { ...p, [key]: val } : p));
  const addProduct = () => saveProducts([...products, { id: uid(), name: "New Style", desc: "Click to edit description", price: 30, tag: "", sizes: "XS · S · M · L · XL", images: [] }]);
  const delProduct = id => saveProducts(products.filter(p => p.id !== id));

  // Gallery
  const updGallery = (id, key, val) => saveGallery(gallery.map(g => g.id === id ? { ...g, [key]: val } : g));
  const addGalleryItem = () => saveGallery([...gallery, { id: uid(), image: null, label: "New photo", bg: "#fce4ec" }]);
  const delGalleryItem = id => saveGallery(gallery.filter(g => g.id !== id));

  // Orders
  const placeOrder = order => { const next = [order, ...orders]; saveOrders(next); setCart([]); };
  const updateOrderStatus = (id, status) => saveOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  const deleteOrder = id => saveOrders(orders.filter(o => o.id !== id));

  const statusColor = { "Pending Payment": "#f59e0b", "Payment Verified": "#10b981", "Shipped": "#6366f1", "Completed": "#b86060", "Cancelled": "#ef4444" };

  const navItems = [
    { key: "home", label: "Home" }, { key: "shop", label: "Shop" },
    { key: "gallery", label: "Gallery" }, { key: "guide", label: "Size Guide" },
    { key: "faq", label: "FAQ" }, { key: "contact", label: "Contact" },
    ...(isAdmin && editMode ? [{ key: "orders", label: "📋 Orders" }] : []),
  ];

  const P = ({ children }) => <span style={{ fontFamily: "'Georgia','Times New Roman',serif" }}>{children}</span>;

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia,serif", color: "#b86060", fontSize: 18 }}>Loading May Nails…</div>;

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#fffaf8", minHeight: "100vh", color: "#2a1818" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .nav{position:sticky;top:0;z-index:100;background:rgba(255,250,248,.96);backdrop-filter:blur(10px);border-bottom:1px solid #f0ddd8;display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:62px;gap:10px}
        .nav-logo{font-size:19px;font-weight:700;letter-spacing:3px;color:#b86060;font-style:italic;text-transform:uppercase;white-space:nowrap}
        .nav-links{display:flex;gap:2px;flex-wrap:wrap}
        .nav-btn{background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:20px;font-size:12px;color:#4a2a2a;transition:background .18s,color .18s;font-family:inherit;white-space:nowrap}
        .nav-btn:hover,.nav-btn.active{background:#fceaea;color:#b86060}
        .nav-right{display:flex;gap:8px;align-items:center;flex-shrink:0}
        .edit-toggle{border:1.5px solid #b86060;border-radius:20px;padding:5px 13px;font-size:12px;cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap}
        .cart-btn{position:relative;background:#b86060;border:none;color:#fff;border-radius:20px;padding:6px 16px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
        .cart-badge{position:absolute;top:-5px;right:-5px;background:#2a1818;color:#fff;border-radius:50%;width:19px;height:19px;font-size:10px;display:flex;align-items:center;justify-content:center}
        .btn-primary{background:#b86060;color:#fff;border:none;border-radius:30px;padding:12px 28px;font-size:14px;cursor:pointer;box-shadow:0 4px 18px #b8606040;font-family:inherit;transition:transform .15s,box-shadow .15s}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px #b8606055}
        .btn-outline{background:transparent;color:#b86060;border:1.5px solid #b86060;border-radius:30px;padding:11px 24px;font-size:14px;cursor:pointer;font-family:inherit;transition:background .15s}
        .btn-outline:hover{background:#fceaea}
        .section{max-width:1100px;margin:0 auto;padding:60px 20px}
        .sec-title{font-size:28px;font-weight:700;color:#2a1818;text-align:center;margin-bottom:8px;font-style:italic}
        .sec-title span{color:#b86060}
        .sec-sub{text-align:center;color:#a07070;font-size:14px;margin-bottom:40px;line-height:1.6}
        .add-item-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#fceaea;border:1.5px dashed #b86060;color:#b86060;border-radius:20px;padding:10px 20px;font-size:13px;cursor:pointer;margin-top:14px;font-family:inherit;width:100%;transition:background .15s}
        .add-item-btn:hover{background:#f8d8d8}
        .ed{cursor:pointer;border-radius:4px;transition:background .15s;display:inline}
        .ed:hover{background:#fceaea}
        .eico{font-size:9px;margin-left:3px;opacity:.4}
        .ei{border:1.5px solid #b86060;border-radius:6px;padding:2px 7px;font-size:inherit;font-family:inherit;color:inherit;background:#fff9f9;outline:none;min-width:60px}
        .eta{border:1.5px solid #b86060;border-radius:6px;padding:4px 8px;font-size:inherit;font-family:inherit;color:inherit;background:#fff9f9;outline:none;width:100%;resize:vertical;min-height:54px;display:block}
        .toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#2a1818;color:#fff;border-radius:30px;padding:10px 24px;font-size:13px;z-index:500;animation:fu .3s ease;pointer-events:none;white-space:nowrap}
        @keyframes fu{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @media(max-width:600px){.nav{padding:0 10px}.nav-logo{font-size:15px}.nav-links .nav-btn{padding:4px 6px;font-size:10px}.section{padding:40px 14px}}
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">May Nails</div>
        <div className="nav-links">
          {navItems.map(({ key, label }) => (
            <button key={key} className={`nav-btn ${section === key ? "active" : ""}`} onClick={() => setSection(key)}>{label}</button>
          ))}
        </div>
        <div className="nav-right">
          {isAdmin && (
            <button className="edit-toggle" onClick={() => { setEditMode(m => !m); if (editMode && section === "orders") setSection("home"); }}
              style={{ background: editMode ? "#b86060" : "transparent", color: editMode ? "#fff" : "#b86060" }}>
              {editMode ? "✅ Done" : "✏️ Edit"}
            </button>
          )}
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {toast && <div className="toast">{toast}</div>}
      {lightbox && <Lightbox images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />}
      {showLogin && <AdminLogin onSuccess={() => { setIsAdmin(true); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}

      {/* CART */}
      {cartOpen && <>
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.28)", zIndex: 200 }} onClick={() => setCartOpen(false)} />
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(390px,100vw)", background: "#fffaf8", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-4px 0 40px #b8606025" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #fae0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 17, color: "#b86060", fontStyle: "italic" }}>Your Cart 🛒</h2>
            <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#b86060" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {cart.length === 0
              ? <div style={{ textAlign: "center", color: "#c09090", padding: "48px 20px", fontSize: 13, lineHeight: 2.2 }}>Your cart is empty.<br />Browse our collection 💅</div>
              : cart.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: "10px 14px", border: "1px solid #fae8e8" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#fdf6f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "💅"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2a1818", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#b86060", fontWeight: 700 }}>{fmt(item.price)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => adjustQty(item.id, -1)} style={{ background: "#fceaea", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 14, cursor: "pointer", color: "#b86060" }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => adjustQty(item.id, 1)} style={{ background: "#fceaea", border: "none", borderRadius: "50%", width: 24, height: 24, fontSize: 14, cursor: "pointer", color: "#b86060" }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 15 }}>✕</button>
                </div>
              ))}
          </div>
          {cart.length > 0 && (
            <div style={{ padding: "18px 24px", borderTop: "1px solid #fae0e0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#7a5858" }}><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#7a5858" }}><span>Shipping</span><span>{shippingFee === 0 ? <span style={{ color: "#b86060" }}>Free</span> : fmt(shippingFee)}</span></div>
                {cartTotal < settings.shipping.free_threshold && <div style={{ fontSize: 11, color: "#c09090" }}>Add {fmt(settings.shipping.free_threshold - cartTotal)} more for free shipping 🎉</div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, paddingTop: 8, borderTop: "1px dashed #fae0e0", marginTop: 4 }}><span>Total</span><span style={{ color: "#b86060" }}>{fmt(cartTotal + shippingFee)}</span></div>
              </div>
              <button onClick={() => { setCartOpen(false); setCheckout(true); }} style={{ width: "100%", background: "#b86060", color: "#fff", border: "none", borderRadius: 30, padding: 14, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>Checkout →</button>
            </div>
          )}
        </div>
      </>}

      {checkout && <CheckoutModal cart={cart} total={cartTotal} shipping={shippingFee} settings={settings} onClose={() => setCheckout(false)} onOrderPlaced={order => { placeOrder(order); setCheckout(false); showToast("Order placed! 🩷"); }} />}

      {/* ══ HOME ══ */}
      {section === "home" && <>
        <div style={{ padding: "80px 24px 64px", textAlign: "center", background: "linear-gradient(150deg,#fff6f6 0%,#fdeaf4 55%,#fff2ec 100%)" }}>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#b86060", marginBottom: 18, opacity: .8 }}>Press-on Nails · Malaysia</p>
          <h1 style={{ fontSize: "clamp(40px,9vw,82px)", fontWeight: 700, color: "#2a1818", letterSpacing: -2, lineHeight: 1.05, marginBottom: 20, fontStyle: "italic" }}>May <span style={{ color: "#b86060" }}>Nails</span></h1>
          <p style={{ fontSize: "clamp(14px,2.5vw,17px)", color: "#7a5050", marginBottom: 10, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            {editMode ? <ET value={settings.hero.tagline} onChange={v => updS("hero.tagline", v)} /> : settings.hero.tagline}
          </p>
          <p style={{ fontSize: 13, color: "#b09090", marginBottom: 36 }}>
            {editMode ? <ET value={settings.hero.subtext} onChange={v => updS("hero.subtext", v)} /> : settings.hero.subtext}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setSection("shop")}>Shop Now 💅</button>
            <button className="btn-outline" onClick={() => setSection("gallery")}>View Gallery 🌸</button>
          </div>
        </div>
        <div className="section">
          <h2 className="sec-title">Why <span>press-ons?</span></h2>
          <p className="sec-sub">Everything you love about a nail salon — without the appointment.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[["⏱️", "5-minute application", "No waiting, no drying time — just press and go."], ["🌿", "Zero nail damage", "No filing or drilling. Your natural nails stay healthy."], ["🎨", "New styles weekly", "Fresh designs dropped regularly — always something new."], ["📦", "Ships within 24 hrs", "Order today, on its way tomorrow."]].map(([icon, title, desc]) => (
              <div key={title} style={{ background: "#fff", borderRadius: 18, padding: "24px 18px", border: "1px solid #f5e0e0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2a1818", marginBottom: 5 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#8a6060", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </>}

      {/* ══ SHOP ══ */}
      {section === "shop" && (
        <div className="section">
          <h2 className="sec-title">Our <span>Collection</span></h2>
          <p className="sec-sub">Each set includes 10 nails (thumb to pinky) + spare sizes.</p>
          {/* Shipping box */}
          <div style={{ background: "linear-gradient(135deg,#fff8f8,#fce8e8)", borderRadius: 20, padding: "24px 28px", border: "1px solid #f5d0d0", marginBottom: 40 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#b86060", marginBottom: 14 }}>📦 Shipping</div>
            {[
              [null, <>Free shipping on orders over RM {editMode ? <ET value={String(settings.shipping.free_threshold)} onChange={v => updS("shipping.free_threshold", Number(v))} /> : settings.shipping.free_threshold} <span style={{ background: "#b86060", color: "#fff", borderRadius: 10, fontSize: 10, padding: "2px 8px", marginLeft: 4 }}>FREE</span></>],
              [<>RM {editMode ? <ET value={String(settings.shipping.standard.price)} onChange={v => updS("shipping.standard.price", Number(v))} /> : settings.shipping.standard.price}</>, <>{editMode ? <ET value={settings.shipping.standard.label} onChange={v => updS("shipping.standard.label", v)} /> : settings.shipping.standard.label} ({editMode ? <ET value={settings.shipping.standard.days} onChange={v => updS("shipping.standard.days", v)} /> : settings.shipping.standard.days})</>],
              [<>RM {editMode ? <ET value={String(settings.shipping.express.price)} onChange={v => updS("shipping.express.price", Number(v))} /> : settings.shipping.express.price}</>, <>{editMode ? <ET value={settings.shipping.express.label} onChange={v => updS("shipping.express.label", v)} /> : settings.shipping.express.label} ({editMode ? <ET value={settings.shipping.express.days} onChange={v => updS("shipping.express.days", v)} /> : settings.shipping.express.days})</>],
            ].map(([price, label], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 2 ? "1px dashed #f0c0c0" : "none", fontSize: 13, color: "#5a3535" }}>
                <span>{label}</span>{price && <span style={{ fontWeight: 700, color: "#b86060" }}>{price}</span>}
              </div>
            ))}
          </div>
          {/* Products */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {products.map(p => (
              <ProductCard key={p.id} p={p} editMode={editMode}
                onUpdate={updProduct} onDelete={delProduct}
                onAddToCart={addToCart}
                onLightbox={(imgs, idx) => setLightbox({ images: imgs, idx })} />
            ))}
          </div>
          {editMode && <button className="add-item-btn" onClick={addProduct}>＋ Add new style</button>}
          {/* Payment settings */}
          {editMode && (
            <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1px solid #fae0e0", marginTop: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#b86060", marginBottom: 14 }}>💳 Payment Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {[["Bank name", "bank_name"], ["Account number", "bank_acc"], ["Account holder", "bank_holder"], ["TNG number", "tng_number"]].map(([lbl, key]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4 }}>{lbl}</label>
                    <input value={settings.payment[key]} onChange={e => updS(`payment.${key}`, e.target.value)} style={{ width: "100%", border: "1.5px solid #f0d0d0", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffaf8" }} />
                  </div>
                ))}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, color: "#b08080", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 6 }}>TNG QR Code</label>
                  <ImgSlot src={settings.payment.tng_qr} editMode={true} style={{ width: 140, height: 140, borderRadius: 12, border: "1px solid #fae0e0" }} onUpload={img => updS("payment.tng_qr", img)} onRemove={() => updS("payment.tng_qr", null)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ GALLERY ══ */}
      {section === "gallery" && (
        <div className="section">
          <h2 className="sec-title">Our <span>Gallery</span></h2>
          <p className="sec-sub">Real nails, real results. Tag us to be featured.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            {gallery.map(g => (
              <div key={g.id} style={{ borderRadius: 18, overflow: "hidden", position: "relative", aspectRatio: "1", border: "1px solid #fae8e8", background: g.bg, cursor: g.image && !editMode ? "zoom-in" : "default" }}
                onClick={() => g.image && !editMode && setLightbox({ images: [g.image], idx: 0 })}>
                <ImgSlot src={g.image} editMode={editMode} label={g.label} style={{ borderRadius: 18, width: "100%", height: "100%" }} onUpload={img => updGallery(g.id, "image", img)} onRemove={() => updGallery(g.id, "image", null)} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(255,250,248,.88)", padding: "7px 12px", fontSize: 12, color: "#5a3535", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {editMode ? <ET value={g.label} onChange={v => updGallery(g.id, "label", v)} /> : <span>{g.label}</span>}
                  {editMode && <button onClick={e => { e.stopPropagation(); delGalleryItem(g.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#b86060", fontSize: 14, opacity: .7 }}>✕</button>}
                </div>
              </div>
            ))}
          </div>
          {editMode && <button className="add-item-btn" style={{ marginTop: 14 }} onClick={addGalleryItem}>＋ Add gallery photo</button>}
          <div style={{ marginTop: 32, background: "linear-gradient(135deg,#fceaea,#fde8f4)", borderRadius: 20, padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📸</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: "#2a1818" }}>Show us your nails</div>
            <div style={{ fontSize: 13, color: "#8a5a5a", marginBottom: 18, lineHeight: 1.7 }}>Tag <strong>@maynails.my</strong> on Instagram or TikTok — we'd love to feature you!</div>
            <button className="btn-primary" onClick={() => setSection("contact")}>Get in touch 💅</button>
          </div>
        </div>
      )}

      {/* ══ SIZE GUIDE ══ */}
      {section === "guide" && (
        <div className="section">
          <h2 className="sec-title" style={{ marginBottom: 12 }}>
            {editMode ? <ET value={settings.guide.title} onChange={v => updS("guide.title", v)} /> : settings.guide.title}
          </h2>
          {(settings.guide.desc || editMode) && (
            <div style={{ maxWidth: 680, margin: "0 auto 36px", fontSize: 14, color: "#7a5858", lineHeight: 1.85, textAlign: "center" }}>
              {editMode ? <ET value={settings.guide.desc} onChange={v => updS("guide.desc", v)} multi placeholder="Add a description here (optional — leave blank to hide)" /> : settings.guide.desc}
            </div>
          )}
          {/* Guide images — full width, tall cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
            {(settings.guide.images || []).map((src, i) => (
              <div key={i} style={{ borderRadius: 18, overflow: "hidden", position: "relative", border: "1px solid #fae8e8", background: "#fdf6f6" }}>
                <img src={src} alt="" style={{ width: "100%", display: "block", objectFit: "cover", cursor: "zoom-in", maxHeight: 480 }} onClick={() => setLightbox({ images: settings.guide.images, idx: i })} />
                {editMode && (
                  <button onClick={() => { const next = (settings.guide.images || []).filter((_, j) => j !== i); updS("guide.images", next); }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.92)", border: "none", borderRadius: "50%", width: 26, height: 26, fontSize: 12, cursor: "pointer", color: "#b86060", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px #0002" }}>✕</button>
                )}
              </div>
            ))}
            {editMode && (
              <div style={{ borderRadius: 18, border: "1.5px dashed #e0c0c0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#fdf9f9", minHeight: 200, gap: 8, fontSize: 32 }}
                onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => updS("guide.images", [...(settings.guide.images || []), ev.target.result]); r.readAsDataURL(f); }; inp.click(); }}>
                📷<span style={{ fontSize: 13, color: "#c09090" }}>Add tutorial image</span>
              </div>
            )}
          </div>
          {(settings.guide.images || []).length === 0 && !editMode && (
            <div style={{ textAlign: "center", color: "#c09090", padding: "60px 0", fontSize: 14 }}>Size guide coming soon 🩷</div>
          )}
        </div>
      )}

      {/* ══ FAQ ══ */}
      {section === "faq" && (
        <div className="section">
          <h2 className="sec-title">Frequently Asked <span>Questions</span></h2>
          <p className="sec-sub">Everything you need to know before your first set.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {settings.faq.map((f, i) => (
              <div key={f.id} style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", border: "1px solid #fae0e0", position: "relative" }}>
                {editMode && <button onClick={() => { const next = JSON.parse(JSON.stringify(settings)); next.faq.splice(i, 1); saveSettings(next); }}
                  style={{ position: "absolute", top: 12, right: 12, background: "#ff6060cc", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2a1818", marginBottom: 7 }}>
                  {editMode ? <ET value={f.q} onChange={v => { const next = JSON.parse(JSON.stringify(settings)); next.faq[i].q = v; saveSettings(next); }} /> : f.q}
                </div>
                <div style={{ fontSize: 13, color: "#7a5858", lineHeight: 1.75 }}>
                  {editMode ? <ET value={f.a} onChange={v => { const next = JSON.parse(JSON.stringify(settings)); next.faq[i].a = v; saveSettings(next); }} multi /> : f.a}
                </div>
              </div>
            ))}
          </div>
          {editMode && (
            <button className="add-item-btn" onClick={() => { const next = JSON.parse(JSON.stringify(settings)); next.faq.push({ id: uid(), q: "New question", a: "Click to edit answer" }); saveSettings(next); }}>
              ＋ Add question
            </button>
          )}
        </div>
      )}

      {/* ══ CONTACT ══ */}
      {section === "contact" && (
        <div className="section">
          <h2 className="sec-title">Get in <span>Touch</span></h2>
          <p className="sec-sub">Order · Ask a question · Exchange — we're here for it all.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
            {[
              { icon: "📸", label: "Instagram", urlKey: "instagram", labelKey: "instagram_label" },
              { icon: "🎵", label: "TikTok", urlKey: "tiktok", labelKey: "tiktok_label" },
              { icon: "📧", label: "Email", urlKey: "email", labelKey: null },
              { icon: "🕐", label: "Hours", urlKey: null, labelKey: "hours" },
            ].map(({ icon, label, urlKey, labelKey }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #fae0e0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontSize: 11, color: "#b08080", marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {labelKey && <><div style={{ fontSize: 10, color: "#c09090" }}>Display text</div><ET value={settings.contact[labelKey]} onChange={v => updS(`contact.${labelKey}`, v)} /></>}
                    {urlKey && urlKey !== "email" && <><div style={{ fontSize: 10, color: "#c09090", marginTop: 4 }}>URL</div><ET value={settings.contact[urlKey]} onChange={v => updS(`contact.${urlKey}`, v)} /></>}
                    {urlKey === "email" && <ET value={settings.contact.email} onChange={v => updS("contact.email", v)} />}
                  </div>
                ) : (
                  urlKey && urlKey !== "email" ? <a href={settings.contact[urlKey]} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700, color: "#b86060", textDecoration: "none" }}>{settings.contact[labelKey]}</a>
                  : urlKey === "email" ? <a href={`mailto:${settings.contact.email}`} style={{ fontSize: 14, fontWeight: 700, color: "#b86060", textDecoration: "none" }}>{settings.contact.email}</a>
                  : <div style={{ fontSize: 14, fontWeight: 700, color: "#2a1818" }}>{settings.contact[labelKey]}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24, background: "#fceaea", borderRadius: 16, padding: "16px 22px", fontSize: 13, color: "#8a5858", lineHeight: 1.7 }}>
            {editMode ? <ET value={settings.contact.note} onChange={v => updS("contact.note", v)} multi /> : settings.contact.note}
          </div>
        </div>
      )}

      {/* ══ ORDERS ══ */}
      {section === "orders" && isAdmin && editMode && (
        <div className="section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 className="sec-title" style={{ textAlign: "left", marginBottom: 4 }}>📋 Orders</h2>
              <p style={{ fontSize: 13, color: "#a07070" }}>{orders.length} total · {orders.filter(o => o.status === "Pending Payment").length} pending</p>
            </div>
            {orders.length > 0 && <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => { if (confirm("Clear all orders?")) saveOrders([]); }}>Clear all</button>}
          </div>
          {orders.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#c09090", fontSize: 14, lineHeight: 2 }}>No orders yet.<br />Orders from customers appear here 🩷</div>
            : orders.map(o => (
              <div key={o.id} style={{ background: "#fff", borderRadius: 18, padding: 20, border: "1px solid #fae0e0", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#b08080", fontFamily: "monospace" }}>#{o.id.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: "#c09090" }}>{new Date(o.date).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}</div>
                  </div>
                  <span style={{ borderRadius: 12, padding: "3px 12px", fontSize: 11, fontWeight: 700, background: (statusColor[o.status] || "#888") + "22", color: statusColor[o.status] || "#888" }}>{o.status}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.customer.name}</div>
                <div style={{ fontSize: 12, color: "#8a6060" }}>📞 {o.customer.phone} · 📍 {o.customer.address}</div>
                {o.customer.size && <div style={{ fontSize: 12, color: "#8a6060" }}>💅 Size: {o.customer.size}</div>}
                {o.customer.note && <div style={{ fontSize: 12, color: "#8a6060" }}>📝 {o.customer.note}</div>}
                <div style={{ fontSize: 12, color: "#7a5858", margin: "8px 0" }}>{o.items.map(i => `${i.name} ×${i.qty}`).join("  ·  ")}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#b86060" }}>{fmt(o.grand)} · {o.payMethod === "bank" ? "🏦 Bank" : "💚 TNG"}</div>
                {o.proof && <img src={o.proof} alt="proof" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", cursor: "zoom-in", marginTop: 8 }} onClick={() => setLightbox({ images: [o.proof], idx: 0 })} />}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} style={{ border: "1.5px solid #f0d0d0", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontFamily: "inherit", background: "#fffaf8", outline: "none", cursor: "pointer" }}>
                    {["Pending Payment", "Payment Verified", "Shipped", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => { if (confirm("Delete?")) deleteOrder(o.id); }} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 13, padding: "6px 10px", borderRadius: 8 }}>🗑 Delete</button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div style={{ height: 1, background: "linear-gradient(to right,transparent,#f0d0d0,transparent)", maxWidth: 1100, margin: "0 auto" }} />
      <footer style={{ background: "#2a1818", color: "#c09090", textAlign: "center", padding: "30px 20px", fontSize: 13, lineHeight: 2.2 }}>
        <strong style={{ color: "#f0b0b0", fontStyle: "italic", fontSize: 15, letterSpacing: 2 }}>May Nails</strong><br />
        Press-on nails, shipped across Malaysia 🩷<br />
        <span style={{ fontSize: 12, opacity: 0.6 }}>© 2025 May Nails · All rights reserved</span>
      </footer>
    </div>
  );
}
