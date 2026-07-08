import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiEye, FiDownload, FiTrash, FiMessageCircle, 
  FiCalendar, FiFilter, FiCheck, FiX, FiCheckCircle, FiImage, FiTrendingUp 
} from 'react-icons/fi';
import { boletaService, productService, clientService } from '../../services/api';

export default function Boletas() {
  const [boletas, setBoletas] = useState([]);
  const [realClients, setRealClients] = useState([]);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterMetodo, setFilterMetodo] = useState('Todos');
  const [filterCajero, setFilterCajero] = useState('Todos');
  
  // Detalle e Inspección
  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [anularReason, setAnularReason] = useState('');
  const [boletaToAnular, setBoletaToAnular] = useState(null);

  const loadBoletas = async () => {
    try {
      const list = await boletaService.getAll();
      let clients = [];
      try {
        clients = await clientService.getAll();
      } catch (e) {
        console.warn("Could not fetch real clients", e);
      }
      setRealClients(clients || []);
      // Ordenar de más reciente a más antigua
      const sortedList = (list || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setBoletas(sortedList);
    } catch (err) {
      console.error("Error loading boletas", err);
    }
  };

  useEffect(() => {
    loadBoletas();
  }, []);

  const getDisplayClientAndPet = (b) => {
    if (!b) return { clientName: 'Público General', petName: 'General' };
    if (b.clienteNombre === 'Público General' || b.clienteNombre === 'Público General / Boleta Común') {
      return { clientName: 'Público General (Boleta Común)', petName: 'General' };
    }
    const exists = realClients.some(c => c.nombre.toLowerCase().trim() === b.clienteNombre.toLowerCase().trim());
    if (exists) {
      return { clientName: b.clienteNombre, petName: b.mascotaNombre || 'General' };
    }
    return { clientName: 'Público General (Boleta Común)', petName: 'General' };
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFechaDesde('');
    setFechaHasta('');
    setFilterEstado('Todos');
    setFilterMetodo('Todos');
    setFilterCajero('Todos');
  };

  // Filtrado de boletas
  const filteredBoletas = boletas.filter(b => {
    const { clientName, petName } = getDisplayClientAndPet(b);
    const matchesSearch = 
      b.nroBoleta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      petName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDesde = true;
    if (fechaDesde) {
      matchesDesde = new Date(b.fecha) >= new Date(fechaDesde);
    }
    
    let matchesHasta = true;
    if (fechaHasta) {
      // Fin del día para incluir la fecha seleccionada
      const endOfDay = new Date(fechaHasta);
      endOfDay.setHours(23, 59, 59, 999);
      matchesHasta = new Date(b.fecha) <= endOfDay;
    }

    const matchesEstado = filterEstado === 'Todos' || b.estado === filterEstado;
    const matchesMetodo = filterMetodo === 'Todos' || b.metodoPago.toLowerCase() === filterMetodo.toLowerCase();
    const matchesCajero = filterCajero === 'Todos' || b.cajero.toLowerCase() === filterCajero.toLowerCase();

    return matchesSearch && matchesDesde && matchesHasta && matchesEstado && matchesMetodo && matchesCajero;
  });

  // Métricas del Historial
  const getStats = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const hoyActive = boletas.filter(b => b.fecha && b.fecha.startsWith(todayStr) && b.estado === 'Activa');
    const totalHoy = hoyActive.reduce((sum, b) => sum + b.total, 0);
    
    const activas = boletas.filter(b => b.estado === 'Activa');
    const totalAcumulado = activas.reduce((sum, b) => sum + b.total, 0);
    
    const anuladas = boletas.filter(b => b.estado === 'Anulada');
    
    return {
      totalHoy,
      cantActivas: activas.length,
      cantAnuladas: anuladas.length,
      totalAcumulado
    };
  };

  const stats = getStats();

  const handleAnular = (boleta) => {
    setBoletaToAnular(boleta);
    setAnularReason('');
    setShowAnularModal(true);
  };

  const confirmAnular = async () => {
    if (!anularReason.trim()) {
      alert("Por favor introduce el motivo de la anulación.");
      return;
    }

    try {
      await boletaService.anular(boletaToAnular.id, anularReason);
      setShowAnularModal(false);
      loadBoletas();
    } catch (err) {
      console.error(err);
      alert("Error al anular boleta.");
    }
  };

  const getSystemConfig = () => {
    const defaults = {
      empresaNombre: 'PET PLACE',
      empresaSubtitulo: 'SERVICIOS MÉDICOS VETERINARIOS',
      empresaDireccion: 'Av. Benavides 1240, Miraflores, Lima',
      empresaTelefono: '(01) 445-8930',
      empresaEmail: 'contacto@petsplace.pe',
      empresaRuc: '20608932451'
    };
    const saved = localStorage.getItem('petplace_system_config');
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  };

  const handleDownloadPDF = async (boleta) => {
    const config = getSystemConfig();
    const { clientName, petName } = getDisplayClientAndPet(boleta);
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Boleta de Venta Electrónica - ${boleta.nroBoleta}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #000000 !important; line-height: 1.4; padding: 0; margin: 0; background: white; }
    .document-container { padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; min-height: 980px; }
    
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
    .clinic-title { font-size: 22px; font-weight: bold; color: #0d9488 !important; margin: 0; }
    .clinic-sub { font-size: 9px; color: #0f766e !important; font-weight: bold; text-transform: uppercase; }
    .clinic-details { font-size: 9px; color: #000000 !important; line-height: 1.4; opacity: 0.8; }
    
    .ruc-box { border: 1.5px solid #0d9488; padding: 10px 15px; border-radius: 8px; text-align: center; background: #f0fdfa; min-width: 180px; }
    .ruc-title { font-size: 11px; font-weight: bold; color: #0d9488 !important; margin: 0; }
    .ruc-number { font-size: 13px; font-weight: black; color: #0f766e !important; margin: 4px 0; }
    .ruc-type { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #0d9488 !important; }

    .client-section { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 10.5px; color: #000000 !important; }
    .client-row { display: flex; margin-bottom: 4px; }
    .client-label { width: 100px; font-weight: bold; color: #000000 !important; opacity: 0.7; }
    .client-val { color: #000000 !important; font-weight: bold; }

    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
    th { background: #f1f5f9; color: #000000 !important; font-weight: bold; border-bottom: 2px solid #cbd5e1; padding: 8px; text-align: left; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #cbd5e1; color: #000000 !important; }
    .text-right { text-align: right; }
    
    .totals-section { align-self: flex-end; width: 220px; margin-top: 20px; font-size: 10.5px; color: #000000 !important; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; color: #000000 !important; }
    .total-bold { font-weight: bold; color: #000000 !important; }
    .total-highlight { font-size: 12.5px; font-weight: black; color: #0d9488 !important; border-top: 1.5px solid #0d9488; padding-top: 6px; margin-top: 4px; }

    .footer { text-align: center; font-size: 8px; color: #000000 !important; opacity: 0.6; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: auto; }
    strong { color: #000000 !important; font-weight: bold; }
  </style>
</head>
<body>
  <div class="document-container">
    <div>
      <div class="invoice-header">
        <div>
          <h1 class="clinic-title">${config.empresaNombre}</h1>
          <span class="clinic-sub">${config.empresaSubtitulo}</span>
          <div class="clinic-details" style="margin-top: 6px;">
            ${config.empresaDireccion}<br>
            Telf: ${config.empresaTelefono} | Email: ${config.empresaEmail}
          </div>
        </div>
        <div class="ruc-box">
          <h4 class="ruc-title">BOLETA DE VENTA ELECTRÓNICA</h4>
          <p class="ruc-number">R.U.C. ${config.empresaRuc}</p>
          <span class="ruc-type">${boleta.nroBoleta}</span>
        </div>
      </div>

      <div class="client-section">
        <div class="client-row">
          <span class="client-label">Fecha Emisión:</span>
          <span class="client-val">${new Date(boleta.fecha).toLocaleString('es-ES')}</span>
        </div>
        <div class="client-row">
          <span class="client-label">Señor(es):</span>
          <span class="client-val">${clientName}</span>
        </div>
        <div class="client-row">
          <span class="client-label">D.N.I. / R.U.C.:</span>
          <span class="client-val">${boleta.clienteDni}</span>
        </div>
        <div class="client-row">
          <span class="client-label">Medio de Pago:</span>
          <span class="client-val" style="text-transform: uppercase;">${boleta.metodoPago}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción / Producto</th>
            <th class="text-right">P. Unitario</th>
            <th class="text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${boleta.detalles.map(d => `
            <tr>
              <td>${d.cantidad}</td>
              <td><strong style="color: #000000 !important;">${d.productoNombre}</strong></td>
              <td class="text-right">S/. ${d.precioUnitario.toFixed(2)}</td>
              <td class="text-right">S/. ${d.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display: flex; flex-direction: column; align-items: flex-end; margin-top: 15px;">
      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal Op. Gravada:</span>
          <span>S/. ${(boleta.total * 0.82).toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>I.G.V. (18%):</span>
          <span>S/. ${(boleta.total * 0.18).toFixed(2)}</span>
        </div>
        <div class="total-row total-highlight">
          <span>Importe Total:</span>
          <span>S/. ${boleta.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="footer" style="width: 100%; margin-top: 30px;">
        Representación impresa de la Boleta de Venta Electrónica.<br>
        ¡Muchas gracias por confiar en ${config.empresaNombre}!
      </div>
    </div>
  </div>
</body>
</html>`;

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });
    }

    const opt = {
      margin: 0.4,
      filename: `Boleta_${boleta.nroBoleta}_${clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    window.html2pdf().from(htmlContent).set(opt).save();
  };

  const handleDownloadPNG = async (boleta) => {
    const config = getSystemConfig();
    const { clientName, petName } = getDisplayClientAndPet(boleta);
    
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.body.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });
    }

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '420px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.padding = '25px';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.color = '#1e293b';

    tempDiv.innerHTML = `
      <div style="border: 2px solid #0d9488; border-radius: 16px; padding: 20px; background: #ffffff; color: #000000 !important;">
        <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px; margin-bottom: 15px;">
          <h2 style="margin: 0; color: #0d9488 !important; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">${config.empresaNombre.toUpperCase()}</h2>
          <span style="font-size: 8px; color: #0f766e !important; font-weight: bold; letter-spacing: 1px; display: block; margin-top: 2px; text-transform: uppercase;">${config.empresaSubtitulo}</span>
          <div style="font-size: 9px; color: #000000 !important; margin-top: 6px; line-height: 1.4;">
            R.U.C. ${config.empresaRuc}<br>
            ${config.empresaDireccion}<br>
            Telf: ${config.empresaTelefono}
          </div>
        </div>

        <div style="font-size: 10px; line-height: 1.6; margin-bottom: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 10px; color: #000000 !important;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">N° Boleta:</span>
            <span style="color: #000000 !important; font-weight: 900;">${boleta.nroBoleta}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">Fecha y Hora:</span>
            <span style="color: #000000 !important; font-weight: bold;">${new Date(boleta.fecha).toLocaleString('es-ES')}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">Emite:</span>
            <span style="color: #000000 !important; font-weight: bold;">${boleta.cajero || 'admin'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">Cliente:</span>
            <span style="color: #000000 !important; font-weight: bold;">${clientName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">Mascota:</span>
            <span style="color: #000000 !important; font-weight: bold;">${petName}</span>
          </div>
        </div>

        <div style="font-size: 10px; margin-bottom: 15px; color: #000000 !important;">
          <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold; color: #000000 !important; display: flex; justify-content: space-between;">
            <span>PRODUCTO</span>
            <span style="width: 50px; text-align: right;">TOTAL</span>
          </div>
          ${boleta.detalles.map(d => `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f1f5f9;">
              <div style="flex: 1; padding-right: 10px; text-align: left;">
                <div style="font-weight: bold; color: #000000 !important; font-size: 10.5px;">${d.productoNombre}</div>
                <div style="font-size: 9px; color: #000000 !important; opacity: 0.85;">${d.cantidad} x S/. ${d.precioUnitario.toFixed(2)}</div>
              </div>
              <span style="font-weight: bold; color: #0d9488 !important; align-self: center;">S/. ${d.subtotal.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 2px solid #cbd5e1; padding-top: 10px; font-size: 10.5px; font-weight: bold; color: #000000 !important; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
          <div style="display: flex; justify-content: space-between; width: 150px; color: #000000 !important;">
            <span>Subtotal:</span>
            <span>S/. ${(boleta.total * 0.82).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 150px; color: #000000 !important;">
            <span>I.G.V. (18%):</span>
            <span>S/. ${(boleta.total * 0.18).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; width: 170px; border-top: 1.5px solid #0d9488; padding-top: 6px; margin-top: 4px; color: #0d9488 !important; font-size: 12px; font-weight: 900;">
            <span>TOTAL NETO:</span>
            <span>S/. ${boleta.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 8px; color: #000000 !important; opacity: 0.7; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
          ¡Gracias por su preferencia!<br>
          PetPlace - Sistema POS
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      const canvas = await window.html2canvas(tempDiv, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Boleta_${boleta.nroBoleta}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating PNG boleta", err);
      alert("Error al generar la imagen PNG.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const getMethodBadgeClass = (method) => {
    switch (method.toLowerCase()) {
      case 'efectivo': return 'bg-sky-50 text-sky-600 border border-sky-100';
      case 'yape': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'tarjeta': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'transferencia': return 'bg-amber-50 text-amber-600 border border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-5 animate-in fade-in duration-200">
      
      {/* Cabecera / Info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div>
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span>🧾 Historial de Boletas</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
            Recaudada hoy: <span className="text-[#0d9488] font-black">S/. {stats.totalHoy.toFixed(2)}</span> · {stats.cantAnuladas} anulada(s)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {/* Card 1: Total hoy */}
        <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/10 border border-teal-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-teal-600/80 uppercase tracking-widest block">Total hoy</span>
            <span className="text-xl font-black text-teal-700">S/. {stats.totalHoy.toFixed(2)}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 shadow-inner">
            <FiTrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Boletas activas */}
        <div className="bg-gradient-to-br from-cyan-50/60 to-blue-50/10 border border-cyan-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-cyan-600/80 uppercase tracking-widest block">Boletas activas</span>
            <span className="text-xl font-black text-cyan-700">{stats.cantActivas}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shadow-inner">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Boletas anuladas */}
        <div className="bg-gradient-to-br from-rose-50/60 to-red-50/10 border border-rose-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-rose-600/80 uppercase tracking-widest block">Boletas anuladas</span>
            <span className="text-xl font-black text-rose-700">{stats.cantAnuladas}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner">
            <FiX className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total acumulado */}
        <div className="bg-gradient-to-br from-amber-50/60 to-yellow-50/10 border border-amber-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600/80 uppercase tracking-widest block">Total acumulado</span>
            <span className="text-xl font-black text-amber-700">S/. {stats.totalAcumulado.toFixed(2)}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner">
            <FiDownload className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 select-none">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FiFilter className="w-3.5 h-3.5 text-[#0d9488]" />
            Filtros de Búsqueda
          </span>
          <button 
            onClick={handleClearFilters}
            className="text-[9.5px] font-extrabold uppercase text-slate-400 hover:text-rose-500 border-0 bg-transparent cursor-pointer flex items-center gap-1 transition-colors"
          >
            <FiX className="w-3 h-3" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Buscar</label>
            <input
              type="text"
              placeholder="Boleta, cliente, mascota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Activa">Activas</option>
              <option value="Anulada">Anuladas</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Método</label>
            <select
              value={filterMetodo}
              onChange={(e) => setFilterMetodo(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Yape">Yape</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Cajero</label>
            <select
              value={filterCajero}
              onChange={(e) => setFilterCajero(e.target.value)}
              className="h-10 bg-slate-50/50 border border-slate-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/5 transition-all text-slate-800 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="admin">admin</option>
              <option value="recepción">Recepción</option>
            </select>
          </div>
        </div>

        {/* Info adicional del filtrado */}
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-3 pt-2">
          <span>📊 {filteredBoletas.length} boletas encontradas</span>
          <span>·</span>
          <span>🟢 Total activos: <strong className="text-[#0d9488]">S/. {filteredBoletas.filter(x => x.estado === 'Activa').reduce((sum, x) => sum + x.total, 0).toFixed(2)}</strong></span>
          <span>·</span>
          <span className="text-rose-500">🔴 Anuladas: {filteredBoletas.filter(x => x.estado === 'Anulada').length}</span>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left select-none">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-3">
              <th className="pb-3">N° Boleta</th>
              <th className="pb-3">Fecha / Hora</th>
              <th className="pb-3">Cliente / Mascota</th>
              <th className="pb-3">Productos</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Método</th>
              <th className="pb-3">Cajero</th>
              <th className="pb-3">Estado</th>
              <th className="pb-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-700">
            {filteredBoletas.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-slate-400 font-bold">Ninguna boleta coincide con los filtros aplicados.</td>
              </tr>
            ) : (
              filteredBoletas.map(b => {
                const { clientName, petName } = getDisplayClientAndPet(b);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 text-[#0d9488] font-black">{b.nroBoleta}</td>
                    <td className="py-3.5 text-slate-500 font-semibold">
                      {new Date(b.fecha).toLocaleDateString('es-ES')} {new Date(b.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5">
                      <div>{clientName}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{petName}</div>
                    </td>
                  <td className="py-3.5 max-w-[200px] truncate text-slate-500 font-semibold" title={b.detalles.map(x => x.productoNombre).join(', ')}>
                    {b.detalles.map(x => x.productoNombre).join(', ')}
                  </td>
                  <td className="py-3.5 text-[#0d9488] font-black">S/. {b.total.toFixed(2)}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold ${getMethodBadgeClass(b.metodoPago)}`}>
                      {b.metodoPago}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{b.cajero}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold ${b.estado === 'Activa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {b.estado}
                    </span>
                  </td>
                  <td className="py-3.5 text-right flex justify-end items-center gap-0.5">
                    <button
                      onClick={() => setSelectedBoleta(b)}
                      className="p-2 rounded-full !border-0 !bg-transparent text-slate-500 hover:!bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
                      title="Ver Detalle"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(b)}
                      className="p-2 rounded-full !border-0 !bg-transparent text-slate-500 hover:!bg-emerald-100/80 active:scale-95 transition-all cursor-pointer"
                      title="Imprimir PDF"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPNG(b)}
                      className="p-2 rounded-full !border-0 !bg-transparent text-sky-500 hover:!bg-sky-100/80 active:scale-95 transition-all cursor-pointer"
                      title="Descargar PNG"
                    >
                      <FiImage className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert("El servicio de envío por WhatsApp requiere la integración de Twilio API.")}
                      className="p-2 rounded-full !border-0 !bg-transparent text-emerald-500 hover:!bg-teal-100/80 active:scale-95 transition-all cursor-pointer"
                      title="Enviar por WhatsApp"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                    </button>
                    {b.estado === 'Activa' && (
                      <button
                        onClick={() => handleAnular(b)}
                        className="p-2 rounded-full !border-0 !bg-transparent text-rose-500 hover:!bg-rose-100/80 active:scale-95 transition-all cursor-pointer"
                        title="Anular Boleta"
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES DE BOLETA */}
      {selectedBoleta && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    📄 Detalle de Comprobante
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Nro de Boleta: {selectedBoleta.nroBoleta}</p>
                </div>
                <button 
                  onClick={() => setSelectedBoleta(null)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="py-8 space-y-6 text-xs select-none">
                
                {/* Datos generales */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs space-y-3 font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="text-slate-800 font-black">{getDisplayClientAndPet(selectedBoleta).clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paciente (Mascota):</span>
                    <span className="text-slate-800 font-black">{getDisplayClientAndPet(selectedBoleta).petName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DNI/RUC:</span>
                    <span className="text-slate-800 font-black">{selectedBoleta.clienteDni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha de Emisión:</span>
                    <span className="text-slate-800 font-black">{new Date(selectedBoleta.fecha).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cajero Autorizado:</span>
                    <span className="text-slate-800 font-black">{selectedBoleta.cajero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Método de Pago:</span>
                    <span className="text-cyan-600 bg-cyan-50 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">{selectedBoleta.metodoPago}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${selectedBoleta.estado === 'Activa' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      {selectedBoleta.estado}
                    </span>
                  </div>
                  {selectedBoleta.estado === 'Anulada' && selectedBoleta.anulacionMotivo && (
                    <div className="flex justify-between border-t border-rose-100/50 pt-3 text-rose-600">
                      <span>Motivo Anulación:</span>
                      <span className="font-black italic">{selectedBoleta.anulacionMotivo}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Productos / Servicios Facturados</h4>
                  <div className="space-y-2">
                    {selectedBoleta.detalles.map((d, index) => (
                      <div key={index} className="flex justify-between items-center text-xs bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
                        <div className="flex-1 truncate pr-2">
                          <span className="font-bold text-slate-800 text-xs block">{d.productoNombre}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Cantidad: {d.cantidad} x S/. {d.precioUnitario.toFixed(2)}</span>
                        </div>
                        <span className="font-extrabold text-cyan-600 bg-cyan-50/40 border border-cyan-100 px-3 py-1 rounded-xl">S/. {d.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-800">Total Facturado</span>
                  <span className="text-cyan-600 font-extrabold text-lg bg-cyan-50 px-4 py-1.5 rounded-2xl border border-cyan-100/50">S/. {selectedBoleta.total.toFixed(2)}</span>
                </div>

                {/* Acciones */}
                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedBoleta(null)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedBoleta)}
                    className="flex-1 h-11 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md shadow-cyan-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FiDownload />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPNG(selectedBoleta)}
                    className="flex-1 h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-extrabold shadow-md shadow-sky-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FiImage />
                    <span>PNG</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANULAR BOLETA */}
      {showAnularModal && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-rose-600 flex items-center gap-2">
                    ⚠️ Anular Comprobante
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Nro de Boleta: {boletaToAnular?.nroBoleta}</p>
                </div>
                <button 
                  onClick={() => setShowAnularModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="py-8 space-y-6 text-xs">
                
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold leading-relaxed text-rose-700">
                  <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-rose-800 mb-1">¡Advertencia de Anulación!</h4>
                  <p>Al anular este comprobante electrónico, se reintegrará de forma automática el stock de todos los productos y servicios asociados al inventario de la veterinaria. Esta acción no se puede deshacer.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Motivo de la Anulación</label>
                  <input 
                    type="text"
                    value={anularReason}
                    onChange={(e) => setAnularReason(e.target.value)}
                    placeholder="Ej. Error de monto / Devolución de producto"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-rose-455 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAnularModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAnular}
                    className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-extrabold shadow-md shadow-rose-500/10 transition-all active:scale-[0.97] border-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FiCheck />
                    <span>Confirmar Anulación</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
