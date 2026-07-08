import React, { useState, useEffect } from 'react';
import { FiSave, FiCheck } from 'react-icons/fi';
import { systemConfigService } from '../../services/api';

export default function Configuracion() {
  const [empresaNombre, setEmpresaNombre] = useState('PET PLACE');
  const [empresaSubtitulo, setEmpresaSubtitulo] = useState('SERVICIOS MÉDICOS VETERINARIOS');
  const [empresaDireccion, setEmpresaDireccion] = useState('Av. Benavides 1240, Miraflores, Lima');
  const [empresaTelefono, setEmpresaTelefono] = useState('(01) 445-8930');
  const [empresaEmail, setEmpresaEmail] = useState('contacto@petsplace.pe');
  const [empresaRuc, setEmpresaRuc] = useState('20608932451');

  const getLoggedUser = () => {
    try {
      const savedUser = sessionStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  };

  const logged = getLoggedUser();
  const [vetNombre, setVetNombre] = useState(logged?.nombre || 'Médico Veterinario');
  const [vetEspecialidad, setVetEspecialidad] = useState('MÉDICO VETERINARIO REGISTRADO');
  const [vetCmvp, setVetCmvp] = useState('C.M.V.P. 8412');

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await systemConfigService.get();
        if (config.empresaNombre) setEmpresaNombre(config.empresaNombre);
        if (config.empresaSubtitulo) setEmpresaSubtitulo(config.empresaSubtitulo);
        if (config.empresaDireccion) setEmpresaDireccion(config.empresaDireccion);
        if (config.empresaTelefono) setEmpresaTelefono(config.empresaTelefono);
        if (config.empresaEmail) setEmpresaEmail(config.empresaEmail);
        if (config.empresaRuc) setEmpresaRuc(config.empresaRuc);
        if (config.vetNombre) setVetNombre(config.vetNombre);
        if (config.vetEspecialidad) setVetEspecialidad(config.vetEspecialidad);
        if (config.vetCmvp) setVetCmvp(config.vetCmvp);
      } catch (e) {
        console.error('Error loading config', e);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const config = {
      empresaNombre,
      empresaSubtitulo,
      empresaDireccion,
      empresaTelefono,
      empresaEmail,
      empresaRuc,
      vetNombre,
      vetEspecialidad,
      vetCmvp
    };
    try {
      await systemConfigService.save(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Mensaje de Éxito */}
      {success && (
        <div className="flex items-center gap-2 bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] px-4 py-3 rounded-2xl shadow-sm text-xs font-bold animate-in slide-in-from-top-4">
          <FiCheck className="w-4 h-4" />
          <span>Configuración del sistema guardada con éxito. Los próximos certificados se generarán con estos datos.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* PANEL: DATOS DE LA EMPRESA */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 select-none border-b border-slate-50 pb-3">
            <span className="text-[#0d9488]">🏢</span> Datos de la Clínica Veterinaria
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Nombre de la Empresa</label>
              <input 
                type="text"
                value={empresaNombre}
                onChange={(e) => setEmpresaNombre(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Especialidad / Subtítulo</label>
              <input 
                type="text"
                value={empresaSubtitulo}
                onChange={(e) => setEmpresaSubtitulo(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Dirección Fiscal</label>
              <input 
                type="text"
                value={empresaDireccion}
                onChange={(e) => setEmpresaDireccion(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Teléfono de Contacto</label>
              <input 
                type="text"
                value={empresaTelefono}
                onChange={(e) => setEmpresaTelefono(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Correo Electrónico</label>
              <input 
                type="email"
                value={empresaEmail}
                onChange={(e) => setEmpresaEmail(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">R.U.C.</label>
              <input 
                type="text"
                value={empresaRuc}
                onChange={(e) => setEmpresaRuc(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
          </div>
        </div>

        {/* PANEL: DATOS DEL VETERINARIO */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 select-none border-b border-slate-50 pb-3">
            <span className="text-[#0d9488]">🩺</span> Datos del Veterinario(a) Asignado(a)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Nombre del Veterinario(a)</label>
              <input 
                type="text"
                value={vetNombre}
                onChange={(e) => setVetNombre(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Cargo / Rango</label>
              <input 
                type="text"
                value={vetEspecialidad}
                onChange={(e) => setVetEspecialidad(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-600 text-[11px]">Colegiatura (C.M.V.P.)</label>
              <input 
                type="text"
                value={vetCmvp}
                onChange={(e) => setVetCmvp(e.target.value)}
                className="h-9 border border-slate-200 rounded-xl px-3 focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
                required
              />
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold py-2.5 px-6 rounded-2xl shadow-sm transition-all border-0 cursor-pointer active:scale-95"
          >
            <FiSave className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
