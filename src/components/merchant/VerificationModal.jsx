import React from 'react';
import { X, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const VerificationModal = ({ isOpen, onClose, order, onVerify, onReject }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white" style={{ borderColor: '#E0E0E0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#2B2B2B' }}>Payment Verification</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" style={{ color: '#A0A0A0' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold" style={{ color: '#2B2B2B' }}>{order.customer}</p>
            <p className="text-sm" style={{ color: '#A0A0A0' }}>{order.location}</p>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4" style={{ borderColor: '#E0E0E0' }}>
            <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Order Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: '#A0A0A0' }}>Product</span>
                <span style={{ color: '#2B2B2B' }}>{order.product}</span>
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

          {/* Payment Proof */}
          <div className="border rounded-lg p-4" style={{ borderColor: '#E0E0E0' }}>
            <h3 className="font-bold mb-3" style={{ color: '#2B2B2B' }}>Payment Proof</h3>
            {order.paymentProof ? (
              <div>
                <div className="bg-gray-100 rounded-lg p-4 text-center mb-3">
                  <p className="text-sm text-gray-600">Payment_0422.jpg</p>
                  <p className="text-xs text-gray-400">271.68 KB</p>
                </div>
                <button className="w-full py-2 border rounded-lg flex items-center justify-center gap-2 transition-colors" style={{ borderColor: '#E0E0E0' }}>
                  <Download className="w-4 h-4" />
                  Download Proof
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" style={{ color: '#A0A0A0' }} />
                <p style={{ color: '#A0A0A0' }}>No payment proof uploaded</p>
              </div>
            )}
          </div>

          {/* Transfer Note */}
          {order.transferNote && (
            <div className="border rounded-lg p-4" style={{ borderColor: '#E0E0E0' }}>
              <h3 className="font-bold mb-2" style={{ color: '#2B2B2B' }}>Transfer Note</h3>
              <p className="text-sm" style={{ color: '#A0A0A0' }}>{order.transferNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onReject(order.id)}
              className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              style={{ border: '1px solid #E0E0E0', color: '#E53935', backgroundColor: 'white' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#FFEBEE'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <XCircle className="w-4 h-4" />
              Reject Payment
            </button>
            <button
              onClick={() => onVerify(order.id)}
              className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-white transition-colors"
              style={{ backgroundColor: '#27AE60' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#219653'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27AE60'}
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Verified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
