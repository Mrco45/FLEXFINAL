import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Order, OrderItem, OrderStatus, AttachmentFile } from './types';
import { ALL_STATUSES, STATUS_COLORS } from './constants';
import { useOrders } from './hooks/useOrders';
import { uploadToCloudinary } from './src/cloudinary';
import Login from './src/Login';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './src/firebase';

// --- TYPE DEFINITIONS ---
type View = 'dashboard' | 'new-order' | 'history';

// --- HELPER ICONS ---
const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000" className="h-10 w-10 mr-3 animate-spin-slow drop-shadow-lg">
        <g fill="#0080BF">
            <circle cx="1000" cy="1000" r="900" fill="#e0f7fa" />
            <text x="50%" y="54%" textAnchor="middle" fontSize="600" fill="#0080BF" fontFamily="Tahoma, Arial, sans-serif" dy=".3em">F</text>
        </g>
    </svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const NewOrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const InProgressIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const ChevronDownIcon = ({ className }: { className: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const EmptyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" /></svg>;


// --- HEADER COMPONENT ---
interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}
const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const navItemClasses = (view: View) => `px-5 py-2 rounded-xl text-base font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
        currentView === view ? 'bg-gradient-to-r from-primary-600 to-blue-500 text-white shadow-lg scale-105' : 'text-slate-700 hover:bg-primary-100 hover:text-primary-700 hover:scale-105'
    }`;

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <LogoIcon />
                        <span className="text-3xl font-extrabold text-primary-700 tracking-tight drop-shadow-md">FLEX</span>
                        <span className="text-xl font-light text-slate-500 hidden sm:inline">- Orders Dashboard</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <button onClick={() => setCurrentView('dashboard')} className={navItemClasses('dashboard')}>Dashboard</button>
                        <button onClick={() => setCurrentView('history')} className={navItemClasses('history')}>Order History</button>
                    </nav>
                </div>
            </div>
        </header>
    );
};

// --- DASHBOARD VIEW ---
interface DashboardViewProps {
  newOrdersCount: number;
  inProgressCount: number;
  onNewOrderClick: () => void;
}
const DashboardView: React.FC<DashboardViewProps> = ({ newOrdersCount, inProgressCount, onNewOrderClick }) => {
    const StatCard: React.FC<{ title: string; value: string | number; color: string; icon: React.ReactNode }> = ({ title, value, color, icon }) => (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
                <button onClick={onNewOrderClick} className="flex items-center justify-center px-5 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200 transform hover:scale-105">
                    <PlusIcon />
                    New Order
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="New Orders" value={newOrdersCount} color="text-yellow-500" icon={<NewOrderIcon />} />
                <StatCard title="In Progress" value={inProgressCount} color="text-blue-500" icon={<InProgressIcon />}/>
                {/* حذف إجمالي المبلغ المتبقي */}
            </div>
        </div>
    );
};

// --- ORDER FORM HELPERS ---
const FormSection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">{children}</div>
    </div>
);

interface InputFieldProps {
    label: string;
    id: string;
    value: string | number;
    onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    type?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
    step?: string | number;
    disabled?: boolean; // Add disabled prop
}
const InputField: React.FC<InputFieldProps> = ({label, id, value, onChange, type="text", required=false, placeholder, className="", step, disabled}) => (
    <div className={`flex flex-col space-y-2 ${className}`}>
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 mr-1">*</span>}</label>
        <input id={id} name={id} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} step={step} className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-white text-slate-900" disabled={disabled} />
    </div>
);

