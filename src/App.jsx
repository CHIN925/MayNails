import { useState, useEffect, useRef } from "react";

// Only show admin/edit features if URL has ?admin=true
const IS_ADMIN = new URLSearchParams(window.location.search).get("admin") === "true";

// ─── helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => RM ${Number(n).toFixed(2)};

async function loadKey(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function saveKey(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── default data ────────────────────────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Creamy Moonlight", desc: "Soft milky white with a pearl shimmer — the ultimate everyday set.", price: 28, tag: "Best Seller", sizes: "XS · S · M · L · XL", image: null },
  { id: "p2", name: "Rose Velvet",       desc: "Dusty rose matte finish, velvety texture with a romantic feel.",      price: 32, tag: "New",         sizes: "XS · S · M · L · XL", image: null },
  { id: "p3", name: "Midnight Aurora",   desc: "Deep navy with aurora glitter — turns heads under every light.",      price: 35, tag: "Limited",     sizes: "XS · S · M · L · XL", image: null },
  { id: "p4", name: "Classic French",    desc: "Timeless white-tip French tips. Never goes out of style.",            price: 25, tag: "",           sizes: "XS · S · M · L · XL", image: null },
  { id: "p5", name: "Matcha Latte",      desc: "Soft sage green with a glazed finish — fresh and understated.",       price: 30, tag: "New",         sizes: "XS · S · M · L · XL", image: null },
  { id: "p6", name: "Candy Gradient",    desc: "Pink-to-orange ombre, sweet and bold — summer's favourite.",          price: 33, tag: "Limited",     sizes: "XS · S · M · L · XL", image: null },
];
const DEFAULT_GALLERY = [
  { id: "g1", image: null, label: "Creamy Moonlight", bg: "#f5f0f0" },
  { id: "g2", image: null, label: "Rose Velvet",       bg: "#fce4ec" },
  { id: "g3", image: null, label: "Midnight Aurora",   bg: "#e8eaf6" },
  { id: "g4", image: null, label: "Classic French",    bg: "#fafafa" },
  { id: "g5", image: null, label: "Matcha Latte",      bg: "#e8f5e9" },
  { id: "g6", image: null, label: "Candy Gradient",    bg: "#fff3e0" },
];
const DEFAULT_SETTINGS = {
  hero: { tagline: "Press-on Nails · Swap Anytime · Salon-perfect Every Day", subtext: "No nail tech needed — gorgeous nails in 5 minutes, at home." },
  shipping: { free_threshold: 80, standard: { label: "Pos Laju", price: 7, days: "2–4 working days" }, express: { label: "Same-day (Klang Valley)", price: 18, days: "Same day" } },
  payment: { bank_name: "Maybank", bank_acc: "1234 5678 9012", bank_holder: "May Nails", tng_number: "+60 12-345 6789", tng_qr: null },
  contact: { instagram: "https://instagram.com/maynails.my", instagram_label: "@maynails.my", whatsapp: "https://wa.me/60123456789", whatsapp_label: "+60 12-345 6789", email: "hello@maynails.my", hours: "Mon–Sun, 10am–10pm", note: "We ship within 24 hours of your order. DM us on Instagram or WhatsApp for any questions 🩷" },
  faq: [
    { id: "f1", q: "Will press-ons damage my real nails?",     a: "Not at all! Press-ons attach with adhesive tabs or nail glue — no filing, no drilling. Remove them gently and your natural nails stay intact." },
    { id: "f2", q: "How do I measure my nail size?",           a: "Use a ruler to measure the widest part of each nail in mm. Match to our size chart — every set includes extra sizes just in case." },
    { id: "f3", q: "How long do they last?",                   a: "With adhesive tabs: 3–5 days. With nail glue: up to 2 weeks. We recommend removing before sleeping to extend wear." },
    { id: "f4", q: "Can I exchange for a different size?",     a: "Yes! Unused sets can be exchanged within 7 days. Just message us first to arrange." },
  ],
};

// ─── editable tefunction ET({ value, onChange, className = "", multi = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onChange(draft); setEditing(false); };
  if (editing) return multi
    ? <textarea autoFocus className={`ei eta ${className}`} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Escape" && (setDraft(value), setEditing(false))} />
    : <input    autoFocus className={`ei ${className}`}     value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }} />;
  return <span className={`ed ${className}`} onClick={() => { setDraft(value); setEditing(true); }} title="Click to edit">{value}<span className="eico">✏️</span></span>;
}

// ─── image upload slot ───────────────────────────────────────────────────────
function ImgSlot({ src, onUpload, onRemove, style = {}, editMode, label = "" }) {
  const ref = useRef();
  const pick = () => { if (!editMode) return; ref.current.click(); };
  const onChange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onUpload(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="img-slot" style={{ ...style, cursor: editMode ? "pointer" : "default" }} onClick={pick}>
      {src ? <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
           : <div className="img-placeholder">{editMode ? <><span style={{ fontSize: 28 }}>📷</span><span style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Upload photo</span></> : <span style={{ opacity: 0.3, fontSize: 22 }}>🖼️</span>}</div>}
      {src && editMode && <button className="img-remove" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onChange} />
    </div>
  );
}

