import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bed, CalendarClock, ChefHat, ClipboardList, Coffee, DoorOpen, EggFried, IdCard, Info, MapPin, Minus, Plus, Users, Utensils, XCircle } from "lucide-react";
import { api, socketUrl } from "../api/client";
import { ASSET_BASE, BREAKFAST_IMAGES, COFFEE_OPTIONS, EGG_DESCRIPTIONS, EGG_IMAGES, EXTRA_PRICES, JUICE_OPTIONS, STATUS_FLOW } from "../constants/app";
import { useCatalog } from "../hooks/useCatalog";
import { BackButton, Field, GuestChrome, PortalInfo, QuantityButton, ServiceClosed } from "../components/ui";
import { OrderSummary } from "../components/OrderSummary";

const STORAGE_KEY = "hotel_guest_order_session";
const REQUIRED_MESSAGE = "Completar correctamente todos los campos";
const VALID_ROOMS = [
  "201", "202", "203", "204", "205", "206",
  "301", "302", "303", "304", "305", "306",
  "401", "403", "404", "405", "406",
  "501", "502", "503", "504", "505", "506",
];
const VALID_STEPS = ["document", "identity", "locationDetail", "breakfast", "egg", "drinks", "extras", "review", "status"];
const onlyDigits = (value, maxLength) => value.replace(/\D/g, "").slice(0, maxLength);
const onlyValidRoomInput = (value, currentValue) => {
  const digits = onlyDigits(value, 3);
  return VALID_ROOMS.some((room) => room.startsWith(digits)) ? digits : currentValue;
};
const onlyLetters = (value) => value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "").replace(/\s{2,}/g, " ");
const normalizeMessage = (value) => value === "Completar todos los campos" ? REQUIRED_MESSAGE : value;
const RESET_AFTER_DELIVERY_MS = 3 * 60 * 1000;

