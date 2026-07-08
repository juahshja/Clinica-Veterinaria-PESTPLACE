import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { specialtyService, vaccineService } from '../../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function Especialidades() {
  const [activeTab, setActiveTab] = useState('especialidades'); // 'especialidades' | 'vacunas'
  const [especialidades, setEspecialidades] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields - Especialidades
  const [specNombre, setSpecNombre] = useState('');
  const [specDescripcion, setSpecDescripcion] = useState('');
  const [specEstado, setSpecEstado] = useState('Activo');

  // Form Fields - Vacunas
  const [vacNombre, setVacNombre] = useState('');
  const [vacEspecieDestino, setVacEspecieDestino] = useState('Gato');
  const [vacDosis, setVacDosis] = useState('1 ml');
  const [vacDiasRefuerzo, setVacDiasRefuerzo] = useState(365);
  const [vacDescripcion, setVacDescripcion] = useState('');

  const loadData = async () => {
    try {
      const specList = await specialtyService.getAll();
      setEspecialidades(specList || []);
      const vacList = await vaccineService.getAll();
      setVacunas(vacList || []);
    } catch (e) {
      console.error("Error al cargar los catálogos", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeTab === 'especialidades') {
      setSpecNombre('');
      setSpecDescripcion('');
      setSpecEstado('Activo');
    } else {
      setVacNombre('');
      setVacEspecieDestino('Gato');
      setVacDosis('1 ml');
      setVacDiasRefuerzo(365);
      setVacDescripcion('');
    }
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'especialidades') {
      setSpecNombre(item.nombre || '');
      setSpecDescripcion(item.descripcion || '');
      setSpecEstado(item.estado || 'Activo');
    } else {
      setVacNombre(item.nombre || '');
      setVacEspecieDestino(item.especieDestino || 'Gato');
      setVacDosis(item.dosis || '1 ml');
      setVacDiasRefuerzo(item.diasRefuerzo || 365);
      setVacDescripcion(item.descripcion || '');
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const isSpecialty = activeTab === 'especialidades';
    const confirmMessage = isSpecialty 
      ? "¿Estás seguro de eliminar esta especialidad?" 
      : "¿Estás seguro de eliminar esta vacuna del catálogo?";
    
    if (window.confirm(confirmMessage)) {
      if (isSpecialty) {
        await specialtyService.delete(id);
      } else {
        await vaccineService.delete(id);
      }
      loadData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSpecialty = activeTab === 'especialidades';

    try {
      if (isSpecialty) {
        const payload = { 
          nombre: specNombre, 
          descripcion: specDescripcion, 
          estado: specEstado 
        };
        if (editingItem) {
          await specialtyService.update(editingItem.id, payload);
        } else {
          await specialtyService.create(payload);
        }
      } else {
        const payload = { 
          nombre: vacNombre, 
          especieDestino: vacEspecieDestino, 
          dosis: vacDosis, 
          diasRefuerzo: Number(vacDiasRefuerzo), 
          descripcion: vacDescripcion 
        };
        if (editingItem) {
          await vaccineService.update(editingItem.id, payload);
        } else {
          await vaccineService.create(payload);
        }
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la información");
    }
  };

  const filteredEspecialidades = especialidades.filter(s => 
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVacunas = vacunas.filter(v => 
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.especieDestino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none text-xs">
      
      {/* Selector de Pestañas Principales */}
      <div className="flex gap-2 p-1 bg-slate-100/80 rounded-2xl max-w-sm border border-slate-200/50">
        <button
          onClick={() => { setActiveTab('especialidades'); setSearchTerm(''); }}
          className={`flex-1 h-9 font-extrabold rounded-xl border-0 transition-all cursor-pointer ${
            activeTab === 'especialidades' 
              ? 'bg-white text-[#0d9488] shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⭐ Especialidades
        </button>
        <button
          onClick={() => { setActiveTab('vacunas'); setSearchTerm(''); }}
          className={`flex-1 h-9 font-extrabold rounded-xl border-0 transition-all cursor-pointer ${
            activeTab === 'vacunas' 
              ? 'bg-white text-[#0d9488] shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          💉 Vacunas
        </button>
      </div>

      {/* Cabecera Dinámica */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'especialidades' ? '⭐ Especialidades Veterinarias' : '💉 Catálogo de Vacunas'}
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">
              {activeTab === 'especialidades' ? especialidades.length : vacunas.length} registradas
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            {activeTab === 'especialidades' 
              ? 'Áreas de especialización del personal clínico de Petsplace' 
              : 'Listado global de vacunas disponibles para inoculación veterinaria'}
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-md shadow-cyan-500/10 transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
        >
          <FiPlus className="w-4.5 h-4.5" />
          <span>{activeTab === 'especialidades' ? 'Nueva Especialidad' : 'Nueva Vacuna'}</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <FiSearch className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder={activeTab === 'especialidades' 
            ? "Buscar especialidad por nombre o descripción..." 
            : "Buscar vacuna por nombre, especie de destino..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>

      {/* Listados */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'especialidades' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-5">Nombre</th>
                  <th className="py-4 px-5">Descripción</th>
                  <th className="py-4 px-5">Estado</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredEspecialidades.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 px-5 text-center text-slate-400">
                      No hay especialidades registradas en el catálogo.
                    </td>
                  </tr>
                ) : (
                  filteredEspecialidades.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-5 font-bold text-slate-850">{s.nombre}</td>
                      <td className="py-3 px-5 text-slate-500 max-w-md truncate">{s.descripcion || '--'}</td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          s.estado === 'Activo' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-slate-100 text-slate-400 hover:text-slate-700 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-rose-50 text-slate-400 hover:text-rose-600 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
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
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-5">Nombre</th>
                  <th className="py-4 px-5">Especie Destino</th>
                  <th className="py-4 px-5">Dosis</th>
                  <th className="py-4 px-5">Días Refuerzo</th>
                  <th className="py-4 px-5">Descripción</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredVacunas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 px-5 text-center text-slate-400">
                      No hay vacunas registradas en el catálogo de base de datos.
                    </td>
                  </tr>
                ) : (
                  filteredVacunas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/30">
                      <td className="py-3 px-5 font-bold text-slate-850">{v.nombre}</td>
                      <td className="py-3 px-5 text-slate-550 font-bold">{v.especieDestino || 'Todas'}</td>
                      <td className="py-3 px-5 text-slate-500 font-bold">{v.dosis || '--'}</td>
                      <td className="py-3 px-5 text-slate-500 font-bold">{v.diasRefuerzo} días</td>
                      <td className="py-3 px-5 text-slate-500 max-w-xs truncate">{v.descripcion || '--'}</td>
                      <td className="py-3 px-5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-slate-100 text-slate-400 hover:text-slate-700 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="h-9 w-9 rounded-full !border-0 !bg-transparent hover:!bg-rose-50 text-slate-400 hover:text-rose-600 transition-all duration-150 active:scale-90 inline-flex items-center justify-center cursor-pointer"
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
          )}
        </div>
        
        {/* MODAL REUSABLE CON CONDICIONAL PARA AMBOS FORMULARIOS */}
        {showModal && createPortal(
          <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      {activeTab === 'especialidades' 
                        ? `🩺 ${editingItem ? 'Editar Especialidad' : 'Registrar Especialidad'}` 
                        : `💉 ${editingItem ? 'Editar Vacuna del Catálogo' : 'Catalogar Nueva Vacuna'}`}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">
                      {activeTab === 'especialidades' 
                        ? 'Registra las áreas de especialización médica para el personal de la clínica.' 
                        : 'Registra las vacunas oficiales disponibles para asignación en el historial.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="py-8 space-y-6 text-xs">
                  
                  {activeTab === 'especialidades' ? (
                    // FORMULARIO ESPECIALIDADES
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre de la Especialidad</label>
                        <input
                          type="text"
                          value={specNombre}
                          onChange={(e) => setSpecNombre(e.target.value)}
                          placeholder="Ej. Cardiología, Fisioterapia"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Descripción</label>
                        <textarea
                          value={specDescripcion}
                          onChange={(e) => setSpecDescripcion(e.target.value)}
                          className="w-full h-24 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                          placeholder="Escribe la descripción de la especialidad..."
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Estado de Especialidad</label>
                        <select
                          value={specEstado}
                          onChange={(e) => setSpecEstado(e.target.value)}
                          className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    // FORMULARIO VACUNAS
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre de la Vacuna</label>
                        <input
                          type="text"
                          value={vacNombre}
                          onChange={(e) => setVacNombre(e.target.value)}
                          placeholder="Ej. Triple Felina, Parvovirus, Antirrábica"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Especie de Destino</label>
                          <select
                            value={vacEspecieDestino}
                            onChange={(e) => setVacEspecieDestino(e.target.value)}
                            className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                          >
                            <option value="Gato">Gato</option>
                            <option value="Perro">Perro</option>
                            <option value="Conejo">Conejo</option>
                            <option value="Todos">Todas las especies</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Dosis Recomendada</label>
                          <input
                            type="text"
                            value={vacDosis}
                            onChange={(e) => setVacDosis(e.target.value)}
                            placeholder="Ej. 1 ml, 0.5 ml"
                            className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Días para Refuerzo Anual</label>
                        <input
                          type="number"
                          value={vacDiasRefuerzo}
                          onChange={(e) => setVacDiasRefuerzo(e.target.value)}
                          placeholder="Ej. 365"
                          className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                          min="1"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Descripción</label>
                        <textarea
                          value={vacDescripcion}
                          onChange={(e) => setVacDescripcion(e.target.value)}
                          className="w-full h-24 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                          placeholder="Escribe detalles adicionales de la vacuna..."
                        />
                      </div>
                    </>
                  )}

                  {/* Botones de Guardar / Cancelar */}
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
                      {editingItem ? 'Guardar Cambios' : 'Registrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