// ─── checkout modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, total, shipping, settings, onClose, onOrderPlaced }) {
  const [step, setStep] = useState(1); // 1=form, 2=payment, 3=done
  const [payMethod, setPayMethod] = useState("bank");
  const [form, setForm] = useState({ name: "", phone: "", address: "", size: "", note: "" });
  const [proof, setProof] = useState(null);
  const proofRef = useRef();
  const grand = total + shipping;

  const submitOrder = () => {
    const order = {
      id: uid(), date: new Date().toISOString(),
      customer: form, items: cart, subtotal: total,
      shipping, grand, payMethod, proof,
      status: "Pending Payment",
    };
    onOrderPlaced(order);
    setStep(3);
  };

  const uploadProof = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => setProof(ev.target.result); r.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ color: "#b86060", fontStyle: "italic" }}>{step === 3 ? "Order Placed! 🩷" : step === 2 ? "Payment" : "Your Details"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === 1 && (
          <div className="modal-body">
            <div className="order-summary-mini">
              {cart.map(i => <div key={i.id} className="osi"><span>{i.name} × {i.qty}</span><span>RM {(i.price * i.qty).toFixed(2)}</span></div>)}
              <div className="osi" style={{ borderTop: "1px dashed #f0d0d0", marginTop: 6, paddingTop: 8 }}>
                <span>Shipping</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span>
              </div>
              <div className="osi" style={{ fontWeight: 700, fontSize: 16, color: "#b86060" }}>xt ───────────────────────────────────────────────────────────
<span>Total</span><span>{fmt(grand)}</span>
              </div>
            </div>
            <div className="form-grid">
              {[["name","Full name"],["phone","Phone / WhatsApp"],["address","Delivery address"],["size","Nail size (e.g. XS/S/M)"],].map(([k, lbl]) => (
                <div key={k} className="form-field">
                  <label>{lbl}</label>
                  <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={lbl} />
                </div>
              ))}
              <div className="form-field" style={{ gridColumn: "1/-1" }}>
                <label>Special requests (optional)</label>
                <textarea className="form-input" style={{ resize: "vertical", minHeight: 60 }} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any special requests?" />
              </div>
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={!form.name⠺⠵⠟⠺⠞⠟⠞⠞⠞⠟⠞⠞⠵⠵⠟!form.address}
              onClick={() => setStep(2)}>Continue to Payment →</button>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body">
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["bank", "tng"].map(m => (
                <button key={m} className={`pay-tab ${payMethod === m ? "active" : ""}`} onClick={() => setPayMethod(m)}>
                  {m === "bank" ? "🏦 Bank Transfer" : "💚 TNG eWallet"}
                </button>
              ))}
            </div>

            {payMethod === "bank" && (
              <div className="pay-box">
                <div className="pay-title">Bank Transfer</div>
                <div className="pay-row"><span>Bank</span><strong>{settings.payment.bank_name}</strong></div>
                <div className="pay-row"><span>Account No.</span><strong>{settings.payment.bank_acc}</strong></div>
                <div className="pay-row"><span>Account Name</span><strong>{settings.payment.bank_holder}</strong></div>
                <div className="pay-row pay-amount"><span>Amount to transfer</span><strong style={{ color: "#b86060", fontSize: 20 }}>{fmt(grand)}</strong></div>
              </div>
            )}

            {payMethod === "tng" && (
              <div className="pay-box">
                <div className="pay-title">TNG eWallet</div>
                <div className="pay-row"><span>Transfer to</span><strong>{settings.payment.tng_number}</strong></div>
                <div className="pay-row pay-amount"><span>Amount</span><strong style={{ color: "#b86060", fontSize: 20 }}>{fmt(grand)}</strong></div>
                {settings.payment.tng_qr && <img src={settings.payment.tng_qr} alt="TNG QR" style={{ width: 180, height: 180, objectFit: "contain", display: "block", margin: "14px auto 0", borderRadius: 12, border: "1px solid #fae0e0" }} />}
                {!settings.payment.tng_qr && <div style={{ textAlign: "center", color: "#c09090", fontSize: 13, marginTop: 10 }}>QR code will appear here once uploaded by owner.</div>}
              </div>
            )}

            <div className="form-field" style={{ marginTop: 16 }}>
              <label>Upload payment screenshot (required)</label>
              <div className="proof-upload" onClick={() => proofRef.current.click()}>
                {proof ? <img src={proof} alt="proof" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8 }} />
                       : <><span style={{ fontSize: 28 }}>📸</span><span style={{ fontSize: 13, color: "#b08080" }}>Tap to upload screenshot</span></>}
              </div>
              <input ref={proofRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadProof} />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" style={{ flex: 2 }} disabled={!proof} onClick={submitOrder}>Confirm Order ✓</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🩷</div>
            <h3 style={{ fontSize: 20, marginBottom: 10, color: "#2a1818" }}>Thank you, {form.name}!</h3>
            <p style={{ fontSize: 14, color: "#7a5858", lineHeight: 1.8, marginBottom: 20 }}>
              Your order has been received. We'll verify your payment and confirm via WhatsApp or Instagram shortly.
            </p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main app ────────────────────────────────────────────────────────────────
