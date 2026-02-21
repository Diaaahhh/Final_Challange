import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import { FaSave, FaPlus, FaUtensils, FaTrash, FaTimes, FaRedo, FaCube } from "react-icons/fa";
import api from "../../api";
import "react-resizable/css/styles.css";

// --- HELPER: Get Default Pixel Dimensions based on Props ---
const getInitialDimensions = (capacity, shape, type) => {
  if (type === 'other') {
    if (shape === 'rectangle') return { w: 200, h: 100 };
    if (shape === 'square') return { w: 100, h: 100 };
    return { w: 120, h: 120 };
  }

  if (shape === 'rectangle') {
    if (capacity <= 4) return { w: 140, h: 90 };
    if (capacity <= 8) return { w: 200, h: 100 };
    return { w: 260, h: 120 };
  }
  if (capacity <= 2) return { w: 70, h: 70 };
  if (capacity <= 4) return { w: 100, h: 100 };
  return { w: 140, h: 140 };
};

// --- SUB-COMPONENT: Draggable & Resizable Item ---
const DraggableItem = ({ item, updatePosition, updateSize, removeItem, rotateItem }) => {
  const nodeRef = useRef(null);
  const isTable = item.type === 'table';

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      defaultPosition={{ x: item.pos_x || 0, y: item.pos_y || 0 }}
      onStop={(e, data) => updatePosition(item.id, data.x, data.y)}
      cancel=".react-resizable-handle"
    >
      <div 
        ref={nodeRef} 
        className="absolute group z-10"
        style={{ width: item.width, height: item.height }}
      >
        {/* Resizable Wrapper */}
        <ResizableBox
          width={item.width}
          height={item.height}
          onResizeStop={(e, data) => updateSize(item.id, data.size.width, data.size.height)}
          minConstraints={[50, 50]}
          maxConstraints={[500, 500]}
          draggableOpts={{ enableUserSelectHack: false }}
        >
          <div 
            className="relative w-full h-full transition-transform duration-300"
            style={{ transform: `rotate(${item.rotation || 0}deg)` }}
          >
            <div 
              className={`
                w-full h-full flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-200
                rounded-lg border-2 
                ${isTable 
                  ? "bg-[#1A1A1A] border-[#2A2A2A] group-hover:border-[#007BFF] group-hover:shadow-[0_0_15px_rgba(0,123,255,0.2)]" 
                  : "bg-[#151515] border-[#222] group-hover:border-[#C59D5F]" 
                }
                cursor-move
              `}
            >
              {/* --- CONTENT --- */}
              {isTable ? (
                <>
                  <FaUtensils className="text-[#007BFF] mb-1 opacity-80" size={12} />
                  <span className="font-bold uppercase text-[#A0A0A0] tracking-wider text-[8px] md:text-[10px]">
                    {item.capacity} Seater
                  </span>
                  <span className="font-['Barlow_Condensed'] font-bold text-white leading-none text-lg">
                    {item.table_number}
                  </span>
                </>
              ) : (
                <span className="font-['Barlow_Condensed'] font-bold uppercase text-[#C59D5F] tracking-widest px-2 text-center leading-tight text-xs overflow-hidden">
                  {item.label}
                </span>
              )}

              {/* --- CONTROLS --- */}
              <button 
                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 pointer-events-auto z-20"
                onTouchEnd={() => removeItem(item.id)} 
              >
                <FaTrash size={10} />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}
                className="absolute -bottom-3 -right-3 bg-[#007BFF] text-black p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-[#C59D5F] pointer-events-auto z-20"
              >
                <FaRedo size={10} />
              </button>
            </div>
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
};

