import { useState, useEffect, useMemo } from "react";

const FIREBASE_URL = "https://agua-2026-default-rtdb.firebaseio.com";

// ─── helpers ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const toDate = (s) => new Date(s + "T00:00:00");
const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const addDays = (s, n) => {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};
const daysFromToday = (s) => {
  if (!s) return null;
  return diffDays(today(), s);
};
const BRANDS = ["Fresh", "Vital", "Spring", "San Luis", "Otra"];
const PAYMENTS = ["Efectivo", "Yape", "Plin", "Transferencia", "Crédito"];

const BRAND_COLOR = {
  Fresh: "#0ea5e9",
  Vital: "#10b981",
  Spring: "#8b5cf6",
  "San Luis": "#f59e0b",
  Otra: "#6b7280",
};

// ─── firebase ────────────────────────────────────────────────────────────────
async function fbGet(path) {
  const r = await fetch(`${FIREBASE_URL}/${path}.json`);
  return r.ok ? r.json() : null;
}
async function fbSet(path, data) {
  await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
async function fbPush(path, data) {
  const r = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return r.ok ? (await r.json()).name : null;
}
async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}/${path}.json`, { method: "DELETE" });
}

// ─── modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: "#e2e8f0" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── input helpers ───────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #1e293b",
  background: "#1e293b",
  color: "#e2e8f0",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
};
const labelStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".04em",
};
const btnPrimary = {
  background: "#38bdf8",
  color: "#0f172a",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
const btnDanger = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
const btnGhost = {
  background: "transparent",
  color: "#64748b",
  border: "1px solid #1e293b",
  borderRadius: 8,
  padding: "8px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─── pronóstico ──────────────────────────────────────────────────────────────
function calcForecast(orders) {
  // orders: array of {date, qty}
  if (orders.length < 2) return null;
  const sorted = [...orders].sort((a, b) => a.date.localeCompare(b.date));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(diffDays(sorted[i - 1].date, sorted[i].date));
  }
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  const last = sorted[sorted.length - 1].date;
  return { avg, next: addDays(last, avg), last };
}

// ─── badge urgencia ──────────────────────────────────────────────────────────
function UrgencyBadge({ nextDate, manualDate }) {
  const target = manualDate || nextDate;
  if (!target) return null;
  const d = daysFromToday(target);
  let color, text;
  if (d < 0) {
    color = "#ef4444";
    text = `Hace ${Math.abs(d)}d`;
  } else if (d === 0) {
    color = "#f59e0b";
    text = "Hoy";
  } else if (d <= 2) {
    color = "#f59e0b";
    text = `En ${d}d`;
  } else {
    color = "#10b981";
    text = `En ${d}d`;
  }
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 20,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("clientes");
  const [clients, setClients] = useState({});
  const [orders, setOrders] = useState({});
  const [envases, setEnvases] = useState({});
  const [loading, setLoading] = useState(true);

  // modal state
  const [clientModal, setClientModal] = useState(null); // null | "new" | clientId
  const [orderModal, setOrderModal] = useState(null); // null | clientId
  const [envasesModal, setEnvasesModal] = useState(null); // null | clientId
  const [detailModal, setDetailModal] = useState(null); // null | clientId

  useEffect(() => {
    (async () => {
      const [c, o, e] = await Promise.all([
        fbGet("ac_clients"),
        fbGet("ac_orders"),
        fbGet("ac_envases"),
      ]);
      setClients(c || {});
      setOrders(o || {});
      setEnvases(e || {});
      setLoading(false);
    })();
  }, []);

  // ── client orders helper ─────────────────────────────────────────────────
  const clientOrders = (cid) =>
    Object.entries(orders)
      .filter(([, o]) => o.clientId === cid)
      .map(([id, o]) => ({ id, ...o }))
      .sort((a, b) => b.date.localeCompare(a.date));

  const clientEnvases = (cid) =>
    Object.entries(envases)
      .filter(([, e]) => e.clientId === cid)
      .reduce((acc, [, e]) => acc + (e.qty || 0), 0);

  // ── save client ───────────────────────────────────────────────────────────
  async function saveClient(data) {
    if (data.id) {
      await fbSet(`ac_clients/${data.id}`, {
        name: data.name,
        phone: data.phone,
        address: data.address,
        brand: data.brand,
        notes: data.notes,
        nextManual: data.nextManual || "",
        isDebtor: data.isDebtor || false,
        debtAmount: data.debtAmount || 0,
      });
      setClients((p) => ({ ...p, [data.id]: { ...p[data.id], ...data } }));
    } else {
      const id = await fbPush("ac_clients", {
        name: data.name,
        phone: data.phone,
        address: data.address,
        brand: data.brand,
        notes: data.notes,
        nextManual: data.nextManual || "",
        isDebtor: false,
        debtAmount: 0,
      });
      setClients((p) => ({
        ...p,
        [id]: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          brand: data.brand,
          notes: data.notes,
          nextManual: "",
          isDebtor: false,
          debtAmount: 0,
        },
      }));
    }
    setClientModal(null);
  }

  async function deleteClient(cid) {
    if (!confirm("¿Eliminar cliente y todos sus datos?")) return;
    await fbDelete(`ac_clients/${cid}`);
    // delete orders
    const toDelO = Object.entries(orders)
      .filter(([, o]) => o.clientId === cid)
      .map(([id]) => id);
    for (const id of toDelO) await fbDelete(`ac_orders/${id}`);
    const toDelE = Object.entries(envases)
      .filter(([, e]) => e.clientId === cid)
      .map(([id]) => id);
    for (const id of toDelE) await fbDelete(`ac_envases/${id}`);
    setClients((p) => {
      const n = { ...p };
      delete n[cid];
      return n;
    });
    setOrders((p) => {
      const n = { ...p };
      toDelO.forEach((id) => delete n[id]);
      return n;
    });
    setEnvases((p) => {
      const n = { ...p };
      toDelE.forEach((id) => delete n[id]);
      return n;
    });
    setDetailModal(null);
  }

  // ── save order ────────────────────────────────────────────────────────────
  async function saveOrder(data) {
    const id = await fbPush("ac_orders", data);
    setOrders((p) => ({ ...p, [id]: data }));
    setOrderModal(null);
  }

  async function deleteOrder(oid) {
    await fbDelete(`ac_orders/${oid}`);
    setOrders((p) => {
      const n = { ...p };
      delete n[oid];
      return n;
    });
  }

  // ── envases ───────────────────────────────────────────────────────────────
  async function addEnvases(cid, qty) {
    const id = await fbPush("ac_envases", {
      clientId: cid,
      qty,
      date: today(),
    });
    setEnvases((p) => ({ ...p, [id]: { clientId: cid, qty, date: today() } }));
    setEnvasesModal(null);
  }

  async function returnEnvases(cid, qty) {
    // find entries for client and reduce
    const entries = Object.entries(envases)
      .filter(([, e]) => e.clientId === cid)
      .sort((a, b) => a[1].date.localeCompare(b[1].date));
    let toReturn = qty;
    for (const [id, e] of entries) {
      if (toReturn <= 0) break;
      if (e.qty <= toReturn) {
        toReturn -= e.qty;
        await fbDelete(`ac_envases/${id}`);
        setEnvases((p) => {
          const n = { ...p };
          delete n[id];
          return n;
        });
      } else {
        const newQty = e.qty - toReturn;
        await fbSet(`ac_envases/${id}`, { ...e, qty: newQty });
        setEnvases((p) => ({
          ...p,
          [id]: { ...p[id], qty: newQty },
        }));
        toReturn = 0;
      }
    }
    setEnvasesModal(null);
  }

  // ── computed lists ────────────────────────────────────────────────────────
  const clientList = useMemo(
    () =>
      Object.entries(clients)
        .map(([id, c]) => {
          const ords = clientOrders(id);
          const fc = calcForecast(ords.map((o) => ({ date: o.date, qty: o.qty })));
          return { id, ...c, forecast: fc, orderCount: ords.length };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clients, orders]
  );

  const debtors = clientList.filter((c) => c.isDebtor);

  // upcoming next 7 days (pronóstico)
  const upcoming = clientList
    .filter((c) => {
      const target = c.nextManual || c.forecast?.next;
      if (!target) return false;
      const d = daysFromToday(target);
      return d !== null && d <= 7;
    })
    .sort((a, b) => {
      const da = daysFromToday(a.nextManual || a.forecast?.next);
      const db = daysFromToday(b.nextManual || b.forecast?.next);
      return da - db;
    });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b1120",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#38bdf8",
          fontSize: 18,
          fontFamily: "system-ui,sans-serif",
        }}
      >
        Cargando AguaClientes…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1120",
        color: "#e2e8f0",
        fontFamily: "'Inter',system-ui,sans-serif",
        paddingBottom: 80,
      }}
    >
      {/* header */}
      <div
        style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>💧</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#38bdf8" }}>
          AguaClientes
        </span>
        <span
          style={{
            marginLeft: "auto",
            background: "#1e293b",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            color: "#64748b",
          }}
        >
          {Object.keys(clients).length} clientes
        </span>
      </div>

      {/* tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #1e293b",
          background: "#0f172a",
          overflowX: "auto",
        }}
      >
        {[
          { id: "clientes", label: "👥 Clientes" },
          { id: "forecast", label: "📅 Próximos" },
          { id: "envases", label: "🫙 Envases" },
          { id: "deudores", label: "💳 Deudores" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #38bdf8" : "2px solid transparent",
              color: tab === t.id ? "#38bdf8" : "#64748b",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* ── CLIENTES TAB ── */}
        {tab === "clientes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button style={btnPrimary} onClick={() => setClientModal("new")}>
                + Nuevo cliente
              </button>
            </div>
            {clientList.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "60px 0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <div>Aún no hay clientes. ¡Agrega el primero!</div>
              </div>
            )}
            {clientList.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                envasesCount={clientEnvases(c.id)}
                onOpen={() => setDetailModal(c.id)}
              />
            ))}
          </div>
        )}

        {/* ── FORECAST TAB ── */}
        {tab === "forecast" && (
          <div>
            <div
              style={{
                color: "#64748b",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              Clientes que pedirán en los próximos 7 días (según historial o fecha manual)
            </div>
            {upcoming.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "60px 0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>Ningún pedido esperado en los próximos 7 días</div>
              </div>
            )}
            {upcoming.map((c) => {
              const target = c.nextManual || c.forecast?.next;
              const d = daysFromToday(target);
              return (
                <div
                  key={c.id}
                  onClick={() => setDetailModal(c.id)}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 10,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background:
                        d < 0
                          ? "#ef444422"
                          : d <= 2
                          ? "#f59e0b22"
                          : "#10b98122",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>
                      {d < 0 ? "⚠️" : d === 0 ? "🔔" : "📅"}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {c.phone && `📞 ${c.phone} · `}
                      {c.brand && (
                        <span
                          style={{ color: BRAND_COLOR[c.brand] || "#64748b" }}
                        >
                          {c.brand}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <UrgencyBadge nextDate={c.forecast?.next} manualDate={c.nextManual} />
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                      {fmtDate(target)}
                    </div>
                    {c.nextManual && (
                      <div style={{ fontSize: 10, color: "#64748b" }}>manual</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ENVASES TAB ── */}
        {tab === "envases" && (
          <div>
            <div
              style={{
                color: "#64748b",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              Bidones prestados a clientes
            </div>
            {clientList.filter((c) => clientEnvases(c.id) > 0).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "60px 0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🫙</div>
                <div>No hay envases prestados actualmente</div>
              </div>
            )}
            {clientList
              .filter((c) => clientEnvases(c.id) > 0)
              .sort((a, b) => clientEnvases(b.id) - clientEnvases(a.id))
              .map((c) => {
                const cnt = clientEnvases(c.id);
                return (
                  <div
                    key={c.id}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        background: "#38bdf822",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      🫙
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {c.phone}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#38bdf8",
                          lineHeight: 1,
                        }}
                      >
                        {cnt}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {cnt === 1 ? "bidón" : "bidones"}
                      </div>
                    </div>
                    <button
                      onClick={() => setEnvasesModal(c.id)}
                      style={{
                        ...btnGhost,
                        marginLeft: 8,
                        fontSize: 12,
                        padding: "6px 12px",
                      }}
                    >
                      Gestionar
                    </button>
                  </div>
                );
              })}
            {/* total */}
            {Object.keys(envases).length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #1e293b",
                }}
              >
                Total prestados:{" "}
                <strong style={{ color: "#38bdf8" }}>
                  {Object.values(envases).reduce((a, e) => a + (e.qty || 0), 0)}
                </strong>{" "}
                bidones
              </div>
            )}
          </div>
        )}

        {/* ── DEUDORES TAB ── */}
        {tab === "deudores" && (
          <div>
            <div
              style={{
                color: "#64748b",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              Clientes con deuda pendiente
            </div>
            {debtors.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  padding: "60px 0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div>Sin deudores registrados</div>
              </div>
            )}
            {debtors.map((c) => (
              <div
                key={c.id}
                onClick={() => setDetailModal(c.id)}
                style={{
                  background: "#0f172a",
                  border: "1px solid #ef444433",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: "#ef444422",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  💳
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{c.phone}</div>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    color: "#ef4444",
                  }}
                >
                  S/ {Number(c.debtAmount || 0).toFixed(2)}
                </div>
              </div>
            ))}
            {debtors.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #1e293b",
                }}
              >
                Total deuda:{" "}
                <strong style={{ color: "#ef4444" }}>
                  S/{" "}
                  {debtors
                    .reduce((a, c) => a + Number(c.debtAmount || 0), 0)
                    .toFixed(2)}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CLIENT MODAL (new/edit) ── */}
      {clientModal && (
        <ClientForm
          initial={
            clientModal === "new" ? null : { id: clientModal, ...clients[clientModal] }
          }
          onSave={saveClient}
          onClose={() => setClientModal(null)}
        />
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal && clients[detailModal] && (
        <DetailModal
          client={{ id: detailModal, ...clients[detailModal] }}
          orders={clientOrders(detailModal)}
          envasesCount={clientEnvases(detailModal)}
          onClose={() => setDetailModal(null)}
          onEdit={() => {
            setDetailModal(null);
            setClientModal(detailModal);
          }}
          onDelete={() => deleteClient(detailModal)}
          onAddOrder={() => {
            setDetailModal(null);
            setOrderModal(detailModal);
          }}
          onDeleteOrder={deleteOrder}
          onManageEnvases={() => {
            setDetailModal(null);
            setEnvasesModal(detailModal);
          }}
        />
      )}

      {/* ── ORDER MODAL ── */}
      {orderModal && (
        <OrderForm
          clientId={orderModal}
          clientName={clients[orderModal]?.name}
          defaultBrand={clients[orderModal]?.brand}
          onSave={saveOrder}
          onClose={() => {
            setOrderModal(null);
            setDetailModal(orderModal);
          }}
        />
      )}

      {/* ── ENVASES MODAL ── */}
      {envasesModal && (
        <EnvasesModal
          clientId={envasesModal}
          clientName={clients[envasesModal]?.name}
          current={clientEnvases(envasesModal)}
          onAdd={(qty) => addEnvases(envasesModal, qty)}
          onReturn={(qty) => returnEnvases(envasesModal, qty)}
          onClose={() => {
            setEnvasesModal(null);
            if (detailModal) setDetailModal(envasesModal);
          }}
        />
      )}
    </div>
  );
}

// ─── CLIENT CARD ─────────────────────────────────────────────────────────────
function ClientCard({ client, envasesCount, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color .15s",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
          fontWeight: 800,
          color: "#38bdf8",
        }}
      >
        {client.name[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 2,
          }}
        >
          {client.name}
          {client.isDebtor && (
            <span style={{ color: "#ef4444", marginLeft: 6, fontSize: 12 }}>
              💳 deudor
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {client.phone && `📞 ${client.phone}`}
          {client.brand && (
            <span
              style={{
                marginLeft: 8,
                color: BRAND_COLOR[client.brand] || "#64748b",
              }}
            >
              ● {client.brand}
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <UrgencyBadge
          nextDate={client.forecast?.next}
          manualDate={client.nextManual}
        />
        {envasesCount > 0 && (
          <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 4 }}>
            🫙 {envasesCount}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
          {client.orderCount} pedido{client.orderCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT FORM ──────────────────────────────────────────────────────────────
function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
    address: initial?.address || "",
    brand: initial?.brand || "",
    notes: initial?.notes || "",
    nextManual: initial?.nextManual || "",
    isDebtor: initial?.isDebtor || false,
    debtAmount: initial?.debtAmount || "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal
      title={initial ? "Editar cliente" : "Nuevo cliente"}
      onClose={onClose}
    >
      <Field label="Nombre *">
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Nombre del cliente"
        />
      </Field>
      <Field label="Teléfono">
        <input
          style={inputStyle}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="999 999 999"
        />
      </Field>
      <Field label="Dirección">
        <input
          style={inputStyle}
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Calle, número, referencia"
        />
      </Field>
      <Field label="Marca preferida">
        <select
          style={inputStyle}
          value={form.brand}
          onChange={(e) => set("brand", e.target.value)}
        >
          <option value="">— Sin preferencia —</option>
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>
      <Field label="Próximo pedido (fecha manual)">
        <input
          type="date"
          style={inputStyle}
          value={form.nextManual}
          onChange={(e) => set("nextManual", e.target.value)}
        />
      </Field>
      <Field label="Notas">
        <textarea
          style={{ ...inputStyle, height: 72, resize: "vertical" }}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Observaciones, horario, etc."
        />
      </Field>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <input
          type="checkbox"
          id="isDebtor"
          checked={form.isDebtor}
          onChange={(e) => set("isDebtor", e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <label
          htmlFor="isDebtor"
          style={{ fontSize: 14, color: "#e2e8f0", cursor: "pointer" }}
        >
          Marcar como deudor
        </label>
      </div>
      {form.isDebtor && (
        <Field label="Monto deuda (S/)">
          <input
            type="number"
            style={inputStyle}
            value={form.debtAmount}
            onChange={(e) => set("debtAmount", e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.50"
          />
        </Field>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button
          style={{ ...btnPrimary, flex: 1 }}
          onClick={() => {
            if (!form.name.trim()) return alert("El nombre es obligatorio");
            onSave({ ...form, id: initial?.id });
          }}
        >
          {initial ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </Modal>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({
  client,
  orders,
  envasesCount,
  onClose,
  onEdit,
  onDelete,
  onAddOrder,
  onDeleteOrder,
  onManageEnvases,
}) {
  const fc = calcForecast(orders.map((o) => ({ date: o.date, qty: o.qty })));

  return (
    <Modal title={client.name} onClose={onClose}>
      {/* info */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 16,
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        {client.phone && (
          <div>
            📞{" "}
            <a
              href={`tel:${client.phone}`}
              style={{ color: "#38bdf8", textDecoration: "none" }}
            >
              {client.phone}
            </a>
          </div>
        )}
        {client.address && <div>📍 {client.address}</div>}
        {client.brand && (
          <div>
            💧{" "}
            <span style={{ color: BRAND_COLOR[client.brand] || "#e2e8f0" }}>
              {client.brand}
            </span>
          </div>
        )}
        {client.notes && <div>📝 {client.notes}</div>}
        {client.isDebtor && (
          <div style={{ color: "#ef4444" }}>
            💳 Deuda: S/ {Number(client.debtAmount || 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* pronóstico */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 8,
          }}
        >
          Pronóstico de pedido
        </div>
        {fc ? (
          <div style={{ fontSize: 13, lineHeight: 1.9 }}>
            <div>
              🔁 Frecuencia promedio:{" "}
              <strong style={{ color: "#e2e8f0" }}>
                cada {fc.avg} día{fc.avg !== 1 ? "s" : ""}
              </strong>
            </div>
            <div>
              📅 Último pedido:{" "}
              <strong style={{ color: "#e2e8f0" }}>{fmtDate(fc.last)}</strong>
            </div>
            <div>
              🔮 Próximo estimado:{" "}
              <strong style={{ color: "#38bdf8" }}>{fmtDate(fc.next)}</strong>{" "}
              <UrgencyBadge nextDate={fc.next} manualDate={client.nextManual} />
            </div>
            {client.nextManual && (
              <div style={{ color: "#f59e0b" }}>
                📌 Fecha manual:{" "}
                <strong>{fmtDate(client.nextManual)}</strong>
              </div>
            )}
          </div>
        ) : orders.length === 1 ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Necesitas al menos 2 pedidos para calcular la frecuencia.
            {client.nextManual && (
              <div style={{ color: "#f59e0b", marginTop: 6 }}>
                📌 Fecha manual: <strong>{fmtDate(client.nextManual)}</strong>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#475569", fontSize: 13 }}>
            Sin pedidos registrados aún.
            {client.nextManual && (
              <div style={{ color: "#f59e0b", marginTop: 6 }}>
                📌 Fecha manual: <strong>{fmtDate(client.nextManual)}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* envases */}
      {envasesCount > 0 && (
        <div
          style={{
            background: "#38bdf811",
            border: "1px solid #38bdf833",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "#38bdf8" }}>
            🫙 {envasesCount} bidón{envasesCount !== 1 ? "es" : ""} prestado
            {envasesCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onManageEnvases}
            style={{ ...btnGhost, padding: "4px 12px", fontSize: 12 }}
          >
            Gestionar
          </button>
        </div>
      )}

      {/* historial */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          Historial ({orders.length})
        </span>
        <button
          style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}
          onClick={onAddOrder}
        >
          + Pedido
        </button>
      </div>

      {orders.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#475569",
            padding: "20px 0",
            fontSize: 13,
          }}
        >
          Sin pedidos registrados
        </div>
      )}

      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            background: "#1e293b",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {o.qty} bidón{o.qty !== 1 ? "es" : ""}
              {o.brand && (
                <span
                  style={{
                    marginLeft: 8,
                    color: BRAND_COLOR[o.brand] || "#64748b",
                    fontSize: 12,
                  }}
                >
                  {o.brand}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {fmtDate(o.date)}
              {o.payment && ` · ${o.payment}`}
              {o.amount && ` · S/ ${Number(o.amount).toFixed(2)}`}
            </div>
            {o.notes && (
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                {o.notes}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm("¿Eliminar este pedido?")) onDeleteOrder(o.id);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 16,
              padding: "4px",
            }}
          >
            🗑
          </button>
        </div>
      ))}

      {/* acciones */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #1e293b",
        }}
      >
        <button style={btnGhost} onClick={onEdit}>
          ✏️ Editar
        </button>
        {envasesCount === 0 && (
          <button
            style={{ ...btnGhost, borderColor: "#38bdf833", color: "#38bdf8" }}
            onClick={onManageEnvases}
          >
            🫙 Envases
          </button>
        )}
        <button
          style={{ ...btnDanger, marginLeft: "auto" }}
          onClick={onDelete}
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

// ─── ORDER FORM ───────────────────────────────────────────────────────────────
function OrderForm({ clientId, clientName, defaultBrand, onSave, onClose }) {
  const [form, setForm] = useState({
    date: today(),
    qty: 1,
    brand: defaultBrand || "",
    payment: "Efectivo",
    amount: "",
    notes: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal title={`Pedido — ${clientName}`} onClose={onClose}>
      <Field label="Fecha">
        <input
          type="date"
          style={inputStyle}
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />
      </Field>
      <Field label="Cantidad de bidones">
        <input
          type="number"
          style={inputStyle}
          value={form.qty}
          min={1}
          onChange={(e) => set("qty", Number(e.target.value))}
        />
      </Field>
      <Field label="Marca">
        <select
          style={inputStyle}
          value={form.brand}
          onChange={(e) => set("brand", e.target.value)}
        >
          <option value="">— —</option>
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>
      <Field label="Método de pago">
        <select
          style={inputStyle}
          value={form.payment}
          onChange={(e) => set("payment", e.target.value)}
        >
          {PAYMENTS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Monto (S/)">
        <input
          type="number"
          style={inputStyle}
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.50"
        />
      </Field>
      <Field label="Notas">
        <input
          style={inputStyle}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Observación opcional"
        />
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button
          style={{ ...btnPrimary, flex: 1 }}
          onClick={() => onSave({ clientId, ...form })}
        >
          Registrar pedido
        </button>
      </div>
    </Modal>
  );
}

// ─── ENVASES MODAL ────────────────────────────────────────────────────────────
function EnvasesModal({ clientId, clientName, current, onAdd, onReturn, onClose }) {
  const [mode, setMode] = useState("add");
  const [qty, setQty] = useState(1);

  return (
    <Modal title={`Envases — ${clientName}`} onClose={onClose}>
      <div
        style={{
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{ fontSize: 40, fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}
        >
          {current}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          bidones prestados actualmente
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 8,
            border: "none",
            background: mode === "add" ? "#38bdf8" : "#1e293b",
            color: mode === "add" ? "#0f172a" : "#64748b",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => setMode("add")}
        >
          + Prestar
        </button>
        <button
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 8,
            border: "none",
            background: mode === "return" ? "#10b981" : "#1e293b",
            color: mode === "return" ? "#fff" : "#64748b",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => setMode("return")}
        >
          ↩ Devolver
        </button>
      </div>

      <Field label={mode === "add" ? "Bidones a prestar" : "Bidones a devolver"}>
        <input
          type="number"
          style={inputStyle}
          value={qty}
          min={1}
          max={mode === "return" ? current : undefined}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        <button
          style={{
            ...btnPrimary,
            flex: 1,
            background: mode === "return" ? "#10b981" : "#38bdf8",
          }}
          onClick={() => {
            if (qty < 1) return;
            if (mode === "return" && qty > current) {
              return alert(`Máximo ${current} bidones para devolver`);
            }
            mode === "add" ? onAdd(qty) : onReturn(qty);
          }}
        >
          {mode === "add" ? `Prestar ${qty}` : `Devolver ${qty}`}
        </button>
      </div>
    </Modal>
  );
}