export default function MayNails() {
  const [products,  setProducts]  = useState(DEFAULT_PRODUCTS);
  const [gallery,   setGallery]   = useState(DEFAULT_GALLERY);
  const [settings,  setSettings]  = useState(DEFAULT_SETTINGS);
  const [orders,    setOrders]    = useState([]);
  const [loaded,    setLoaded]    = useState(false);

  const [editMode,  setEditMode]  = useState(false);
  const [section,   setSection]   = useState("home");
  const [cart,      setCart]      = useState([]);
  const [cartOpen,  setCartOpen]  = useState(false);
  const [checkout,  setCheckout]  = useState(false);
  const [toast,     setToast]     = useState("");
  const [orderView, setOrderView] = useState(null); // order id

  // ── persist load ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [p, g, s, o] = await Promise.all([
        loadKey("mn_products"), loadKey("mn_gallery"),
        loadKey("mn_settings"), loadKey("mn_orders"),
      ]);
      if (p) setProducts(p);
      if (g) setGallery(g);
      if (s) setSettings(s);
      if (o) setOrders(o);
      setLoaded(true);
    })();
  }, []);

  const saveProducts = v => { setProducts(v); saveKey("mn_products", v); };
  const saveGallery  = v => { setGallery(v);  saveKey("mn_gallery", v); };
  const saveSettings = v => { setSettings(v); saveKey("mn_settings", v); };
  const saveOrders   = v => { setOrders(v);   saveKey("mn_orders", v); };

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  // ── settings updater ────────────────────────────────────────────────────────
  const updS = (path, val) => {
    const next = JSON.parse(JSON.stringify(settings));
    const keys = path.split("."); let cur = next;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = val;
    saveSettings(next);
  };

  // ── cart ─────────────────────────────────────────────────────────────────────
  const addToCart = p => {
    setCart(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]; });
    showToast(`Added: ${p.name} 🛒`);
  };
  const removeFromCart = id => setCart(prev => prev.filter(i => i.id !== id));
  const adjustQty = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingFee = cartTotal >= settings.shipping.free_threshold ? 0 : settings.shipping.standard.price;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── orders ────────────────────────────────────────────────────────────────────
  const placeOrder = order => { const next = [order, ...orders]; saveOrders(next); setCart([]); };
  const updateOrderStatus = (id, status) => { const next = orders.map(o => o.id === id ? { ...o, status } : o); saveOrders(next); };
  const deleteOrder = id => { const next = orders.filter(o => o.id !== id); saveOrders(next); };

  // ── products ─────────────────────────────────────────────────────────────────
  const updProduct = (id, key, val) => saveProducts(products.map(p => p.id === id ? { ...p, [key]: val } : p));
  const addProduct = () => saveProducts([...products, { id: uid(), name: "New Style", desc: "Click to edit", price: 30, tag: "", sizes: "XS · S · M · L · XL", image: null }]);
  const delProduct = id => saveProducts(products.filter(p => p.id !== id));

  // ── gallery ──────────────────────────────────────────────────────────────────
  const updGallery = (id, key, val) => saveGallery(gallery.map(g => g.id === id ? { ...g, [key]: val } : g));
  const addGalleryItem = () => saveGallery([...gallery, { id: uid(), image: null, label: "New photo", bg: "#fce4ec" }]);
  const delGalleryItem = id => saveGallery(gallery.filter(g => g.id !== id));

  const navItems = [
    { key: "home", label: "Home" }, { key: "shop", label: "Shop" },
    { key: "gallery", label: "Gallery" }, { key: "faq", label: "FAQ" },
    { key: "contact", label: "Contact" },
    ...(editMode ? [{ key: "orders", label: "📋 Orders" }] : []),
  ];

  const statusColor = { "Pending Payment": "#f59e0b", "Payment Verified": "#10b981", "Shipped": "#6366f1", "Completed": "#b86060", "Cancelled": "#ef4444" };

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif", color: "#b86060", fontSize: 18 }}>Loading May Nails…</div>;

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#fffaf8", minHeight: "100vh", color: "#2a1818" }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* NAV */
        .nav{position:sticky;top:0;z-index:100;background:rgba(255,250,248,.96);backdrop-filter:blur(10px);border-bottom:1px solid #f0ddd8;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:62px;gap:12px}
        .nav-logo{font-size:20px;font-weight:700;letter-spacing:3px;color:#b86060;font-style:italic;text-transform:uppercase;white-space:nowrap}
        .nav-links{display:flex;gap:2px;flex-wrap:wrap}
        .nav-btn{background:none;border:none;cursor:pointer;padding:6px 11px;border-radius:20px;font-size:12px;color:#4a2a2a;letter-spacing:.3px;transition:background .18s,color .18s;font-family:inherit;white-space:nowrap}
        .nav-btn:hover,.nav-btn.active{background:#fceaea;color:#b86060}
        .nav-right{display:flex;gap:8px;align-items:center;flex-shrink:0}
        .edit-toggle{background:${editMode?"#b86060":"transparent"};border:1.5px solid #b86060;color:${editMode?"#fff":"#b86060"};border-radius:20px;padding:5px 13px;font-size:12px;cursor:pointer;transition:all .18s;font-family:inherit;white-space:nowrap}
        .edit-toggle:hover{background:#b86060;color:#fff}
        .cart-btn{position:relative;background:#b86060;border:none;color:#fff;border-radius:20px;padding:6px 16px;font-size:12px;cursor:pointer;font-family:inherit;transition:opacity .15s;white-space:nowrap}
        .cart-btn:hover{opacity:.88}
        .cart-badge{position:absolute;top:-5px;right:-5px;background:#2a1818;color:#fff;border-radius:50%;width:19px;height:19px;font-size:10px;display:flex;align-items:center;justify-content:center}

        /* HERO */
        .hero{padding:80px 24px 64px;text-align:center;background:linear-gradient(150deg,#fff6f6 0%,#fdeaf4 55%,#fff2ec 100%)}
        .hero-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#b86060;margin-bottom:18px;opacity:.8}
        .hero-title{font-size:clamp(40px,9vw,82px);font-weight:700;color:#2a1818;letter-spacing:-2px;line-height:1.05;margin-bottom:20px;font-style:italic}
        .hero-title span{color:#b86060}
        .hero-tag{font-size:clamp(14px,2.5vw,17px);color:#7a5050;margin-bottom:10px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.6}
        .hero-sub{font-size:13px;color:#b09090;margin-bottom:36px}
        .hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

        /* BUTTONS */
        .
        btn-primary{background:#b86060;color:#fff;border:none;border-radius:30px;padding:12px 28px;font-size:14px;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 18px #b8606040;font-family:inherit;letter-spacing:.3px}
        .btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px #b8606055}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .btn-outline{background:transparent;color:#b86060;border:1.5px solid #b86060;border-radius:30px;padding:11px 24px;font-size:14px;cursor:pointer;transition:all .15s;font-family:inherit;letter-spacing:.3px}
        .btn-outline:hover{background:#fceaea}

        /* SECTION */
        .section{max-width:1100px;margin:0 auto;padding:60px 20px}
        .sec-title{font-size:28px;font-weight:700;color:#2a1818;text-align:center;margin-bottom:8px;letter-spacing:-.5px;font-style:italic}
        .sec-title span{color:#b86060}
        .sec-sub{text-align:center;color:#a07070;font-size:14px;margin-bottom:40px;line-height:1.6}

        /* FEATURES */
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
        .feat-card{background:#fff;border-radius:18px;padding:24px 18px;border:1px solid #f5e0e0;text-align:center}
        .feat-icon{font-size:32px;margin-bottom:10px}
        .feat-t{font-weight:700;font-size:14px;color:#2a1818;margin-bottom:5px}
        .feat-d{font-size:12px;color:#8a6060;line-height:1.6}

        /* SHIPPING BOX */
        .ship-box{background:linear-gradient(135deg,#fff8f8,#fce8e8);border-radius:20px;padding:24px 28px;border:1px solid #f5d0d0;margin-bottom:40px}
        .ship-title{font-size:15px;font-weight:700;color:#b86060;margin-bottom:14px}
        .ship-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed #f0c0c0;font-size:13px;color:#5a3535}
        .ship-row:last-child{border-bottom:none}
        .ship-price{font-weight:700;color:#b86060}
        .free-badge{background:#b86060;color:#fff;border-radius:10px;font-size:10px;padding:2px 8px;margin-left:6px}

        /* PRODUCTS */
        .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
        .prod-card{background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 2px 20px #f0c0c018;border:1px solid #fae8e8;transition:transform .2s,box-shadow .2s;position:relative}
        .prod-card:hover{transform:translateY(-4px);box-shadow:0 10px 36px #f0c0c035}
        .prod-img-wrap{width:100%;height:200px;overflow:hidden;background:#fdf6f6;position:relative}
        .prod-body{padding:18px 20px 20px}
        .prod-tag{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.92);color:#b86060;font-size:10px;padding:3px 10px;border-radius:10px;font-weight:600;letter-spacing:.5px;z-index:2}
        .prod-name{font-size:16px;font-weight:700;color:#2a1818;margin-bottom:6px}
        .prod-desc{font-size:12px;color:#8a6a6a;margin-bottom:10px;line-height:1.65}
        .prod-sizes{font-size:11px;color:#c09090;margin-bottom:14px}
        .prod-foot{display:flex;align-items:center;justify-content:space-between}
        .prod-price{font-size:20px;font-weight:700;color:#b86060}
        .prod-price::before{content:"RM ";font-size:12px;font-weight:600}
        .add-btn{background:#b86060;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}
        .add-btn:hover{transform:scale(1.15)}
        .del-btn{position:absolute;top:10px;left:10px;background:#ff6060cc;color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3}
        .add-item-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#fceaea;border:1.5px dashed #b86060;color:#b86060;border-radius:20px;padding:10px 20px;font-size:13px;cursor:pointer;margin-top:14px;transition:background .15s;font-family:inherit;width:100%}
        .
        add-item-btn:hover{background:#f8d8d8}

        /* IMAGE SLOT */
        .img-slot{width:100%;height:100%;position:relative;border-radius:inherit;overflow:hidden}
        .img-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fdf6f6;gap:4px}
        .img-remove{position:absolute;top:6px;right:6px;background:rgba(255,255,255,.9);border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b86060;box-shadow:0 1px 4px #0002;z-index:4}

        /* GALLERY */
        .gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
        .gal-item{border-radius:18px;overflow:hidden;position:relative;aspect-ratio:1;border:1px solid #fae8e8}
        .gal-label-bar{position:absolute;bottom:0;left:0;right:0;background:rgba(255,250,248,.88);padding:6px 10px;font-size:12px;color:#5a3535;display:flex;align-items:center;justify-content:space-between}
        .gal-del{background:none;border:none;cursor:pointer;color:#b86060;font-size:14px;opacity:.7}
        .gal-del:hover{opacity:1}

        /* FAQ */
        .faq-list{display:flex;flex-direction:column;gap:12px}
        .faq-item{background:#fff;border-radius:18px;padding:20px 24px;border:1px solid #fae0e0;position:relative}
        .faq-q{font-size:14px;font-weight:700;color:#2a1818;margin-bottom:7px}
        .faq-a{font-size:13px;color:#7a5858;line-height:1.75}

        /* CONTACT */
        .con-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
        .con-card{background:#fff;border-radius:20px;padding:24px;border:1px solid #fae0e0;text-align:center;transition:box-shadow .2s}
        .con-card a{text-decoration:none}
        .con-card:hover{box-shadow:0 4px 20px #f0c0c030}
        .con-icon{font-size:32px;margin-bottom:10px}
        .con-lbl{font-size:11px;color:#b08080;margin-bottom:4px;letter-spacing:1px;text-transform:uppercase}
        .con-val{font-size:14px;font-weight:700;color:#2a1818;word-break:break-all}
        .con-val-link{font-size:14px;font-weight:700;color:#b86060;word-break:break-all}
        .con-note{text-align:center;margin-top:24px;background:#fceaea;border-radius:16px;padding:16px 22px;font-size:13px;color:#8a5858;line-height:1.7}

        /* PAYMENT SETTINGS (edit mode) */
        .pay-settings{background:#fff;border-radius:18px;padding:24px;border:1px solid #fae0e0;margin-top:24px}
        .pay-set-title{font-size:14px;font-weight:700;color:#b86060;margin-bottom:14px}
        .pay-fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
        .pay-field label{font-size:11px;color:#b08080;letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:4px}
        .pay-field input{width:100%;border:1.5px solid #f0d0d0;border-radius:8px;padding:7px 10px;font-size:13px;font-family:inherit;color:#2a1818;outline:none;background:#fffaf8}
        .pay-field input:focus{border-color:#b86060}

        /* CHECKOUT MODAL */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:#fffaf8;border-radius:24px;width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden}
        .modal-header{padding:20px 24px;border-bottom:1px solid #fae0e0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
        .modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:#b86060}
        .modal-body{padding:20px 24px;overflow-y:auto}
        .order-summary-mini{background:#fdf6f6;border-radius:14px;padding:14px;margin-bottom:18px;display:flex;flex-direction:column;gap:5px}
        .osi{display:flex;justify-content:space-between;font-size:13px;color:#5a3535}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .form-field{display:flex;flex-direction:column;gap:4px}
        .
        form-field label{font-size:11px;color:#b08080;letter-spacing:.5px;text-transform:uppercase}
        .form-input{border:1.5px solid #f0d0d0;border-radius:10px;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;background:#fff}
        .form-input:focus{border-color:#b86060}
        .pay-tab{flex:1;padding:10px;border-radius:12px;border:1.5px solid #f0d0d0;background:#fff;cursor:pointer;font-family:inherit;font-size:13px;color:#5a3535;transition:all .15s}
        .pay-tab.active{background:#fceaea;border-color:#b86060;color:#b86060;font-weight:700}
        .pay-box{background:#fdf6f6;border-radius:14px;padding:18px;border:1px solid #f5d0d0}
        .pay-title{font-size:13px;font-weight:700;color:#b86060;margin-bottom:12px;letter-spacing:.5px}
        .pay-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#5a3535;padding:6px 0;border-bottom:1px dashed #f0d0d0}
        .pay-row:last-child{border-bottom:none}
        .pay-amount{margin-top:4px}
        .proof-upload{border:2px dashed #e0c0c0;border-radius:14px;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;min-height:100px;background:#fffaf8;transition:border-color .15s}
        .proof-upload:hover{border-color:#b86060}

        /* CART DRAWER */
        .cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:200}
        .cart-drawer{position:fixed;right:0;top:0;bottom:0;width:min(390px,100vw);background:#fffaf8;z-index:201;display:flex;flex-direction:column;box-shadow:-4px 0 40px #b8606025}
        .cart-header{padding:20px 24px;border-bottom:1px solid #fae0e0;display:flex;justify-content:space-between;align-items:center}
        .cart-header h2{font-size:17px;color:#b86060;font-style:italic}
        .cart-close{background:none;border:none;font-size:20px;cursor:pointer;color:#b86060}
        .cart-items{flex:1;overflow-y:auto;padding:16px 24px;display:flex;flex-direction:column;gap:10px}
        .cart-item{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:10px 14px;border:1px solid #fae8e8}
        .cart-thumb{width:48px;height:48px;border-radius:10px;object-fit:cover;background:#fdf6f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px}
        .cart-info{flex:1;min-width:0}
        .cart-iname{font-size:13px;font-weight:700;color:#2a1818;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cart-iprice{font-size:12px;color:#b86060;font-weight:700}
        .qty-ctrl{display:flex;align-items:center;gap:6px}
        .qty-btn{background:#fceaea;border:none;border-radius:50%;width:24px;height:24px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b86060;flex-shrink:0}
        .qty-val{font-size:13px;font-weight:700;min-width:18px;text-align:center}
        .cart-rm{background:none;border:none;color:#ccc;cursor:pointer;font-size:15px;transition:color .15s;flex-shrink:0}
        .cart-rm:hover{color:#b86060}
        .cart-footer{padding:18px 24px;border-top:1px solid #fae0e0}
        .cart-sum{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
        .cart-sum-row{display:flex;justify-content:space-between;font-size:13px;color:#7a5858}
        .cart-tot{display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#2a1818;padding-top:8px;border-top:1px dashed #fae0e0;margin-top:6px}
        .checkout-btn{width:100%;background:#b86060;color:#fff;border:none;border-radius:30px;padding:14px;font-size:15px;cursor:pointer;font-family:inherit;transition:transform .15s}
        .checkout-btn:hover{transform:translateY(-1px)}
        .cart-empty{text-align:center;color:#c09090;padding:48px 20px;font-size:13px;line-height:2.2}

        /* ORDERS */
        .orders-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px}
        .order-cards{display:flex;flex-direction:column;gap:14px}
        .
        order-card{background:#fff;border-radius:18px;padding:20px;border:1px solid #fae0e0;position:relative}
        .order-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px}
        .order-id{font-size:12px;color:#b08080;font-family:monospace}
        .order-date{font-size:11px;color:#c09090}
        .status-badge{border-radius:12px;padding:3px 12px;font-size:11px;font-weight:700;letter-spacing:.5px}
        .order-cust{font-size:14px;font-weight:700;color:#2a1818;margin-bottom:2px}
        .order-phone{font-size:12px;color:#8a6060}
        .order-items{font-size:12px;color:#7a5858;margin:8px 0;line-height:1.7}
        .order-grand{font-size:16px;font-weight:700;color:#b86060;margin-top:6px}
        .order-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
        .status-sel{border:1.5px solid #f0d0d0;border-radius:10px;padding:6px 10px;font-size:12px;font-family:inherit;color:#5a3535;background:#fffaf8;cursor:pointer;outline:none}
        .status-sel:focus{border-color:#b86060}
        .proof-thumb{width:80px;height:80px;border-radius:10px;object-fit:cover;border:1px solid #fae0e0;cursor:pointer;margin-top:8px}
        .order-del{background:none;border:none;color:#ccc;cursor:pointer;font-size:13px;transition:color .15s;padding:6px 10px;border-radius:8px}
        .order-del:hover{color:#ef4444;background:#fff0f0}
        .empty-orders{text-align:center;padding:60px 20px;color:#c09090;font-size:14px;line-height:2}

        /* EDITABLE */
        .ed{cursor:pointer;border-radius:4px;transition:background .15s;display:inline}
        .ed:hover{background:#fceaea}
        .eico{font-size:9px;margin-left:3px;opacity:.4}
        .ei{border:1.5px solid #b86060;border-radius:6px;padding:2px 7px;font-size:inherit;font-family:inherit;color:inherit;background:#fff9f9;outline:none;min-width:60px}
        .eta{border:1.5px solid #b86060;border-radius:6px;padding:4px 8px;font-size:inherit;font-family:inherit;color:inherit;background:#fff9f9;outline:none;width:100%;resize:vertical;min-height:54px}

        /* TOAST */
        .toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#2a1818;color:#fff;border-radius:30px;padding:10px 24px;font-size:13px;z-index:500;animation:fu .3s ease;pointer-events:none;white-space:nowrap}
        @keyframes fu{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

        /* DIVIDER / FOOTER */
        .divider{height:1px;background:linear-gradient(to right,transparent,#f0d0d0,transparent);max-width:1100px;margin:0 auto}
        .footer{background:#2a1818;color:#c09090;text-align:center;padding:30px 20px;font-size:13px;line-height:2.2;letter-spacing:.3px}
        .footer strong{color:#f0b0b0;font-style:italic;font-size:15px;letter-spacing:2px}

        @media(max-width:600px){
          .nav{padding:0 12px}.nav-logo{font-size:16px}.nav-links .nav-btn{padding:5px 7px;font-size:11px}
          .hero{padding:52px 14px 42px}.section{padding:44px 14px}
          .form-grid{grid-template-columns:1fr}
          .form-field:last-child{grid-column:auto}
        }
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
          {IS_ADMIN && <button className="edit-toggle" onClick={() => { setEditMode(m => !m); if (section === "orders" && editMode) setSection("home"); }}>
            {editMode ? "✅ Done" : "✏️ Edit"}</button>}
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {toast && <div className="toast">{toast}</div>}

      {/* CART */}
      {cartOpen && <>
        <div className="cart-overlay" onClick={() => setCartOpen(false)} />
        <div className="cart-drawer">
          <div className="cart-header">
            <h2>Your Cart 🛒</h2>
            <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
          </div>
          <div className="cart-items">
            {cart.length === 0
              ? <div className="cart-empty">Your cart is empty.<br />Browse our collection and pick something you love 💅</div>
              : cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-thumb">
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} /> : "💅"}
                  </div>
                  <div className="cart-info">
                    <div className="cart-iname">{item.name}</div>
                    <div className="cart-iprice">{fmt(item.price)}</div>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => adjustQty(item.id, -1)}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => adjustQty(item.id, 1)}>+</button>
                  </div>
                  <button className="cart-rm" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
          </div>
          {cart.length > 0 && (
            <div className="cart-footer">
              <div className="cart-sum">
                <div className="cart-sum-row"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
                <div className="cart-sum-row">
                  <span>Shipping ({settings.shipping.standard.label})</span>
                  <span>{shippingFee === 0 ? <span style={{ color: "#b86060" }}>Free</span> : fmt(shippingFee)}</span>
                </div>
                {cartTotal < settings.shipping.free_threshold && (
                  <div className="cart-sum-row" style={{ fontSize: 11, color: "#c09090" }}>
                    Add {fmt(settings.shipping.free_threshold - cartTotal)} more for free shipping 🎉
                  </div>
                )}
                <div className="cart-tot"><span>Total</span><span style={{ color: "#b86060" }}>{fmt(cartTotal + shippingFee)}</span></div>
              </div>
              <button className="checkout-btn" onClick={() => { setCartOpen(false); setCheckout(true); }}>Checkout →</button>
            </div>
          )}
        </div>
      </>}

      {/* CHECKOUT */}
      {checkout && (
        <CheckoutModal
          cart={cart} total={cartTotal} shipping={shippingFee} settings={settings}
          onClose={() => setCheckout(false)}
          onOrderPlaced={order => { placeOrder(order); setCheckout(false); showToast("Order placed! 🩷"); }}
        />
      )}

      {/* ══ HOME ══ */}
      {section === "home" && <>
        <div className="hero">
          <p className="hero-eyebrow">Press-on Nails · Malaysia</p>
          <h1 className="hero-title">May <span>Nails</span></h1>
          <p className="hero-tag">{editMode ? <ET value={settings.hero.tagline} onChange={v => updS("hero.tagline", v)} /> : settings.hero.tagline}</p>
          <p className="hero-sub">{editMode ? <ET value={settings.hero.subtext} onChange={v => updS("hero.subtext", v)} /> : settings.hero.subtext}</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => setSection("shop")}>Shop Now 💅</button>
            <button className="btn-outline" onClick={() => setSection("gallery")}>View Gallery 🌸</button>
          </div>
        </div>
        <div className="section">
          <h2 className="sec-title">Why <span>press-ons?</span></h2>
          <p className="sec-sub">Everything you love about a nail salon — without the appointment.</p>
          <div className="feat-grid">
            {[["⏱️","5-minute application","No waiting, no drying time — just press and go."],["🌿","Zero nail damage","No filing or drilling. Your natural nails stay healthy."],["🎨","New styles weekly","Fresh designs dropped regularly — always something new."],["📦","Ships within 24 hrs","Order today, on its way tomorrow."]].map(([i,t,d]) => (
              <div key={t} className="feat-card"><div className="feat-icon">{i}</div><div className="feat-t">{t}</div><div className="feat-d">{d}</div></div>
            ))}
          </div>
        </div>
      </>}

      {/* ══ SHOP ══ */}
      {section === "shop" && (
        <div className="section">
          <h2 className="sec-title">Our <span>Collection</span></h2>
          <p className="sec-sub">Each set includes 10 nails (thumb to pinky) + spare sizes.</p>

          <div className="ship-box">
            <div className="ship-title">📦 Shipping</div>
            <div className="ship-row">
              <span>Free shipping on orders over RM {editMode ? <ET value={String(settings.shipping.free_threshold)} onChange={v => updS("shipping.free_threshold", Number(v))} /> : settings.shipping.free_threshold}<span className="free-badge">FREE</span></span>
            </div>
            <div className="ship-row">
              <span>{editMode ? <ET value={settings.shipping.standard.label} onChange={v => updS("shipping.standard.label", v)} /> : settings.shipping.standard.label} ({editMode ? <ET value={settings.shipping.standard.days} onChange={v => updS("shipping.standard.days", v)} /> : settings.shipping.standard.days})</span>
              <span className="ship-price">RM {editMode ? <ET value={String(settings.shipping.standard.price)} onChange={v => updS("shipping.standard.price", Number(v))} /> : settings.shipping.standard.price}</span>
            </div>
            <div className="ship-row">
              <span>{editMode ? <ET value={settings.shipping.express.label} onChange={v => updS("shipping.express.label", v)} /> : settings.shipping.express.label} ({editMode ? <ET value={settings.shipping.express.days} onChange={v => updS("shipping.express.days", v)} /> : settings.shipping.express.days})</span>
              <span className="ship-price">RM {editMode ? <ET value={String(settings.shipping.express.price)} onChange={v => updS("shipping.express.price", Number(v))} /> : settings.shipping.express.price}</span>
            </div>
          </div>

          <div className="prod-grid">
            {products.map(p => (
              <div key={p.id} className="prod-card">
                {editMode && <button className="del-btn" onClick={() => delProduct(p.id)}>✕</button>}
                {p.tag && <div className="prod-tag">{p.tag}</div>}
                <div className="prod-img-wrap">
                  <ImgSlot src={p.image} editMode={editMode} label={p.name}
                    onUpload={img => updProduct(p.id, "image", img)}
                    onRemove={() => updProduct(p.id, "image", null)} />
                </div>
                <div className="prod-body">
                  <div className="prod-name">{editMode ? <ET value={p.name} onChange={v => updProduct(p.id, "name", v)} /> : p.name}</div>
                  <div className="prod-desc">{editMode ? <ET value={p.desc} onChange={v => updProduct(p.id, "desc", v)} multi /> : p.desc}</div>
                  <div className="prod-sizes">Sizes: {editMode ? <ET value={p.sizes} onChange={v => updProduct(p.id, "sizes", v)} /> : p.sizes}</div>
                  <div className="prod-foot">
                    <div className="prod-price">{editMode ? <ET value={String(p.price)} onChange={v => updProduct(p.id, "price", Number(v))} /> : p.price}</div>
                    <button className="add-btn" onClick={() => addToCart(p)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {editMode && <button className="add-item-btn" onClick={addProduct}>＋ Add new style</button>}

          {/* Payment settings (edit mode only) */}
          {editMode && (
          <div className="pay-settings">
              <div className="pay-set-title">💳 Payment Details (visible to customers at checkout)</div>
              <div className="pay-fields">
                {[["Bank name","payment.bank_name"],["Account number","payment.bank_acc"],["Account holder","payment.bank_holder"],["TNG number","payment.tng_number"]].map(([lbl, key]) => (
                  <div key={key} className="pay-field">
                    <label>{lbl}</label>
                    <input value={settings.payment[key.split(".")[1]]} onChange={e => updS(key, e.target.value)} />
                  </div>
                ))}
                <div className="pay-field" style={{ gridColumn: "1/-1" }}>
                  <label>TNG QR Code image</label>
                  <div style={{ marginTop: 6 }}>
                    <ImgSlot src={settings.payment.tng_qr} editMode={true} label="TNG QR"
                      style={{ width: 140, height: 140, borderRadius: 12, border: "1px solid #fae0e0" }}
                      onUpload={img => updS("payment.tng_qr", img)}
                      onRemove={() => updS("payment.tng_qr", null)} />
                  </div>
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
          <div className="gal-grid">
            {gallery.map(g => (
              <div key={g.id} className="gal-item" style={{ background: g.bg }}>
                <ImgSlot src={g.image} editMode={editMode} label={g.label}
                  style={{ borderRadius: 18 }}
                  onUpload={img => updGallery(g.id, "image", img)}
                  onRemove={() => updGallery(g.id, "image", null)} />
                <div className="gal-label-bar">
                  {editMode ? <ET value={g.label} onChange={v => updGallery(g.id, "label", v)} /> : <span>{g.label}</span>}
                  {editMode && <button className="gal-del" onClick={() => delGalleryItem(g.id)}>✕</button>}
                </div>
              </div>
            ))}
          </div>
          {editMode && <button className="add-item-btn" style={{ marginTop: 14 }} onClick={addGalleryItem}>＋ Add gallery photo</button>}
          <div style={{ marginTop: 32, background: "linear-gradient(135deg,#fceaea,#fde8f4)", borderRadius: 20, padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📸</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: "#2a1818" }}>Show us your nails</div>
            <div style={{ fontSize: 13, color: "#8a5a5a", marginBottom: 18, lineHeight: 1.7 }}>Tag <strong>@maynails.my</strong> on Instagram or send us your photo — we'd love to feature you!</div>
            <button className="btn-primary" onClick={() => setSection("contact")}>Get in touch 💅</button>
          </div>
        </div>
      )}

      {/* ══ FAQ ══ */}
      {section === "faq" && (
        <div className="section">
          <h2 className="sec-title">Frequently Asked <span>Questions</span></h2>
          <p className="sec-sub">Everything you need to know before your first set.</p>
          <div className="faq-list">
            {settings.faq.map((f, i) => (
              <div key={f.id} className="faq-item">
                {editMode && <button style={{ position: "absolute", top: 12, right: 12, background: "#ff6060cc", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => { const next = JSON.parse(JSON.stringify(settings)); next.faq.splice(i, 1); saveSettings(next); }}>✕</button>}
                <div className="faq-q">{editMode ? <ET value={f.q} onChange={v => { const next = JSON.parse(JSON.stringify(settings)); next.faq[i].
                q = v; saveSettings(next); }} /> : f.q}</div>
                <div className="faq-a">{editMode ? <ET value={f.a} onChange={v => { const next = JSON.parse(JSON.stringify(settings)); next.faq[i].a = v; saveSettings(next); }} multi /> : f.a}</div>
              </div>
            ))}
          </div>
          {editMode && <button className="add-item-btn" onClick={() => { const next = JSON.parse(JSON.stringify(settings)); next.faq.push({ id: uid(), q: "New question", a: "Click to edit" }); saveSettings(next); }}>＋ Add question</button>}
        </div>
      )}

      {/* ══ CONTACT ══ */}
      {section === "contact" && (
        <div className="section">
          <h2 className="sec-title">Get in <span>Touch</span></h2>
          <p className="sec-sub">Order · Ask a question · Exchange — we're here for it all.</p>
          <div className="con-grid">
            {/* Instagram */}
            <div className="con-card">
              <div className="con-icon">📸</div>
              <div className="con-lbl">Instagram</div>
              {editMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, color: "#c09090" }}>Label</div>
                  <ET value={settings.contact.instagram_label} onChange={v => updS("contact.instagram_label", v)} />
                  <div style={{ fontSize: 11, color: "#c09090", marginTop: 4 }}>URL</div>
                  <ET value={settings.contact.instagram} onChange={v => updS("contact.instagram", v)} />
                </div>
              ) : (
                <a href={settings.contact.instagram} target="_blank" rel="noreferrer" className="con-val-link">{settings.contact.instagram_label}</a>
              )}
            </div>
            {/* WhatsApp */}
            <div className="con-card">
              <div className="con-icon">💬</div>
              <div className="con-lbl">WhatsApp</div>
              {editMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 11, color: "#c09090" }}>Label</div>
                  <ET value={settings.contact.whatsapp_label} onChange={v => updS("contact.whatsapp_label", v)} />
                  <div style={{ fontSize: 11, color: "#c09090", marginTop: 4 }}>URL (wa.me link)</div>
                  <ET value={settings.contact.whatsapp} onChange={v => updS("contact.whatsapp", v)} />
                </div>
              ) : (
                <a href={settings.contact.whatsapp} target="_blank" rel="noreferrer" className="con-val-link">{settings.contact.whatsapp_label}</a>
              )}
            </div>
            {/* Email */}
            <div className="con-card">
              <div className="con-icon">📧</div>
              <div className="con-lbl">Email</div>
              {editMode
                ? <ET value={settings.contact.email} onChange={v => updS("contact.email", v)} />
                : <a href={`mailto:${settings.contact.email}`} className="con-val-link">{settings.contact.email}</a>}
            </div>
            {/* Hours */}
            <div className="con-card">
              <div className="con-icon">🕐</div>
              <div className="con-lbl">Hours</div>
              <div className="con-val">{editMode ? <ET value={settings.contact.hours} onChange={v => updS("contact.hours", v)} /> : settings.contact.hours}</div>
            </div>
          </div>
          <div className="con-note">
            {editMode ? <ET value={settings.contact.note} onChange={v => updS("contact.note", v)} multi /> : settings.contact.note}
          </div>
        </div>
      )}

      {/* ══ ORDERS (owner dashboard) ══ */}
      {section === "orders" && editMode && (
        <div className="section">
          <div className="orders-header">
            <div>
              <h2 className="sec-title" style={{ textAlign: "left", marginBottom: 4 }}>📋 Orders</h2>
              <p style={{ fontSize: 13, color: "#a07070" }}>{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
              </div>
            {orders.length > 0 && (
              <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => { if (confirm("Clear all orders?")) saveOrders([]); }}>Clear all</button>
            )}
          </div>
          {orders.length === 0
            ? <div className="empty-orders">No orders yet.<br />When customers checkout, their orders appear here 🩷</div>
            : <div className="order-cards">
                {orders.map(o => (
                  <div key={o.id} className="order-card">
                    <div className="order-top">
                      <div>
                        <div className="order-id">#{o.id.toUpperCase()}</div>
                        <div className="order-date">{new Date(o.date).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}</div>
                      </div>
                      <span className="status-badge" style={{ background: (statusColor[o.status]⠺⠵⠺⠵⠟⠞⠵⠵⠵⠺⠞⠞⠞⠺⠞⠵⠟⠞⠞⠵⠵⠞⠞⠺⠺⠞⠵⠟⠵⠟⠞⠵⠺⠺⠵⠞⠟⠺⠟⠟⠵⠞⠵⠺⠞⠵⠞⠞"#888" }}>{o.status}</span>
                    </div>
                    <div className="order-cust">{o.customer.name}</div>
                    <div className="order-phone">📞 {o.customer.phone}</div>
                    <div style={{ fontSize: 12, color: "#8a6060", marginTop: 2 }}>📍 {o.customer.address}</div>
                    {o.customer.size && <div style={{ fontSize: 12, color: "#8a6060" }}>💅 Size: {o.customer.size}</div>}
                    {o.customer.note && <div style={{ fontSize: 12, color: "#8a6060" }}>📝 {o.customer.note}</div>}
                    <div className="order-items">
                      {o.items.map(i => <span key={i.id} style={{ marginRight: 12 }}>{i.name} ×{i.qty}</span>)}
                    </div>
                    <div className="order-grand">{fmt(o.grand)} · {o.payMethod === "bank" ? "🏦 Bank Transfer" : "💚 TNG eWallet"}</div>
                    {o.proof && <img src={o.proof} alt="Payment proof" className="proof-thumb" onClick={() => window.open(o.proof)} />}
                    <div className="order-actions">
                      <select className="status-sel" value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                        {["Pending Payment","Payment Verified","Shipped","Completed","Cancelled"].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button className="order-del" onClick={() => { if (confirm("Delete this order?")) deleteOrder(o.id); }}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      <div className="divider" />
      <footer className="footer">
        <strong>May Nails</strong><br />
        Press-on nails, shipped across Malaysia 🩷<br />
        <span style={{ fontSize: 12, opacity: 0.6 }}>© 2025 May Nails · All rights reserved</span>
      </footer>
    </div>
  );
}

