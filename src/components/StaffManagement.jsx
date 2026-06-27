import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Plus, Search, UserCheck, UserX } from "lucide-react";
import { api } from "../api/client";

const EMPTY_FORM = { name: "", dni: "", username: "", password: "", role: "Cocina", is_active: true };
const ROLES = ["Cocina", "Recepción", "Gerencia"];
const ROLE_LABELS = { cook: "Cocina", reception: "Recepción", receptionist: "Recepción", manager: "Gerencia" };
const normalizeRole = (role) => ROLE_LABELS[role] || role;

export function StaffManagement({ onMessage }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setUsers(await api.staff());
    } catch (error) {
      onMessage(error.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const query = search.trim().toLocaleLowerCase("es");
    const matchesSearch = !query || user.name.toLocaleLowerCase("es").includes(query) || user.dni.includes(query);
    const matchesRole = roleFilter === "Todos" || normalizeRole(user.role) === roleFilter;
    const matchesStatus = statusFilter === "Todos" || (statusFilter === "Activos" ? user.is_active : !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, search, roleFilter, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const editUser = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name, dni: user.dni, username: user.username || "", password: "", role: normalizeRole(user.role), is_active: user.is_active });
    document.querySelector(".userManagementForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editingId) await api.updateStaff(editingId, payload);
      else await api.createStaff(payload);
      onMessage(editingId ? "Usuario actualizado correctamente." : "Usuario registrado correctamente.");
      resetForm();
      await loadUsers();
    } catch (error) {
      onMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (user) => {
    try {
      await api.updateStaff(user.id, { ...user, role: normalizeRole(user.role), password: undefined, is_active: !user.is_active });
      onMessage(`Acceso de ${user.name} ${user.is_active ? "desactivado" : "activado"}.`);
      await loadUsers();
    } catch (error) {
      onMessage(error.message);
    }
  };

  return (
    <section className="userManagement">
      <div className="userManagementHeading">
        <div>
          <h2>Gestión de usuarios</h2>
          <p>Administre el personal autorizado y sus roles dentro del sistema.</p>
        </div>
      </div>

      <form className="userManagementForm" onSubmit={saveUser}>
        <div className="userFormTitle">
          <h3>{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
          <p>Registre los datos del personal y defina su nivel de acceso.</p>
        </div>
        <label>Nombre y apellidos
          <input required value={form.name} maxLength={120} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>DNI
          <input required inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value.replace(/\D/g, "") })} />
        </label>
        <label>Usuario
          <input required value={form.username} maxLength={60} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
        </label>
        <label>Contraseña
          <input type="password" required={!editingId} minLength={6} value={form.password} placeholder={editingId ? "Dejar en blanco para mantener" : "Contraseña"} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <label>Rol
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {ROLES.map((role) => <option key={role}>{role}</option>)}
          </select>
        </label>
        <label className="userActiveField">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
          Usuario activo
        </label>
        <div className="userFormActions">
          {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancelar</button>}
          <button type="submit" className="primary" disabled={saving}>
            {editingId ? <CheckCircle2 size={17} /> : <Plus size={17} />}
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </form>

      <div className="userDirectory">
        <div className="userFilters">
          <label className="userSearch"><Search size={17} /><input placeholder="Buscar por nombre o DNI" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option>Todos</option>{ROLES.map((role) => <option key={role}>{role}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Todos</option><option>Activos</option><option>Inactivos</option>
          </select>
        </div>
        <div className="userTableWrap">
          <table className="userTable">
            <thead><tr><th>Usuario</th><th>DNI</th><th>Acceso</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><span className="userAvatar">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><strong>{user.name}</strong></td>
                  <td>{user.dni}</td><td>{user.username}</td><td>{normalizeRole(user.role)}</td>
                  <td><span className={`userStatus ${user.is_active ? "active" : "inactive"}`}>{user.is_active ? "Activo" : "Inactivo"}</span></td>
                  <td><div className="userActions"><button type="button" title="Editar usuario" onClick={() => editUser(user)}><Edit3 size={16} /></button><button type="button" className={user.is_active ? "deactivate" : "activate"} title={user.is_active ? "Desactivar acceso" : "Activar acceso"} onClick={() => toggleUser(user)}>{user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}</button></div></td>
                </tr>
              ))}
              {!filteredUsers.length && <tr><td colSpan="6" className="emptyUsers">No se encontraron usuarios con estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
