import { useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'ur';

export interface Translations {
  // Common
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  
  // Navigation
  sales: string;
  customers: string;
  orders: string;
  reports: string;
  admin: string;
  logout: string;
  
  // POS/Sales
  laundryServices: string;
  selectService: string;
  addToCart: string;
  cart: string;
  checkout: string;
  total: string;
  subtotal: string;
  tax: string;
  paymentMethod: string;
  cash: string;
  card: string;
  payLater: string;
  customer: string;
  selectCustomer: string;
  createNewCustomer: string;
  
  // Receipt
  receipt: string;
  payLaterReceipt: string;
  date: string;
  time: string;
  orderNumber: string;
  receiptNumber: string;
  staff: string;
  paymentDue: string;
  paymentDueUponPickup: string;
  paidInFull: string;
  thankYouPayment: string;
  thankYouService: string;
  inquiriesCall: string;
  bringReceiptPickup: string;
  print: string;
  email: string;
  
  // Customer Management
  customerName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  balanceDue: string;
  totalSpent: string;
  loyaltyPoints: string;
  
  // Order Status
  orderStatus: string;
  received: string;
  processing: string;
  washing: string;
  drying: string;
  ready: string;
  completed: string;
  
  // Company Info
  companyName: string;
  companyTagline: string;
  location: string;
  phone: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    
    // Navigation
    sales: "Sales",
    customers: "Customers",
    orders: "Orders",
    reports: "Reports",
    admin: "Admin",
    logout: "Logout",
    
    // POS/Sales
    laundryServices: "Laundry Services",
    selectService: "Select Service",
    addToCart: "Add to Cart",
    cart: "Cart",
    checkout: "Checkout",
    total: "Total",
    subtotal: "Subtotal",
    tax: "Tax",
    paymentMethod: "Payment Method",
    cash: "Cash",
    card: "Card",
    payLater: "Pay Later",
    customer: "Customer",
    selectCustomer: "Select Customer",
    createNewCustomer: "Create New Customer",
    
    // Receipt
    receipt: "Receipt",
    payLaterReceipt: "Pay Later Receipt",
    date: "Date",
    time: "Time",
    orderNumber: "Order #",
    receiptNumber: "Receipt #",
    staff: "Staff",
    paymentDue: "PAYMENT DUE",
    paymentDueUponPickup: "Payment is due upon pickup",
    paidInFull: "PAID IN FULL",
    thankYouPayment: "Thank you for your payment",
    thankYouService: "Thank you for choosing our laundry services!",
    inquiriesCall: "For inquiries, please call",
    bringReceiptPickup: "Please bring this receipt for pickup",
    print: "Print",
    email: "Email",
    
    // Customer Management
    customerName: "Customer Name",
    phoneNumber: "Phone Number",
    emailAddress: "Email",
    address: "Address",
    balanceDue: "Balance Due",
    totalSpent: "Total Spent",
    loyaltyPoints: "Loyalty Points",
    
    // Order Status
    orderStatus: "Order Status",
    received: "Received",
    processing: "Processing",
    washing: "Washing",
    drying: "Drying",
    ready: "Ready",
    completed: "Completed",
    
    // Company Info
    companyName: "LAUNDRY SERVICES",
    companyTagline: "Professional Cleaning Solutions",
    location: "Kuwait City, Kuwait",
    phone: "+965-2XXX-XXXX",
  },
  ar: {
    // Common
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث",
    
    // Navigation
    sales: "المبيعات",
    customers: "العملاء",
    orders: "الطلبات",
    reports: "التقارير",
    admin: "الإدارة",
    logout: "تسجيل الخروج",
    
    // POS/Sales
    laundryServices: "خدمات الغسيل",
    selectService: "اختيار الخدمة",
    addToCart: "إضافة للسلة",
    cart: "السلة",
    checkout: "الدفع",
    total: "المجموع",
    subtotal: "المجموع الفرعي",
    tax: "الضريبة",
    paymentMethod: "طريقة الدفع",
    cash: "نقداً",
    card: "بطاقة",
    payLater: "دفع لاحق",
    customer: "العميل",
    selectCustomer: "اختيار العميل",
    createNewCustomer: "إنشاء عميل جديد",
    
    // Receipt
    receipt: "الإيصال",
    payLaterReceipt: "إيصال دفع لاحق",
    date: "التاريخ",
    time: "الوقت",
    orderNumber: "رقم الطلب",
    receiptNumber: "رقم الإيصال",
    staff: "الموظف",
    paymentDue: "مبلغ مستحق",
    paymentDueUponPickup: "الدفع مطلوب عند الاستلام",
    paidInFull: "مدفوع بالكامل",
    thankYouPayment: "شكراً لدفعك",
    thankYouService: "شكراً لاختيارك خدمات الغسيل لدينا!",
    inquiriesCall: "للاستفسارات، يرجى الاتصال",
    bringReceiptPickup: "يرجى إحضار هذا الإيصال عند الاستلام",
    print: "طباعة",
    email: "إيميل",
    
    // Customer Management
    customerName: "اسم العميل",
    phoneNumber: "رقم الهاتف",
    emailAddress: "الإيميل",
    address: "العنوان",
    balanceDue: "الرصيد المستحق",
    totalSpent: "إجمالي المصروف",
    loyaltyPoints: "نقاط الولاء",
    
    // Order Status
    orderStatus: "حالة الطلب",
    received: "مستلم",
    processing: "قيد المعالجة",
    washing: "غسيل",
    drying: "تجفيف",
    ready: "جاهز",
    completed: "مكتمل",
    
    // Company Info
    companyName: "خدمات الغسيل",
    companyTagline: "حلول التنظيف المهنية",
    location: "مدينة الكويت، الكويت",
    phone: "+965-2XXX-XXXX",
  },
  ur: {
    // Common
    loading: "لوڈ ہو رہا ہے...",
    save: "محفوظ کریں",
    cancel: "منسوخ",
    delete: "ڈیلیٹ",
    edit: "تبدیل کریں",
    add: "شامل کریں",
    search: "تلاش",
    
    // Navigation
    sales: "فروخت",
    customers: "کسٹمرز",
    orders: "آرڈرز",
    reports: "رپورٹس",
    admin: "ایڈمن",
    logout: "لاگ آؤٹ",
    
    // POS/Sales
    laundryServices: "لانڈری خدمات",
    selectService: "خدمت منتخب کریں",
    addToCart: "ٹوکری میں ڈالیں",
    cart: "ٹوکری",
    checkout: "ادائیگی",
    total: "کل",
    subtotal: "ذیلی کل",
    tax: "ٹیکس",
    paymentMethod: "ادائیگی کا طریقہ",
    cash: "نقد",
    card: "کارڈ",
    payLater: "بعد میں ادائیگی",
    customer: "کسٹمر",
    selectCustomer: "کسٹمر منتخب کریں",
    createNewCustomer: "نیا کسٹمر بنائیں",
    
    // Receipt
    receipt: "رسید",
    payLaterReceipt: "بعد میں ادائیگی کی رسید",
    date: "تاریخ",
    time: "وقت",
    orderNumber: "آرڈر نمبر",
    receiptNumber: "رسید نمبر",
    staff: "عملہ",
    paymentDue: "ادائیگی واجب",
    paymentDueUponPickup: "لینے کے وقت ادائیگی لازمی",
    paidInFull: "مکمل ادا شدہ",
    thankYouPayment: "آپ کی ادائیگی کا شکریہ",
    thankYouService: "ہماری لانڈری خدمات منتخب کرنے کا شکریہ!",
    inquiriesCall: "استفسار کے لیے فون کریں",
    bringReceiptPickup: "لینے کے وقت یہ رسید لے کر آئیں",
    print: "پرنٹ",
    email: "ای میل",
    
    // Customer Management
    customerName: "کسٹمر کا نام",
    phoneNumber: "فون نمبر",
    emailAddress: "ای میل ایڈریس",
    address: "پتہ",
    balanceDue: "باقی رقم",
    totalSpent: "کل خرچ",
    loyaltyPoints: "وفاداری کے پوائنٹس",
    
    // Order Status
    orderStatus: "آرڈر کی حالت",
    received: "موصولہ",
    processing: "کارروائی میں",
    washing: "دھلائی",
    drying: "خشک کرنا",
    ready: "تیار",
    completed: "مکمل",
    
    // Company Info
    companyName: "لانڈری خدمات",
    companyTagline: "پیشہ ورانہ صفائی کے حل",
    location: "کویت سٹی، کویت",
    phone: "+965-2XXX-XXXX",
  }
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.dir = language === 'ar' || language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return { t, language, setLanguage };
};

export const formatCurrency = (amount: string | number, language: Language = 'en') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (language === 'ar') {
    return `${num.toFixed(3)} د.ك`; // Arabic KWD
  } else if (language === 'ur') {
    return `${num.toFixed(3)} کویتی دینار`; // Urdu KWD
  } else {
    return `${num.toFixed(3)} KWD`; // English KWD
  }
};