const initialDraft = {
  document: "",
  full_name: "",
  delivery_location: "Restaurante",
  table_number: "",
  room_number: "",
  claimed_included: true,
  breakfast_type_id: "",
  egg_prep_type_id: "",
  juice_choice: "Naranja",
  coffee_choice: "Cafe Negro",
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
  const [step, setStep] = useState(VALID_STEPS.includes(stored.step) ? stored.step : "document");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ ...initialDraft, ...(stored.draft || {}) });
  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [addingExtras, setAddingExtras] = useState(false);
  const [hasRequestedMore, setHasRequestedMore] = useState(Boolean(stored.hasRequestedMore));

  const resetGuestSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOrder(null);
    setAddingExtras(false);
    setHasRequestedMore(false);
    setDraft(initialDraft);
    setStep("document");
  };

  const activeBreakfasts = catalog?.breakfast_types.filter((item) => item.is_active) || [];
  const activeEggs = catalog?.egg_prep_types.filter((item) => item.is_active) || [];
  const allExtras = catalog?.extra_categories.flatMap((category) => category.extras) || [];
  const selectedBreakfast = activeBreakfasts.find((item) => item.id === Number(draft.breakfast_type_id));
  const selectedEgg = activeEggs.find((egg) => egg.id === Number(draft.egg_prep_type_id));

  useEffect(() => {
    const restoreOrder = async () => {
      if (!stored.orderId) return;
      try {
        const data = await api.getOrder(stored.orderId);
        setOrder(data);
        setStep(data.confirmed_at ? "status" : "review");
      } catch {
        resetGuestSession();
      }
    };
    restoreOrder();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, orderId: order?.id || null, step, hasRequestedMore }));
  }, [draft, order?.id, step, hasRequestedMore]);

  useEffect(() => {
    if (step !== "review" || !order || order.confirmed_at) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        setMessage("El pedido expiro. Puedes empezar nuevamente.");
        resetGuestSession();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [step, order]);

  useEffect(() => {
    if (step !== "status" || order?.status !== "Entregado") return undefined;
    const timer = setTimeout(resetGuestSession, RESET_AFTER_DELIVERY_MS);
    return () => clearTimeout(timer);
  }, [step, order?.status]);

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
      setMessage(REQUIRED_MESSAGE);
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
      setMessage(normalizeMessage(err.message));
    }
  };

  const validateIdentity = () => {
    if (!/^\d{8}$/.test(draft.document) || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(draft.full_name.trim())) return REQUIRED_MESSAGE;
    return "";
  };

  const validateLocationDetail = () => {
    if (draft.delivery_location === "Restaurante" && !["1", "2", "3", "4", "5", "6", "7"].includes(draft.table_number)) return REQUIRED_MESSAGE;
    if (draft.delivery_location === "Habitacion" && !VALID_ROOMS.includes(draft.room_number)) return REQUIRED_MESSAGE;
    return "";
  };

  const validateExtras = () => {
    const missingEggPrep = draft.extras
      .map((item) => ({ ...item, extra: allExtras.find((extra) => extra.id === item.extra_id) }))
      .filter((item) => item.extra?.requires_egg_prep && !item.egg_prep_type_id);
    return missingEggPrep.length ? REQUIRED_MESSAGE : "";
  };

  const buildExtrasPayload = () => draft.extras.map((item) => ({
    extra_id: item.extra_id,
    quantity: item.quantity,
    egg_prep_type_id: item.egg_prep_type_id ? Number(item.egg_prep_type_id) : null,
  }));

  const submitDraft = async () => {
    if (!draft.breakfast_type_id || (selectedBreakfast?.has_eggs && !draft.egg_prep_type_id)) {
      setMessage(REQUIRED_MESSAGE);
      return;
    }
    const drinksValidation = validateDrinks();
    if (drinksValidation) {
      setMessage(drinksValidation);
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
      setMessage(normalizeMessage(err.message));
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
      setHasRequestedMore(true);
      setStep("status");
      setMessage("");
    } catch (err) {
      setMessage(normalizeMessage(err.message));
    }
  };

  const confirm = async () => {
    try {
      const confirmed = await api.confirmOrder(order.id);
      setOrder(confirmed);
      setStep("status");
      setMessage("");
    } catch (err) {
      setMessage(normalizeMessage(err.message));
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
      setMessage(REQUIRED_MESSAGE);
      return;
    }
    setMessage("");
    setStep(selectedBreakfast?.has_eggs ? "egg" : "drinks");
  };

  const validateDrinks = () => {
    if (!draft.juice_choice || !draft.coffee_choice) return "Debe seleccionar un jugo y un cafe";
    return "";
  };

  const contextStrip = (
    <div className="guestContext referenceContext">
      <span><Users size={25} /><b>Huesped:</b><strong>{draft.full_name || order?.guest_name}</strong></span>
      <span><DoorOpen size={26} /><b>{draft.delivery_location === "Habitacion" ? "Habitacion:" : "Mesa:"}</b><strong>{draft.delivery_location === "Habitacion" ? (draft.room_number || order?.room_number || "-") : (draft.table_number || order?.table_number || "-")}</strong></span>
      <span><Users size={25} /><b>Personas registradas:</b><strong>2</strong></span>
      {selectedBreakfast && <span><EggFried size={25} /><b>Desayuno seleccionado:</b><strong>{selectedBreakfast.name}</strong></span>}
      {selectedEgg && <span><Coffee size={25} /><b>Preparacion de huevos:</b><strong>{selectedEgg.name}</strong></span>}
    </div>
  );

  const includedDrinks = {
    juice: draft.juice_choice,
    coffee: draft.coffee_choice,
  };

  const displayOrder = order ? { ...order, included_drinks: includedDrinks } : { ...orderSummary, included_drinks: includedDrinks };

  const extrasScreen = (
    <GuestChrome title="SELECCION DE ADICIONALES" icon={<Coffee size={21} />}>
      <section className="breakfastScreen">
        {sharedMessages}
        {contextStrip}
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
          <BackButton onClick={() => setStep(addingExtras ? "status" : "drinks")} />
          <button className="portalPrimary navPrimary" onClick={addingExtras ? submitMoreExtras : submitDraft}>
            {addingExtras ? "Agregar al pedido" : "Continuar"} <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </GuestChrome>
  );

  if (step === "document") {
    return (
      <GuestChrome title="INICIO DE SESION" icon={<Users size={21} />} footer={false} className="loginPortal">
        <section className="documentScreen loginReferenceScreen">
          {sharedMessages}
          <div className="loginSplitCard">
            <div className="loginPane">
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
              <input value={draft.full_name} onChange={(event) => setDraft({ ...draft, full_name: onlyLetters(event.target.value) })} />
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
                  <input value={draft.room_number} inputMode="numeric" maxLength="3" placeholder="Ejemplo: 203" onChange={(event) => setDraft({ ...draft, room_number: onlyValidRoomInput(event.target.value, draft.room_number) })} />
                </Field>
              )}
              <p className="hintText">{draft.delivery_location === "Restaurante" ? "Solo se permiten numeros del 1 al 7" : "Ingrese una habitacion disponible"}</p>
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
          {contextStrip}
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
      <GuestChrome title="SELECCION DE PREPARACION DE HUEVOS" icon={<EggFried size={21} />}>
        <section className="breakfastScreen">
          {sharedMessages}
          {contextStrip}
          <div className="portalHeading">
            <h1>Seleccione la preparacion de sus huevos</h1>
            <p>Este desayuno incluye huevos, por favor elija como desea que los preparemos.</p>
          </div>
          <div className="inlineNotice"><Info size={22} /><b>Importante:</b><span>Debe seleccionar una opcion de preparacion.</span></div>
          <div className="eggChoiceGrid">
            {activeEggs.map((egg) => (
              <button key={egg.id} className={`eggChoice ${Number(draft.egg_prep_type_id) === egg.id ? "selected" : ""}`} onClick={() => setDraft({ ...draft, egg_prep_type_id: egg.id })}>
                <img src={EGG_IMAGES[egg.name] || `${ASSET_BASE}/egg-fritos.png`} alt={egg.name} />
                <div>
                  <span><EggFried size={24} /></span>
                  <strong>{egg.name}</strong>
                  <p>{EGG_DESCRIPTIONS[egg.name] || "Preparacion de huevos."}</p>
                </div>
                <i />
              </button>
            ))}
          </div>
          <div className="portalNav">
            <BackButton onClick={() => setStep("breakfast")} />
            <button className="portalPrimary navPrimary" onClick={() => {
              if (!draft.egg_prep_type_id) setMessage(REQUIRED_MESSAGE);
              else {
                setMessage("");
                setStep("drinks");
              }
            }}>
              Continuar <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "drinks") {
    return (
      <GuestChrome title="SELECCION DE BEBIDAS" icon={<Coffee size={21} />}>
        <section className="breakfastScreen">
          {sharedMessages}
          {contextStrip}
          <div className="portalHeading">
            <h1>Seleccione su bebida</h1>
            <p>Todos nuestros desayunos incluyen 1 jugo y 1 cafe.</p>
          </div>
          <div className="drinkSelectionGrid">
            <DrinkGroup
              title="Jugo"
              subtitle="Seleccione su jugo favorito"
              options={JUICE_OPTIONS}
              value={draft.juice_choice}
              onChange={(name) => setDraft({ ...draft, juice_choice: name })}
              tone="orange"
            />
            <DrinkGroup
              title="Cafe"
              subtitle="Seleccione su cafe favorito"
              options={COFFEE_OPTIONS}
              value={draft.coffee_choice}
              onChange={(name) => setDraft({ ...draft, coffee_choice: name })}
              tone="purple"
            />
          </div>
          <div className="inlineNotice drinksNotice"><Info size={22} /><b>Importante:</b><span>Las bebidas seleccionadas estan incluidas en su desayuno. No tienen costo adicional.</span></div>
          <div className="portalNav">
            <BackButton onClick={() => setStep(selectedBreakfast?.has_eggs ? "egg" : "breakfast")} />
            <button className="portalPrimary navPrimary" onClick={() => {
              const validation = validateDrinks();
              if (validation) setMessage(validation);
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
          {contextStrip}
          <div className="portalHeading">
            <h1>Revise los detalles de su pedido</h1>
            <p>Por favor verifique que toda la informacion sea correcta antes de confirmar.</p>
          </div>
          <div className="confirmationLayout">
            <div className="documentCard compactCard orderSummaryCard">
              <h2>Resumen de su desayuno</h2>
              <OrderSummary order={displayOrder} />
            </div>
            <div className="confirmationMedia">
              <img src={BREAKFAST_IMAGES[selectedBreakfast?.name] || `${ASSET_BASE}/Americano.png`} alt={selectedBreakfast?.name || "Desayuno"} />
              <div className="deliveryTime"><CalendarClock size={34} /><p><b>Tiempo estimado de entrega:</b><span>6 minutos</span></p></div>
            </div>
          </div>
          <div className="portalNav reviewActions">
              <BackButton onClick={() => setStep("extras")}>Editar</BackButton>
              <button className="portalPrimary navPrimary" onClick={confirm}>Confirmar</button>
          </div>
        </section>
      </GuestChrome>
    );
  }

  if (step === "status" && order) {
    const isCancelled = order.status === "Cancelado";
    return (
      <GuestChrome title={isCancelled ? "PEDIDO CANCELADO" : "ESTADO DEL PEDIDO"} icon={isCancelled ? <XCircle size={21} /> : <ClipboardList size={21} />}>
        <section className="reviewScreen">
          {sharedMessages}
          <div className="documentCard compactCard orderSummaryCard">
            <h1>{isCancelled ? "Su pedido fue cancelado" : "Resumen del pedido"}</h1>
            {isCancelled ? (
              <div className="cancelledGuestNotice">
                <XCircle size={28} />
                <p><b>Motivo:</b> {order.cancellation_reason || "Pedido cancelado por cocina"}</p>
              </div>
            ) : (
              <>
                <div className="statusTrack portalStatus">
                  {STATUS_FLOW.map((status) => <span key={status} className={STATUS_FLOW.indexOf(order.status) >= STATUS_FLOW.indexOf(status) ? "done" : ""}>{status}</span>)}
                </div>
                {order.status === "Entregado" && <p className="deliveredThanks">Su desayuno ha sido entregado. ¡Buen provecho!</p>}
              </>
            )}
            <OrderSummary order={displayOrder} />
            {!isCancelled && order.status !== "Entregado" && !hasRequestedMore && (
              <button className="hungerButton" onClick={() => {
                setDraft((current) => ({ ...current, extras: [] }));
                setAddingExtras(true);
                setStep("extras");
              }}>
                ¿Desea agregar algo más a su pedido?
              </button>
            )}
          </div>
        </section>
      </GuestChrome>
    );
  }

  return (
    <GuestChrome title="INICIO DE SESION" icon={<Users size={21} />} footer={false} className="loginPortal">
      <section className="documentScreen loginReferenceScreen">
        {sharedMessages}
        <div className="portalHeading">
          <h1>Estamos preparando tu sesión</h1>
          <p>Si la pantalla no avanza, vuelve a ingresar tu DNI.</p>
        </div>
        <div className="portalNav">
          <button className="portalPrimary navPrimary" onClick={() => {
            resetGuestSession();
          }}>
            Volver al inicio
          </button>
        </div>
      </section>
    </GuestChrome>
  );
}

function DrinkGroup({ title, subtitle, options, value, onChange, tone }) {
  return (
    <section className={`drinkGroup ${tone}`}>
      <div className="drinkGroupTitle">
        <span><Coffee size={30} /></span>
        <div>
          <h2>{title} <small>(incluido)</small></h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="drinkCards">
        {options.map((option) => (
          <button key={option.name} className={`drinkCard ${value === option.name ? "selected" : ""}`} onClick={() => onChange(option.name)}>
            <img src={option.image} alt={option.name} />
            <strong>{option.name}</strong>
            <i />
          </button>
        ))}
      </div>
    </section>
  );
}
