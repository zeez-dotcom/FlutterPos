import { X, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, Customer } from "@shared/schema";
import { useTranslation, translations } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { ReactNode, useEffect, useState } from "react";
import logoImage from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getTaxRate } from "@/lib/tax";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface ReceiptModalProps {
  transaction?: Transaction | null;
  order?: any | null;
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  printNumber?: number;
  printedAt?: string;
}

export function ReceiptModal({ transaction, order, customer, isOpen, onClose, printNumber, printedAt }: ReceiptModalProps) {
  const receiptData = transaction || order;
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const taxRate = getTaxRate();
  const tEn = translations.en;
  const tAr = translations.ar;

  const [receiptHeaderMessage, setReceiptHeaderMessage] = useState("");
  const [receiptFooterMessage, setReceiptFooterMessage] = useState("");

  useEffect(() => {
    const settings = localStorage.getItem("laundrySettings");
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setReceiptHeaderMessage(parsed.receiptHeader || "");
        setReceiptFooterMessage(parsed.receiptFooter || "");
      } catch {
        // ignore JSON parse errors
      }
    }
  }, []);

  const renderBilingualRow = (
    enLabel: string,
    enValue: ReactNode,
    arLabel: string,
    arValue: ReactNode = enValue,
    className = ''
  ) => (
    <div className={`flex ${className}`}>
      <span className="flex-1">
        {enLabel}: {enValue}
      </span>
      <span className="flex-1 text-right" dir="rtl">
        {arLabel}: {arValue}
      </span>
    </div>
  );

  const estimatedPickupEn = 'Est. Pickup';
  const estimatedPickupAr = 'الاستلام المتوقع';
  
  const branchName = receiptData?.branchName || 'Laundry Services';
  const branchAddress = receiptData?.branchAddress;
  const branchPhone = receiptData?.branchPhone || '+965-2XXX-XXXX';
  if (!receiptData) return null;

  const sellerName = receiptData.sellerName;

  const paymentMethodKey =
    receiptData.paymentMethod === 'pay_later'
      ? 'payLater'
      : receiptData.paymentMethod === 'cash'
        ? 'cash'
        : 'card';

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
            .text-right { text-align: right; }
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
  const identifier = isPayLater && receiptData.orderNumber
    ? receiptData.orderNumber
    : receiptData.id.slice(-6).toUpperCase();
  
  const { branch } = useAuth();
  // Company logo - branch logo if available, else default asset
  const logoUrl = branch?.logoUrl || logoImage;

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
            <h3 className="font-bold text-lg">{branchName}</h3>
            <div className="flex">
              <p className="flex-1 text-gray-600">{tEn.companyTagline}</p>
              <p className="flex-1 text-gray-600 text-right" dir="rtl">{tAr.companyTagline}</p>
            </div>
            {receiptHeaderMessage && (
              <div className="flex">
                <p className="flex-1 text-gray-600">{receiptHeaderMessage}</p>
                <p className="flex-1 text-gray-600 text-right" dir="rtl">
                  {receiptHeaderMessage}
                </p>
              </div>
            )}
            {branchAddress && (
              <div className="flex">
                <p className="flex-1 text-gray-600">{branchAddress}</p>
                <p className="flex-1 text-gray-600 text-right" dir="rtl">{branchAddress}</p>
              </div>
            )}
            <div className="flex">
              <p className="flex-1 text-gray-600">{branchPhone}</p>
              <p className="flex-1 text-gray-600 text-right" dir="rtl">
                <span dir="ltr">{branchPhone}</span>
              </p>
          </div>
        </div>

        {printNumber && printedAt && (
          <div className="text-center text-xs text-gray-500">
            {`Print #${printNumber} – ${format(new Date(printedAt), "MMM dd, HH:mm")}`}
          </div>
        )}

        <div className="border-t border-b border-gray-400 py-3 space-y-1">
            {renderBilingualRow(
              tEn.date,
              date.toLocaleDateString(),
              tAr.date,
              date.toLocaleDateString()
            )}
            {renderBilingualRow(
              tEn.time,
              date.toLocaleTimeString(),
              tAr.time,
              date.toLocaleTimeString()
            )}
            {renderBilingualRow(
              isPayLater ? tEn.orderNumber : tEn.receiptNumber,
              identifier,
              isPayLater ? tAr.orderNumber : tAr.receiptNumber,
              identifier
            )}
            {sellerName &&
              renderBilingualRow(
                tEn.staff,
                sellerName,
                tAr.staff,
                sellerName
              )}
            {customer &&
              renderBilingualRow(
                tEn.customer,
                customer.name,
                tAr.customer,
                customer.name
              )}
            {receiptData.customerName &&
              renderBilingualRow(
                tEn.customer,
                receiptData.customerName,
                tAr.customer,
                receiptData.customerName
              )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((item, index) => {
              const serviceName =
                typeof item.service === "string"
                  ? item.service
                  : item.service?.name;
              const clothingItem =
                typeof item.name === "string"
                  ? item.name
                  : typeof item.clothingItem === "string"
                    ? item.clothingItem
                    : item.clothingItem?.name;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex">
                    <div className="flex-1 flex justify-between">
                      <span className="flex-1">{clothingItem}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                    <div className="flex-1 flex justify-between text-right" dir="rtl">
                      <span className="flex-1">{clothingItem}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="text-xs text-gray-600 flex-1 pl-2">
                      {serviceName} × {item.quantity}
                    </span>
                    <span className="text-xs text-gray-600 flex-1 text-right" dir="rtl">
                      {serviceName} × {item.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-400 pt-3 space-y-1">
            {renderBilingualRow(
              tEn.subtotal,
              formatCurrency(receiptData.subtotal),
              tAr.subtotal,
              formatCurrency(receiptData.subtotal)
            )}
            {taxRate > 0 &&
              renderBilingualRow(
                tEn.tax,
                formatCurrency(receiptData.tax),
                tAr.tax,
                formatCurrency(receiptData.tax)
              )}
            {renderBilingualRow(
              tEn.total,
              formatCurrency(receiptData.total),
              tAr.total,
              formatCurrency(receiptData.total),
              'font-bold border-t pt-1'
            )}
          </div>

          {/* Payment Information */}
          <div className="border-t border-gray-400 pt-3 space-y-1">
            {renderBilingualRow(
              tEn.paymentMethod,
              tEn[paymentMethodKey],
              tAr.paymentMethod,
              tAr[paymentMethodKey]
            )}

            {isPayLater ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <div className="text-center space-y-1">
                    <div className="flex">
                      <p className="font-bold text-yellow-800 flex-1">{tEn.paymentDue}</p>
                      <p className="font-bold text-yellow-800 flex-1 text-right" dir="rtl">
                        {tAr.paymentDue}
                      </p>
                    </div>
                    <div className="flex">
                      <p className="text-lg font-bold text-red-600 flex-1">
                        {formatCurrency(receiptData.total)}
                      </p>
                      <p className="text-lg font-bold text-red-600 flex-1 text-right" dir="rtl">
                        {formatCurrency(receiptData.total)}
                      </p>
                    </div>
                    <div className="flex">
                      <p className="text-xs text-yellow-700 mt-1 flex-1">
                        {tEn.paymentDueUponPickup}
                      </p>
                      <p
                        className="text-xs text-yellow-700 mt-1 flex-1 text-right"
                        dir="rtl"
                      >
                        {tAr.paymentDueUponPickup}
                      </p>
                    </div>
                  </div>
                </div>
                {receiptData.estimatedPickup &&
                  renderBilingualRow(
                    estimatedPickupEn,
                    new Date(receiptData.estimatedPickup).toLocaleDateString(),
                    estimatedPickupAr,
                    new Date(receiptData.estimatedPickup).toLocaleDateString(),
                    'text-xs mt-2'
                  )}
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                <div className="text-center space-y-1">
                  <div className="flex">
                    <p className="font-bold text-green-800 flex-1">{tEn.paidInFull}</p>
                    <p className="font-bold text-green-800 flex-1 text-right" dir="rtl">
                      {tAr.paidInFull}
                    </p>
                  </div>
                  <div className="flex">
                    <p className="text-xs text-green-700 flex-1">{tEn.thankYouPayment}</p>
                    <p className="text-xs text-green-700 flex-1 text-right" dir="rtl">
                      {tAr.thankYouPayment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-400 pt-3 text-center text-xs text-gray-600 space-y-1">
            <div className="flex">
              <p className="flex-1">{tEn.thankYouService}</p>
              <p className="flex-1 text-right" dir="rtl">{tAr.thankYouService}</p>
            </div>
            <div className="flex">
              <p className="flex-1">
                {tEn.inquiriesCall} {branchPhone}
              </p>
              <p className="flex-1 text-right" dir="rtl">
                {tAr.inquiriesCall} <span dir="ltr">{branchPhone}</span>
              </p>
            </div>
            {isPayLater && (
              <div className="flex">
                <p className="font-bold text-red-600 flex-1">
                  {tEn.bringReceiptPickup}
                </p>
                <p className="font-bold text-red-600 flex-1 text-right" dir="rtl">
                  {tAr.bringReceiptPickup}
                </p>
              </div>
            )}
            {receiptFooterMessage && (
              <div className="flex">
                <p className="flex-1">{receiptFooterMessage}</p>
                <p className="flex-1 text-right" dir="rtl">
                  {receiptFooterMessage}
                </p>
              </div>
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