// --- MAIN COMPONENT ---
export default function TableLayout() {
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({ table_number: "", capacity: 4, shape: 'square' });
  
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [newOtherData, setNewOtherData] = useState({ label: "", shape: "rectangle" });

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const res = await api.get("/tables");
      const processed = (res.data || []).map(t => ({
        ...t, 
        rotation: t.rotation || 0,
        width: t.width || 100,
        height: t.height || 100
      }));
      setItems(processed);
    } catch (err) {
      console.warn("Backend error:", err); 
      setItems([]); 
    } finally {
      setLoading(false);
    }
  };

  const openAddTableModal = () => {
    const existingTables = items.filter(i => i.type === 'table');
    const nextNum = existingTables.length > 0 ? Math.max(...existingTables.map(t => parseInt(t.table_number) || 0)) + 1 : 1;
    setNewTableData({ table_number: nextNum, capacity: 4, shape: 'square' });
    setIsTableModalOpen(true);
  };

  const confirmAddTable = (e) => {
    e.preventDefault();
    const { w, h } = getInitialDimensions(parseInt(newTableData.capacity), newTableData.shape, 'table');

    const newItem = {
      id: `table-${Date.now()}`,
      type: 'table',
      isBookable: true,
      table_number: newTableData.table_number,
      capacity: parseInt(newTableData.capacity) || 2,
      shape: newTableData.shape,
      rotation: 0,
      width: w,
      height: h,
      pos_x: 50,
      pos_y: 50,
      is_new: true
    };
    setItems([...items, newItem]);
    setIsTableModalOpen(false);
  };

  const openAddOtherModal = () => {
    setNewOtherData({ label: "", shape: "rectangle" });
    setIsOtherModalOpen(true);
  };

  const confirmAddOther = (e) => {
    e.preventDefault();
    const { w, h } = getInitialDimensions(0, newOtherData.shape, 'other');

    const newItem = {
      id: `other-${Date.now()}`,
      type: 'other',
      isBookable: false,
      label: newOtherData.label || "Station",
      shape: newOtherData.shape,
      rotation: 0,
      width: w,
      height: h,
      pos_x: 100, 
      pos_y: 50,
      is_new: true
    };
    setItems([...items, newItem]);
    setIsOtherModalOpen(false);
  };

  const removeItem = (id) => {
    if (window.confirm("Remove this item?")) setItems(items.filter((t) => t.id !== id));
  };

  const updatePosition = (id, x, y) => {
    setItems(items.map(t => t.id === id ? { ...t, pos_x: x, pos_y: y } : t));
  };

  const updateSize = (id, width, height) => {
    setItems(items.map(t => t.id === id ? { ...t, width, height } : t));
  };

  const rotateItem = (id) => {
    setItems(items.map(t => t.id === id ? { ...t, rotation: (t.rotation + 90) % 360 } : t));
  };

  const saveLayout = async () => {
    try {
      await api.post("/tables/update-layout", { layout: items });
      alert("Layout saved!");
      fetchLayout(); 
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-[#007BFF] font-bold text-xl tracking-widest font-['Barlow_Condensed'] uppercase animate-pulse">
      Loading Layout...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] pt-24 pb-12 px-4 font-['Inter']">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-[#1E1E1E] pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-['Barlow_Condensed'] font-bold uppercase text-white">
              Floor Plan <span className="text-[#007BFF]">Designer</span>
            </h1>
            <p className="text-[#A0A0A0] text-sm mt-1">Drag to move. Grab corner to resize.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openAddTableModal} className="bg-[#111111] border-2 border-[#2A2A2A] text-white hover:border-[#007BFF] hover:text-[#007BFF] px-4 py-3 rounded-xl font-bold uppercase flex items-center gap-2 shadow-sm transition-all">
              <FaPlus /> Table
            </button>
            <button onClick={openAddOtherModal} className="bg-[#111111] border-2 border-[#2A2A2A] text-[#A0A0A0] hover:border-[#C59D5F] hover:text-[#C59D5F] px-4 py-3 rounded-xl font-bold uppercase flex items-center gap-2 shadow-sm transition-all">
              <FaCube /> Others
            </button>
            <button onClick={saveLayout} className="bg-[#007BFF] hover:bg-[#0066e6] text-black px-6 py-3 rounded-xl font-bold uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(0,123,255,0.3)] hover:shadow-[0_0_30px_rgba(0,123,255,0.5)] transition-all">
              <FaSave /> Save
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative w-full h-[600px] bg-[#0A0A0A] rounded-2xl border-2 border-dashed border-[#1E1E1E] overflow-hidden shadow-inner">
          {/* Grid dots pattern */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2A2A2A 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#333] pointer-events-none">
              <FaUtensils className="text-6xl opacity-20 mb-4" />
              <p className="text-lg font-['Barlow_Condensed'] uppercase font-bold text-[#444]">Canvas is Empty</p>
            </div>
          )}

          {items.map((item) => (
            <DraggableItem 
              key={item.id} 
              item={item} 
              updatePosition={updatePosition} 
              updateSize={updateSize}
              removeItem={removeItem}
              rotateItem={rotateItem} 
            />
          ))}
        </div>
      </div>

      {/* MODAL FOR TABLE */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] rounded-2xl w-full max-w-md p-6 border border-[#2A2A2A] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase text-white font-['Barlow_Condensed'] tracking-wider">New Table</h2>
              <button onClick={() => setIsTableModalOpen(false)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg"><FaTimes/></button>
            </div>
            <form onSubmit={confirmAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-[#A0A0A0] tracking-wider">Number</label>
                <input type="text" required value={newTableData.table_number} onChange={e=>setNewTableData({...newTableData, table_number: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-white focus:border-[#007BFF] outline-none transition-colors font-mono"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-[#A0A0A0] tracking-wider">Capacity</label>
                <input type="number" required value={newTableData.capacity} onChange={e=>setNewTableData({...newTableData, capacity: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-white focus:border-[#007BFF] outline-none transition-colors font-mono"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-[#A0A0A0] tracking-wider">Shape</label>
               <div className="flex gap-4">
                 <button type="button" onClick={()=>setNewTableData({...newTableData, shape:'square'})} className={`flex-1 p-3 border rounded-lg font-bold uppercase text-sm transition-all ${newTableData.shape==='square' ? 'bg-[#007BFF]/20 border-[#007BFF] text-[#007BFF]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]'}`}>Square</button>
                 <button type="button" onClick={()=>setNewTableData({...newTableData, shape:'rectangle'})} className={`flex-1 p-3 border rounded-lg font-bold uppercase text-sm transition-all ${newTableData.shape==='rectangle' ? 'bg-[#007BFF]/20 border-[#007BFF] text-[#007BFF]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]'}`}>Rect</button>
               </div>
              </div>
              <button type="submit" className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-black p-3 rounded-lg font-bold uppercase font-['Barlow_Condensed'] tracking-wider transition-all shadow-[0_0_15px_rgba(0,123,255,0.2)]">Create</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR OTHERS */}
      {isOtherModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] rounded-2xl w-full max-w-md p-6 border border-[#2A2A2A] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase text-white font-['Barlow_Condensed'] tracking-wider">Add Element</h2>
              <button onClick={() => setIsOtherModalOpen(false)} className="text-[#555] hover:text-[#C59D5F] transition-colors text-lg"><FaTimes/></button>
            </div>
            <form onSubmit={confirmAddOther} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-[#A0A0A0] tracking-wider">Label</label>
                <input type="text" required value={newOtherData.label} onChange={e=>setNewOtherData({...newOtherData, label: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-white focus:border-[#C59D5F] outline-none transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-[#A0A0A0] tracking-wider">Shape</label>
               <div className="flex gap-4">
                 <button type="button" onClick={()=>setNewOtherData({...newOtherData, shape:'square'})} className={`flex-1 p-3 border rounded-lg font-bold uppercase text-sm transition-all ${newOtherData.shape==='square' ? 'bg-[#C59D5F]/20 border-[#C59D5F] text-[#C59D5F]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]'}`}>Square</button>
                 <button type="button" onClick={()=>setNewOtherData({...newOtherData, shape:'rectangle'})} className={`flex-1 p-3 border rounded-lg font-bold uppercase text-sm transition-all ${newOtherData.shape==='rectangle' ? 'bg-[#C59D5F]/20 border-[#C59D5F] text-[#C59D5F]' : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A0A0A0] hover:border-[#444]'}`}>Rect</button>
               </div>
              </div>
              <button type="submit" className="w-full bg-[#C59D5F] hover:bg-[#b08d55] text-white p-3 rounded-lg font-bold uppercase font-['Barlow_Condensed'] tracking-wider transition-all">Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}