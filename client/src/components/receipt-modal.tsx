import { X, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction } from "@shared/schema";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In a real app, this would open an email dialog or send via API
    alert("Email functionality would be implemented here");
  };

  if (!transaction) return null;

  const items = transaction.items as any[];
  const date = new Date(transaction.createdAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Receipt
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="font-mono text-sm space-y-4" id="receiptContent">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-lg">MAIN STORE</h3>
            <p className="text-gray-600">123 Commerce St</p>
            <p className="text-gray-600">City, State 12345</p>
            <p className="text-gray-600">Tel: (555) 123-4567</p>
          </div>

          <div className="border-t border-b border-gray-400 py-3 space-y-1">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{date.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{date.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{transaction.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{transaction.cashierName}</span>
            </div>
          </div>

          {/* Receipt Items */}
          <div className="space-y-1">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-400 pt-3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${parseFloat(transaction.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8.5%):</span>
              <span>${parseFloat(transaction.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
              <span>TOTAL:</span>
              <span>${parseFloat(transaction.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="capitalize">{transaction.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 space-y-1">
            <p>Thank you for your business!</p>
            <p>Visit us again soon</p>
          </div>
        </div>

        {/* Receipt Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint} className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button onClick={handleEmail} className="flex items-center space-x-2 bg-pos-primary hover:bg-blue-700">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