// --- ORDER FORM VIEW ---
interface FormOrderItem {
  id: string;
  description: string;
  quantity: string;
  cost: string;
  width?: string;
  height?: string;
}
interface OrderFormViewProps {
    onSaveSuccess: () => void;
    onCancel: () => void;
    addOrder: (order: Omit<Order, 'id' | 'totalCost'>) => void;
}
const OrderFormView: React.FC<OrderFormViewProps> = ({ onSaveSuccess, onCancel, addOrder }) => {
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [items, setItems] = useState<FormOrderItem[]>([{ id: `item-${Date.now()}`, description: '', quantity: '1', cost: '', width: '', height: '' }]);
    const [amountPaid, setAmountPaid] = useState<number | string>('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);
    const [formSaved, setFormSaved] = useState(false); // NEW: track if form is saved

    const totalCost = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost) || 0), 0);
    }, [items]);
    const amountRemaining = useMemo(() => totalCost - (Number(amountPaid) || 0), [totalCost, amountPaid]);
    
    const handleItemChange = (index: number, field: keyof Omit<FormOrderItem, 'id'>, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };
    const addItem = () => setItems([...items, { id: `item-${Date.now()}`, description: '', quantity: '1', cost: '', width: '', height: '' }]);
    const removeItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filePromises = Array.from(e.target.files).map(async (file) => {
                // Upload to Cloudinary and get the URL
                const url = await uploadToCloudinary(file);
                return { name: file.name, type: file.type, size: file.size, dataUrl: url };
            });
            const newAttachments = await Promise.all(filePromises);
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };
    const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if(formSaved) return; // Prevent double submit
        if(!customerName || !phoneNumber) {
            setError("Please enter customer name and phone number.");
            return;
        }
        if(items.some(i => !i.description || !i.cost || !i.quantity)) {
            setError("Please make sure all order items have description, quantity, and cost.");
            return;
        }
        setIsSubmitting(true);
        const newOrder: Omit<Order, 'id' | 'totalCost'> = {
            customerName, phoneNumber,
            orderDate: new Date().toISOString().split('T')[0],
            items: items.map(item => ({...item, quantity: Number(item.quantity) || 1, cost: Number(item.cost) || 0, width: Number(item.width) || undefined, height: Number(item.height) || undefined })),
            amountPaid: Number(amountPaid) || 0,
            attachments, status: OrderStatus.NewOrder
        };
        addOrder(newOrder);
        setIsSubmitting(false);
        setLastSavedOrder({
            ...newOrder,
            id: 'Will be generated',
            totalCost: items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost) || 0), 0)
        } as Order);
        setFormSaved(true); // NEW: mark as saved
    };

    const handlePrintInvoice = () => {
        if (!lastSavedOrder) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html lang="en" dir="ltr">
            <head>
                <title>Order Invoice</title>
                <style>
                    body { font-family: Tahoma, Arial, sans-serif; margin: 40px; color: #222; }
                    h2 { color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
                    th { background: #f3f4f6; }
                    .total { font-weight: bold; color: #d97706; }
                </style>
            </head>
            <body>
                <h2>FLEX Order Invoice</h2>
                <p><strong>Customer Name:</strong> ${lastSavedOrder.customerName}</p>
                <p><strong>Phone Number:</strong> ${lastSavedOrder.phoneNumber}</p>
                <p><strong>Order Date:</strong> ${lastSavedOrder.orderDate}</p>
                <table>
                    <thead>
                        <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${lastSavedOrder.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>${item.cost.toLocaleString()} جنيه</td>
                                <td>${(item.cost * item.quantity).toLocaleString()} جنيه</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p class="total">Total Cost: ${lastSavedOrder.totalCost.toLocaleString()} جنيه</p>
                <p><strong>Amount Paid:</strong> ${lastSavedOrder.amountPaid.toLocaleString()} جنيه</p>
                <p><strong>Amount Remaining:</strong> ${(lastSavedOrder.totalCost - lastSavedOrder.amountPaid).toLocaleString()} جنيه</p>
                <hr style="margin:32px 0;">
                <p>Thank you for using FLEX!</p>
                <script>window.print();</script>
            </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => { onSaveSuccess(); }, 500); // Go back after print
    };

    // Disable form fields after save
    const formDisabled = formSaved;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Create New Order</h1>
            </div>
            {/* --- SIDE BY SIDE LAYOUT --- */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Right: Calculator and Invoice Preview */}
                <div className="md:w-1/3 order-2 md:order-1 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">Simple Calculator</h3>
                        <SimpleCalculator />
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">Invoice Preview</h3>
                        <InvoicePreview 
                            customerName={customerName}
                            phoneNumber={phoneNumber}
                            orderDate={new Date().toISOString().split('T')[0]}
                            items={items}
                            totalCost={totalCost}
                            amountPaid={amountPaid}
                        />
                        <button type="button" onClick={() => handlePrintInvoicePreview({customerName, phoneNumber, orderDate: new Date().toISOString().split('T')[0], items, totalCost, amountPaid})} className="mt-4 px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105">
                            Print Invoice
                        </button>
                    </div>
                </div>
                {/* Left: Form Sections */}
                <div className="md:w-2/3 order-1 md:order-2">
                    {/* --- FORM SECTIONS --- */}
                    <FormSection title="Customer Details">
                        <InputField label="Customer Name" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="e.g. John Doe" disabled={formDisabled} />
                        <InputField label="Phone Number" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" required placeholder="e.g. 01234567890" disabled={formDisabled} />
                    </FormSection>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">Order Items</h3>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <InputField label="Description" id={`item-desc-${index}`} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} required placeholder="e.g. A4 Menu Printing" className="col-span-12 sm:col-span-4 !space-y-1" disabled={formDisabled} />
                                    <InputField label="Quantity" id={`item-qty-${index}`} type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required placeholder="1" className="col-span-3 sm:col-span-2 !space-y-1" disabled={formDisabled} />
                                    <InputField label="Unit Cost (EGP)" id={`item-cost-${index}`} type="number" step="0.01" value={item.cost} onChange={e => handleItemChange(index, 'cost', e.target.value)} required placeholder="150" className="col-span-3 sm:col-span-2 !space-y-1" disabled={formDisabled} />
                                    <InputField label="Width (cm)" id={`item-width-${index}`} type="number" value={item.width} onChange={e => handleItemChange(index, 'width', e.target.value)} placeholder="Width" className="col-span-3 sm:col-span-2 !space-y-1" disabled={formDisabled} />
                                    <InputField label="Height (cm)" id={`item-height-${index}`} type="number" value={item.height} onChange={e => handleItemChange(index, 'height', e.target.value)} placeholder="Height" className="col-span-3 sm:col-span-2 !space-y-1" disabled={formDisabled} />
                                    <div className="col-span-3 sm:col-span-1">
                                        <button type="button" onClick={() => removeItem(index)} disabled={items.length <= 1 || formDisabled} className="w-full h-10 flex items-center justify-center text-red-600 bg-red-100 rounded-lg hover:bg-red-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
                                            <TrashIcon/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addItem} className="flex items-center px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-100 hover:text-slate-800 hover:border-slate-400 transition-all" disabled={formDisabled}>
                                <PlusIcon /> Add Item
                            </button>
                        </div>
                    </div>
                    <FormSection title="Attachments">
                        <div className="md:col-span-2">
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-slate-600 justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} /><span>Upload Files</span></label><p className="pr-1">or drag and drop them here</p>
                                    </div><p className="text-xs text-slate-500">PSD, AI, PDF, JPG, PNG</p>
                                </div>
                            </div>
                            {attachments.length > 0 && (<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{attachments.map((file, index) => (<div key={index} className="relative group border rounded-lg p-2 bg-white"><div className="aspect-w-1 aspect-h-1">{file.type.startsWith('image/') ? <img src={file.dataUrl} alt={file.name} className="h-20 w-20 object-cover mx-auto rounded-md" /> : <div className="h-20 w-20 mx-auto flex items-center justify-center bg-slate-100 rounded-md"><FileIcon /></div>}</div><p className="text-xs text-center truncate mt-1">{file.name}</p><button type="button" onClick={() => removeAttachment(index)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button></div>))}</div>)}
                        </div>
                    </FormSection>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">Financial Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col space-y-2 p-4 bg-slate-100 rounded-lg">
                                <label className="text-sm font-medium text-slate-600">Total Cost</label>
                                <div className="text-2xl font-bold text-slate-800">{totalCost.toLocaleString()} <span className="text-lg font-medium text-slate-500">EGP</span></div>
                            </div>
                            <InputField label="Amount Paid (EGP)" id="amountPaid" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="e.g. 500" className="md:pt-4" disabled={formDisabled} />
                            <div className="flex flex-col space-y-2 p-4 bg-slate-100 rounded-lg">
                                <label className="text-sm font-medium text-slate-600">Amount Remaining</label>
                                <div className={`text-2xl font-bold ${amountRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{amountRemaining.toLocaleString()} <span className="text-lg font-medium text-slate-500">EGP</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4">
                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">{error}</p>}
                        <div className="flex-grow sm:flex-grow-0 flex items-center gap-4">
                            <button type="button" onClick={() => { if(formSaved) onSaveSuccess(); else onCancel(); }} className="px-8 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                {formSaved ? 'Back' : 'Cancel'}
                            </button>
                            {!formSaved && (
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                                    {isSubmitting ? 'Saving...' : 'Save Order'}
                                </button>
                            )}
                            {formSaved && lastSavedOrder && (
                                <button type="button" onClick={handlePrintInvoice} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:scale-105">
                                    Print Invoice
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

// --- ORDER HISTORY VIEW ---
interface OrderHistoryViewProps {
    orders: Order[];
    updateOrder: (order: Order) => void;
}
const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ orders, updateOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
            const matchesSearch = searchTerm.trim() === '' ||
                order.customerName.toLowerCase().includes(lowerCaseSearch) ||
                order.phoneNumber.includes(searchTerm) ||
                order.id.toLowerCase().includes(lowerCaseSearch) ||
                order.items.some(item => item.description.toLowerCase().includes(lowerCaseSearch));
            return matchesStatus && matchesSearch;
        });
    }, [orders, searchTerm, statusFilter]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    <input type="text" placeholder="Search by name, phone, ID, or item..." className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    <button onClick={() => setStatusFilter('All')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${statusFilter === 'All' ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All</button>
                    {ALL_STATUSES.map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{status}</button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-4">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order} updateOrder={updateOrder} />
                )) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                        <EmptyIcon />
                        <h3 className="text-xl font-medium text-slate-700 mt-4">No orders found</h3>
                        <p className="text-slate-500 mt-2">Try changing the search or filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STATUS DROPDOWN ---
const StatusDropdown: React.FC<{ order: Order; updateOrder: (order: Order) => void; }> = ({ order, updateOrder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const statusColor = STATUS_COLORS[order.status];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusChange = (newStatus: OrderStatus) => {
        updateOrder({ ...order, status: newStatus });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`font-semibold text-sm rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-200 ${statusColor.base} ${statusColor.text} border ${statusColor.border} hover:brightness-95`}>
                <span>{order.status}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-10 py-1">
                    {ALL_STATUSES.map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)} className={`w-full text-right px-4 py-2 text-sm ${order.status === s ? 'font-bold text-primary-600' : 'text-slate-700'} hover:bg-slate-100`}>{s}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- ORDER CARD COMPONENT ---
interface OrderCardProps {
    order: Order;
    updateOrder: (order: Order) => void;
}
const OrderCard: React.FC<OrderCardProps> = ({ order, updateOrder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editOrder, setEditOrder] = useState<Order>(order);
    const amountRemaining = order.totalCost - order.amountPaid;
    const isCompleted = order.status === OrderStatus.Completed;

    useEffect(() => {
        setEditOrder(order);
    }, [order]);

    const handleEditChange = (field: keyof Order, value: any) => {
        setEditOrder((prev: Order) => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...editOrder.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditOrder((prev: Order) => ({ ...prev, items: newItems }));
    };

    const handleSave = () => {
        updateOrder({ ...editOrder });
        setIsEditing(false);
    };

    // Change status to Completed and hide from active list
    const handleDone = () => {
        updateOrder({ ...order, status: OrderStatus.Completed });
    };

    // Hide edit/done buttons for completed orders
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg text-right">
            {/* Collapsed View */}
            <div className="p-4 sm:p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <p className="text-sm text-slate-500 font-mono text-left">{order.id}</p>
                        {isEditing ? (
                            <input
                                className="text-xl font-bold text-slate-900 border-b border-slate-300"
                                value={editOrder.customerName}
                                onChange={e => handleEditChange('customerName', e.target.value)}
                                disabled={isCompleted}
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-slate-900">{order.customerName}</h2>
                        )}
                        {isEditing ? (
                            <input
                                className="text-primary-600 border-b border-slate-300"
                                value={editOrder.phoneNumber}
                                onChange={e => handleEditChange('phoneNumber', e.target.value)}
                                disabled={isCompleted}
                            />
                        ) : (
                            <a href={`tel:${order.phoneNumber}`} className="text-primary-600 hover:underline">{order.phoneNumber}</a>
                        )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2" onClick={e => e.stopPropagation()}>
                        {!isCompleted && <StatusDropdown order={order} updateOrder={updateOrder} />}
                        {!isCompleted && !isEditing && (
                            <button className="px-3 py-1 bg-slate-200 rounded text-slate-700 hover:bg-slate-300" onClick={() => setIsEditing(true)} type="button">Edit</button>
                        )}
                        {!isCompleted && (
                            <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={handleDone} type="button">Delivered</button>
                        )}
                        {isEditing && !isCompleted && (
                            <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700" onClick={handleSave} type="button">Save</button>
                        )}
                        {isEditing && !isCompleted && (
                            <button className="px-3 py-1 bg-slate-200 rounded text-slate-700 hover:bg-slate-300" onClick={() => setIsEditing(false)} type="button">Cancel</button>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Total Cost</p>
                        {isEditing ? (
                            <input
                                type="number"
                                className="font-semibold text-lg border-b border-slate-300"
                                value={editOrder.totalCost}
                                onChange={e => handleEditChange('totalCost', Number(e.target.value))}
                                disabled={isCompleted}
                            />
                        ) : (
                            <p className="font-semibold text-lg">{order.totalCost.toLocaleString()} EGP</p>
                        )}
                    </div>
                    <div>
                        <p className="text-slate-500">Amount Paid</p>
                        {isEditing ? (
                            <input
                                type="number"
                                className="font-semibold text-lg text-green-600 border-b border-slate-300"
                                value={editOrder.amountPaid}
                                onChange={e => handleEditChange('amountPaid', Number(e.target.value))}
                                disabled={isCompleted}
                            />
                        ) : (
                            <p className="font-semibold text-lg text-green-600">{order.amountPaid.toLocaleString()} EGP</p>
                        )}
                    </div>
                    <div>
                        <p className="text-slate-500">Amount Remaining</p>
                        <p className={`font-semibold text-lg ${amountRemaining > 0 ? 'text-red-600' : 'text-slate-800'}`}>{amountRemaining.toLocaleString()} EGP</p>
                    </div>
                    <div className="flex items-center justify-start col-span-2 md:col-span-1">
                        <button className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800">
                            Details <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded View */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="px-4 sm:px-6 pb-6 pt-2">
                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-md font-semibold text-slate-700">Order Items</h4>
                            <p className="text-sm text-slate-500">Order Date: <span className="font-semibold text-slate-700">{order.orderDate}</span></p>
                        </div>
                        <ul className="space-y-2 text-sm list-inside bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {isEditing ? editOrder.items.map((item: OrderItem, idx: number) => (
                                <li key={item.id} className="flex justify-between items-center flex-wrap gap-x-4">
                                    <div>
                                        <input
                                            className="font-medium text-slate-800 border-b border-slate-300"
                                            value={item.description}
                                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                            disabled={isCompleted}
                                        />
                                        <span className="text-slate-500 mr-2">(Qty: <input type="number" className="w-12 border-b border-slate-300" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} disabled={isCompleted} />)</span>
                                    </div>
                                    <input
                                        type="number"
                                        className="font-semibold text-slate-900 border-b border-slate-300 w-20"
                                        value={item.cost}
                                        onChange={e => handleItemChange(idx, 'cost', Number(e.target.value))}
                                        disabled={isCompleted}
                                    /> EGP
                                </li>
                            )) : order.items.map((item: OrderItem) => (
                                <li key={item.id} className="flex justify-between items-center flex-wrap gap-x-4">
                                    <div>
                                        <span className="font-medium text-slate-800">{item.description}</span>
 
 
                                         <div className="text-xs text-slate-500">Quantity: {item.quantity}</div>
                                        <div className="text-xs text-slate-500">Unit Price: {item.cost} EGP</div>
                                        <div className="text-xs text-slate-500">Width: {item.width ? item.width + ' cm' : 'N/A'}</div>
                                        <div className="text-xs text-slate-500">Height: {item.height ? item.height + ' cm' : 'N/A'}</div>
                                        <span className="font-semibold text-slate-900">{(item.cost * item.quantity).toLocaleString()} EGP</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {order.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <h4 className="text-md font-semibold text-slate-700 mb-3">Attachments</h4>
                            <div className="flex flex-wrap gap-3">
                                {order.attachments.map((file: AttachmentFile, index: number) => (
                                    <a key={index} href={file.dataUrl} download={file.name} title={file.name} className="block w-20 h-20 border rounded-lg p-1 bg-white hover:border-primary-500 transition-all group">
                                        {file.type.startsWith('image/') ? <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover rounded-md" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-md text-slate-400 group-hover:text-primary-500"><FileIcon/></div>}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUCCESS TOAST NOTIFICATION ---
const SuccessToast: React.FC<{ show: boolean; message: string; onDismiss: () => void }> = ({ show, message, onDismiss }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => onDismiss(), 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onDismiss]);

    return (
        <div className={`fixed bottom-8 left-8 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ zIndex: 100 }}>
            <div className="flex items-center bg-gradient-to-r from-green-500 to-green-400 text-white font-bold text-base px-6 py-4 rounded-xl shadow-2xl border-2 border-green-600 animate-bounce">
                <svg className="w-6 h-6 ml-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                <p>{message}</p>
            </div>
        </div>
    );
};

