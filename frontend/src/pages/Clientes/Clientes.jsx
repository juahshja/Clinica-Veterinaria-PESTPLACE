import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clientService } from '../../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMapPin, FiMail, FiPhone, FiX } from 'react-icons/fi';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  const loadClientes = async () => {
    const data = await clientService.getAll();
    setClientes(data);
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setNombre('');
    setDni('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setShowModal(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setNombre(client.nombre || '');
    setDni(client.dni || '');
    setTelefono(client.telefono || '');
    setEmail(client.email || '');
    setDireccion(client.direccion || '');
    setShowModal(true);
  };

  const handleDelete = async (c) => {
    if (window.confirm(`¿Estás seguro de eliminar al propietario ${c.nombre}? Se borrarán sus datos asociados.`)) {
      await clientService.delete(c.id, c.nombre);
      loadClientes();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar duplicado de DNI
    const isDuplicate = clientes.some(c => c.dni === dni && (!editingClient || c.id !== editingClient.id));
    if (isDuplicate) {
      alert("Error: Ya existe un cliente registrado con el mismo DNI.");
      return;
    }

    const payload = { nombre, dni, telefono, email, direccion };

    if (editingClient) {
      await clientService.update(editingClient.id, payload);
    } else {
      await clientService.create(payload);
    }

    setShowModal(false);
    loadClientes();
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dni?.includes(searchTerm) ||
    c.telefono?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none text-xs">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            👤 Clientes / Dueños
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">
              {clientes.length} registrados
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Gestión de propietarios de mascotas
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-md shadow-cyan-500/10 transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
        >
          <FiPlus className="w-4.5 h-4.5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <FiSearch className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar cliente por nombre, DNI, teléfono o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>

      {/* Listado */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-4 px-5">Nombre</th>
                <th className="py-4 px-5">DNI</th>
                <th className="py-4 px-5">Teléfono</th>
                <th className="py-4 px-5">Correo</th>
                <th className="py-4 px-5">Dirección</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredClientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/30">
                  <td className="py-3 px-5 font-bold text-slate-850">{c.nombre}</td>
                  <td className="py-3 px-5 text-slate-500">{c.dni}</td>
                  <td className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><FiPhone className="text-slate-400" /> {c.telefono || '--'}</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><FiMail className="text-slate-400" /> {c.email || '--'}</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className="flex items-center gap-1.5"><FiMapPin className="text-slate-400" /> {c.direccion || '--'}</span>
                  </td>
                  <td className="py-3 px-5 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-slate-100 text-slate-400 hover:text-slate-700 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                      title="Editar"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-rose-50 text-slate-400 hover:text-rose-600 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                      title="Eliminar"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREAR / EDITAR CLIENTE */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    👤 {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Ingresa la información personal y datos de contacto del propietario.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="py-8 space-y-6 text-xs">
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">DNI</label>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="8 dígitos"
                      className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="9 dígitos"
                      className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Dirección Residencial</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Av. Larco 123, Miraflores"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 !border !border-slate-200 bg-white rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer"
                  >
                    Guardar Cliente
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
