import { X, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, Customer } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useState, useEffect } from "react";
import logoImage from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getTaxRate } from "@/lib/tax";

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
  const { toast } = useToast();
  const taxRate = getTaxRate();
  
  // Get dynamic company settings
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  
  useEffect(() => {
    setCompanyName(localStorage.getItem('companyName') || 'Laundry Services');
    setCompanyPhone(localStorage.getItem('companyPhone') || '+965-2XXX-XXXX');
  }, [isOpen]);
  
  if (!receiptData) return null;

  const handlePrint = () => {
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    // Get the receipt HTML content
    const receiptHTML = receiptContent.outerHTML;
    
    // Create a complete HTML document for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 20px;
              line-height: 1.4;
            }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .text-center { text-align: center; }
            .text-xs { font-size: 10px; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-gray-600 { color: #666; }
            .text-gray-400 { color: #999; }
            .text-yellow-800 { color: #92400e; }
            .text-red-600 { color: #dc2626; }
            .text-green-800 { color: #166534; }
            .text-green-700 { color: #15803d; }
            .text-yellow-700 { color: #a16207; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-b { border-bottom: 1px solid #d1d5db; }
            .border-gray-400 { border-color: #9ca3af; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .pt-3 { padding-top: 0.75rem; }
            .pt-1 { padding-top: 0.25rem; }
            .pl-2 { padding-left: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-2 { padding: 0.5rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .object-contain { object-fit: contain; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded { border-radius: 0.25rem; }
            .bg-yellow-50 { background-color: #fefce8; }
            .bg-green-50 { background-color: #f0fdf4; }
            .border { border-width: 1px; }
            .border-yellow-200 { border-color: #fde047; }
            .border-green-200 { border-color: #bbf7d0; }
            .capitalize { text-transform: capitalize; }
            .flex-1 { flex: 1; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleEmail = async () => {
    if (!customer?.email) return;
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;
    const receiptHTML = receiptContent.outerHTML;

    try {
      await apiRequest("POST", "/api/receipts/email", {
        email: customer.email,
        html: receiptHTML,
      });
      toast({
        title: "Email sent",
        description: "Receipt emailed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send receipt email",
        variant: "destructive",
      });
    }
  };

  const items = receiptData.items as any[];
  const date = new Date(receiptData.createdAt);
  const isPayLater = receiptData.paymentMethod === 'pay_later';
  
  // Company logo - using imported asset
  const logoUrl = logoImage;

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
            <h3 className="font-bold text-lg">{companyName}</h3>
            <p className="text-gray-600">{t.companyTagline}</p>
            <p className="text-gray-600">{t.location}</p>
            <p className="text-gray-600">{companyPhone}</p>
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
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span>{t.tax}:</span>
                <span>{formatCurrency(receiptData.tax)}</span>
              </div>
            )}
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
            <p>{t.inquiriesCall} {companyPhone}</p>
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
          {customer?.email && (
            <Button onClick={handleEmail} variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              {t.email}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}