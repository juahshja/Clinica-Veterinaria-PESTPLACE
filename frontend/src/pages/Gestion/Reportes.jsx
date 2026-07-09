import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiCalendar, FiTrendingUp, FiUsers, FiDollarSign, 
  FiChevronRight, FiCreditCard, FiActivity, FiXCircle 
} from 'react-icons/fi';
import { boletaService, petService, clientService, consultationService, appointmentService } from '../../services/api';

export default function Reportes() {
  const [totalVentas, setTotalVentas] = useState(0);
  const [cantBoletas, setCantBoletas] = useState(0);
  const [cantMascotas, setCantMascotas] = useState(0);
  const [cantConsultas, setCantConsultas] = useState(0);
  const [cantCitasCompletadas, setCantCitasCompletadas] = useState(0);
  
  // Métodos de pago
  const [metodosPago, setMetodosPago] = useState({
    Efectivo: 0,
    Yape: 0,
    Tarjeta: 0,
    Transferencia: 0
  });

  // Citas por estado
  const [citasEstado, setCitasEstado] = useState({
    Pendiente: 0,
    Confirmada: 0,
    EnAtencion: 0,
    Completada: 0,
    Cancelada: 0,
    NoAsistio: 0
  });

  // Boletas anuladas
  const [boletasAnuladas, setBoletasAnuladas] = useState([]);

  // Top Veterinarios
  const [topVeterinarios, setTopVeterinarios] = useState([]);

  // Historial mensual de ingresos (para la gráfica de barras)
  const [monthlyRevenue, setMonthlyRevenue] = useState([
    { mes: 'Ene', valor: '0.0k', altura: '0%' },
    { mes: 'Feb', valor: '0.0k', altura: '0%' },
    { mes: 'Mar', valor: '0.0k', altura: '0%' },
    { mes: 'Abr', valor: '0.0k', altura: '0%' },
    { mes: 'May', valor: '0.0k', altura: '0%' },
    { mes: 'Jun', valor: '0.0k', altura: '0%' }
  ]);

  useEffect(() => {
    const loadRealMetrics = async () => {
      try {
        const boletaList = await boletaService.getAll();
        const petList = await petService.getAll();
        const consultList = await consultationService.getAll();
        const appointmentList = await appointmentService.getAll();

        setCantMascotas(petList.length);
        setCantConsultas(consultList.length);
        setCantBoletas(boletaList.length);

        // Ventas e ingresos activos
        const activas = boletaList.filter(b => b.estado === 'Activa');
        const sumSales = activas.reduce((sum, b) => sum + Number(b.total || 0), 0);
        setTotalVentas(sumSales);

        // Agrupar por métodos de pago
        const payMethods = { Efectivo: 0, Yape: 0, Tarjeta: 0, Transferencia: 0 };
        activas.forEach(b => {
          const method = b.metodoPago;
          if (method === 'Efectivo') payMethods.Efectivo += 1;
          else if (method === 'Yape') payMethods.Yape += 1;
          else if (method === 'Tarjeta') payMethods.Tarjeta += 1;
          else if (method === 'Transferencia') payMethods.Transferencia += 1;
        });
        setMetodosPago(payMethods);

        // Boletas anuladas reales
        const anuladas = boletaList.filter(b => b.estado === 'Anulada');
        setBoletasAnuladas(anuladas.map(b => ({
          nroBoleta: b.nroBoleta,
          cajero: b.cajero || 'Admin',
          motivo: b.anulacionMotivo || 'Error de monto'
        })));

        // Citas por estado
        const states = { Pendiente: 0, Confirmada: 0, EnAtencion: 0, Completada: 0, Cancelada: 0, NoAsistio: 0 };
        const vetCounts = {};
        appointmentList.forEach(a => {
          const status = a.estado;
          if (status === 'Pendiente') states.Pendiente += 1;
          else if (status === 'Confirmada') states.Confirmada += 1;
          else if (status === 'En atención') states.EnAtencion += 1;
          else if (status === 'Completada') states.Completada += 1;
          else if (status === 'Cancelada') states.Cancelada += 1;
          else if (status === 'No asistió') states.NoAsistio += 1;

          if (a.veterinario) {
            vetCounts[a.veterinario] = (vetCounts[a.veterinario] || 0) + 1;
          }
        });
        setCitasEstado(states);
        setCantCitasCompletadas(states.Completada);

        const computedTop = Object.entries(vetCounts)
          .map(([nombre, consultas]) => ({ nombre, consultas }))
          .sort((a, b) => b.consultas - a.consultas);
        setTopVeterinarios(computedTop);

        // Calcular ingresos de los últimos 6 meses dinámicamente
        const last6Months = [];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const year = d.getFullYear();
          const monthIndex = d.getMonth();
          const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
          last6Months.push({
            key,
            mes: `${monthNames[monthIndex]} ${String(year).substring(2)}`,
            valor: 0,
            rawVal: 0
          });
        }

        last6Months.forEach(m => {
          const matchingBoletas = activas.filter(b => b.fecha && b.fecha.startsWith(m.key));
          const total = matchingBoletas.reduce((sum, b) => sum + Number(b.total || 0), 0);
          m.rawVal = total;
          m.valor = Number((total / 1000).toFixed(1)); // en miles (k)
        });

        const maxVal = Math.max(...last6Months.map(m => m.rawVal), 1);
        const computedMonthlyRevenue = last6Months.map(m => ({
          mes: m.mes,
          valor: `${m.valor}k`,
          altura: `${Math.round((m.rawVal / maxVal) * 100)}%`
        }));
        setMonthlyRevenue(computedMonthlyRevenue);

      } catch (err) {
        console.error("Error updating stats", err);
      }
    };
    loadRealMetrics();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-5 animate-in fade-in duration-200 select-none">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span>📈 Reportes Gerenciales</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Métricas de rendimiento clínico y comercial</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4 h-20">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Consultas totales</span>
            <span className="text-base font-black text-slate-800">{cantConsultas}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4 h-20">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Citas completadas</span>
            <span className="text-base font-black text-slate-800">{cantCitasCompletadas}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4 h-20">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0d9488] flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Ingresos totales</span>
            <span className="text-base font-black text-[#0d9488]">S/. {totalVentas.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4 h-20">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Pacientes</span>
            <span className="text-base font-black text-slate-800">{cantMascotas}</span>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA (8/12 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Ingresos mensuales (Gráfica de Barras) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-6">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              💰 Ingresos mensuales (S/.)
            </h3>
            
            <div className="flex justify-between items-end h-56 pt-6 px-4 border-b border-slate-100 relative">
              {monthlyRevenue.map((m, idx) => (
                <div key={idx} className="flex flex-col items-center w-12 h-full justify-end group">
                  <span className="text-[9px] font-extrabold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {m.valor}
                  </span>
                  <div 
                    style={{ height: m.altura }} 
                    className="w-8 bg-gradient-to-t from-[#0d9488]/80 to-[#22d3ee]/80 hover:from-[#0f766e] hover:to-[#06b6d4] rounded-t-lg transition-all duration-300 relative"
                  />
                  <span className="text-[10px] font-bold text-slate-600 mt-2">{m.mes}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Citas por estado */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              📋 Citas por estado
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Pendiente', count: citasEstado.Pendiente, color: 'bg-slate-300' },
                { label: 'Confirmada', count: citasEstado.Confirmada, color: 'bg-[#0d9488]' },
                { label: 'En atención', count: citasEstado.EnAtencion, color: 'bg-cyan-500' },
                { label: 'Completada', count: citasEstado.Completada, color: 'bg-purple-500' },
                { label: 'Cancelada', count: citasEstado.Cancelada, color: 'bg-rose-500' },
                { label: 'No asistió', count: citasEstado.NoAsistio, color: 'bg-slate-400' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, (item.count / 10) * 100)}%` }} 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA (4/12 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Métodos de Pago */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
              💳 Métodos de pago
            </h3>
            
            <div className="space-y-2 text-[10.5px] font-bold text-slate-700">
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl">
                <span>Efectivo</span>
                <span className="text-[#0d9488] font-black">{metodosPago.Efectivo} ventas</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl">
                <span>Yape</span>
                <span className="text-[#0d9488] font-black">{metodosPago.Yape} ventas</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl">
                <span>Tarjeta</span>
                <span className="text-[#0d9488] font-black">{metodosPago.Tarjeta} ventas</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl">
                <span>Transferencia</span>
                <span className="text-[#0d9488] font-black">{metodosPago.Transferencia} ventas</span>
              </div>
            </div>
          </div>

          {/* Boletas anuladas */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider text-rose-500 border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <FiXCircle className="w-4 h-4" />
              Boletas anuladas
            </h3>
            
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {boletasAnuladas.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold text-center py-4">Sin boletas anuladas</p>
              ) : (
                boletasAnuladas.map((b, idx) => (
                  <div key={idx} className="bg-rose-50/30 border border-rose-100/50 p-2.5 rounded-xl text-[10.5px]">
                    <div className="flex justify-between font-black text-rose-700">
                      <span>{b.nroBoleta}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-bold">Por: {b.cajero} · {b.motivo}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Veterinarios */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
              🩺 Top Veterinarios
            </h3>
            
            <div className="space-y-2">
              {topVeterinarios.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold text-center py-4">Sin datos de veterinarios</p>
              ) : (
                topVeterinarios.map((v, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl text-[10.5px] font-bold text-slate-700">
                    <span>{v.nombre}</span>
                    <span className="bg-teal-50 text-[#0d9488] px-2 py-0.5 rounded-lg text-[9.5px] font-black">
                      {v.consultas} citas.
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