// --- APP ROOT COMPONENT ---
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { orders, addOrder, updateOrder } = useOrders();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Debug: Log user and authChecked (always call hooks at top level)
  useEffect(() => {
    console.log('Auth checked:', authChecked, 'User:', user);
  }, [authChecked, user]);

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.Completed), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => o.status !== OrderStatus.Completed), [orders]);
  const newOrdersCount = useMemo(() => activeOrders.filter(o => o.status === OrderStatus.NewOrder).length, [activeOrders]);
  const inProgressCount = useMemo(() => activeOrders.filter(o => o.status === OrderStatus.InProgress).length, [activeOrders]);

  if (!authChecked) {
    return <div className="text-center mt-20 text-lg">Checking authentication...</div>;
  }
  if (!user) {
    return <Login onLogin={() => {}} />;
  }


  const handleSaveSuccess = () => {
    setCurrentView('dashboard');
    setShowSuccessToast(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView newOrdersCount={newOrdersCount} inProgressCount={inProgressCount} onNewOrderClick={() => setCurrentView('new-order')} />;
      case 'new-order':
        return <OrderFormView onSaveSuccess={handleSaveSuccess} onCancel={() => setCurrentView('dashboard')} addOrder={addOrder} />;
      case 'history':
        return (
          <>
            <OrderHistoryView orders={activeOrders} updateOrder={updateOrder} />
            {deliveredOrders.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-green-700 mb-4">Delivered</h2>
                <div className="space-y-4">
                  {deliveredOrders.map(order => (
                    <OrderCard key={order.id} order={order} updateOrder={() => {}} />
                  ))}
                </div>
              </div>
            )}
          </>
        );
      default:
        return <div>Error: Unknown view</div>;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen font-sans text-slate-800">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="max-w-7xl mx-auto p-6 sm:p-10 lg:p-16">
        {renderView()}
      </main>
      <SuccessToast show={showSuccessToast} message="Order saved successfully!" onDismiss={() => setShowSuccessToast(false)} />
    </div>
  );
};

