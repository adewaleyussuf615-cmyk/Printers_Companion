import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';

const PaperCard = ({ paper, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden hover:shadow-md transition-all hover:border-[#00C2FF] group cursor-pointer" 
      onClick={onClick}
    >
      <div className="h-32 flex items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#1E3E66] relative overflow-hidden">
        {paper.image_url ? (
          <img src={paper.image_url} alt={paper.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-white/90">
            <span className="text-3xl">📄</span>
            <span className="text-[10px] font-mono tracking-wider text-[#00C2FF] uppercase font-bold">{paper.gsm} GSM</span>
          </div>
        )}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0B1F3A]/75 text-[10px] text-white font-mono font-bold tracking-wider">
          {paper.merchant}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-[#0B1F3A] text-base group-hover:text-[#00C2FF] transition-colors line-clamp-1">{paper.name}</h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{paper.gsm}gsm • {paper.size}</p>
          </div>
          <button 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#E53935] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {paper.useCases.map((use, idx) => (
            <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600">
              {use}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Merchant price</p>
            <p className="font-extrabold text-base text-[#0B1F3A]">₦{paper.price.toLocaleString()}</p>
          </div>
          <button 
            className="px-3.5 py-1.5 bg-[#E53935] hover:bg-[#C62828] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-[#E53935]/15"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperCard;
