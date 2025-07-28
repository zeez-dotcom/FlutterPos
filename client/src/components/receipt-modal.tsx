import { X, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, Customer } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

interface ReceiptModalProps {
  transaction?: Transaction | null;
  order?: any | null;
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, order, customer, isOpen, onClose }: ReceiptModalProps) {
  const receiptData = transaction || order;
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    alert("Email functionality would be implemented here");
  };

  const items = receiptData.items as any[];
  const date = new Date(receiptData.createdAt);
  const isPayLater = receiptData.paymentMethod === 'pay_later';
  
  // Company logo URL
  const logoUrl = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.J1FnT7YsQoJUjS4LBElT7wHa&f=1&ipt=5545e86aaec86b0fec9027bbad0987fd75958cd64b12cb0b558f87bdc7217f1a&ipo=images";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isPayLater ? t.payLaterReceipt : t.receipt}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="font-mono text-sm space-y-4" id="receiptContent">
          {/* Company Header with Logo */}
          <div className="text-center space-y-2">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="w-16 h-16 mx-auto object-contain rounded-lg"
            />
            <h3 className="font-bold text-lg">{t.companyName}</h3>
            <p className="text-gray-600">{t.companyTagline}</p>
            <p className="text-gray-600">{t.location}</p>
            <p className="text-gray-600">{t.phone}</p>
          </div>

          <div className="border-t border-b border-gray-400 py-3 space-y-1">
            <div className="flex justify-between">
              <span>{t.date}:</span>
              <span>{date.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.time}:</span>
              <span>{date.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{isPayLater ? t.orderNumber : t.receiptNumber}:</span>
              <span>{receiptData.id.slice(-6).toUpperCase()}</span>
            </div>
            {receiptData.cashierName && (
              <div className="flex justify-between">
                <span>{t.staff}:</span>
                <span>{receiptData.cashierName}</span>
              </div>
            )}
            {receiptData.createdBy && (
              <div className="flex justify-between">
                <span>{t.staff}:</span>
                <span>{receiptData.createdBy}</span>
              </div>
            )}
            {customer && (
              <div className="flex justify-between">
                <span>{t.customer}:</span>
                <span>{customer.name}</span>
              </div>
            )}
            {receiptData.customerName && (
              <div className="flex justify-between">
                <span>{t.customer}:</span>
                <span>{receiptData.customerName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span className="flex-1">{item.name}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
                <div className="text-xs text-gray-600 pl-2">
                  {item.service} × {item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-400 pt-3 space-y-1">
            <div className="flex justify-between">
              <span>{t.subtotal}:</span>
              <span>{formatCurrency(receiptData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.tax}:</span>
              <span>{formatCurrency(receiptData.tax)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>{t.total}:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-t border-gray-400 pt-3 space-y-1">
            <div className="flex justify-between">
              <span>{t.paymentMethod}:</span>
              <span className="capitalize">{receiptData.paymentMethod.replace('_', ' ')}</span>
            </div>
            
            {isPayLater ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <div className="text-center">
                    <p className="font-bold text-yellow-800">{t.paymentDue}</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(receiptData.total)}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t.paymentDueUponPickup}
                    </p>
                  </div>
                </div>
                {receiptData.estimatedPickup && (
                  <div className="flex justify-between text-xs">
                    <span>Est. Pickup:</span>
                    <span>{new Date(receiptData.estimatedPickup).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                <div className="text-center">
                  <p className="font-bold text-green-800">{t.paidInFull}</p>
                  <p className="text-xs text-green-700">{t.thankYouPayment}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-400 pt-3 text-center text-xs text-gray-600 space-y-1">
            <p>{t.thankYouService}</p>
            <p>{t.inquiriesCall} {t.phone}</p>
            {isPayLater && (
              <p className="font-bold text-red-600">{t.bringReceiptPickup}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            {t.print}
          </Button>
          <Button onClick={handleEmail} variant="outline" className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            {t.email}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}