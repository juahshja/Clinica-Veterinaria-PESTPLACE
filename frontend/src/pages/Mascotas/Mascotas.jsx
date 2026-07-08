import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { petService, clientService } from '../../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiCalendar, FiX } from 'react-icons/fi';

export default function Mascotas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const getRoleCode = () => {
    if (!user || !user.rol) return 'RECEPCION';
    const rol = (typeof user.rol === 'object' ? user.rol.nombre : user.rol) || '';
    if (rol.toUpperCase().includes('ADMIN')) return 'ADMIN';
    if (rol.toUpperCase().includes('VET')) return 'VET';
    return 'RECEPCION';
  };
  const role = getRoleCode();
  const [clientes, setClientes] = useState([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [specieFilter, setSpecieFilter] = useState('Todas las especies');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('Perro');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('Macho');
  const [edad, setEdad] = useState('');
  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');
  const [emoji, setEmoji] = useState('🐶');
  const [alergias, setAlergias] = useState('');
  const [notasClinicas, setNotasClinicas] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState('Activo');

  // Nuevo dueño inline
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [newOwnerNombre, setNewOwnerNombre] = useState('');
  const [newOwnerDni, setNewOwnerDni] = useState('');
  const [newOwnerTelefono, setNewOwnerTelefono] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerDireccion, setNewOwnerDireccion] = useState('');

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Se cargan en paralelo para evitar que un retraso en una petición bloquee a la otra
      const [pets, clients] = await Promise.all([
        petService.getAll(),
        clientService.getAll()
      ]);
      setMascotas(pets || []);
      setClientes(clients || []);
      if (clients && clients.length > 0) {
        setClienteId(clients[0].id.toString());
      }
    } catch (error) {
      console.error('Error al cargar mascotas/clientes:', error);
      alert('No se pudieron cargar los datos de mascotas. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Volver a la página 1 cada vez que cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, specieFilter]);

  // Cambiar emoji automáticamente según especie
  useEffect(() => {
    if (especie === 'Perro') setEmoji('🐶');
    else if (especie === 'Gato') setEmoji('🐱');
    else if (especie === 'Ave') setEmoji('🐦');
    else if (especie === 'Conejo') setEmoji('🐰');
    else setEmoji('🐾');
  }, [especie]);

  const handleOpenCreate = () => {
    setEditingPet(null);
    setNombre('');
    setEspecie('Perro');
    setRaza('');
    setSexo('Macho');
    setEdad('');
    setPeso('');
    setColor('');
    setAlergias('');
    setNotasClinicas('');
    setEstado('Activo');
    setIsNewOwner(false);
    setNewOwnerNombre('');
    setNewOwnerDni('');
    setNewOwnerTelefono('');
    setNewOwnerEmail('');
    setNewOwnerDireccion('');
    if (clientes.length > 0) {
      setClienteId(clientes[0].id.toString());
    }
    setShowModal(true);
  };

  const handleOpenEdit = (pet) => {
    setEditingPet(pet);
    setNombre(pet.nombre || '');
    setEspecie(pet.especie || 'Perro');
    setRaza(pet.raza || '');
    setSexo(pet.sexo || 'Macho');
    setEdad(pet.edad ? pet.edad.toString() : '');
    setPeso(pet.peso ? pet.peso.toString() : '');
    setColor(pet.color || '');
    setAlergias(pet.alergias || '');
    setNotasClinicas(pet.notasClinicas || '');
    setEstado(pet.estado || 'Activo');
    setIsNewOwner(false);
    setNewOwnerNombre('');
    setNewOwnerDni('');
    setNewOwnerTelefono('');
    setNewOwnerEmail('');
    setNewOwnerDireccion('');
    setClienteId(pet.clienteId ? pet.clienteId.toString() : (pet.cliente?.id ? pet.cliente.id.toString() : ''));
    setShowModal(true);
  };

  const handleDelete = async (pet) => {
    if (window.confirm(`¿Estás seguro de desactivar a la mascota ${pet.nombre}? (Se conservará todo su historial clínico y consultas en el sistema, pero figurará como Inactiva)`)) {
      await petService.delete(pet.id, pet.nombre);
      loadData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalClienteId = clienteId ? Number(clienteId) : null;

    if (isNewOwner) {
      // Validar duplicado de DNI
      const isDuplicate = clientes.some(c => c.dni === newOwnerDni);
      if (isDuplicate) {
        alert("Error: Ya existe un cliente registrado con el DNI ingresado.");
        return;
      }

      const newClient = await clientService.create({
        nombre: newOwnerNombre,
        dni: newOwnerDni,
        telefono: newOwnerTelefono,
        email: newOwnerEmail,
        direccion: newOwnerDireccion
      });

      if (newClient && newClient.id) {
        finalClienteId = newClient.id;
      } else {
        alert("Error al registrar el nuevo dueño. Por favor intente seleccionando uno existente.");
        return;
      }
    }

    const payload = {
      nombre,
      especie,
      raza,
      sexo,
      edad: edad ? Number(edad) : null,
      peso: peso ? Number(peso) : null,
      color,
      emoji,
      fechaNacimiento: editingPet?.fechaNacimiento || '2022-01-01',
      cliente: finalClienteId ? { id: Number(finalClienteId) } : null,
      alergias,
      notasClinicas,
      estado
    };

    if (editingPet) {
      await petService.update(editingPet.id, payload);
    } else {
      await petService.create(payload);
    }

    setShowModal(false);
    loadData();
  };

  // Filtrado de mascotas
  const filteredMascotas = mascotas.filter(pet => {
    const matchesSearch = 
      pet.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.raza?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.cliente?.telefono?.includes(searchTerm) ||
      `PET-00${pet.id}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecie = specieFilter === 'Todas las especies' || pet.especie === specieFilter;

    return matchesSearch && matchesSpecie;
  });

  // Paginación: 10 mascotas por página
  const totalPages = Math.max(1, Math.ceil(filteredMascotas.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMascotas = filteredMascotas.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 select-none">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>🐾 Mascotas</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">
              {mascotas.length} registradas
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Fichero clínico de pacientes de Pets Place
          </p>
        </div>
        {(role === 'ADMIN' || role === 'RECEPCION') && (
          <button 
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 !bg-cyan-400 hover:!bg-cyan-500 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-sm transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
          >
            <FiPlus className="w-4.5 h-4.5" />
            <span>Nuevo Paciente</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, dueño, teléfono, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Especie */}
        <select
          value={specieFilter}
          onChange={(e) => setSpecieFilter(e.target.value)}
          className="h-10 border border-slate-200 rounded-xl px-4 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-cyan-400"
        >
          <option value="Todas las especies">Todas las especies</option>
          <option value="Perro">Perros</option>
          <option value="Gato">Gatos</option>
          <option value="Ave">Aves</option>
          <option value="Conejo">Conejos</option>
        </select>
      </div>

      {/* Tabla de mascotas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-4 px-5">Foto</th>
                <th className="py-4 px-5">Mascota / Código</th>
                <th className="py-4 px-5">Especie / Raza</th>
                <th className="py-4 px-5">Dueño</th>
                <th className="py-4 px-5">Teléfono</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingData ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-bold text-xs">
                    Cargando mascotas...
                  </td>
                </tr>
              ) : paginatedMascotas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-bold text-xs">
                    No se encontraron mascotas registradas.
                  </td>
                </tr>
              ) : paginatedMascotas.map((pet) => (
                <tr key={pet.id} className="hover:bg-slate-50/30">
                  
                  {/* Foto/Emoji */}
                  <td className="py-3 px-5">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100">
                      {pet.emoji || '🐶'}
                    </div>
                  </td>

                  {/* Nombre y Código */}
                  <td className="py-3 px-5">
                    <div className="font-bold text-slate-800">{pet.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">PET-00{pet.id}</div>
                  </td>

                  {/* Especie / Raza */}
                  <td className="py-3 px-5">
                    <div className="font-bold text-slate-700">{pet.especie}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{pet.raza || 'Sin raza'}</div>
                  </td>

                  {/* Dueño */}
                  <td className="py-3 px-5 text-slate-600 font-semibold">
                    {pet.cliente?.nombre || 'Particular'}
                  </td>

                  {/* Teléfono */}
                  <td className="py-3 px-5 text-slate-500 font-semibold">
                    {pet.cliente?.telefono || '--'}
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      (pet.estado || 'Activo') === 'Activo' 
                        ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {pet.estado || 'Activo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/mascotas/perfil/${pet.id}`)}
                      className="px-3.5 h-9 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white font-extrabold rounded-xl text-[10px] shadow-sm shadow-cyan-500/10 transition-all duration-150 active:scale-95 cursor-pointer border-0"
                    >
                      Perfil
                    </button>
                    <button
                      onClick={() => handleOpenEdit(pet)}
                      className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-amber-50 hover:border-amber-200 text-slate-500 hover:text-amber-600 shadow-sm transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                      title="Editar"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/agenda')}
                      className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-500 hover:text-blue-600 shadow-sm transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                      title="Citas"
                    >
                      <FiCalendar className="w-4 h-4" />
                    </button>
                    {role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(pet)}
                        className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 shadow-sm transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación */}
        {!loadingData && filteredMascotas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[11px] text-slate-400 font-semibold">
              Mostrando {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredMascotas.length)} de {filteredMascotas.length} mascotas
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-extrabold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer"
              >
                ‹ Anterior
              </button>
              <span className="text-[11px] font-extrabold text-slate-500 px-2">
                Página {safePage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-extrabold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-all cursor-pointer"
              >
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR PACIENTE */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    🐾 {editingPet ? `Editar Mascota: ${editingPet.nombre}` : 'Registrar Nuevo Paciente'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Registra los datos de identidad, propietario responsable y ficha médica del animal.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="py-8 space-y-6 text-xs">
                
                {/* DATOS DE LA MASCOTA */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Información General</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre del Paciente</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Max"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Especie</label>
                      <select
                        value={especie}
                        onChange={(e) => setEspecie(e.target.value)}
                        className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                        <option value="Ave">Ave</option>
                        <option value="Conejo">Conejo</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Raza</label>
                      <input
                        type="text"
                        value={raza}
                        onChange={(e) => setRaza(e.target.value)}
                        placeholder="Ej. Golden Retriever"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Sexo</label>
                      <select
                        value={sexo}
                        onChange={(e) => setSexo(e.target.value)}
                        className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Edad (Años)</label>
                      <input
                        type="number"
                        value={edad}
                        onChange={(e) => setEdad(e.target.value)}
                        placeholder="Ej. 4"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Peso Inicial (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="Ej. 12.5"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Color</label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ej. Dorado"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Estado de Paciente</label>
                      <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DUENO RESPONSABLE */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Dueño Responsable</h4>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setIsNewOwner(false)}
                      className={`flex-1 h-9 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                        !isNewOwner 
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-600 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      👤 Dueño Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewOwner(true)}
                      className={`flex-1 h-9 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                        isNewOwner 
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-600 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ➕ Registrar Nuevo Dueño
                    </button>
                  </div>

                  {!isNewOwner ? (
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Seleccionar Propietario</label>
                      <select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                      >
                        {clientes.map(client => (
                          <option key={client.id} value={client.id}>
                            👤 {client.nombre} (DNI: {client.dni})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre Completo</label>
                        <input
                          type="text"
                          value={newOwnerNombre}
                          onChange={(e) => setNewOwnerNombre(e.target.value)}
                          placeholder="Ej. Carlos Mendoza"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-750 bg-white"
                          required={isNewOwner}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">DNI</label>
                          <input
                            type="text"
                            value={newOwnerDni}
                            onChange={(e) => setNewOwnerDni(e.target.value)}
                            placeholder="8 dígitos"
                            className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-750 bg-white"
                            required={isNewOwner}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Teléfono</label>
                          <input
                            type="text"
                            value={newOwnerTelefono}
                            onChange={(e) => setNewOwnerTelefono(e.target.value)}
                            placeholder="9 dígitos"
                            className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-755 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Correo Electrónico</label>
                        <input
                          type="email"
                          value={newOwnerEmail}
                          onChange={(e) => setNewOwnerEmail(e.target.value)}
                          placeholder="ejemplo@gmail.com"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-755 bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Dirección Residencial</label>
                        <input
                          type="text"
                          value={newOwnerDireccion}
                          onChange={(e) => setNewOwnerDireccion(e.target.value)}
                          placeholder="Ej. Av. Larco 123, Miraflores"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-755 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* FICHA MEDICA INICIAL */}
                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Ficha Médica Inicial</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Alergias Conocidas</label>
                      <input
                        type="text"
                        value={alergias}
                        onChange={(e) => setAlergias(e.target.value)}
                        placeholder="Ej. Penicilina, antiparasitarios o ninguna"
                        className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Notas Clínicas / Síntomas</label>
                      <textarea
                        value={notasClinicas}
                        onChange={(e) => setNotasClinicas(e.target.value)}
                        placeholder="Ej. Dieta especial baja en sodio"
                        className="w-full h-20 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTONES ACCION */}
                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer"
                  >
                    Guardar Paciente
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
