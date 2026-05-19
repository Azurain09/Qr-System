import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bed, ChefHat, ClipboardList, Coffee, EggFried, IdCard, MapPin, Minus, Plus, Users, Utensils } from "lucide-react";
import { api, socketUrl } from "../api/client";
import { ASSET_BASE, BREAKFAST_IMAGES, EXTRA_PRICES, STATUS_FLOW } from "../constants/app";
import { useCatalog } from "../hooks/useCatalog";
import { BackButton, Field, GuestChrome, PortalInfo, QuantityButton, ServiceClosed } from "../components/ui";
import { OrderSummary } from "../components/OrderSummary";

const STORAGE_KEY = "hotel_guest_order_session";
const onlyDigits = (value, maxLength) => value.replace(/\D/g, "").slice(0, maxLength);

const initialDraft = {
  document: "",
  full_name: "",
  delivery_location: "Restaurante",
  table_number: "",
  room_number: "",
  claimed_included: true,
  breakfast_type_id: "",
  egg_prep_type_id: "",
  extras: [],
};

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function GuestApp() {
  const { catalog, error } = useCatalog();
  const stored = useMemo(readStoredSession, []);
  const [step, setStep] = useState(stored.step || "document");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ ...initialDraft, ...(stored.draft || {}) });
  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [addingExtras, setAddingExtras] = useState(false);

  const activeBreakfasts = catalog?.breakfast_types.filter((item) => item.is_active) || [];
  const activeEggs = catalog?.egg_prep_types.filter((item) => item.is_active) || [];
  const allExtras = catalog?.extra_categories.flatMap((category) => category.extras) || [];
  const selectedBreakfast = activeBreakfasts.find((item) => item.id === Number(draft.breakfast_type_id));

  useEffect(() => {
    const restoreOrder = async () => {
      if (!stored.orderId) return;
      try {
        const data = await api.getOrder(stored.orderId);
        setOrder(data);
        setStep(data.confirmed_at ? "status" : "review");
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    restoreOrder();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, orderId: order?.id || null, step }));
  }, [draft, order?.id, step]);

  useEffect(() => {
    if (step !== "review" || !order || order.confirmed_at) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        setOrder(null);
        setStep("document");
        setMessage("El pedido expiro. Puedes empezar nuevamente.");
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [step, order]);

  useEffect(() => {
    if (!order?.id) return;
    const refreshOrder = async () => {
      try {
        setOrder(await api.getOrder(order.id));
      } catch {
        // The WebSocket or next poll will retry.
      }
    };
    const socket = new WebSocket(socketUrl(`/ws/orders/${order.id}`));
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.order) setOrder(payload.order);
    };
    const poll = setInterval(refreshOrder, 8000);
    return () => {
      socket.close();
      clearInterval(poll);
    };
  }, [order?.id]);

  if (!catalog) return <main className="centerScreen">{error || "Cargando..."}</main>;
  if (!catalog.is_guest_open) return <ServiceClosed />;

  const updateExtra = (extra, delta) => {
    setDraft((current) => {
      const existing = current.extras.find((item) => item.extra_id === extra.id);
      if (!existing && delta > 0) {
        return { ...current, extras: [...current.extras, { extra_id: extra.id, quantity: 1, egg_prep_type_id: "" }] };
      }
      const extras = current.extras
        .map((item) => (item.extra_id === extra.id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0);
      return { ...current, extras };
    });
  };

  const setExtraEggPrep = (extraId, eggPrepId) => {
    setDraft((current) => ({
      ...current,
      extras: current.extras.map((item) => (item.extra_id === extraId ? { ...item, egg_prep_type_id: eggPrepId } : item)),
    }));
  };

  const continueFromDocument = async () => {
    if (!/^\d{8}$/.test(draft.document)) {
      setMessage("Completar todos los campos");
      return;
    }
    try {
      const data = await api.getOrderByDocument(draft.document);
      if (data.order) {
        setOrder(data.order);
        setStep(data.order.confirmed_at ? "status" : "review");
      } else {
        setStep("identity");
      }
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const validateIdentity = () => {
    if (!/^\d{8}$/.test(draft.document) || !draft.full_name.trim()) return "Completar todos los campos";
    return "";
  };

  const validateLocationDetail = () => {
    if (draft.delivery_location === "Restaurante" && !["1", "2", "3", "4", "5", "6", "7"].includes(draft.table_number)) return "Completar todos los campos";
    if (draft.delivery_location === "Habitacion" && !/^\d{3}$/.test(draft.room_number)) return "Completar todos los campos";
    return "";
  };

  const validateExtras = () => {
    const missingEggPrep = draft.extras
      .map((item) => ({ ...item, extra: allExtras.find((extra) => extra.id === item.extra_id) }))
      .filter((item) => item.extra?.requires_egg_prep && !item.egg_prep_type_id);
    return missingEggPrep.length ? "Completar todos los campos" : "";
  };

  const buildExtrasPayload = () => draft.extras.map((item) => ({
    extra_id: item.extra_id,
    quantity: item.quantity,
    egg_prep_type_id: item.egg_prep_type_id ? Number(item.egg_prep_type_id) : null,
  }));

  const submitDraft = async () => {
    if (!draft.breakfast_type_id || (selectedBreakfast?.has_eggs && !draft.egg_prep_type_id)) {
      setMessage("Completar todos los campos");
      return;
    }
    const validation = validateExtras();
    if (validation) {
      setMessage(validation);
      return;
    }
    try {
      const payload = {
        ...draft,
        table_number: draft.delivery_location === "Restaurante" ? Number(draft.table_number) : null,
        room_number: draft.delivery_location === "Habitacion" ? draft.room_number : null,
        breakfast_type_id: Number(draft.breakfast_type_id),
        egg_prep_type_id: draft.egg_prep_type_id ? Number(draft.egg_prep_type_id) : null,
        extras: buildExtrasPayload(),
      };
      const created = await api.createOrder(payload);
      setOrder(created);
      setStep("review");
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const submitMoreExtras = async () => {
    const validation = validateExtras();
    if (validation) {
      setMessage(validation);
      return;
    }
    if (!draft.extras.length) {
      setStep("status");
      return;
    }
    try {
      const updated = await api.addOrderExtras(order.id, buildExtrasPayload());
      setOrder(updated);
      setDraft((current) => ({ ...current, extras: [] }));
      setAddingExtras(false);
      setStep("status");
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const confirm = async () => {
    try {
      const confirmed = await api.confirmOrder(order.id);
      setOrder(confirmed);
      setStep("status");
      setMessage("");
    } catch (err) {
      setMessage(err.message);
      if (err.message.includes("expiro")) setStep("document");
    }
  };

  const orderSummary = order || {
    guest_name: draft.full_name,
    document: draft.document,
    delivery_location: draft.delivery_location,
    table_number: draft.table_number,
    room_number: draft.room_number,
    claimed_included: draft.claimed_included,
    status: "Pendiente",
    breakfast_type: selectedBreakfast?.name,
    egg_prep: activeEggs.find((egg) => egg.id === Number(draft.egg_prep_type_id))?.name,
    extras: draft.extras.map((item) => {
      const extra = allExtras.find((entry) => entry.id === item.extra_id);
      return {
        id: item.extra_id,
        name: extra?.name,
        category_name: extra?.category_name,
        quantity: item.quantity,
        egg_prep: activeEggs.find((egg) => egg.id === Number(item.egg_prep_type_id))?.name,
      };
    }),
  };

  const sharedMessages = (
    <>
      {message && <div className="alert portalAlert">{message}</div>}
      {error && <div className="alert portalAlert">{error}</div>}
    </>
  );

  const goAfterBreakfast = () => {
    if (!draft.breakfast_type_id) {
      setMessage("Completar todos los campos");
      return;
    }
    setMessage("");
    setStep(selectedBreakfast?.has_eggs ? "egg" : "extras");
  };

  const extrasScreen = (
    <GuestChrome title="SELECCION DE ADICIONALES" icon={<Coffee size={21} />}>
      <section className="breakfastScreen">
        {sharedMessages}
        <div className="portalHeading">
          <h1>{addingExtras ? "Agrega mas adicionales" : "Seleccione adicionales"}</h1>
          <p>Los precios son temporales y se pueden modificar en un solo archivo.</p>
        </div>
        <section className="extrasPanel standaloneExtras">
          {catalog.extra_categories.map((category) => {
            const extras = category.extras.filter((extra) => extra.is_active);
            if (!extras.length) return null;
            return (
              <div key={category.id} className="extraGroup">
                <h3>{category.name}</h3>
                {extras.map((extra) => {
                  const selected = draft.extras.find((item) => item.extra_id === extra.id);
                  return (
                    <div key={extra.id} className="extraRow pricedExtraRow">
                      <span>{extra.name}</span>
                      <strong>S/ {(EXTRA_PRICES[extra.name] || 0).toFixed(2)}</strong>
                      {extra.requires_egg_prep && selected && (
                        <select value={selected.egg_prep_type_id} onChange={(event) => setExtraEggPrep(extra.id, event.target.value)}>
                          <option value="">Huevos</option>
                          {activeEggs.map((egg) => <option key={egg.id} value={egg.id}>{egg.name}</option>)}
                        </select>
                      )}
                      <div className="qty">
                        <QuantityButton onClick={() => updateExtra(extra, -1)}><Minus size={16} /></QuantityButton>
                        <b>{selected?.quantity || 0}</b>
                        <QuantityButton onClick={() => updateExtra(extra, 1)}><Plus size={16} /></QuantityButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
        <div className="portalNav">
          <BackButton onClick={() => setStep(addingExtras ? "status" : selectedBreakfast?.has_eggs ? "egg" : "breakfast")} />
          <button className="portalPrimary navPrimary" onClick={addingExtras ? submitMoreExtras : submitDraft}>
            {addingExtras ? "Agregar al pedido" : "Continuar"} <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </GuestChrome>
  );

  if (step === "document") {
    return (
      <GuestChrome title="1. INICIO DE SESION" icon={<Users size={21} />} footer={false}>
        <section className="documentScreen loginReferenceScreen">
          {sharedMessages}
          <div className="loginSplitCard">
            <div className="loginPane">
              <img className="loginLogoLarge" src={`${ASSET_BASE}/logo.png`} alt="QR System" />
              <h1>Bienvenido</h1>
              <p>Ingrese su DNI para acceder a su pedido</p>
              <div className="documentInput loginInput">
                <IdCard size={20} />
                <input value={draft.document} inputMode="numeric" maxLength="8" placeholder="DNI" onChange={(event) => setDraft({ ...draft, document: onlyDigits(event.target.value, 8) })} />
              </div>
              <button className="portalPrimary loginButton" onClick={continueFromDocument}>
                <ArrowRight size={20} /> Validar
              </button>
              <PortalInfo>Asegurese de ingresar correctamente su numero de documento. No utilice puntos ni espacios.</PortalInfo>
              <div className="loginCopyright">© 2025 Cacique Hotel - Todos los derechos reservados</div>
            </div>
            <img className="loginHotelImage" src={`${ASSET_BASE}/Hotel.png`} alt="Hotel Cacique" />
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "identity") {
    return (
      <GuestChrome title="SELECCION DE UBICACION" icon={<MapPin size={22} />}>
        <section className="locationScreen">
          {sharedMessages}
          <div className="portalHeading">
            <h1>Seleccione su ubicacion actual</h1>
            <p>Complete sus datos para realizar su pedido de desayuno.</p>
          </div>
          <div className="guestDetailsCard">
            <Field label="Nombre completo">
              <input value={draft.full_name} onChange={(event) => setDraft({ ...draft, full_name: event.target.value })} />
            </Field>
            <label className="checkRow">
              <input type="checkbox" checked={draft.claimed_included} onChange={(event) => setDraft({ ...draft, claimed_included: event.target.checked })} />
              Reclamo mi desayuno incluido
            </label>
          </div>
          <div className="locationCards">
            <button className={`locationCard restaurant ${draft.delivery_location === "Restaurante" ? "selected" : ""}`} onClick={() => setDraft({ ...draft, delivery_location: "Restaurante" })}>
              <span><Utensils size={66} /></span>
              <strong>Restaurante</strong>
              <p>Realizar pedido desde el restaurante</p>
            </button>
            <button className={`locationCard room ${draft.delivery_location === "Habitacion" ? "selected" : ""}`} onClick={() => setDraft({ ...draft, delivery_location: "Habitacion" })}>
              <span><Bed size={72} /></span>
              <strong>Habitacion</strong>
              <p>Realizar pedido desde su habitacion</p>
            </button>
          </div>
          <div className="portalNav">
            <BackButton onClick={() => setStep("document")} />
            <button className="portalPrimary navPrimary" onClick={() => {
              const validation = validateIdentity();
              if (validation) setMessage(validation);
              else {
                setMessage("");
                setStep("locationDetail");
              }
            }}>
              Continuar <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "locationDetail") {
    return (
      <GuestChrome title={draft.delivery_location === "Restaurante" ? "SELECCION DE MESA" : "SELECCION DE HABITACION"} icon={draft.delivery_location === "Restaurante" ? <Utensils size={21} /> : <Bed size={21} />}>
        <section className="locationScreen">
          {sharedMessages}
          <div className="locationDetailPanel">
            <div className="locationDetailCopy">
              <h2>{draft.delivery_location === "Restaurante" ? "Ingrese numero de mesa" : "Ingrese numero de habitacion"}</h2>
              {draft.delivery_location === "Restaurante" ? (
                <Field label="Numero de mesa">
                  <select value={draft.table_number} onChange={(event) => setDraft({ ...draft, table_number: event.target.value })}>
                    <option value="">Seleccionar</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((number) => <option key={number}>{number}</option>)}
                  </select>
                </Field>
              ) : (
                <Field label="Habitacion">
                  <input value={draft.room_number} inputMode="numeric" maxLength="3" placeholder="Ejemplo: 203" onChange={(event) => setDraft({ ...draft, room_number: onlyDigits(event.target.value, 3) })} />
                </Field>
              )}
              <p className="hintText">{draft.delivery_location === "Restaurante" ? "Solo se permiten numeros del 1 al 7" : "Ingrese hasta 3 digitos"}</p>
              <PortalInfo>{draft.delivery_location === "Restaurante" ? "Asegurese de ingresar el numero correcto de su mesa." : "Asegurese de ingresar correctamente el numero de su habitacion."}</PortalInfo>
            </div>
            <img className="locationPhoto" src={`${ASSET_BASE}/${draft.delivery_location === "Restaurante" ? "tables.png" : "room.png"}`} alt={draft.delivery_location} />
          </div>
          <div className="portalNav">
            <BackButton onClick={() => setStep("identity")} />
            <button className="portalPrimary navPrimary" onClick={() => {
              const validation = validateLocationDetail();
              if (validation) setMessage(validation);
              else {
                setMessage("");
                setStep("breakfast");
              }
            }}>
              Continuar <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "breakfast") {
    return (
      <GuestChrome title="SELECCION DE DESAYUNO" icon={<ChefHat size={21} />}>
        <section className="breakfastScreen">
          {sharedMessages}
          <div className="guestContext">
            <span><Users size={19} /><b>Huesped:</b> {draft.full_name}</span>
            <span>{draft.delivery_location === "Restaurante" ? <Utensils size={19} /> : <Bed size={19} />}<b>{draft.delivery_location}:</b> {draft.table_number || draft.room_number}</span>
            <span><Coffee size={19} /><b>Incluye:</b> 1 jugo y 1 cafe</span>
          </div>
          <div className="portalHeading">
            <h1>Seleccione su desayuno</h1>
            <p>Primero elija el desayuno principal.</p>
          </div>
          <div className="breakfastCards">
            {activeBreakfasts.map((breakfast) => (
              <button
                key={breakfast.id}
                className={`breakfastCard ${Number(draft.breakfast_type_id) === breakfast.id ? "selected" : ""}`}
                onClick={() => setDraft({ ...draft, breakfast_type_id: breakfast.id, egg_prep_type_id: breakfast.has_eggs ? draft.egg_prep_type_id : "" })}
              >
                <img src={BREAKFAST_IMAGES[breakfast.name] || `${ASSET_BASE}/Americano.png`} alt={breakfast.name} />
                <div>
                  <strong>{breakfast.name}</strong>
                  <p>{breakfast.description}</p>
                  <i />
                </div>
              </button>
            ))}
          </div>
          <div className="portalNav">
            <BackButton onClick={() => setStep("locationDetail")} />
            <button className="portalPrimary navPrimary" onClick={goAfterBreakfast}>
              Continuar <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "egg") {
    return (
      <GuestChrome title="TIPO DE HUEVO FRITO" icon={<EggFried size={21} />}>
        <section className="breakfastScreen">
          {sharedMessages}
          <div className="portalHeading">
            <h1>Seleccione el tipo de huevo</h1>
            <p>{selectedBreakfast?.name}</p>
          </div>
          <div className="eggChoiceGrid">
            {activeEggs.map((egg) => (
              <button key={egg.id} className={`eggChoice ${Number(draft.egg_prep_type_id) === egg.id ? "selected" : ""}`} onClick={() => setDraft({ ...draft, egg_prep_type_id: egg.id })}>
                <EggFried size={34} />
                <strong>{egg.name}</strong>
              </button>
            ))}
          </div>
          <div className="portalNav">
            <BackButton onClick={() => setStep("breakfast")} />
            <button className="portalPrimary navPrimary" onClick={() => {
              if (!draft.egg_prep_type_id) setMessage("Completar todos los campos");
              else {
                setMessage("");
                setStep("extras");
              }
            }}>
              Continuar <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "extras") return extrasScreen;

  if (step === "review") {
    return (
      <GuestChrome title="RESUMEN DEL PEDIDO" icon={<ClipboardList size={21} />} countdown={!order?.confirmed_at ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : undefined}>
        <section className="reviewScreen">
          {sharedMessages}
          <div className="documentCard compactCard orderSummaryCard">
            <h1>Revise su pedido</h1>
            <OrderSummary order={orderSummary} />
            <div className="portalNav inline">
              <BackButton onClick={() => setStep("extras")}>Editar</BackButton>
              <button className="portalPrimary navPrimary" onClick={confirm}>Confirmar</button>
            </div>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "status" && order) {
    return (
      <GuestChrome title="ESTADO DEL PEDIDO" icon={<ClipboardList size={21} />}>
        <section className="reviewScreen">
          {sharedMessages}
          <div className="documentCard compactCard orderSummaryCard">
            <h1>Resumen del pedido</h1>
            <div className="statusTrack portalStatus">
              {STATUS_FLOW.map((status) => <span key={status} className={STATUS_FLOW.indexOf(order.status) >= STATUS_FLOW.indexOf(status) ? "done" : ""}>{status}</span>)}
            </div>
            <OrderSummary order={order} />
            <button className="hungerButton" onClick={() => {
              setDraft((current) => ({ ...current, extras: [] }));
              setAddingExtras(true);
              setStep("extras");
            }}>
              ¿Te quedaste con hambre?
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  return null;
}