// آلة حاسبة بسيطة
const SimpleCalculator: React.FC = () => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState<string | number>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Allow keyboard input only when focused
    useEffect(() => {
        if (!isFocused) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key.match(/^[0-9\-+*/.=]$/)) {
                setExpression(prev => prev + e.key);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                handleCalculate();
                e.preventDefault();
            } else if (e.key === 'Backspace') {
                setExpression(prev => prev.slice(0, -1));
                e.preventDefault();
            } else if (e.key === 'Delete') {
                setExpression('');
                setResult('');
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocused]);

    const handleInput = (value: string) => {
        setExpression(prev => prev + value);
        inputRef.current?.focus();
    };
    const handleClear = () => {
        setExpression('');
        setResult('');
        inputRef.current?.focus();
    };
    const handleBackspace = () => {
        setExpression(prev => prev.slice(0, -1));
        inputRef.current?.focus();
    };
    const handleCalculate = () => {
        try {
            // eslint-disable-next-line no-eval
            const evalResult = eval(expression.replace(/[^-+*/.\d()]/g, ''));
            setResult(evalResult);
        } catch {
            setResult('Error in calculation');
        }
        inputRef.current?.focus();
    };

    return (
        <div className="max-w-xs mx-auto">
            <input
                ref={inputRef}
                type="text"
                className="w-full mb-2 px-3 py-2 border rounded text-lg text-right bg-slate-50"
                value={expression}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={e => setExpression(e.target.value.replace(/[^-+*/.\d()]/g, ''))}
                placeholder="Enter calculation..."
                dir="ltr"
            />
            <div className="grid grid-cols-4 gap-2 mb-2">
                {[7,8,9,'/'].map(v => <button key={v} className="py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={() => handleInput(String(v))}>{v}</button>)}
                {[4,5,6,'*'].map(v => <button key={v} className="py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={() => handleInput(String(v))}>{v}</button>)}
                {[1,2,3,'-'].map(v => <button key={v} className="py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={() => handleInput(String(v))}>{v}</button>)}
                {[0,'.','=','+'].map(v => v==='='
                    ? <button key={v} className="py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={handleCalculate}>=</button>
                    : <button key={v} className="py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={() => handleInput(String(v))}>{v}</button>
                )}
            </div>
            <div className="flex gap-2 mb-2">
                <button className="flex-1 py-2 bg-red-200 rounded hover:bg-red-300" onClick={handleClear} type="button">Clear</button>
                <button className="flex-1 py-2 bg-yellow-200 rounded hover:bg-yellow-300" onClick={handleBackspace} type="button">Backspace</button>
            </div>
            {result !== '' && (
                <div className="text-lg font-bold text-primary-700 text-right">Result: {result}</div>
            )}
        </div>
    );
};

// معاينة الفاتورة (Invoice Preview)
interface InvoicePreviewProps {
    customerName: string;
    phoneNumber: string;
    orderDate: string;
    items: { description: string; quantity: string; cost: string }[];
    totalCost: number;
    amountPaid: number | string;
}
const InvoicePreview: React.FC<InvoicePreviewProps> = ({ customerName, phoneNumber, orderDate, items, totalCost, amountPaid }) => {
    const amountRemaining = totalCost - (Number(amountPaid) || 0);
    return (
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 text-right">
            <h2 className="text-2xl font-bold text-primary-700 mb-2">Order Invoice</h2>
            <div className="mb-2"><span className="font-semibold">Customer Name:</span> {customerName || <span className="text-slate-400">---</span>}</div>
            <div className="mb-2"><span className="font-semibold">Phone Number:</span> {phoneNumber || <span className="text-slate-400">---</span>}</div>
            <div className="mb-4"><span className="font-semibold">Order Date:</span> {orderDate}</div>
            <table className="w-full text-sm mb-4 border">
                <thead>
                    <tr className="bg-slate-200">
                        <th className="p-2 border">Description</th>
                        <th className="p-2 border">Quantity</th>
                        <th className="p-2 border">Unit Price</th>
                        <th className="p-2 border">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 || (items.length === 1 && !items[0].description) ? (
                        <tr><td colSpan={4} className="text-center text-slate-400 p-4">No items found</td></tr>
                    ) : items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border p-2">{item.description}</td>
                            <td className="border p-2">{item.quantity}</td>
                            <td className="border p-2">{item.cost}</td>
                            <td className="border p-2">{(Number(item.cost) * Number(item.quantity)).toLocaleString()} EGP</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mb-1 font-bold">Total Cost: <span className="text-primary-700">{totalCost.toLocaleString()} EGP</span></div>
            <div className="mb-1">Amount Paid: <span className="text-green-700">{Number(amountPaid).toLocaleString()} EGP</span></div>
            <div>Amount Remaining: <span className={amountRemaining > 0 ? 'text-red-600' : 'text-green-600'}>{amountRemaining.toLocaleString()} EGP</span></div>
        </div>
    );
};

// طباعة معاينة الفاتورة
function handlePrintInvoicePreview({customerName, phoneNumber, orderDate, items, totalCost, amountPaid}: InvoicePreviewProps) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
        <html lang="en" dir="ltr">
        <head>
            <title>Order Invoice</title>
            <style>
                body { font-family: Tahoma, Arial, sans-serif; margin: 40px; color: #222; }
                h2 { color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
                th { background: #f3f4f6; }
                .total { font-weight: bold; color: #d97706; }
            </style>
        </head>
        <body>
            <h2>FLEX Order Invoice</h2>
            <p><strong>Customer Name:</strong> ${customerName}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <table>
                <thead>
                    <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                    ${items.length === 0 || (items.length === 1 && !items[0].description) ?
                        `<tr><td colspan="4" style="text-align:center;color:#888;padding:16px;">No items</td></tr>` :
                        items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>${item.cost}</td>
                                <td>${(Number(item.cost) * Number(item.quantity)).toLocaleString()} جنيه</td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
            <p class="total">Total Cost: ${totalCost.toLocaleString()} جنيه</p>
            <p><strong>Amount Paid:</strong> ${Number(amountPaid).toLocaleString()} جنيه</p>
            <p><strong>Amount Remaining:</strong> ${(totalCost - (Number(amountPaid) || 0)).toLocaleString()} جنيه</p>
            <hr style="margin:32px 0;">
            <p>Thank you for using FLEX!</p>
            <script>window.print();</script>
        </body>
        </html>
    `);
    win.document.close();
}

export default App;
