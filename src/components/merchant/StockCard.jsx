import React from 'react';
import { Edit, Trash2, Package, Truck } from 'lucide-react';

const StockCard = ({ stock, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ borderColor: '#E0E0E0' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B1F3A' }}>
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: '#2B2B2B' }}>{stock.name}</h3>
            <p className="text-xs" style={{ color: '#A0A0A0' }}>{stock.gsm}gsm • {stock.size || '700×1000mm'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(stock)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit className="w-4 h-4" style={{ color: '#00C2FF' }} />
          </button>
          <button onClick={() => onDelete(stock.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" style={{ color: '#E53935' }} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: '#A0A0A0' }}>Price per ream</span>
          <span className="font-bold" style={{ color: '#E53935' }}>₦{stock.price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: '#A0A0A0' }}>Quantity</span>
          <span style={{ color: '#2B2B2B' }}>{stock.quantity} reams</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: '#A0A0A0' }}>Delivery</span>
          <div className="flex items-center gap-1">
            {stock.delivery === 'Yes' && <Truck className="w-3 h-3" style={{ color: '#27AE60' }} />}
            <span className={`text-xs px-2 py-0.5 rounded-full ${stock.delivery === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {stock.delivery}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
