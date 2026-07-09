import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiSearch, FiTrash2, FiFileText, FiMessageCircle, FiCheck, 
  FiShoppingCart, FiX, FiImage 
} from 'react-icons/fi';
import { productService, boletaService, clientService, petService, billingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NuevaVenta() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Catálogo y Datos
  const [productos, setProductos] = useState([]);
  const [clientPetList, setClientPetList] = useState([]);
  const [selectedClientPet, setSelectedClientPet] = useState('Público General');
  const [pendingCharges, setPendingCharges] = useState([]);

  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Carrito
  const [cart, setCart] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreatedBoleta, setLastCreatedBoleta] = useState(null);

  const tabs = [
    'Todos', 'Alimento', 'Antiparasitario', 'Dermatología', 
    'Medicamento', 'Antibiótico', 'Accesorio', 'Suplemento', 'Servicio'
  ];



  const loadData = async () => {
    try {
      let prodList = await productService.getAll();
      setProductos(prodList || []);

      const pets = await petService.getAll();
      const list = [];
      if (pets && Array.isArray(pets)) {
        pets.forEach(pet => {
          if (pet && pet.cliente) {
            list.push({
              id: pet.id,
              label: `${pet.cliente.nombre || 'Cliente'} - ${pet.nombre || 'Mascota'}`,
              clienteNombre: pet.cliente.nombre || 'Cliente',
              clienteDni: pet.cliente.dni || '----------',
              mascotaNombre: pet.nombre || 'Mascota'
            });
          }
        });
      }
      setClientPetList(list);
    } catch (err) {
      console.error("Error loading POS data", err);
      setProductos([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.selectedPetId && clientPetList.length > 0) {
      const found = clientPetList.find(x => x.id.toString() === location.state.selectedPetId.toString());
      if (found) {
        setSelectedClientPet(found.label);
      }
    }
  }, [location.state, clientPetList]);

  useEffect(() => {
    if (selectedClientPet === 'Público General') {
      setPendingCharges([]);
      return;
    }
    const found = clientPetList.find(x => x.label === selectedClientPet);
    if (found) {
      const charges = billingService.getPendingCharges(found.id);
      setPendingCharges(charges || []);
    } else {
      setPendingCharges([]);
    }
  }, [selectedClientPet, clientPetList]);

  const handleLoadPendingCharges = () => {
    if (pendingCharges.length === 0) return;
    const newItems = pendingCharges.map(charge => {
      return {
        id: `CLINIC-${charge.id}`,
        nombre: charge.descripcion,
        sku: charge.tipo === 'Consulta' ? 'SER-CON' : 'SER-VAC',
        precio: charge.costo,
        cantidad: 1,
        categoria: 'Servicio',
        emoji: charge.tipo === 'Consulta' ? '🩺' : '💉'
      };
    });
    setCart(prevCart => {
      const filteredPrev = prevCart.filter(item => !String(item.id).startsWith('CLINIC-'));
      return [...filteredPrev, ...newItems];
    });
  };

  const handleAddToCart = (product) => {
    if (!product) return;
    if (product.stock <= 0 && product.categoria !== 'Servicio') {
      alert("Este producto no cuenta con stock disponible.");
      return;
    }
    
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex !== -1) {
      const updated = [...cart];
      if (product.categoria !== 'Servicio' && updated[existingIndex].cantidad >= product.stock) {
        alert(`Stock máximo alcanzado (${product.stock}).`);
        return;
      }
      updated[existingIndex].cantidad += 1;
      setCart(updated);
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
  };

  const handleUpdateQty = (id, val) => {
    const qty = parseInt(val);
    if (isNaN(qty) || qty <= 0) return;
    
    const item = cart.find(x => x.id === id);
    if (!item) return;
    if (item.categoria !== 'Servicio' && qty > item.stock) {
      alert(`El stock máximo es ${item.stock}`);
      return;
    }
    setCart(cart.map(x => x.id === id ? { ...x, cantidad: qty } : x));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + ((item.precio || 0) * item.cantidad), 0);
  const getIGV = () => getSubtotal() * 0.18;
  const getTotal = () => Math.max(0, getSubtotal() - Number(descuento));

  const handleClearCart = () => {
    setCart([]);
    setDescuento(0);
  };

  const getProductIcon = (item) => {
    if (!item) return '📦';
    if (item.emoji) return item.emoji;
    switch (item.categoria) {
      case 'Alimento': return '🦴';
      case 'Antiparasitario': return '💊';
      case 'Dermatología': return '🧴';
      case 'Medicamento': return '💊';
      case 'Antibiótico': return '💊';
      case 'Accesorio': return '🦮';
      case 'Suplemento': return '🧪';
      case 'Servicio': return '🩺';
      default: return '📦';
    }
  };

  const handleEmitirBoleta = async (e) => {
    if (e) e.preventDefault();
    if (cart.length === 0) {
      alert("Agrega productos al carrito.");
      return;
    }

    let cNombre = "Público General";
    let cDni = "----------";
    let mNombre = "General";

    if (selectedClientPet !== 'Público General') {
      const found = clientPetList.find(x => x.label === selectedClientPet);
      if (found) {
        cNombre = found.clienteNombre;
        cDni = found.clienteDni;
        mNombre = found.mascotaNombre;
      }
    }

    const payload = {
      nroBoleta: `B001-${Math.floor(10000 + Math.random() * 90000)}`,
      fecha: (() => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        return (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
      })(),
      clienteNombre: cNombre,
      clienteDni: cDni,
      mascotaNombre: mNombre,
      metodoPago: paymentMethod,
      cajero: user?.nombre || 'Administrador',
      estado: 'Activa',
      total: getTotal(),
      detalles: cart.map(x => ({
        productoId: x.id,
        productoNombre: x.nombre || 'Producto',
        cantidad: x.cantidad,
        precioUnitario: x.precio || 0,
        subtotal: (x.precio || 0) * x.cantidad
      }))
    };

    try {
      const created = await boletaService.create(payload);
      setLastCreatedBoleta(created);
      setShowSuccess(true);
      setCart([]);
      setDescuento(0);
      loadData(); // Recargar stock

      // Limpiar cargos clínicos pendientes pagados
      if (selectedClientPet !== 'Público General') {
        const found = clientPetList.find(x => x.label === selectedClientPet);
        if (found) {
          billingService.removePendingCharges(found.id);
          setPendingCharges([]);
        }
      }
      // Descargar boleta como PNG automáticamente al emitir
      setTimeout(() => {
        downloadBoletaAsPNG(created);
      }, 300);

      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      alert("Error al emitir boleta.");
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

  const downloadBoletaAsPNG = async (boleta) => {
    if (!boleta) return;
    const config = getSystemConfig();
    
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
            <span style="color: #000000 !important; font-weight: bold;">${boleta.clienteNombre}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #000000 !important; font-weight: bold;">Mascota:</span>
            <span style="color: #000000 !important; font-weight: bold;">${boleta.mascotaNombre || 'General'}</span>
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

  const filteredProducts = productos.filter(p => {
    if (!p) return false;
    const nameStr = p.nombre || '';
    const skuStr = p.sku || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          skuStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'Todos' || p.categoria === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Alerta Éxito */}
      {showSuccess && lastCreatedBoleta && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl shadow-sm text-xs font-bold animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-emerald-600" />
            <span>Comprobante emitido con éxito: <strong>{lastCreatedBoleta.nroBoleta}</strong> por S/. {lastCreatedBoleta.total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => downloadBoletaAsPNG(lastCreatedBoleta)} 
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl border-0 cursor-pointer font-bold transition-all text-[10px] flex items-center gap-1.5"
            >
              <FiImage className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>
            <button 
              onClick={() => navigate('/boletas')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl border-0 cursor-pointer font-bold transition-all text-[10px]"
            >
              Ver Historial
            </button>
          </div>
        </div>
      )}

      {/* DISEÑO FLEXBOX HORIZONTAL FORZADO (Izquierda Catálogo, Derecha Carrito) */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'start', width: '100%' }}>
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO Y TABS (Flex-1) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Cabecera / Buscador */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center select-none border-b border-slate-50 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>🛍️ Nueva Venta</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Selecciona productos o servicios</p>
              </div>
              <button 
                onClick={() => navigate('/boletas')}
                className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100/40 py-1.5 px-3.5 rounded-xl border-0 cursor-pointer transition-all active:scale-95"
              >
                Ver boletas →
              </button>
            </div>

            {/* Categorías (Tabs) */}
            <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-9 px-5 rounded-2xl text-[11px] font-black tracking-wide transition-all cursor-pointer flex-shrink-0 ${activeTab === tab ? '!bg-gradient-to-r !from-cyan-500 !to-teal-400 !text-white shadow-md shadow-cyan-500/15 border-0' : 'bg-slate-50/80 border border-slate-100 text-slate-500 hover:bg-slate-100/50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Input búsqueda */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <FiSearch className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Buscar producto o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/5 text-xs font-semibold text-slate-800 bg-slate-50/50 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Grilla de productos / servicios (Forzado a 3 columnas exactas) */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
              gap: '12px',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className={`bg-white border border-slate-100 hover:border-[#0d9488]/30 rounded-3xl p-5 shadow-sm text-center flex flex-col justify-between items-center hover:bg-[#0d9488]/5 transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${p.stock <= 0 && p.categoria !== 'Servicio' ? 'opacity-50' : ''}`}
              >
                {/* Icono grande en el medio */}
                <div className="w-12 h-12 bg-slate-50 text-2xl flex items-center justify-center rounded-2xl mb-3 shadow-inner">
                  {getProductIcon(p)}
                </div>
                
                <div className="space-y-1 text-center">
                  <h4 className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2 h-8 flex items-center justify-center">{p.nombre || 'Producto'}</h4>
                  <p className="text-xs font-black text-[#0d9488] pt-1">S/. {(p.precio || 0).toFixed(2)}</p>
                </div>

                <span className="text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400 mt-3 pt-2 border-t border-slate-100/60 w-full block">
                  {p.categoria === 'Servicio' ? 'Servicio' : p.stock > 0 ? `Stock ${p.stock}` : 'Sin stock'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO Y ACCIONES (Ancho fijo de 380px) */}
        <div style={{ width: '380px', flexShrink: 0 }}>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[580px] h-full">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 select-none">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>🛒 Carrito</span>
                </h3>
                <button
                  onClick={handleClearCart}
                  className="text-[9px] font-extrabold uppercase tracking-wider text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded-lg border-0 bg-transparent cursor-pointer transition-all"
                >
                  Limpiar
                </button>
              </div>

              {/* Selector Cliente / Mascota */}
              <div className="flex flex-col gap-1.5 select-none">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">CLIENTE / MASCOTA</label>
                <select
                  value={selectedClientPet}
                  onChange={(e) => setSelectedClientPet(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 px-3.5 focus:outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/5 text-xs text-slate-800 font-bold bg-slate-50/50 cursor-pointer transition-all shadow-sm"
                >
                  <option value="Público General">Público General / Boleta Común</option>
                  {clientPetList.map(cp => (
                    <option key={cp.id} value={cp.label}>{cp.label}</option>
                  ))}
                </select>
              </div>

              {/* Cargos Clínicos Pendientes */}
              {pendingCharges.length > 0 && (
                <div className="bg-amber-50/75 border border-amber-200/60 rounded-2xl p-3.5 space-y-2.5 animate-pulse select-none">
                  <div className="flex items-start gap-2">
                    <span className="text-base">⚠️</span>
                    <div className="flex-1">
                      <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Cargos Clínicos Pendientes</h4>
                      <p className="text-[9.5px] text-amber-600 font-semibold mt-0.5 leading-snug">
                        Esta mascota tiene evoluciones o vacunas registradas pendientes de cobro:
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 pl-6">
                    {pendingCharges.map(charge => (
                      <div key={charge.id} className="flex justify-between items-center text-[9.5px] font-bold text-amber-700">
                        <span>{charge.tipo === 'Consulta' ? '🩺' : '💉'} {charge.descripcion}</span>
                        <span>S/. {charge.costo.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleLoadPendingCharges}
                    className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[9px] uppercase tracking-wider shadow-sm transition-all duration-150 active:scale-95 border-0 cursor-pointer flex items-center justify-center gap-1"
                  >
                    📥 Cargar cargos al carrito
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-[10px] font-bold">Sin productos en el carrito</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50/50 border border-slate-100 p-2.5 rounded-2xl animate-in fade-in duration-150">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[10.5px] font-bold text-slate-800 truncate leading-tight">{item.nombre || 'Producto'}</h5>
                        <span className="text-[9px] text-[#0d9488] font-bold">S/. {(item.precio || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.categoria === 'Servicio' ? 99 : item.stock}
                          value={item.cantidad}
                          onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                          className="w-10 h-7 border border-slate-200 rounded-lg text-center text-[10.5px] font-bold focus:outline-none focus:border-[#0d9488]"
                        />
                        <button
                          onClick={() => setCart(cart.filter(x => x.id !== item.id))}
                          className="text-rose-400 hover:bg-rose-50 p-1.5 rounded-lg border-0 bg-transparent cursor-pointer transition-all"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totales y Métodos de Pago */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              
              {/* Formas de Pago en Grilla 2x2 */}
              <div className="grid grid-cols-2 gap-2 select-none">
                {[
                  { name: 'Efectivo', label: '💵 Efectivo' },
                  { name: 'Tarjeta', label: '💳 Tarjeta' },
                  { name: 'Yape', label: '📱 Yape' },
                  { name: 'Transferencia', label: '💸 Transferencia' }
                ].map(opt => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setPaymentMethod(opt.name)}
                    className={`h-10 rounded-2xl border text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${paymentMethod === opt.name ? '!bg-gradient-to-r !from-cyan-500 !to-teal-400 border-0 !text-white shadow-md shadow-cyan-500/15' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50/80'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Desglose de importes */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-[10.5px] font-bold text-slate-500 select-none">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>S/. {getSubtotal().toFixed(2)}</span>
                </div>
                
                {/* Descuento Editable */}
                <div className="flex justify-between items-center">
                  <span>Descuento</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px]">S/.</span>
                    <input
                      type="number"
                      min="0"
                      max={getSubtotal()}
                      value={descuento}
                      onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
                      className="w-12 h-6 border border-slate-200 rounded-lg text-center font-bold text-[10px] focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-slate-800 font-black border-t border-slate-200/60 pt-2.5 mt-1 items-center">
                  <span className="text-[11.5px] uppercase tracking-wide">TOTAL</span>
                  <span className="text-sm text-[#0d9488]">S/. {getTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal de Emisión */}
              <button
                onClick={handleEmitirBoleta}
                disabled={cart.length === 0}
                className="w-full h-12 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 disabled:!bg-slate-100 disabled:!from-slate-100 disabled:!to-slate-100 disabled:!text-slate-400 !text-white font-extrabold text-xs rounded-2xl shadow-md shadow-cyan-500/10 cursor-pointer border-0 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <FiShoppingCart className="w-4 h-4" />
                <span>COBRAR Y EMITIR BOLETA</span>
              </button>

              {/* Botones Secundarios PNG / WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (lastCreatedBoleta) {
                      downloadBoletaAsPNG(lastCreatedBoleta);
                    } else {
                      alert("Por favor emite la boleta primero cobrando el carrito para descargarla en formato PNG.");
                    }
                  }}
                  className={`h-10 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${lastCreatedBoleta ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' : 'border-slate-200 hover:bg-slate-50 text-slate-500 bg-white'}`}
                >
                  <FiImage className={`w-4 h-4 ${lastCreatedBoleta ? 'text-sky-500' : 'text-slate-400'}`} />
                  <span>PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("El servicio de envío por WhatsApp requiere la integración de Twilio API.")}
                  className="h-10 rounded-2xl border border-slate-200 hover:bg-slate-50 bg-white text-xs font-extrabold text-slate-500 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <FiMessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
