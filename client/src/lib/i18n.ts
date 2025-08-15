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
  confirmDeleteClothing: string;
  confirmDeleteService: string;
  
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

  // Settings
  error: string;
  settingsSaved: string;
  settingsUpdated: string;
  preferencesUpdated: string;
  systemSettings: string;
  currencySettings: string;
  defaultCurrency: string;
  selectCurrency: string;
  preview: string;
  taxRate: string;
  languageLocalization: string;
  systemLanguage: string;
  selectLanguage: string;
  english: string;
  arabic: string;
  urdu: string;
  companyInformation: string;
  companyNameLabel: string;
  saveSettings: string;
  resetToDefaults: string;
  saveChanges: string;
  settingsReset: string;
  settingsRestored: string;
  profile: string;
  business: string;
  receipts: string;
  system: string;
  pricing: string;
  appearance: string;
  security: string;
  businessInformation: string;
  businessNameLabel: string;
  businessAddress: string;
  currency: string;
  usDollar: string;
  euro: string;
  britishPound: string;
  canadianDollar: string;
  receiptConfiguration: string;
  receiptHeaderMessage: string;
  receiptFooterMessage: string;
  printBusinessLogo: string;
  includeLogoPrintedReceipts: string;
  systemPreferences: string;
  autoLogoutMinutes: string;
  minutes15: string;
  minutes30: string;
  oneHour: string;
  twoHours: string;
  never: string;
  enableNotifications: string;
  showSystemNotificationsAlerts: string;
  soundEffects: string;
  playSoundsForClicks: string;
  pricingTaxSettings: string;
  minimumOrderAmount: string;
  priceRoundingMethod: string;
  roundToNearestCent: string;
  alwaysRoundUp: string;
  alwaysRoundDown: string;
  appearanceSettings: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  autoSystem: string;
  primaryColor: string;
  compactMode: string;
  useSmallerSpacingFonts: string;
  securitySettings: string;
  sessionTimeoutMinutes: string;
  requireTwoFactorAuthentication: string;
  passwordPolicy: string;
  passwordPolicyPlaceholder: string;
  failedSaveSecuritySettings: string;
  name: string;
  newPassword: string;
  profileUpdated: string;
  // Auth
  loginTitle: string;
  loginDescription: string;
  usernameLabel: string;
  passwordLabel: string;
  loginButton: string;
  signingIn: string;
  loginSuccess: string;
  welcome: string;
  loginFailed: string;
  missingCredentials: string;
  logoutSuccess: string;
  logoutFailed: string;
  mainStore: string;
  laundryManagementSystem: string;
  allItems: string;
  loadingCategories: string;
  failedToLoadCategories: string;
  loadingProducts: string;
  loadingClothingItems: string;
  searchProducts: string;
  searchItemsServices: string;
  noProductsFound: string;
  stock: string;
  searchClothingItems: string;
  noClothingItemsFound: string;
  servicePriceInfo: string;
  categoryManagement: string;
  inventoryManagement: string;
  categoryCreated: string;
  categoryUpdated: string;
  categoryDeleted: string;
  errorCreatingCategory: string;
  errorUpdatingCategory: string;
  errorDeletingCategory: string;
  type: string;
  description: string;
  optionalDescription: string;
  create: string;
  update: string;
  clothing: string;
  service: string;
  category: string;
  clothingCategories: string;
  serviceCategories: string;
  categoriesForClothingItems: string;
  categoriesForLaundryServices: string;
  active: string;
  inactive: string;
  noClothingCategoriesFound: string;
  noServiceCategoriesFound: string;
  pants: string;
  shirts: string;
  traditional: string;
  dresses: string;
  formal: string;
  linens: string;
  clothingItemCreated: string;
  clothingItemUpdated: string;
  clothingItemDeleted: string;
  serviceCreated: string;
  serviceUpdated: string;
  serviceDeleted: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    confirmDeleteClothing: "Are you sure you want to delete this clothing item?",
    confirmDeleteService: "Are you sure you want to delete this service?",
    
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
    // Settings
    error: "Error",
    settingsSaved: "Settings saved",
    settingsUpdated: "System settings have been updated successfully",
    preferencesUpdated: "Your preferences have been updated.",
    systemSettings: "System Settings",
    currencySettings: "Currency Settings",
    defaultCurrency: "Default Currency",
    selectCurrency: "Select currency",
    preview: "Preview",
    taxRate: "Tax Rate (%)",
    languageLocalization: "Language & Localization",
    systemLanguage: "System Language",
    selectLanguage: "Select language",
    english: "English",
    arabic: "Arabic",
    urdu: "Urdu",
    companyInformation: "Company Information",
    companyNameLabel: "Company Name",
    saveSettings: "Save Settings",
    resetToDefaults: "Reset to Defaults",
    saveChanges: "Save Changes",
    settingsReset: "Settings reset",
    settingsRestored: "All settings have been restored to defaults.",
    profile: "Profile",
    business: "Business",
    receipts: "Receipts",
    system: "System",
    pricing: "Pricing",
    appearance: "Appearance",
    security: "Security",
    businessInformation: "Business Information",
    businessNameLabel: "Business Name",
    businessAddress: "Business Address",
    currency: "Currency",
    usDollar: "US Dollar ($)",
    euro: "Euro (€)",
    britishPound: "British Pound (£)",
    canadianDollar: "Canadian Dollar (CAD)",
    receiptConfiguration: "Receipt Configuration",
    receiptHeaderMessage: "Receipt Header Message",
    receiptFooterMessage: "Receipt Footer Message",
    printBusinessLogo: "Print Business Logo",
    includeLogoPrintedReceipts: "Include logo on printed receipts",
    systemPreferences: "System Preferences",
    autoLogoutMinutes: "Auto Logout (minutes)",
    minutes15: "15 minutes",
    minutes30: "30 minutes",
    oneHour: "1 hour",
    twoHours: "2 hours",
    never: "Never",
    enableNotifications: "Enable Notifications",
    showSystemNotificationsAlerts: "Show system notifications and alerts",
    soundEffects: "Sound Effects",
    playSoundsForClicks: "Play sounds for button clicks and alerts",
    pricingTaxSettings: "Pricing & Tax Settings",
    minimumOrderAmount: "Minimum Order Amount",
    priceRoundingMethod: "Price Rounding Method",
    roundToNearestCent: "Round to Nearest Cent",
    alwaysRoundUp: "Always Round Up",
    alwaysRoundDown: "Always Round Down",
    appearanceSettings: "Appearance Settings",
    theme: "Theme",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    autoSystem: "Auto (System)",
    primaryColor: "Primary Color",
    compactMode: "Compact Mode",
    useSmallerSpacingFonts: "Use smaller spacing and fonts",
    securitySettings: "Security Settings",
    sessionTimeoutMinutes: "Session Timeout (minutes)",
    requireTwoFactorAuthentication: "Require Two-Factor Authentication",
    passwordPolicy: "Password Policy",
    passwordPolicyPlaceholder: "e.g., Minimum 8 characters",
    failedSaveSecuritySettings: "Failed to save security settings",
    name: "Name",
    newPassword: "New Password",
    profileUpdated: "Profile updated",
    // Auth
    loginTitle: "Laundry Management",
    loginDescription: "Sign in to access the system",
    usernameLabel: "Username",
    passwordLabel: "Password",
    loginButton: "Sign In",
    signingIn: "Signing in...",
    loginSuccess: "Login Successful",
    welcome: "Welcome to the Laundry Management System",
    loginFailed: "Login Failed",
    missingCredentials: "Please enter both username and password",
    logoutSuccess: "Logged out successfully",
    logoutFailed: "Logout failed",
    mainStore: "Main Store",
    laundryManagementSystem: "Laundry Management System",
    allItems: "All Items",
    loadingCategories: "Loading categories...",
    failedToLoadCategories: "Failed to load categories",
    loadingProducts: "Loading products...",
    loadingClothingItems: "Loading clothing items...",
    searchProducts: "Search products...",
    searchItemsServices: "Search items and services...",
    noProductsFound: "No products found",
    stock: "Stock",
    searchClothingItems: "Search clothing items...",
    noClothingItemsFound: "No clothing items found",
    servicePriceInfo: "Service prices will be shown in the next step",
    categoryManagement: "Category Management",
    inventoryManagement: "Inventory Management",
    categoryCreated: "Category created successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleted: "Category deleted successfully",
    errorCreatingCategory: "Error creating category",
    errorUpdatingCategory: "Error updating category",
    errorDeletingCategory: "Error deleting category",
    type: "Type",
    description: "Description",
    optionalDescription: "Optional description",
    create: "Create",
    update: "Update",
    clothing: "Clothing",
    service: "Service",
    category: "Category",
    clothingCategories: "Clothing Categories",
    serviceCategories: "Service Categories",
    categoriesForClothingItems: "Categories for clothing items",
    categoriesForLaundryServices: "Categories for laundry services",
    active: "Active",
    inactive: "Inactive",
    noClothingCategoriesFound: "No clothing categories found",
    noServiceCategoriesFound: "No service categories found",
    pants: "Pants",
    shirts: "Shirts",
    traditional: "Traditional",
    dresses: "Dresses",
    formal: "Formal",
    linens: "Linens",
    clothingItemCreated: "Clothing item created successfully",
    clothingItemUpdated: "Clothing item updated successfully",
    clothingItemDeleted: "Clothing item deleted successfully",
    serviceCreated: "Service created successfully",
    serviceUpdated: "Service updated successfully",
    serviceDeleted: "Service deleted successfully",
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
    confirmDeleteClothing: "هل أنت متأكد أنك تريد حذف عنصر الملابس هذا؟",
    confirmDeleteService: "هل أنت متأكد أنك تريد حذف هذه الخدمة؟",
    
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
    // Settings
    error: "خطأ",
    settingsSaved: "تم حفظ الإعدادات",
    settingsUpdated: "تم تحديث إعدادات النظام بنجاح",
    preferencesUpdated: "تم تحديث تفضيلاتك.",
    systemSettings: "إعدادات النظام",
    currencySettings: "إعدادات العملة",
    defaultCurrency: "العملة الافتراضية",
    selectCurrency: "اختر العملة",
    preview: "معاينة",
    taxRate: "نسبة الضريبة (%)",
    languageLocalization: "اللغة والتعريب",
    systemLanguage: "لغة النظام",
    selectLanguage: "اختر اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    urdu: "الأردية",
    companyInformation: "معلومات الشركة",
    companyNameLabel: "اسم الشركة",
    saveSettings: "حفظ الإعدادات",
    resetToDefaults: "إعادة التعيين للوضع الافتراضي",
    saveChanges: "حفظ التغييرات",
    settingsReset: "تمت إعادة تعيين الإعدادات",
    settingsRestored: "تمت استعادة جميع الإعدادات إلى الوضع الافتراضي.",
    profile: "الملف الشخصي",
    business: "الأعمال",
    receipts: "الإيصالات",
    system: "النظام",
    pricing: "التسعير",
    appearance: "المظهر",
    security: "الأمان",
    businessInformation: "معلومات العمل",
    businessNameLabel: "اسم العمل",
    businessAddress: "عنوان العمل",
    currency: "العملة",
    usDollar: "دولار أمريكي ($)",
    euro: "يورو (€)",
    britishPound: "جنيه إسترليني (£)",
    canadianDollar: "دولار كندي (CAD)",
    receiptConfiguration: "إعدادات الإيصال",
    receiptHeaderMessage: "رسالة رأس الإيصال",
    receiptFooterMessage: "رسالة ذيل الإيصال",
    printBusinessLogo: "طباعة شعار العمل",
    includeLogoPrintedReceipts: "تضمين الشعار في الإيصالات المطبوعة",
    systemPreferences: "تفضيلات النظام",
    autoLogoutMinutes: "تسجيل الخروج التلقائي (بالدقائق)",
    minutes15: "15 دقيقة",
    minutes30: "30 دقيقة",
    oneHour: "ساعة واحدة",
    twoHours: "ساعتان",
    never: "أبداً",
    enableNotifications: "تمكين الإشعارات",
    showSystemNotificationsAlerts: "عرض إشعارات النظام والتنبيهات",
    soundEffects: "المؤثرات الصوتية",
    playSoundsForClicks: "تشغيل الأصوات للنقرات والتنبيهات",
    pricingTaxSettings: "إعدادات التسعير والضريبة",
    minimumOrderAmount: "الحد الأدنى للطلب",
    priceRoundingMethod: "طريقة تقريب السعر",
    roundToNearestCent: "تقريب لأقرب سنت",
    alwaysRoundUp: "التقريب دائماً للأعلى",
    alwaysRoundDown: "التقريب دائماً للأسفل",
    appearanceSettings: "إعدادات المظهر",
    theme: "السمة",
    lightTheme: "سمة فاتحة",
    darkTheme: "سمة داكنة",
    autoSystem: "تلقائي (النظام)",
    primaryColor: "اللون الأساسي",
    compactMode: "وضع مضغوط",
    useSmallerSpacingFonts: "استخدام تباعد وخطوط أصغر",
    securitySettings: "إعدادات الأمان",
    sessionTimeoutMinutes: "انتهاء الجلسة (بالدقائق)",
    requireTwoFactorAuthentication: "طلب المصادقة الثنائية",
    passwordPolicy: "سياسة كلمة المرور",
    passwordPolicyPlaceholder: "مثال: حد أدنى 8 أحرف",
    failedSaveSecuritySettings: "فشل حفظ إعدادات الأمان",
    name: "الاسم",
    newPassword: "كلمة مرور جديدة",
    profileUpdated: "تم تحديث الملف الشخصي",
    // Auth
    loginTitle: "إدارة الغسيل",
    loginDescription: "سجّل الدخول للوصول إلى النظام",
    usernameLabel: "اسم المستخدم",
    passwordLabel: "كلمة المرور",
    loginButton: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    welcome: "مرحباً بك في نظام إدارة الغسيل",
    loginFailed: "فشل تسجيل الدخول",
    missingCredentials: "يرجى إدخال اسم المستخدم وكلمة المرور",
    logoutSuccess: "تم تسجيل الخروج بنجاح",
    logoutFailed: "فشل تسجيل الخروج",
    mainStore: "المتجر الرئيسي",
    laundryManagementSystem: "نظام إدارة المغسلة",
    allItems: "جميع العناصر",
    loadingCategories: "جاري تحميل الفئات...",
    failedToLoadCategories: "فشل تحميل الفئات",
    loadingProducts: "جاري تحميل المنتجات...",
    loadingClothingItems: "جاري تحميل عناصر الملابس...",
    searchProducts: "بحث عن المنتجات...",
    searchItemsServices: "البحث عن العناصر والخدمات...",
    noProductsFound: "لم يتم العثور على منتجات",
    stock: "المخزون",
    searchClothingItems: "البحث عن عناصر الملابس...",
    noClothingItemsFound: "لم يتم العثور على عناصر الملابس",
    servicePriceInfo: "ستظهر أسعار الخدمات في الخطوة التالية",
    categoryManagement: "إدارة الفئات",
    inventoryManagement: "إدارة المخزون",
    categoryCreated: "تم إنشاء الفئة بنجاح",
    categoryUpdated: "تم تحديث الفئة بنجاح",
    categoryDeleted: "تم حذف الفئة بنجاح",
    errorCreatingCategory: "خطأ في إنشاء الفئة",
    errorUpdatingCategory: "خطأ في تحديث الفئة",
    errorDeletingCategory: "خطأ في حذف الفئة",
    type: "النوع",
    description: "الوصف",
    optionalDescription: "وصف اختياري",
    create: "إنشاء",
    update: "تحديث",
    clothing: "ملابس",
    service: "خدمة",
    category: "فئة",
    clothingCategories: "فئات الملابس",
    serviceCategories: "فئات الخدمات",
    categoriesForClothingItems: "فئات لعناصر الملابس",
    categoriesForLaundryServices: "فئات لخدمات الغسيل",
    active: "نشط",
    inactive: "غير نشط",
    noClothingCategoriesFound: "لم يتم العثور على فئات ملابس",
    noServiceCategoriesFound: "لم يتم العثور على فئات خدمات",
    pants: "بنطال",
    shirts: "قمصان",
    traditional: "تقليدي",
    dresses: "فساتين",
    formal: "رسمي",
    linens: "أقمشة",
    clothingItemCreated: "تم إنشاء عنصر الملابس بنجاح",
    clothingItemUpdated: "تم تحديث عنصر الملابس بنجاح",
    clothingItemDeleted: "تم حذف عنصر الملابس بنجاح",
    serviceCreated: "تم إنشاء الخدمة بنجاح",
    serviceUpdated: "تم تحديث الخدمة بنجاح",
    serviceDeleted: "تم حذف الخدمة بنجاح",
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
    confirmDeleteClothing: "کیا آپ واقعی اس کپڑے کی چیز کو حذف کرنا چاہتے ہیں؟",
    confirmDeleteService: "کیا آپ واقعی اس خدمت کو حذف کرنا چاہتے ہیں؟",
    
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
    // Settings
    error: "غلطی",
    settingsSaved: "ترتیبات محفوظ ہو گئیں",
    settingsUpdated: "سسٹم کی ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں",
    preferencesUpdated: "آپ کی ترجیحات اپ ڈیٹ ہو گئیں۔",
    systemSettings: "سسٹم سیٹنگز",
    currencySettings: "کرنسی کی ترتیبات",
    defaultCurrency: "طے شدہ کرنسی",
    selectCurrency: "کرنسی منتخب کریں",
    preview: "پیش نظارہ",
    taxRate: "ٹیکس کی شرح (%)",
    languageLocalization: "زبان اور مقامی سازی",
    systemLanguage: "سسٹم کی زبان",
    selectLanguage: "زبان منتخب کریں",
    english: "انگریزی",
    arabic: "عربی",
    urdu: "اردو",
    companyInformation: "کمپنی کی معلومات",
    companyNameLabel: "کمپنی کا نام",
    saveSettings: "ترتیبات محفوظ کریں",
    resetToDefaults: "پہلے جیسی کریں",
    saveChanges: "تبدیلیاں محفوظ کریں",
    settingsReset: "ترتیبات ری سیٹ ہو گئیں",
    settingsRestored: "تمام ترتیبات کو ڈیفالٹ پر بحال کر دیا گیا ہے۔",
    profile: "پروفائل",
    business: "کاروبار",
    receipts: "رسیدیں",
    system: "سسٹم",
    pricing: "قیمتیں",
    appearance: "ظاہری شکل",
    security: "سیکیورٹی",
    businessInformation: "کاروباری معلومات",
    businessNameLabel: "کاروبار کا نام",
    businessAddress: "کاروباری پتہ",
    currency: "کرنسی",
    usDollar: "امریکی ڈالر ($)",
    euro: "یورو (€)",
    britishPound: "برطانوی پاؤنڈ (£)",
    canadianDollar: "کینیڈین ڈالر (CAD)",
    receiptConfiguration: "رسید کی ترتیبات",
    receiptHeaderMessage: "رسید کے سر کی عبارت",
    receiptFooterMessage: "رسید کے آخر کی عبارت",
    printBusinessLogo: "کاروباری لوگو پرنٹ کریں",
    includeLogoPrintedReceipts: "پرنٹ شدہ رسیدوں پر لوگو شامل کریں",
    systemPreferences: "سسٹم کی ترجیحات",
    autoLogoutMinutes: "خود کار لاگ آؤٹ (منٹوں میں)",
    minutes15: "15 منٹ",
    minutes30: "30 منٹ",
    oneHour: "1 گھنٹہ",
    twoHours: "2 گھنٹے",
    never: "کبھی نہیں",
    enableNotifications: "نوٹیفکیشن فعال کریں",
    showSystemNotificationsAlerts: "سسٹم نوٹیفکیشن اور الرٹس دکھائیں",
    soundEffects: "ساؤنڈ ایفیکٹس",
    playSoundsForClicks: "بٹن کلکس اور الرٹس کے لیے آوازیں چلائیں",
    pricingTaxSettings: "قیمت اور ٹیکس کی ترتیبات",
    minimumOrderAmount: "کم از کم آرڈر رقم",
    priceRoundingMethod: "قیمت کو گول کرنے کا طریقہ",
    roundToNearestCent: "قریب ترین سینٹ تک گول کریں",
    alwaysRoundUp: "ہمیشہ اوپر گول کریں",
    alwaysRoundDown: "ہمیشہ نیچے گول کریں",
    appearanceSettings: "ظاہری شکل کی ترتیبات",
    theme: "تھیم",
    lightTheme: "لائٹ تھیم",
    darkTheme: "ڈارک تھیم",
    autoSystem: "خودکار (سسٹم)",
    primaryColor: "بنیادی رنگ",
    compactMode: "کمپیکٹ موڈ",
    useSmallerSpacingFonts: "کم فاصلے اور فونٹس استعمال کریں",
    securitySettings: "سیکیورٹی سیٹنگز",
    sessionTimeoutMinutes: "سیشن ٹائم آؤٹ (منٹوں میں)",
    requireTwoFactorAuthentication: "ٹو فیکٹر تصدیق درکار ہے",
    passwordPolicy: "پاس ورڈ پالیسی",
    passwordPolicyPlaceholder: "مثال: کم از کم 8 حروف",
    failedSaveSecuritySettings: "سیکیورٹی سیٹنگز محفوظ کرنے میں ناکام",
    name: "نام",
    newPassword: "نیا پاس ورڈ",
    profileUpdated: "پروفائل اپ ڈیٹ ہو گیا",
    // Auth
    loginTitle: "لانڈری مینجمنٹ",
    loginDescription: "سسٹم تک رسائی کے لیے سائن ان کریں",
    usernameLabel: "صارف نام",
    passwordLabel: "پاس ورڈ",
    loginButton: "سائن ان",
    signingIn: "سائن ان ہو رہا ہے...",
    loginSuccess: "لاگ اِن کامیاب",
    welcome: "لانڈری مینجمنٹ سسٹم میں خوش آمدید",
    loginFailed: "لاگ اِن ناکام",
    missingCredentials: "براہ کرم صارف نام اور پاس ورڈ درج کریں",
    logoutSuccess: "لاگ آؤٹ کامیاب رہا",
    logoutFailed: "لاگ آؤٹ ناکام ہوا",
    mainStore: "مین اسٹور",
    laundryManagementSystem: "لانڈری مینجمنٹ سسٹم",
    allItems: "تمام اشیاء",
    loadingCategories: "زمرے لوڈ ہو رہے ہیں...",
    failedToLoadCategories: "زمرے لوڈ کرنے میں ناکام",
    loadingProducts: "مصنوعات لوڈ ہو رہی ہیں...",
    loadingClothingItems: "کپڑوں کی اشیاء لوڈ ہو رہی ہیں...",
    searchProducts: "مصنوعات تلاش کریں...",
    searchItemsServices: "اشیاء اور خدمات تلاش کریں...",
    noProductsFound: "کوئی مصنوعات نہیں ملی",
    stock: "اسٹاک",
    searchClothingItems: "کپڑوں کی اشیاء تلاش کریں...",
    noClothingItemsFound: "کوئی کپڑوں کی اشیاء نہیں ملیں",
    servicePriceInfo: "خدمات کی قیمتیں اگلے مرحلے میں دکھائی جائیں گی",
    categoryManagement: "زمرہ جات کا انتظام",
    inventoryManagement: "انوینٹری کا انتظام",
    categoryCreated: "زمرہ کامیابی سے بن گیا",
    categoryUpdated: "زمرہ کامیابی سے اپ ڈیٹ ہو گیا",
    categoryDeleted: "زمرہ کامیابی سے حذف ہو گیا",
    errorCreatingCategory: "زمرہ بنانے میں خرابی",
    errorUpdatingCategory: "زمرہ اپ ڈیٹ کرنے میں خرابی",
    errorDeletingCategory: "زمرہ حذف کرنے میں خرابی",
    type: "قسم",
    description: "تفصیل",
    optionalDescription: "اختیاری تفصیل",
    create: "بنائیں",
    update: "اپ ڈیٹ",
    clothing: "کپڑے",
    service: "سروس",
    category: "زمرہ",
    clothingCategories: "کپڑوں کے زمرے",
    serviceCategories: "سروس کے زمرے",
    categoriesForClothingItems: "کپڑوں کی اشیاء کے لئے زمرے",
    categoriesForLaundryServices: "لانڈری خدمات کے لئے زمرے",
    active: "فعال",
    inactive: "غیرفعال",
    noClothingCategoriesFound: "کوئی کپڑوں کے زمرے نہیں ملے",
    noServiceCategoriesFound: "کوئی سروس کے زمرے نہیں ملے",
    pants: "پتلون",
    shirts: "قمیضیں",
    traditional: "روایتی",
    dresses: "ڈریس",
    formal: "فارمل",
    linens: "لینن",
    clothingItemCreated: "کپڑے کی چیز کامیابی سے بن گئی",
    clothingItemUpdated: "کپڑے کی چیز کامیابی سے اپ ڈیٹ ہو گئی",
    clothingItemDeleted: "کپڑے کی چیز کامیابی سے حذف ہو گئی",
    serviceCreated: "سروس کامیابی سے بن گئی",
    serviceUpdated: "سروس کامیابی سے اپ ڈیٹ ہو گئی",
    serviceDeleted: "سروس کامیابی سے حذف ہو گئی",
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

// Remove this function as we now use the currency system
// export const formatCurrency = (amount: string | number, language: Language = 'en') => {
//   const num = typeof amount === 'string' ? parseFloat(amount) : amount;
//   
//   if (language === 'ar') {
//     return `${num.toFixed(3)} د.ك`; // Arabic KWD
//   } else if (language === 'ur') {
//     return `${num.toFixed(3)} کویتی دینار`; // Urdu KWD
//   } else {
//     return `${num.toFixed(3)} KWD`; // English KWD
//   }
// };