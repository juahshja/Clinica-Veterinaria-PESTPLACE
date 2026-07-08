import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiCheck, FiX } from 'react-icons/fi';
import { productService } from '../../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales y Formularios
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [categoria, setCategoria] = useState('Medicamento');

  const categories = ['Alimento', 'Antiparasitario', 'Dermatología', 'Medicamento', 'Antibiótico', 'Accesorio', 'Suplemento', 'Servicio'];

  const getEmojiForCategory = (cat) => {
    switch (cat) {
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

  const loadInventory = async () => {
    try {
      const list = await productService.getAll();
      setProductos(list || []);
    } catch (err) {
      console.error("Error loading products", err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setSku(`PRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setStock(10);
    setPrecio(15.0);
    setCategoria('Medicamento');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setSku(p.sku);
    setStock(p.stock);
    setPrecio(p.precio);
    setCategoria(p.categoria);
    setShowModal(true);
  };

  const handleDelete = async (p) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto ${p.nombre} del catálogo?`)) {
      try {
        await productService.delete(p.id, p.nombre);
        loadInventory();
      } catch (err) {
        console.error("Error deleting product", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nombre,
      sku,
      stock: Number(stock),
      precio: Number(precio),
      categoria,
      emoji: getEmojiForCategory(categoria)
    };

    try {
      if (editingId) {
        await productService.update(editingId, payload);
      } else {
        await productService.create(payload);
      }
      setShowModal(false);
      loadInventory();
    } catch (err) {
      console.error("Error saving product", err);
      alert("Error al guardar el producto.");
    }
  };

  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 animate-in fade-in duration-200">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>📦 Inventario de Farmacia y Tienda</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">
              {productos.length} productos
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Gestiona el stock de medicamentos, alimentos y accesorios de la clínica.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <FiSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0d9488] text-[11px] font-semibold text-slate-800 bg-slate-50/50"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 !bg-[#0d9488] hover:!bg-[#0f766e] !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-sm !border-0 cursor-pointer transition-all active:scale-95 flex-shrink-0"
          >
            <FiPlus className="w-4.5 h-4.5" />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Listado de Inventario */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">SKU</th>
                <th className="pb-3">Categoría</th>
                <th className="pb-3">Nombre del Producto</th>
                <th className="pb-3">Precio Unitario</th>
                <th className="pb-3">Stock disponible</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-semibold text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold select-none">No se registran productos en el catálogo.</td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 font-bold text-slate-500">{p.sku}</td>
                    <td className="py-3.5">
                      <span className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-lg text-[9.5px] font-bold">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-800 text-[11.5px] flex items-center gap-2">
                      <span className="text-base select-none">{p.emoji || getEmojiForCategory(p.categoria)}</span>
                      <span>{p.nombre}</span>
                    </td>
                    <td className="py-3.5 font-black text-[#0d9488]">S/. {Number(p.precio).toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.stock <= 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : p.stock <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {p.stock <= 0 ? 'Agotado' : p.stock <= 5 ? `Bajo Stock (${p.stock} u.)` : `${p.stock} unidades`}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-teal-50 hover:border-teal-200 text-slate-500 hover:text-teal-650 shadow-sm transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                        title="Editar Stock"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 shadow-sm transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
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

      {/* MODAL FORMULARIO DE PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    📦 {editingId ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Registra la información del producto, SKU, categoría y existencias del inventario.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="py-8 space-y-6 text-xs">
                
                {/* Nombre */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Nombre del Producto</label>
                  <input 
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Antiparasitario Bravecto"
                    className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Código SKU</label>
                    <input 
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Ej. SKU-991"
                      className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      required
                    />
                  </div>

                  {/* Categoría */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Categoría</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Precio Venta */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Precio Venta (S/.)</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="0.00"
                      className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      required
                    />
                  </div>

                  {/* Stock Inicial */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Stock Inicial</label>
                    <input 
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className="h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                {/* Botones */}
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
                    {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
