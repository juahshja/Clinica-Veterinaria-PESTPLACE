import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { userService } from '../../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUser, FiMail, FiShield, FiInfo, FiX } from 'react-icons/fi';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('Veterinario');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const loadUsuarios = async () => {
    try {
      const data = await userService.getAll();
      setUsuarios(data || []);
      setErrorMsg('');
    } catch (err) {
      console.error("Error loading users", err);
      setErrorMsg(err.response?.data?.error || err.response?.data?.message || err.message);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setNombre('');
    setEmail('');
    setPassword('');
    setRol('Veterinario');
    setConfirmPassword('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setNombre(user.nombre || '');
    setEmail(user.email || '');
    setPassword('[PROTEGIDO]'); // Contraseña enmascarada
    setRol(user.rol?.nombre || 'Veterinario');
    setConfirmPassword('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario del sistema? Perderá acceso de inmediato.")) {
      await userService.delete(id);
      loadUsuarios();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar duplicado de email
    const isDuplicate = usuarios.some(u => u.email.toLowerCase() === email.toLowerCase() && (!editingUser || u.id !== editingUser.id));
    if (isDuplicate) {
      alert("Error: El correo electrónico ya está registrado por otro usuario.");
      return;
    }

    const payload = {
      nombre,
      email,
      rol,
      ...(password !== '[PROTEGIDO]' && password.trim() !== '' ? { password } : {}),
      ...(editingUser ? { confirmPassword } : {})
    };

    try {
      if (editingUser) {
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(payload);
      }
      setShowModal(false);
      loadUsuarios();
    } catch (err) {
      alert("Error al guardar usuario: " + (err.response?.data?.error || err.message));
    }
  };

  // Convertir rol a etiqueta amigable en la tabla
  const getRoleLabel = (rolName) => {
    if (!rolName) return 'Usuario';
    if (rolName.toUpperCase().includes('ADMIN')) return 'Administración';
    if (rolName.toUpperCase().includes('VET')) return 'Veterinario';
    return 'Personal de atención';
  };

  // Filtrado de usuarios
  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = 
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const userRol = u.rol?.nombre || '';
    const matchesRole = 
      roleFilter === 'TODOS' ||
      (roleFilter === 'ADMIN' && userRol.toUpperCase().includes('ADMIN')) ||
      (roleFilter === 'VET' && userRol.toUpperCase().includes('VET')) ||
      (roleFilter === 'RECEPCION' && userRol.toUpperCase().includes('ATENCION'));

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 select-none text-xs">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            👤 Gestión de Usuarios
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">
              {usuarios.length} registrados
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Administración del personal de la clínica y sus permisos de acceso
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-md shadow-cyan-500/10 transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
        >
          <FiPlus className="w-4.5 h-4.5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-rose-950">Error al cargar usuarios</h4>
            <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{errorMsg}. Por favor, cierra sesión y vuelve a ingresar si el problema persiste.</p>
          </div>
        </div>
      )}

      {/* Filtros e inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Buscador */}
        <div className="relative sm:col-span-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-400 transition-all font-semibold"
          />
        </div>

        {/* Roles dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 border border-slate-205 rounded-xl px-4 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
        >
          <option value="TODOS">Todos los roles</option>
          <option value="ADMIN">Administración</option>
          <option value="VET">Veterinarios</option>
          <option value="RECEPCION">Personal de atención</option>
        </select>
      </div>

      {/* Listado */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-4 px-5">Nombre Completo</th>
                <th className="py-4 px-5">Correo Electrónico</th>
                <th className="py-4 px-5">Rol asignado</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiInfo className="w-6 h-6 text-slate-350" />
                      <span>No se encontraron usuarios que coincidan con la búsqueda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-105 flex items-center justify-center text-slate-500 font-bold border border-slate-200/50">
                          {u.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-850">{u.nombre}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-1.5 text-slate-500"><FiMail className="text-slate-400 w-3.5 h-3.5" /> {u.email}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        u.rol?.nombre?.toUpperCase().includes('ADMIN')
                          ? 'bg-purple-50 text-purple-650 border-purple-100/50'
                          : u.rol?.nombre?.toUpperCase().includes('VET')
                            ? 'bg-blue-50 text-blue-650 border-blue-100/50'
                            : 'bg-teal-50 text-teal-650 border-teal-100/50'
                      }`}>
                        {getRoleLabel(u.rol?.nombre)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-slate-100 text-slate-400 hover:text-slate-700 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                        title="Editar"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={u.email === 'admin@petplace.com'} // Proteger al admin principal
                        className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-rose-50 disabled:opacity-20 text-slate-400 hover:text-rose-600 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREAR / EDITAR USUARIO */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    👤 {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Crea o edita cuentas de acceso con roles específicos.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="pt-4 space-y-4 text-xs">
                
                {/* Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Dr. Fernando Torres"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                {/* Correo */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@petplace.com"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">
                    {editingUser ? 'Contraseña (Dejar en blanco para no modificar)' : 'Contraseña de Acceso'}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required={!editingUser}
                  />
                </div>

                {/* Contraseña de Confirmación (Solo al editar) */}
                {editingUser && (
                  <div className="flex flex-col gap-2 p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <label className="font-extrabold text-rose-800 uppercase tracking-wider text-[9px]">
                      Contraseña Actual del Usuario (Requerido para autorizar)
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ingrese la contraseña vigente de esta cuenta"
                      className="h-10 border border-rose-200 rounded-xl px-4 focus:outline-none focus:border-rose-450 text-xs font-bold text-slate-700 bg-white"
                      required
                    />
                    <span className="text-[9px] text-rose-500 font-semibold leading-tight">
                      ⚠️ Requiere validar la identidad del usuario ingresando su contraseña actual antes de guardar.
                    </span>
                  </div>
                )}

                {/* Rol */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Rol del Sistema</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Veterinario">Veterinario</option>
                    <option value="Personal de atencion">Personal de atención</option>
                  </select>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-10 !border !border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 !text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] !border-0 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
