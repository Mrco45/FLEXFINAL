import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Order, OrderItem, OrderStatus, AttachmentFile } from './types';
import { ALL_STATUSES, ALL_STATUSES_WITH_COMPLETED, STATUS_COLORS } from './constants';
import { useOrders } from './hooks/useOrders';
import { uploadToCloudinary } from './src/cloudinary';
import Login from './src/Login';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './src/firebase';
import { Puck } from '@measured/puck';
import '@measured/puck/puck.css';

// --- TYPE DEFINITIONS ---
type View = 'dashboard' | 'new-order' | 'history';

// --- COUNTER ANIMATION COMPONENT ---
const CounterAnimation: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        const duration = 1000;
        const steps = 60;
        const stepValue = value / steps;
        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            setDisplayValue(Math.floor(stepValue * currentStep));
            
            if (currentStep >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            }
        }, duration / steps);
        
        return () => clearInterval(timer);
    }, [value]);
    
    return <span>{displayValue.toLocaleString()}</span>;
};

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
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30 shadow-xl">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-white">
                                <path fill="currentColor" d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                                <text x="50%" y="60%" textAnchor="middle" fontSize="10" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold">F</text>
                            </svg>
                        </div>
                        <div>
                            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FLEX</span>
                            <span className="text-sm font-medium text-slate-500 block leading-none">Orders Dashboard</span>
                        </div>
                    </div>
                    <nav className="flex items-center gap-2">
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
  orders: Order[];
  onNewOrderClick: () => void;
}
const DashboardView: React.FC<DashboardViewProps> = ({ newOrdersCount, inProgressCount, orders, onNewOrderClick }) => {
    const StatCard: React.FC<{ title: string; value: string | number; color: string; icon: React.ReactNode; subtitle?: string }> = ({ title, value, color, icon, subtitle }) => (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className="flex-shrink-0">{icon}</div>
            </div>
        </div>
    );

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = useMemo(() => orders.filter(order => order.orderDate === today), [orders, today]);
    
    const revenueMetrics = useMemo(() => {
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.amountPaid, 0);
        const totalMoney = orders.reduce((sum, order) => sum + order.totalCost, 0);
        const totalReceived = orders.reduce((sum, order) => sum + order.amountPaid, 0);
        const pendingAmount = orders.reduce((sum, order) => sum + (order.totalCost - order.amountPaid), 0);

        return { todayRevenue, totalMoney, totalReceived, pendingAmount };
    }, [orders, todayOrders]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-600 mt-1">Manage your orders and track performance</p>
                </div>
                <button onClick={onNewOrderClick} className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200 transform hover:scale-105">
                    <PlusIcon />
                    New Order
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
                        </div>
                        <span className="text-sm font-medium opacity-90">Total Money</span>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                        <CounterAnimation value={revenueMetrics.totalMoney} /> جنيه
                    </div>
                    <p className="text-sm opacity-80">Expected total revenue</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-sm font-medium opacity-90">Total Received</span>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                        <CounterAnimation value={revenueMetrics.totalReceived} /> جنيه
                    </div>
                    <p className="text-sm opacity-80">Payments collected</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-sm font-medium opacity-90">Pending</span>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                        <CounterAnimation value={revenueMetrics.pendingAmount} /> جنيه
                    </div>
                    <p className="text-sm opacity-80">Outstanding balances</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <NewOrderIcon />
                        </div>
                        <span className="text-sm font-medium opacity-90">Active Orders</span>
                    </div>
                    <div className="text-3xl font-bold mb-2">
                        <CounterAnimation value={newOrdersCount + inProgressCount} />
                    </div>
                    <p className="text-sm opacity-80">{newOrdersCount} new, {inProgressCount} in progress</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-700">Recent Activity</h4>
                        <p className="text-sm text-slate-500 mt-1">Last order: {orders.length > 0 ? orders[0].customerName : 'No orders yet'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-700">Pending Amount</h4>
                        <p className="text-sm text-slate-500 mt-1">{revenueMetrics.pendingAmount.toLocaleString()} جنيه</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-700">Total Orders</h4>
                        <p className="text-sm text-slate-500 mt-1">{orders.length} total orders</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ORDER FORM HELPERS ---
const FormSection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/50 shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">{children}</div>
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
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
        <input id={id} name={id} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} step={step} className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 hover:border-slate-400" disabled={disabled} />
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

    const totalCost = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const cost = Number(item.cost) || 0;
            return sum + (quantity * cost);
        }, 0);
    }, [items]);
    const amountRemaining = useMemo(() => totalCost - (Number(amountPaid) || 0), [totalCost, amountPaid]);
    const progress = useMemo(() => {
        const filledFields = [
            customerName, phoneNumber, 
            ...items.flatMap(item => [item.description, item.cost])
        ].filter(field => field.toString().trim() !== '').length;
        const totalFields = 2 + (items.length * 2);
        return Math.round((filledFields / totalFields) * 100);
    }, [customerName, phoneNumber, items]);
    
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
        if(isSubmitting) return; // Prevent double submit
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
        onSaveSuccess();
    };

    const handlePrintInvoice = () => {
        if (!lastSavedOrder) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FLEX Invoice</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.4; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-section h3 { color: #4f46e5; font-size: 14px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-section p { margin-bottom: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .table tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .totals { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-row.final { font-weight: bold; font-size: 18px; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; }
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .header { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>FLEX</h1>
            <p>Professional Order Invoice</p>
        </div>
        
        <div class="info-grid">
            <div class="info-section">
                <h3>Bill To</h3>
                <p><strong>${lastSavedOrder.customerName}</strong></p>
                <p>${lastSavedOrder.phoneNumber}</p>
            </div>
            <div class="info-section">
                <h3>Invoice Details</h3>
                <p><strong>Date:</strong> ${new Date(lastSavedOrder.orderDate).toLocaleDateString()}</p>
                <p><strong>Invoice #:</strong> ${lastSavedOrder.id}</p>
                <p><strong>Status:</strong> ${lastSavedOrder.status}</p>
            </div>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${lastSavedOrder.items.map(item => `
                    <tr>
                        <td>
                            ${item.description}
                            ${item.width || item.height ? `<br><small style="color: #6b7280;">${item.width || ''}${item.width && item.height ? ' x ' : ''}${item.height || ''} cm</small>` : ''}
                        </td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${item.cost.toLocaleString()} EGP</td>
                        <td class="text-right">${(item.cost * item.quantity).toLocaleString()} EGP</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${lastSavedOrder.totalCost.toLocaleString()} EGP</span>
            </div>
            <div class="total-row">
                <span>Amount Paid:</span>
                <span style="color: #059669;">${lastSavedOrder.amountPaid.toLocaleString()} EGP</span>
            </div>
            <div class="total-row final">
                <span>Balance Due:</span>
                <span>${(lastSavedOrder.totalCost - lastSavedOrder.amountPaid).toLocaleString()} EGP</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>FLEX - Professional Printing Services</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            };
        };
    </script>
</body>
</html>`;
        
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    // Disable form fields after save
    const formDisabled = !!lastSavedOrder;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Create New Order</h1>
                {progress > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">Progress</span>
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                            <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-primary-600">{progress}%</span>
                    </div>
                )}
            </div>
            {/* --- SIDE BY SIDE LAYOUT --- */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Right: Calculator and Invoice Preview */}
                <div className="md:w-1/3 order-2 md:order-1 flex flex-col gap-6">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 shadow-xl sticky top-24">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            Calculator
                        </h3>
                        <SimpleCalculator />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 shadow-xl">
                        <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            Invoice Preview
                        </h3>
                        <InvoicePreview 
                            customerName={customerName}
                            phoneNumber={phoneNumber}
                            orderDate={new Date().toISOString().split('T')[0]}
                            items={items}
                            totalCost={totalCost}
                            amountPaid={amountPaid}
                        />
                        <button type="button" onClick={() => handlePrintInvoicePreview({customerName, phoneNumber, orderDate: new Date().toISOString().split('T')[0], items, totalCost, amountPaid})} className="mt-4 w-full px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                            <svg className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Preview
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
                            <button type="button" onClick={() => { if(formDisabled) onSaveSuccess(); else onCancel(); }} className="px-8 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                {formDisabled ? 'Back' : 'Cancel'}
                            </button>
                            {!formDisabled && (
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                                    {isSubmitting ? 'Saving...' : 'Save Order'}
                                </button>
                            )}
                            {formDisabled && lastSavedOrder && (
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

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = filteredOrders.filter(order => order.orderDate === today);
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.amountPaid, 0);
        const pendingAmount = filteredOrders.reduce((sum, order) => sum + (order.totalCost - order.amountPaid), 0);
        
        return {
            totalOrders: filteredOrders.length,
            todayOrders: todayOrders.length,
            totalRevenue,
            pendingAmount
        };
    }, [filteredOrders]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
                    <p className="text-slate-600 mt-1">Manage and track all your orders</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{stats.totalOrders}</div>
                        <div className="text-slate-600">Total Orders</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.todayOrders}</div>
                        <div className="text-slate-600">Today</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalRevenue.toLocaleString()}</div>
                        <div className="text-slate-600">Total Received</div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><SearchIcon /></div>
                        <input type="text" placeholder="Search by name, phone, ID, or item..." className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 font-medium">Filter:</span>
                        <div className="flex items-center space-x-2 overflow-x-auto">
                            <button onClick={() => setStatusFilter('All')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${statusFilter === 'All' ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All ({orders.length})</button>
                            {ALL_STATUSES_WITH_COMPLETED.map(status => {
                                const count = orders.filter(o => o.status === status).length;
                                return (
                                    <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        {status} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {stats.pendingAmount > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="text-amber-600 mr-2">⚠️</div>
                            <div>
                                <span className="font-medium text-amber-800">Pending Amount:</span>
                                <span className="ml-2 text-amber-900 font-bold">{stats.pendingAmount.toLocaleString()} جنيه</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div>
                {filteredOrders.length > 0 ? (
                    <>
                        <div className="flex justify-between items-center text-sm text-slate-600 mb-6">
                            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                            <span>Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredOrders.map(order => (
                                <OrderCard key={order.id} order={order} updateOrder={updateOrder} />
                            ))}
                        </div>
                    </>
                ) : (
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
    const isCancelled = order.status === OrderStatus.Cancelled;
    const daysSinceOrder = Math.floor((new Date().getTime() - new Date(order.orderDate).getTime()) / (1000 * 60 * 60 * 24));
    const progressPercentage = (order.amountPaid / order.totalCost) * 100;
    const statusColor = STATUS_COLORS[order.status];

    useEffect(() => {
        setEditOrder(order);
    }, [order]);

    const handleEditChange = (field: keyof Order, value: any) => {
        setEditOrder(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateOrder(editOrder);
        setIsEditing(false);
    };

    const handleDone = () => updateOrder({ ...order, status: OrderStatus.Completed });
    const handleCancel = () => updateOrder({ ...order, status: OrderStatus.Cancelled });
    const handlePrintInvoice = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FLEX Invoice</title><style>@page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#333;line-height:1.4}.invoice{max-width:800px;margin:0 auto;background:white}.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:30px;text-align:center;margin-bottom:30px}.header h1{font-size:36px;font-weight:bold;margin-bottom:8px}.header p{font-size:16px;opacity:0.9}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px}.info-section h3{color:#4f46e5;font-size:14px;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}.info-section p{margin-bottom:5px}.table{width:100%;border-collapse:collapse;margin:20px 0}.table th{background:#f8fafc;padding:12px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0}.table td{padding:12px;border-bottom:1px solid #e2e8f0}.table tr:nth-child(even){background:#f8fafc}.text-right{text-align:right}.totals{background:#f8fafc;padding:20px;border-radius:8px;margin-top:20px}.total-row{display:flex;justify-content:space-between;margin-bottom:8px}.total-row.final{font-weight:bold;font-size:18px;color:#4f46e5;border-top:2px solid #e2e8f0;padding-top:8px;margin-top:8px}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#6b7280}@media print{body{-webkit-print-color-adjust:exact}.header{-webkit-print-color-adjust:exact}}</style></head><body><div class="invoice"><div class="header"><h1>FLEX</h1><p>Professional Order Invoice</p></div><div class="info-grid"><div class="info-section"><h3>Bill To</h3><p><strong>${order.customerName}</strong></p><p>${order.phoneNumber}</p></div><div class="info-section"><h3>Invoice Details</h3><p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p><p><strong>Invoice #:</strong> ${order.id}</p><p><strong>Status:</strong> ${order.status}</p></div></div><table class="table"><thead><tr><th>Description</th><th class="text-right">Qty</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr></thead><tbody>${order.items.map(item => `<tr><td>${item.description}${item.width || item.height ? `<br><small style="color: #6b7280;">${item.width || ''}${item.width && item.height ? ' x ' : ''}${item.height || ''} cm</small>` : ''}</td><td class="text-right">${item.quantity}</td><td class="text-right">${item.cost.toLocaleString()} EGP</td><td class="text-right">${(item.cost * item.quantity).toLocaleString()} EGP</td></tr>`).join('')}</tbody></table><div class="totals"><div class="total-row"><span>Subtotal:</span><span>${order.totalCost.toLocaleString()} EGP</span></div><div class="total-row"><span>Amount Paid:</span><span style="color: #059669;">${order.amountPaid.toLocaleString()} EGP</span></div><div class="total-row final"><span>Balance Due:</span><span>${(order.totalCost - order.amountPaid).toLocaleString()} EGP</span></div></div><div class="footer"><p><strong>Thank you for your business!</strong></p><p>FLEX - Professional Printing Services</p></div></div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}};</script></body></html>`);
        printWindow.document.close();
    };

    return (
        <div 
            className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                isExpanded 
                    ? 'border-blue-300 shadow-2xl z-10' 
                    : 'border-slate-200 shadow-lg hover:shadow-xl hover:scale-105 hover:border-blue-200'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Compact Card View */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="relative group/status" onClick={e => e.stopPropagation()}>
                                <select 
                                    className={`px-3 py-1 text-xs font-bold rounded-full border-0 cursor-pointer ${statusColor.base} ${statusColor.text} opacity-0 group-hover:opacity-100 absolute inset-0 z-10`}
                                    value={order.status}
                                    onChange={e => updateOrder({ ...order, status: e.target.value as OrderStatus })}
                                >
                                    {ALL_STATUSES_WITH_COMPLETED.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor.base} ${statusColor.text} group-hover:opacity-50 transition-opacity`}>
                                    {order.status}
                                </span>
                            </div>
                            {daysSinceOrder <= 1 && (
                                <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">NEW</span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{order.customerName}</h3>
                        <p className="text-sm text-slate-500 font-mono">{order.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">{order.totalCost.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">EGP</div>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Paid:</span>
                        <span className="font-semibold text-green-600">{order.amountPaid.toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Remaining:</span>
                        <span className={`font-semibold ${amountRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {amountRemaining.toLocaleString()} EGP
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>{order.items.length} items</span>
                        <span>{daysSinceOrder} days ago</span>
                    </div>
                </div>
            </div>

            {/* Expanded Modal View */}
            {isExpanded && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsExpanded(false)}>
                    <div 
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white p-6 border-b border-slate-200 rounded-t-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input 
                                                className="text-2xl font-bold text-slate-900 border-b-2 border-blue-300 bg-transparent w-full"
                                                value={editOrder.customerName}
                                                onChange={e => handleEditChange('customerName', e.target.value)}
                                            />
                                            <input 
                                                className="text-slate-600 border-b border-slate-300 bg-transparent w-full"
                                                value={editOrder.phoneNumber}
                                                onChange={e => handleEditChange('phoneNumber', e.target.value)}
                                            />
                                            <select 
                                                className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                                                value={editOrder.status}
                                                onChange={e => handleEditChange('status', e.target.value as OrderStatus)}
                                            >
                                                {ALL_STATUSES_WITH_COMPLETED.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">{order.customerName}</h2>
                                            <p className="text-slate-600">{order.phoneNumber}</p>
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${statusColor.base} ${statusColor.text}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-500 mt-1">{order.orderDate} • {order.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isCompleted && !isCancelled && (
                                        isEditing ? (
                                            <>
                                                <button onClick={handleSave} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                                                    Save
                                                </button>
                                                <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300">
                                                Edit
                                            </button>
                                        )
                                    )}
                                    <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-400 hover:text-slate-600 text-2xl">
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl text-center">
                                    <div className="text-sm text-slate-600 mb-1">Total</div>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            className="text-xl font-bold text-slate-900 bg-transparent text-center w-full border-b border-slate-300"
                                            value={editOrder.totalCost}
                                            onChange={e => handleEditChange('totalCost', Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="text-xl font-bold text-slate-900">{order.totalCost.toLocaleString()}</div>
                                    )}
                                    <div className="text-xs text-slate-500">EGP</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-center">
                                    <div className="text-sm text-slate-600 mb-1">Paid</div>
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            className="text-xl font-bold text-green-600 bg-transparent text-center w-full border-b border-slate-300"
                                            value={editOrder.amountPaid}
                                            onChange={e => handleEditChange('amountPaid', Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="text-xl font-bold text-green-600">{order.amountPaid.toLocaleString()}</div>
                                    )}
                                    <div className="text-xs text-slate-500">EGP</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl text-center">
                                    <div className="text-sm text-slate-600 mb-1">Remaining</div>
                                    <div className={`text-xl font-bold ${amountRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {((isEditing ? editOrder.totalCost - editOrder.amountPaid : amountRemaining)).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500">EGP</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-semibold text-slate-800 mb-4">Items ({order.items.length})</h3>
                                <div className="space-y-2">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start py-2 border-b border-slate-200 last:border-b-0">
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">{item.description}</div>
                                                {(item.width || item.height) && (
                                                    <div className="text-sm text-slate-500">
                                                        {item.width && item.height ? `${item.width} × ${item.height} cm` : 
                                                         item.width ? `${item.width} cm` : `${item.height} cm`}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="font-semibold text-slate-900">{(item.cost * item.quantity).toLocaleString()} EGP</div>
                                                <div className="text-sm text-slate-500">{item.quantity} × {item.cost}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                {!isCompleted && !isCancelled && (
                                    <>
                                        <button onClick={handleDone} className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold">
                                            Mark as Delivered
                                        </button>
                                        <button onClick={handleCancel} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold">
                                            Cancel Order
                                        </button>
                                    </>
                                )}
                                <button onClick={handlePrintInvoice} className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold">
                                    Print Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.Cancelled), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => o.status !== OrderStatus.Completed && o.status !== OrderStatus.Cancelled), [orders]);
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
        return <DashboardView newOrdersCount={newOrdersCount} inProgressCount={inProgressCount} orders={activeOrders} onNewOrderClick={() => setCurrentView('new-order')} />;
      case 'new-order':
        return <OrderFormView onSaveSuccess={handleSaveSuccess} onCancel={() => setCurrentView('dashboard')} addOrder={addOrder} />;
      case 'history':
        return (
          <>
            <OrderHistoryView orders={activeOrders} updateOrder={updateOrder} />
            {deliveredOrders.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-green-700 mb-6">Delivered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {deliveredOrders.map(order => (
                    <OrderCard key={order.id} order={order} updateOrder={() => {}} />
                  ))}
                </div>
              </div>
            )}
            {cancelledOrders.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-red-700 mb-6">Cancelled</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cancelledOrders.map(order => (
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
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen font-sans text-slate-800">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-12">
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FLEX Invoice Preview</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.4; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
        .header p { font-size: 16px; opacity: 0.9; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-section h3 { color: #4f46e5; font-size: 14px; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-section p { margin-bottom: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
        .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .table tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .totals { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total-row.final { font-weight: bold; font-size: 18px; color: #4f46e5; border-top: 2px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; }
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .header { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>FLEX</h1>
            <p>Professional Order Invoice - Preview</p>
        </div>
        
        <div class="info-grid">
            <div class="info-section">
                <h3>Bill To</h3>
                <p><strong>${customerName || 'Customer Name'}</strong></p>
                <p>${phoneNumber || 'Phone Number'}</p>
            </div>
            <div class="info-section">
                <h3>Invoice Details</h3>
                <p><strong>Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
                <p><strong>Invoice #:</strong> PREVIEW-${Date.now()}</p>
                <p><strong>Status:</strong> Draft</p>
            </div>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.length === 0 || (items.length === 1 && !items[0].description) ?
                    `<tr><td colspan="4" style="text-align:center;color:#888;padding:16px;">No items added</td></tr>` :
                    items.map(item => `
                        <tr>
                            <td>${item.description || 'Item description'}</td>
                            <td class="text-right">${item.quantity || 1}</td>
                            <td class="text-right">${Number(item.cost || 0).toLocaleString()} EGP</td>
                            <td class="text-right">${(Number(item.cost || 0) * Number(item.quantity || 1)).toLocaleString()} EGP</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${totalCost.toLocaleString()} EGP</span>
            </div>
            <div class="total-row">
                <span>Amount Paid:</span>
                <span style="color: #059669;">${Number(amountPaid || 0).toLocaleString()} EGP</span>
            </div>
            <div class="total-row final">
                <span>Balance Due:</span>
                <span>${(totalCost - (Number(amountPaid) || 0)).toLocaleString()} EGP</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>FLEX - Professional Printing Services</p>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            };
        };
    </script>
</body>
</html>`;
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
}

export default App;
