import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, petService, consultationService, auditService, boletaService, productService } from '../../services/api';
import { 
  FiUsers, FiCalendar, FiDollarSign, FiShield, 
  FiClock, FiTrendingUp, FiArrowRight, FiActivity
} from 'react-icons/fi';

// Formateador de moneda en soles
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    pacientesCount: 0,
    citasHoy: 0,
    ingresosHoy: 0,
    vacunasVencidas: 0
  });
  const [citasHoy, setCitasHoy] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([
    { mes: 'Ene', valor: 0, pct: '0%', rawVal: 0 },
    { mes: 'Feb', valor: 0, pct: '0%', rawVal: 0 },
    { mes: 'Mar', valor: 0, pct: '0%', rawVal: 0 },
    { mes: 'Abr', valor: 0, pct: '0%', rawVal: 0 },
    { mes: 'May', valor: 0, pct: '0%', rawVal: 0 },
    { mes: 'Jun', valor: 0, pct: '0%', rawVal: 0 }
  ]);
  const [chartSummary, setChartSummary] = useState({ total: 0, promedio: 0 });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      // 1. Obtener citas de hoy
      let todayCitas = [];
      try {
        todayCitas = await appointmentService.getAll(todayStr);
      } catch (e) {
        console.error("Error fetching today's appointments", e);
      }
      setCitasHoy(todayCitas);

      // 2. Obtener todas las mascotas para el conteo
      let allPets = [];
      try {
        allPets = await petService.getAll();
      } catch (e) {
        console.error("Error fetching pets", e);
      }

      // 3. Obtener boletas reales desde la base de datos
      let boletas = [];
      try {
        boletas = await boletaService.getAll();
      } catch (e) {
        console.error("Error fetching boletas", e);
      }

      // 4. Obtener productos reales desde la base de datos
      let productos = [];
      try {
        productos = await productService.getAll();
      } catch (e) {
        console.error("Error fetching products", e);
      }
      
      // Contar vacunas vencidas y alertas dinámicas desde las mascotas reales de la base de datos
      let vencidasCount = 0;
      const dynamicAlerts = [];

      try {
        for (const pet of allPets) {
          const petVacunas = await petService.getVacunas(pet.id);
          const vencidas = (petVacunas || []).filter(v => v.estado === 'Vencida');
          vencidasCount += vencidas.length;

          vencidas.forEach(v => {
            dynamicAlerts.push({
              type: 'vaccine',
              title: `Vacuna vencida - ${pet.nombre}`,
              description: v.vacuna?.nombre || 'Vacuna',
              icon: '💉',
              bgColor: 'bg-rose-50/50',
              borderColor: 'border-rose-100/60',
              iconColor: 'text-rose-500'
            });
          });
        }
      } catch (e) {
        console.error("Error calculating vaccine alerts from real database", e);
      }

      // Calcular ingresos de hoy basados en boletas reales
      let totalIngresos = 0;
      try {
        const boletasHoy = boletas.filter(b => b.fecha && b.fecha.startsWith(todayStr) && b.estado === 'Activa');
        totalIngresos = boletasHoy.reduce((sum, b) => sum + Number(b.total || 0), 0);
      } catch (e) {}

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

      try {
        const activas = boletas.filter(b => b.estado === 'Activa');
        last6Months.forEach(m => {
          const matchingBoletas = activas.filter(b => b.fecha && b.fecha.startsWith(m.key));
          const total = matchingBoletas.reduce((sum, b) => sum + Number(b.total || 0), 0);
          m.rawVal = total;
          m.valor = Number((total / 1000).toFixed(1)); // en miles (k)
        });
      } catch (e) {}

      const maxVal = Math.max(...last6Months.map(m => m.rawVal), 1);
      const computedChartData = last6Months.map(m => ({
        mes: m.mes,
        valor: m.valor,
        rawVal: m.rawVal,
        pct: `${Math.round((m.rawVal / maxVal) * 100)}%`
      }));
      setChartData(computedChartData);

      const total6Months = last6Months.reduce((sum, m) => sum + m.rawVal, 0);
      const prom6Months = total6Months / 6;
      setChartSummary({ total: total6Months, promedio: prom6Months });

      // Calcular alertas de stock dinámicas
      try {
        const sinStock = productos.filter(p => p.stock === 0);
        sinStock.forEach(p => {
          dynamicAlerts.push({
            type: 'stock',
            title: `Sin stock - ${p.nombre}`,
            description: 'Requiere reabastecimiento',
            icon: '📦',
            bgColor: 'bg-amber-50/50',
            borderColor: 'border-amber-100/60',
            iconColor: 'text-amber-500'
          });
        });
      } catch (e) {}
      setAlerts(dynamicAlerts);

      setMetrics({
        pacientesCount: allPets.length,
        citasHoy: todayCitas.length,
        ingresosHoy: totalIngresos,
        vacunasVencidas: vencidasCount
      });

      // 3. Obtener actividades reales desde los logs de auditoría centralizados
      try {
        const savedLogs = await auditService.getAll();
        const recent = (savedLogs || []).slice(0, 5).map(log => {
          const d = new Date(log.fecha);
          const t = isNaN(d.getTime()) 
            ? 'Hace poco' 
            : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          return {
            id: log.id || Math.random(),
            text: `${log.accion}: ${log.detalles}`,
            time: t
          };
        });
        setRecentActivities(recent);
      } catch (e) {
        setRecentActivities([
          { id: 1, text: 'Sistema iniciado correctamente.', time: '09:00' }
        ]);
      }
    };

    loadDashboardData();
  }, []);

  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Saludo y Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            👋 Hola, {user?.nombre || 'admin'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1 capitalize">
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tarjeta Pacientes */}
        <div className="bg-gradient-to-br from-cyan-50/60 to-teal-50/10 border border-cyan-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-cyan-600/80 uppercase tracking-widest block">Pacientes</span>
            <h3 className="text-2xl font-black text-slate-800">{metrics.pacientesCount}</h3>
            <span className="text-[9.5px] font-extrabold text-cyan-600 bg-cyan-100/40 px-2 py-0.5 rounded-lg block w-max">
              +12% este mes
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shadow-inner">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta Citas */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-cyan-50/10 border border-indigo-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-indigo-600/80 uppercase tracking-widest block">Citas hoy</span>
            <h3 className="text-2xl font-black text-slate-800">{metrics.citasHoy}</h3>
            <span className="text-[9.5px] font-extrabold text-indigo-600 bg-indigo-100/40 px-2 py-0.5 rounded-lg block w-max">
              {metrics.citasHoy === 0 ? 'Sin pendientes' : 'Pendientes hoy'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner">
            <FiCalendar className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta Ingresos */}
        <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/10 border border-emerald-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-emerald-600/80 uppercase tracking-widest block">Ingresos hoy</span>
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(metrics.ingresosHoy)}</h3>
            <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-100/40 px-2 py-0.5 rounded-lg block w-max">
              Recaudación hoy
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
            <FiDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta Vacunas */}
        <div className="bg-gradient-to-br from-rose-50/60 to-red-50/10 border border-rose-100/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-rose-600/80 uppercase tracking-widest block">Vacunas vencidas</span>
            <h3 className="text-2xl font-black text-rose-700">{metrics.vacunasVencidas}</h3>
            <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-lg block w-max ${metrics.vacunasVencidas > 0 ? 'text-rose-600 bg-rose-100/40 animate-pulse' : 'text-slate-500 bg-slate-100/50'}`}>
              {metrics.vacunasVencidas > 0 ? 'Acción requerida' : 'Al día'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shadow-inner">
            <FiShield className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Contenido Principal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO IZQUIERDO: Citas y Gráfico */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de Citas de hoy */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                📅 Citas de hoy ({citasHoy.length})
              </h4>
              <button 
                onClick={() => navigate('/agenda')}
                className="text-xs font-bold text-cyan-500 hover:text-cyan-600 flex items-center gap-1"
              >
                <span>Ver agenda</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-6">
              {citasHoy.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <FiCalendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Sin citas hoy</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Mascota</th>
                        <th className="pb-3">Hora</th>
                        <th className="pb-3">Motivo</th>
                        <th className="pb-3">Veterinario</th>
                        <th className="pb-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {citasHoy.map((cita) => (
                        <tr key={cita.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-800">{cita.mascota?.nombre || 'Paciente'}</td>
                          <td className="py-3 text-slate-500">{cita.hora}</td>
                          <td className="py-3 text-slate-600">{cita.motivo}</td>
                          <td className="py-3 text-slate-500">{cita.veterinario || 'General'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              cita.estado === 'Confirmada' ? 'bg-cyan-50 text-cyan-500' :
                              cita.estado === 'En atención' ? 'bg-amber-50 text-amber-500' :
                              cita.estado === 'Completada' ? 'bg-emerald-50 text-emerald-500' :
                              'bg-rose-50 text-rose-500'
                            }`}>
                              {cita.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Gráfico de Ingresos */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800">📊 Ingresos (6 meses)</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total: {formatCurrency(chartSummary.total)} | Prom: {formatCurrency(chartSummary.promedio)}</p>
              </div>
              <span className="text-[10px] font-extrabold text-cyan-500 bg-cyan-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Soles (S/.)
              </span>
            </div>

            {/* Gráfico de barras premium hecho con puro HTML/CSS */}
            <div className="h-48 flex items-end gap-6 pt-4 px-2">
              {chartData.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-400 mb-1">{bar.valor}k</span>
                  <div 
                    className="w-full bg-gradient-to-t from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 rounded-t-lg transition-all duration-300 relative group cursor-pointer shadow-md shadow-cyan-500/10"
                    style={{ height: bar.pct }}
                  >
                    {/* Tooltip on hover */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10 shadow-md">
                      S/. {bar.rawVal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 mt-2">{bar.mes}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* LADO DERECHO: Alertas, Acciones y Actividades */}
        <div className="space-y-6">
          
          {/* Panel Alertas */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">🔔 Alertas</h4>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <span className="text-xl">✅</span>
                  <p className="text-xs font-bold text-slate-400">Sin alertas pendientes</p>
                  <p className="text-[10px] text-slate-400">Todo el inventario y vacunas están al día</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-xl ${alert.bgColor} border ${alert.borderColor} flex items-start gap-3`}>
                    <span className={`${alert.iconColor} mt-0.5`}>{alert.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">⚡ Acciones rápidas</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/agenda')}
                className="p-3 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/20 hover:shadow-md hover:shadow-cyan-100/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <span className="text-xl filter drop-shadow-sm">📅</span>
                <span className="text-[10px] font-bold text-slate-700">Agenda</span>
              </button>
              <button 
                onClick={() => navigate('/mascotas')}
                className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 hover:shadow-md hover:shadow-teal-100/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <span className="text-xl filter drop-shadow-sm">🐶</span>
                <span className="text-[10px] font-bold text-slate-700">Mascotas</span>
              </button>
              <button 
                onClick={() => navigate('/consultas')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 hover:shadow-md hover:shadow-indigo-100/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <span className="text-xl filter drop-shadow-sm">🩺</span>
                <span className="text-[10px] font-bold text-slate-700">Consultas</span>
              </button>
              <button 
                onClick={() => navigate('/nueva-venta')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 hover:shadow-md hover:shadow-emerald-100/40 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <span className="text-xl filter drop-shadow-sm">💰</span>
                <span className="text-[10px] font-bold text-slate-700">Nueva Venta</span>
              </button>
            </div>
          </div>

          {/* Actividades Recientes */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiActivity className="text-slate-400" />
              <span>Actividad reciente</span>
            </h4>
            <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4 py-2">
              {recentActivities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Puntero de actividad */}
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white" />
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-bold text-slate-700">{act.text}</p>
                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5">
                      <FiClock className="w-2.5 h-2.5" />
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
