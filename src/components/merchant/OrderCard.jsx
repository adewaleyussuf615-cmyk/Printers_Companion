import React, { useState } from 'react';
import { Package, MapPin, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Download } from 'lucide-react';

const OrderCard = ({ order, onVerify, onReject }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { text: 'Pending Verification', color: '#E53935', bg: '#FFEBEE' };
      case 'verified':
        return { text: 'Payment Verified', color: '#27AE60', bg: '#E8F5E9' };
      case 'rejected':
        return { text: 'Rejected', color: '#A0A0A0', bg: '#F5F5F5' };
      default:
        return { text: status, color: '#2B2B2B', bg: '#F7F7F5' };
    }
  };

  const status = getStatusBadge(order.status);

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E0E0E0' }}>
      {/* Order Summary */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" style={{ color: '#00C2FF' }} />
                <span className="font-bold" style={{ color: '#2B2B2B' }}>Order #{order.id}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>
                {status.text}
              </span>
            </div>
            <p className="font-medium" style={{ color: '#2B2B2B' }}>{order.customer}</p>
            <p className="text-sm flex items-center gap-1 mt-1" style={{ color: '#A0A0A0' }}>
              <MapPin className="w-3 h-3" /> {order.location}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg" style={{ color: '#E53935' }}>₦{order.total.toLocaleString()}</p>
            <p className="text-xs" style={{ color: '#A0A0A0' }}>{order.time}</p>
            <div className="mt-1">
              {expanded ? 
                <ChevronUp className="w-5 h-5" style={{ color: '#A0A0A0' }} /> : 
                <ChevronDown className="w-5 h-5" style={{ color: '#A0A0A0' }} />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t p-4 space-y-4 animate-in slide-in-from-top-2" style={{ borderColor: '#E0E0E0', backgroundColor: '#F7F7F5' }}>
          {/* Product Details */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Order Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A0' }}>Product</span>
                <span className="font-medium" style={{ color: '#2B2B2B' }}>{order.product}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A0' }}>Size</span>
                <span style={{ color: '#2B2B2B' }}>{order.size || '700×1000mm'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A0' }}>GSM</span>
                <span style={{ color: '#2B2B2B' }}>{order.gsm}gsm</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A0' }}>Quantity</span>
                <span style={{ color: '#2B2B2B' }}>{order.quantity} reams</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: '#E0E0E0' }}>
                <span className="font-bold" style={{ color: '#2B2B2B' }}>Total Price</span>
                <span className="font-bold text-lg" style={{ color: '#E53935' }}>₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Verification */}
          {order.status === 'pending' && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Payment Verification</h3>
              {order.paymentProof ? (
                <div className="mb-4">
                  <p className="text-sm mb-2" style={{ color: '#2B2B2B' }}>Payment proof uploaded:</p>
                  <button className="text-sm flex items-center gap-2 px-4 py-2 border rounded-lg" style={{ borderColor: '#E0E0E0' }}>
                    <Download className="w-4 h-4" />
                    Download Payment Proof
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4" style={{ borderColor: '#E0E0E0' }}>
                  <p className="text-sm" style={{ color: '#A0A0A0' }}>No payment proof uploaded yet</p>
                  <p className="text-xs mt-1" style={{ color: '#A0A0A0' }}>Awaiting customer payment confirmation</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => onVerify(order.id)}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors"
                  style={{ backgroundColor: '#27AE60' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#219653'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#27AE60'}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Verified
                </button>
                <button
                  onClick={() => onReject(order.id)}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ border: '1px solid #E0E0E0', color: '#E53935', backgroundColor: 'white' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#FFEBEE'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Verified Order Actions */}
          {order.status === 'verified' && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Payment Verified</h3>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-white transition-colors"
                  style={{ backgroundColor: '#00C2FF' }}
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
                <button
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ border: '1px solid #E0E0E0', color: '#2B2B2B', backgroundColor: 'white' }}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Order Timeline</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#00C2FF' }}></div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2B2B2B' }}>Order Placed</p>
                  <p className="text-xs" style={{ color: '#A0A0A0' }}>{order.date} at {order.time}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: order.status === 'pending' ? '#E0E0E0' : '#27AE60' }}></div>
                <div>
                  <p className="text-sm font-medium" style={{ color: order.status === 'pending' ? '#A0A0A0' : '#2B2B2B' }}>Payment Verification</p>
                  {order.status !== 'pending' && <p className="text-xs" style={{ color: '#A0A0A0' }}>Verified on {order.date}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#E0E0E0' }}></div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#A0A0A0' }}>Order Fulfilled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
