
import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Plus,
  Save,
  Send,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Hash,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';
import { DeleteButton } from '../components/ui/DeleteButton';

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const QuotationsPage: React.FC = () => {
  const { showToast } = useApp();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quotationNumber, setQuotationNumber] = useState(`QTN-${Math.floor(Math.random() * 90000) + 10000}`);

  const [items, setItems] = useState<QuotationItem[]>([
    { id: '1', description: 'Enterprise ERP License (Yearly)', quantity: 1, unitPrice: 1200 }
  ]);

  const [taxRate] = useState(15);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [items]);
  const taxAmount = useMemo(() => (subtotal * taxRate) / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: string) => {
    if (items.length === 1) {
      showToast('At least one item required.', 'error');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" leftIcon={<Eye size={14} />}>Preview</Button>
      <Button size="sm" onClick={() => showToast('Draft saved.')} leftIcon={<Save size={14} />}>Save Draft</Button>
    </div>
  );

  return (
    <PageLayout
      title="Draft New Quotation"
      description={`ID: ${quotationNumber}`}
      actions={actions}
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Customer Profile" description="Billing identity and schedule.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Business Entity" placeholder="Acme Corp LLC" icon={<User size={14} />} value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input label="Recipient Email" placeholder="billing@acme.com" icon={<Send size={14} />} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              <Input label="Document Ref" icon={<Hash size={14} />} value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} />
              <Input label="Expiration Date" type="date" icon={<Calendar size={14} />} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </Card>

          <Card
            title="Service Line Items"
            description="Detailed breakdown of costs."
            headerAction={
              <Button variant="ghost" size="xs" className="text-[var(--primary)] font-semibold" leftIcon={<Plus size={12} />} onClick={addItem}>Add Row</Button>
            }
          >
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_100px_40px] gap-4 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <span>Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
                <span></span>
              </div>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_100px_40px] gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <input className="bg-transparent text-sm font-medium text-slate-800 outline-none px-2" placeholder="Item name..." value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                  <input type="number" className="bg-transparent text-sm font-semibold text-slate-600 text-center outline-none" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} />
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900 tracking-tight">${(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                  <DeleteButton onClick={() => removeItem(item.id)} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Summary">
            <div className="space-y-4 py-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Net Subtotal</span>
                <span className="text-slate-900 font-semibold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>VAT ({taxRate}%)</span>
                <span className="text-slate-900 font-semibold">+${taxAmount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900">Total Payable</span>
                <span className="text-2xl font-bold text-indigo-600">${total.toLocaleString()}</span>
              </div>
            </div>
            <Button className="w-full mt-6 rounded-lg h-11 shadow-md shadow-indigo-100" rightIcon={<ChevronRight size={14} />}>Issue Document</Button>
          </Card>

          <div className="p-4 bg-[var(--primary-muted)] border border-[var(--primary)]/10 rounded-xl flex gap-3 shadow-sm">
            <AlertCircle size={18} className="text-[var(--primary)] shrink-0" />
            <p className="text-[11px] text-[var(--primary)] font-medium leading-relaxed">
              Quotes are generated as encrypted PDFs. All revisions are tracked in the system audit logs.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
