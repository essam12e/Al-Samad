import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

export default function DashboardApp() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("تم تسجيل الدخول");
    } catch (err) {
      alert("خطأ في تسجيل الدخول");
      console.error(err);
    }
  };

  const STORAGE_KEY = 'alsmad-next-clean-state-v2'
  const SESSION_USER_KEY = 'alsmad-next-clean-session-user-v1'
  const MAIN_ADMIN_USERNAME = 'Al-Samad'
  const MAIN_ADMIN_PASSWORD = '102030'

  const roleLabels = {
    admin: 'أدمن رئيسي',
    sales_manager: 'مدير مبيعات',
    accountant: 'محاسب',
    support: 'دعم'
  }
}
const subscriptionTypeOptions = [
  'باقة القمة',
  'باقة التميز',
  'اشتراك بيانات',
  'خدمة مخصصة',
  'شريحة موبايلي اعمال',
  'شريحة STC اعمال',
]
const durationOptions = [1, 2, 3, 6, 12]
const SAUDI_COUNTRY_CODE = '966'

const addMonths = (dateString, months) => {
  const date = new Date(dateString)
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + Number(months || 0))
  return copy.toISOString().split('T')[0]
}

const daysBetween = (targetDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

const currency = (value) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const formatDate = (value) =>
  new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))

const formatHijriDate = (value) =>
  new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))

const createInvoiceNumber = (customerId) =>
  `INV-${customerId}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`

const buildAudit = (action, actor, target, details = '') => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  action,
  actor,
  target,
  details,
  date: new Date().toLocaleString('sv-SE').replace(' ', '  '),
})

const buildDeletionRecord = (customer, actor, reason) => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  customerId: customer.id,
  customerName: customer.name,
  serialNumber: customer.serialNumber,
  customerPhone: customer.customerPhone,
  serviceNumber: customer.serviceNumber,
  orderNumber: customer.orderNumber,
  reason,
  actor,
  date: new Date().toLocaleString('sv-SE').replace(' ', '  '),
})

const createWorksheet = (rows, columns) => {
  const safeRows = rows.length ? rows : [{ 'لا توجد بيانات': '-' }]
  const worksheet = XLSX.utils.json_to_sheet(safeRows)
  worksheet['!cols'] = columns.map((width) => ({ wch: width }))
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' }
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
  worksheet['!rows'] = [{ hpt: 26 }]

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    }
  }

  return worksheet
}

const initialState = {
  users: [
    {
      id: 1,
      name: 'Al-Samad',
      username: MAIN_ADMIN_USERNAME,
      password: MAIN_ADMIN_PASSWORD,
      role: 'admin',
      protected: true,
      createdAt: '2026-04-20',
    },
  ],
  customers: [
    {
      id: 1001,
      serialNumber: 'SIM-1001',
      name: 'أحمد الشمري',
      customerPhone: '966501234567',
      serviceNumber: 'SVC-3001',
      orderNumber: 'ORD-50031',
      subscriptionType: 'باقة القمة',
      durationMonths: 12,
      startDate: '2025-04-22',
      endDate: '2026-04-22',
  renewalStatus: 'pending',
  amount: 1299,
      notes: 'عميل مهم',
    },
    {
      id: 1002,
      serialNumber: 'SIM-1002',
      name: 'خالد المطيري',
      customerPhone: '966509876543',
      serviceNumber: 'SVC-3002',
      orderNumber: 'ORD-50044',
      subscriptionType: 'باقة التميز',
      durationMonths: 6,
      startDate: '2025-10-20',
      endDate: '2026-04-20',
  renewalStatus: 'pending',
  amount: 799,
      notes: 'يحتاج تواصل قبل الانتهاء',
    },
  ],
  auditLogs: [buildAudit('تأسيس النظام', 'Al-Samad', 'الإعداد الأولي')],
  deletedCustomers: [],
}

const emptyCustomerForm = {
  name: '',
  customerPhone: '',
  serialNumber: '',
  serviceNumber: '',
  orderNumber: '',
  subscriptionType: 'باقة القمة',
  durationMonths: '12',
  startDate: new Date().toISOString().split('T')[0],
  amount: '',
  notes: '',
}

const emptyUserForm = {
  name: '',
  username: '',
  password: '',
  role: 'support',
}

const getStoredState = () => {
  if (typeof window === 'undefined') return initialState
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved)
    const normalizedCustomers = (parsed.customers || initialState.customers).map((customer) => ({
      ...customer,
      serialNumber: customer.serialNumber || customer.customerNumber || `SIM-${String(customer.id).slice(-4)}`,
      customerPhone: customer.customerPhone || customer.phone || '',
      serviceNumber: customer.serviceNumber || '',
    }))
    const normalizedDeletedCustomers = (parsed.deletedCustomers || []).map((customer) => ({
      ...customer,
      serialNumber: customer.serialNumber || customer.customerNumber || '',
      customerPhone: customer.customerPhone || customer.phone || '',
      serviceNumber: customer.serviceNumber || '',
    }))
    return {
      ...initialState,
      ...parsed,
      users: parsed.users || initialState.users,
      customers: normalizedCustomers,
      auditLogs: parsed.auditLogs || initialState.auditLogs,
      deletedCustomers: normalizedDeletedCustomers,
    }
  } catch {
    return initialState
  }
}

const withStatus = (customer) => {
  const daysLeft = daysBetween(customer.endDate)
  const subscriptionStatus =
    daysLeft < 0 ? 'expired' : daysLeft <= 3 ? 'expiring' : 'active'

  return { ...customer, daysLeft, subscriptionStatus }
}

const sanitizePhoneNumber = (value) => String(value || '').replace(/[^\d]/g, '')
const extractLocalSaudiPhone = (value) => {
  let digits = sanitizePhoneNumber(value)
  if (digits.startsWith(SAUDI_COUNTRY_CODE)) digits = digits.slice(SAUDI_COUNTRY_CODE.length)
  digits = digits.replace(/^0+/, '')
  return digits
}
const buildSaudiWhatsAppNumber = (value) => {
  const local = extractLocalSaudiPhone(value)
  return local ? `${SAUDI_COUNTRY_CODE}${local}` : ''
}
const displaySaudiPhone = (value) => {
  const local = extractLocalSaudiPhone(value)
  return local ? `+${SAUDI_COUNTRY_CODE} ${local}` : '-'
}
const createCustomerDraft = (customer) => ({
  name: customer.name || '',
  customerPhone: extractLocalSaudiPhone(customer.customerPhone || ''),
  serialNumber: customer.serialNumber || '',
  serviceNumber: customer.serviceNumber || '',
  orderNumber: customer.orderNumber || '',
  subscriptionType: customer.subscriptionType || subscriptionTypeOptions[0],
  durationMonths: String(customer.durationMonths || durationOptions[0]),
  startDate: customer.startDate || new Date().toISOString().split('T')[0],
  amount: String(customer.amount ?? ''),
  notes: customer.notes || '',
})

export default function DashboardApp() {
  const [mounted, setMounted] = useState(false)
  const [appState, setAppState] = useState(initialState)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [invoiceCustomer, setInvoiceCustomer] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState(emptyCustomerForm)
  const invoiceRef = useRef(null)

  useEffect(() => {
    setAppState(getStoredState())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
  }, [appState, mounted])

  useEffect(() => {
    if (!mounted) return
    try {
      const savedUsername = window.localStorage.getItem(SESSION_USER_KEY)
      if (!savedUsername) return
      const matchedUser = appState.users.find((item) => item.username === savedUsername)
      if (matchedUser) {
        setCurrentUser(matchedUser)
      } else {
        window.localStorage.removeItem(SESSION_USER_KEY)
      }
    } catch {
      window.localStorage.removeItem(SESSION_USER_KEY)
    }
  }, [appState.users, mounted])

  useEffect(() => {
    if (!mounted) return
    try {
      if (currentUser?.username) {
        window.localStorage.setItem(SESSION_USER_KEY, currentUser.username)
      } else {
        window.localStorage.removeItem(SESSION_USER_KEY)
      }
    } catch {
      // ignore localStorage persistence failures
    }
  }, [currentUser, mounted])

  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [message])

  const addAuditLog = (action, actor, target, details = '') => {
    setAppState((prev) => ({
      ...prev,
      auditLogs: [buildAudit(action, actor, target, details), ...(prev.auditLogs || [])].slice(0, 100),
    }))
  }

  const customers = useMemo(() => appState.customers.map(withStatus), [appState.customers])

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.serialNumber, customer.orderNumber, customer.customerPhone, customer.serviceNumber]
        .join(' ')
        .toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesFilter = filter === 'all' ? true : customer.subscriptionStatus === filter
      return matchesSearch && matchesFilter
    })
  }, [customers, filter, search])

  const stats = useMemo(() => {
    return {
      totalSubscriptions: customers.length,
      activeCustomers: customers.filter((item) => item.subscriptionStatus === 'active').length,
      expiringSoon: customers.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3).length,
      expired: customers.filter((item) => item.subscriptionStatus === 'expired').length,
    }
  }, [customers])

  const alerts = useMemo(
    () => customers.filter((customer) => customer.daysLeft >= 0 && customer.daysLeft <= 3),
    [customers],
  )

  const openEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setEditForm(createCustomerDraft(customer))
  }

  const closeEditCustomer = () => {
    setEditingCustomer(null)
    setEditForm(emptyCustomerForm)
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const user = appState.users.find(
      (item) => item.username === loginData.username && item.password === loginData.password,
    )
    if (!user) {
      setMessage('بيانات الدخول غير صحيحة')
      return
    }
    setCurrentUser(user)
    addAuditLog('تسجيل دخول', user.username, 'النظام')
    setMessage(`مرحباً ${user.name}`)
  }

  const handleCustomerSubmit = (event) => {
    event.preventDefault()
    const durationMonths = Number(customerForm.durationMonths)
    const customerPhone = buildSaudiWhatsAppNumber(customerForm.customerPhone)
    if (!durationMonths || durationMonths < 1) {
      setMessage('أدخل مدة اشتراك صحيحة بالشهور')
      return
    }
    if (!customerPhone) {
      setMessage('أدخل رقم العميل الصحيح للواتساب')
      return
    }
    if (!customerForm.serviceNumber.trim()) {
      setMessage('أدخل رقم الخدمة')
      return
    }
    const nextId = Date.now()
    const manualSubscriptionType = !subscriptionTypeOptions.includes(customerForm.subscriptionType)
    const manualDuration = !durationOptions.includes(durationMonths)
    const newCustomer = {
      id: nextId,
      ...customerForm,
      serialNumber: customerForm.serialNumber.trim() || `SIM-${String(nextId).slice(-5)}`,
      customerPhone,
      serviceNumber: customerForm.serviceNumber.trim(),
      durationMonths,
      amount: Number(customerForm.amount || 0),
      endDate: addMonths(customerForm.startDate, durationMonths),
    }
    setAppState((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
      auditLogs: [buildAudit('إضافة عميل', currentUser.username, newCustomer.name, `نوع الاشتراك: ${newCustomer.subscriptionType}${manualSubscriptionType ? ' (إدخال يدوي)' : ' (من القائمة)'} — مدة الاشتراك: ${newCustomer.durationMonths} شهر${manualDuration ? ' (إدخال يدوي)' : ' (من القائمة)'}`), ...prev.auditLogs].slice(0, 100),
    }))
    setCustomerForm(emptyCustomerForm)
    setMessage('تم إضافة العميل والاشتراك بنجاح')
  }

  const handleCustomerUpdate = (event) => {
    event.preventDefault()
    if (!editingCustomer) return
    const durationMonths = Number(editForm.durationMonths)
    const customerPhone = buildSaudiWhatsAppNumber(editForm.customerPhone)
    if (!durationMonths || durationMonths < 1) {
      setMessage('أدخل مدة اشتراك صحيحة بالشهور')
      return
    }
    if (!customerPhone) {
      setMessage('أدخل رقم العميل الصحيح للواتساب')
      return
    }
    if (!editForm.serviceNumber.trim()) {
      setMessage('أدخل رقم الخدمة')
      return
    }

    const updatedCustomer = {
      ...editingCustomer,
      ...editForm,
      serialNumber: editForm.serialNumber.trim() || editingCustomer.serialNumber,
      customerPhone,
      serviceNumber: editForm.serviceNumber.trim(),
      durationMonths,
      amount: Number(editForm.amount || 0),
      endDate: addMonths(editForm.startDate, durationMonths),
    }

    setAppState((prev) => ({
      ...prev,
      customers: prev.customers.map((customer) => (customer.id === editingCustomer.id ? updatedCustomer : customer)),
      auditLogs: [
        buildAudit('تعديل بيانات عميل', currentUser.username, updatedCustomer.name, `الخدمة: ${updatedCustomer.serviceNumber || '-'} — النوع: ${updatedCustomer.subscriptionType} — المدة: ${updatedCustomer.durationMonths} شهر`),
        ...prev.auditLogs,
      ].slice(0, 100),
    }))
    closeEditCustomer()
    setMessage('تم تحديث بيانات العميل بنجاح')
  }

  const handleUserSubmit = (event) => {
    event.preventDefault()
    if (appState.users.some((item) => item.username === userForm.username)) {
      setMessage('اسم المستخدم مستخدم مسبقاً')
      return
    }
    const newUser = {
      id: Date.now(),
      ...userForm,
      protected: false,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setAppState((prev) => ({
      ...prev,
      users: [newUser, ...prev.users],
      auditLogs: [buildAudit('إضافة مستخدم', currentUser.username, newUser.username, `الصلاحية: ${roleLabels[newUser.role] || newUser.role}`), ...prev.auditLogs].slice(0, 100),
    }))
    setUserForm(emptyUserForm)
    setMessage('تمت إضافة المستخدم')
  }

  const deleteUser = (id) => {
    const target = appState.users.find((item) => item.id === id)
    if (target?.protected) {
      setMessage('لا يمكن حذف المستخدم الرئيسي')
      return
    }
    setAppState((prev) => ({
      ...prev,
      users: prev.users.filter((item) => item.id !== id),
      auditLogs: [buildAudit('حذف مستخدم', currentUser.username, target?.username || 'غير معروف'), ...prev.auditLogs].slice(0, 100),
    }))
    setMessage('تم حذف المستخدم')
  }

  const renewCustomer = (id) => {
    const target = appState.customers.find((item) => item.id === id)
    setAppState((prev) => ({
      ...prev,
      customers: prev.customers.map((customer) => {
        if (customer.id !== id) return customer
        const newStartDate = customer.endDate
        return {
          ...customer,
          startDate: newStartDate,
          endDate: addMonths(newStartDate, customer.durationMonths),
        }
      }),
      auditLogs: [buildAudit('تجديد اشتراك', currentUser.username, target?.name || 'عميل', `حتى ${target ? addMonths(target.endDate, target.durationMonths) : ''}`), ...prev.auditLogs].slice(0, 100),
    }))
    setMessage('تم تجديد الاشتراك')
  }

  const deleteCustomer = (id) => {
    const target = appState.customers.find((item) => item.id === id)
    if (!target) return
    const reason = window.prompt('ما سبب الحذف؟')
    if (reason === null) return
    const cleanedReason = reason.trim()
    if (!cleanedReason) {
      setMessage('يجب كتابة سبب الحذف')
      return
    }

    setAppState((prev) => ({
      ...prev,
      customers: prev.customers.filter((item) => item.id !== id),
      deletedCustomers: [
        buildDeletionRecord(target, currentUser.username, cleanedReason),
        ...(prev.deletedCustomers || []),
      ].slice(0, 100),
      auditLogs: [
        buildAudit('حذف العميل', currentUser.username, target.name, `سبب الحذف: ${cleanedReason}`),
        ...prev.auditLogs,
      ].slice(0, 100),
    }))
    setMessage('تم حذف بيانات العميل وحفظ سبب الحذف')
  }

  const openWhatsApp = (customer) => {
    const whatsappNumber = buildSaudiWhatsAppNumber(customer.customerPhone)
    if (!whatsappNumber) {
      setMessage('رقم العميل غير صالح للواتساب')
      return
    }
    const text = encodeURIComponent(
      `مرحباً ${customer.name}، نود تذكيركم بأن اشتراكك في ${customer.subscriptionType} سينتهي بتاريخ ${formatDate(customer.endDate)}\nلتجديد ارسل الرقم 7 مع ارسال ايصال التحويل`,
      `مرحباً ${customer.name}، نود تذكيركم بأن اشتراكك في ${customer.subscriptionType} سينتهي بتاريخ ${formatHijriDate(customer.endDate)}\nلتجديد ارسل الرقم 7 مع ارسال ايصال التحويل`,
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const downloadInvoice = async (customer) => {
    setInvoiceCustomer(customer)
    await new Promise((resolve) => setTimeout(resolve, 150))
    if (!invoiceRef.current) return
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = (canvas.height * pageWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
    pdf.save(`invoice-${customer.serialNumber}.pdf`)
    addAuditLog('تحميل فاتورة', currentUser.username, customer.name, `الرقم التسلسلي للشريحة: ${customer.serialNumber}`)
    setMessage('تم تحميل الفاتورة')
  }

  const exportBackup = () => {
    const workbook = XLSX.utils.book_new()
    workbook.Props = {
      Title: 'متجر الصماد - نسخة احتياطية',
      Subject: 'بيانات العملاء والعمليات والعملاء المحذوفين',
      Author: currentUser?.username || 'Al-Samad',
      Company: 'متجر الصماد',
    }
    const customersSheet = createWorksheet(
      appState.customers
        .map((item) => ({
          'اسم العميل': item.name,
          'الرقم التسلسلي للشريحة': item.serialNumber,
          'رقم العميل': displaySaudiPhone(item.customerPhone),
          'رقم الخدمة': item.serviceNumber || '-',
          'رقم الطلب': item.orderNumber,
          'نوع الاشتراك': item.subscriptionType,
          'مدة الاشتراك': `${item.durationMonths} شهر`,
          'تاريخ البداية': item.startDate,
          'تاريخ النهاية': item.endDate,
          'القيمة': Number(item.amount || 0),
          'ملاحظات': item.notes || '-',
        }))
        .sort((a, b) => a['اسم العميل'].localeCompare(b['اسم العميل'], 'ar')),
      [22, 18, 18, 16, 16, 18, 14, 16, 16, 12, 28],
    )

    const summarySheet = createWorksheet(
      [
        { 'البيان': 'اسم الجهة', 'القيمة': 'متجر الصماد' },
        { 'البيان': 'إجمالي العملاء', 'القيمة': appState.customers.length },
        { 'البيان': 'العملاء المحذوفون', 'القيمة': (appState.deletedCustomers || []).length },
        { 'البيان': 'عدد المستخدمين', 'القيمة': appState.users.length },
        { 'البيان': 'تاريخ التصدير', 'القيمة': new Date().toLocaleString('sv-SE').replace(' ', '  ') },
      ],
      [24, 36],
    )

    const usersSheet = createWorksheet(
      appState.users.map((item) => ({
        'الاسم': item.name,
        'اسم المستخدم': item.username,
        'الصلاحية': roleLabels[item.role] || item.role,
        'تاريخ الإنشاء': item.createdAt,
      })),
      [20, 18, 18, 16],
    )

    const auditSheet = createWorksheet(
      appState.auditLogs.map((item) => ({
        'العملية': item.action,
        'المنفذ': item.actor,
        'المستهدف': item.target,
        'التفاصيل': item.details || '-',
        'التاريخ': item.date,
      })),
      [22, 18, 28, 44, 22],
    )

    const deletedCustomersSheet = createWorksheet(
      (appState.deletedCustomers || []).map((item) => ({
        'اسم العميل': item.customerName,
        'الرقم التسلسلي للشريحة': item.serialNumber,
        'رقم العميل': displaySaudiPhone(item.customerPhone),
        'رقم الخدمة': item.serviceNumber || '-',
        'رقم الطلب': item.orderNumber,
        'سبب الحذف': item.reason,
        'تم الحذف بواسطة': item.actor,
        'تاريخ الحذف': item.date,
      })),
      [22, 18, 18, 16, 16, 40, 18, 22],
    )

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص')
    XLSX.utils.book_append_sheet(workbook, customersSheet, 'العملاء')
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'المستخدمون')
    XLSX.utils.book_append_sheet(workbook, auditSheet, 'سجل العمليات')
    XLSX.utils.book_append_sheet(workbook, deletedCustomersSheet, 'العملاء المحذوفون')

    XLSX.writeFile(workbook, 'متجر-الصماد-نسخة-احتياطية.xlsx')
    addAuditLog('نسخ احتياطي', currentUser.username, 'ملف Excel')
    setMessage('تم إنشاء النسخة الاحتياطية Excel')
  }

  const resetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(SESSION_USER_KEY)
    setAppState(initialState)
    setCurrentUser(null)
    setMessage('تم إعادة ضبط البيانات التجريبية')
  }

  if (!mounted) return <div className="page-shell" />

  if (!currentUser) {
    return (
      <div className="auth-layout page-shell">
        <section className="hero-panel">
          <img className="brand-logo" src="/alsmad-logo.jpeg" alt="شعار الصماد" />
          <span className="badge">منصة إدارة اشتراكات</span>
          <h1>نظام الصماد لإدارة الاشتراكات والعملاء والفواتير</h1>
          <p>منصة احترافية لإدارة العملاء والاشتراكات والفواتير والتنبيهات ضمن واجهة واضحة ودقيقة.</p>

          <div className="hero-grid">
            <div className="hero-card">
              <strong>إدارة الاشتراكات</strong>
              <p>متابعة دقيقة لتواريخ البداية والنهاية والتنبيه قبل الانتهاء وإدارة التجديد بسهولة.</p>
            </div>
            <div className="hero-card">
              <strong>حالة العميل</strong>
              <p>نشط / سينتهي قريباً / منتهي مع تنبيهات واضحة وسجل عمليات مرتب.</p>
            </div>
            <div className="hero-card">
              <strong>تقارير وإدارة</strong>
              <p>لوحة تحكم، فواتير، نسخ احتياطي، وصلاحيات متعددة لإدارة العمل باحترافية.</p>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <form className="login-card" onSubmit={handleLogin}>
            <h2>تسجيل الدخول</h2>
            <p className="muted">ادخل بيانات الحساب للوصول إلى لوحة التحكم.</p>
            <label>
              اسم المستخدم
              <input value={loginData.username} onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))} />
            </label>
            <label>
              كلمة المرور
              <input type="password" value={loginData.password} onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))} />
            </label>
            <button className="primary-btn" type="submit">دخول للنظام</button>
            {message ? <div className="toast">{message}</div> : null}
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell page-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <img className="brand-logo small" src="/alsmad-logo.jpeg" alt="شعار الصماد" />
          <div>
            <strong>متجر الصماد</strong>
            <p>{currentUser.name}</p>
          </div>
        </div>

        <nav>
          {[
            ['dashboard', 'لوحة التحكم'],
            ['customers', 'العملاء والاشتراكات'],
            ['alerts', 'التنبيهات'],
            ['users', 'المستخدمون'],
            ['settings', 'الصلاحيات والنسخ'],
          ].map(([key, label]) => (
            <button key={key} className={activeTab === key ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button className="ghost-btn" onClick={resetDemo}>إعادة البيانات التجريبية</button>
          <button className="ghost-btn" onClick={() => setCurrentUser(null)}>تسجيل الخروج</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>نظام إدارة الاشتراكات - متجر الصماد</h1>
            <p>إدارة احترافية للاشتراكات والعملاء والفواتير والتنبيهات.</p>
          </div>
          {message ? <div className="toast inline">{message}</div> : null}
        </header>

        {activeTab === 'dashboard' && (
          <section className="page-grid">
            <div className="stats-grid">
              <StatCard title="إجمالي الاشتراكات" value={stats.totalSubscriptions} />
              <StatCard title="العملاء النشطون" value={stats.activeCustomers} />
              <StatCard title="ستنتهي خلال 3 أيام" value={stats.expiringSoon} />
              <StatCard title="اشتراكات منتهية" value={stats.expired} />
            </div>

            <div className="panel two-col">
              <div>
                <h3>إضافة عميل جديد</h3>
                <p className="muted">تمت إضافة خيارات سريعة مباشرة للمدة والنوع مع إمكانية الإدخال اليدوي والتعديل الاحترافي.</p>
                <form className="form-grid" onSubmit={handleCustomerSubmit}>
                  <CustomerFormFields form={customerForm} setForm={setCustomerForm} idPrefix="create" />
                  <button className="primary-btn full-span" type="submit">حفظ العميل والاشتراك</button>
                </form>
              </div>

              <div className="panel nested">
                <h3>تنبيهات سريعة</h3>
                {alerts.length === 0 ? (
                  <p className="muted">لا يوجد حالياً اشتراكات متبقي عليها 3 أيام أو أقل.</p>
                ) : (
                  alerts.map((customer) => (
                    <div key={customer.id} className="alert-card">
                      <strong>{customer.name}</strong>
                      <p className="alert-line">متبقي {customer.daysLeft} يوم - {customer.subscriptionType}</p>
                      <p className="alert-line">رقم العميل: {displaySaudiPhone(customer.customerPhone)}</p>
                      <p className="alert-line">الرقم التسلسلي للشريحة: {customer.serialNumber}</p>
                      <p className="alert-line">رقم الطلب: {customer.orderNumber}</p>
                      <div className="row-actions">
                        <button className="primary-btn small" onClick={() => openWhatsApp(customer)}>تواصل واتساب</button>
                        <button className="ghost-btn small" onClick={() => renewCustomer(customer.id)}>تجديد الآن</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'customers' && (
          <section className="panel">
            <div className="toolbar">
              <input className="search-input" placeholder="ابحث باسم العميل أو الرقم التسلسلي أو رقم العميل أو رقم الخدمة أو رقم الطلب" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="expiring">سينتهي قريباً</option>
                <option value="expired">منتهي</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم العميل</th><th>الرقم التسلسلي للشريحة</th><th>رقم العميل</th><th>رقم الخدمة</th><th>رقم الطلب</th><th>نوع الاشتراك</th><th>المدة</th><th>البداية</th><th>النهاية</th><th>الحالة</th><th>الفاتورة</th><th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>{customer.name}</strong><span className="cell-note">{displaySaudiPhone(customer.customerPhone)}</span></td>
                      <td>{customer.serialNumber}</td>
                      <td>{displaySaudiPhone(customer.customerPhone)}</td>
                      <td>{customer.serviceNumber || '-'}</td>
                      <td>{customer.orderNumber}</td>
                      <td>{customer.subscriptionType}</td>
                      <td>{customer.durationMonths} شهر</td>
                      <td>{customer.startDate}</td>
                      <td>{customer.endDate}</td>
                      <td><span className={`status-pill ${customer.subscriptionStatus}`}>{customer.subscriptionStatus === 'active' ? 'نشط' : customer.subscriptionStatus === 'expiring' ? `باقي ${customer.daysLeft} يوم` : 'منتهي'}</span></td>
                      <td><button className="ghost-btn small" onClick={() => downloadInvoice(customer)}>تحميل الفاتورة</button></td>
                      <td><div className="row-actions vertical"><button className="primary-btn small" onClick={() => openWhatsApp(customer)}>واتساب</button><button className="ghost-btn small" onClick={() => renewCustomer(customer.id)}>تجديد</button><button className="ghost-btn small" onClick={() => openEditCustomer(customer)}>تعديل البيانات</button><button className="ghost-btn small danger-btn" onClick={() => deleteCustomer(customer.id)}>حذف العميل</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'alerts' && (
          <section className="panel">
            <h3>تنبيهات الاشتراكات قبل الانتهاء بـ 3 أيام</h3>
            <div className="audit-list">
              {alerts.length === 0 ? <p className="muted">لا توجد تنبيهات حالية.</p> : alerts.map((customer) => (
                <div key={customer.id} className="alert-card wide">
                  <div>
                    <strong>{customer.name}</strong>
                    <p>الرقم التسلسلي للشريحة: {customer.serialNumber} — رقم العميل: {displaySaudiPhone(customer.customerPhone)}</p>
                    <p>رقم الخدمة: {customer.serviceNumber || '-'}</p>
                    <p>رقم الطلب: {customer.orderNumber}</p>
                    <p>المتبقي: {customer.daysLeft} يوم — ينتهي بتاريخ {formatDate(customer.endDate)}</p>
                  </div>
                  <div className="row-actions">
                    <button className="primary-btn" onClick={() => openWhatsApp(customer)}>فتح واتساب</button>
                    <button className="ghost-btn" onClick={() => downloadInvoice(customer)}>تحميل الفاتورة</button>
                    <button className="ghost-btn danger-btn" onClick={() => deleteCustomer(customer.id)}>حذف العميل</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="page-grid users-grid">
            <div className="panel">
              <h3>إضافة مستخدم</h3>
              <form className="form-grid" onSubmit={handleUserSubmit}>
                <label>الاسم<input required value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} /></label>
                <label>اسم المستخدم<input required value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} /></label>
                <label>كلمة المرور<input required type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} /></label>
                <label>
                  الصلاحية
                  <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}>
                    <option value="sales_manager">مدير مبيعات</option>
                    <option value="accountant">محاسب</option>
                    <option value="support">دعم</option>
                    <option value="admin">أدمن رئيسي</option>
                  </select>
                </label>
                <button className="primary-btn full-span" type="submit">إضافة المستخدم</button>
              </form>
            </div>

            <div className="panel">
              <h3>قائمة المستخدمين</h3>
              <div className="users-list">
                {appState.users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.username} — {roleLabels[user.role] || user.role}</p>
                    </div>
                    <button className="ghost-btn small" onClick={() => deleteUser(user.id)} disabled={user.protected}>
                      {user.protected ? 'المستخدم الرئيسي' : 'حذف'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="page-grid users-grid">
            <div className="panel">
              <h3>الصلاحيات المعتمدة</h3>
              <div className="checklist">
                {[
                  'أدمن رئيسي: تحكم كامل بالنظام ولا يمكن حذف الحساب الرئيسي.',
                  'مدير مبيعات: إدارة العملاء، التجديد، والمتابعة.',
                  'محاسب: مراجعة الفواتير والتقارير والنسخ الاحتياطي.',
                  'دعم: متابعة العملاء والتواصل والتنبيهات.',
                ].map((item) => (
                  <div key={item} className="check-item"><span>✓</span><p>{item}</p></div>
                ))}
              </div>

              <div className="backup-box">
                <h4>نسخ احتياطي</h4>
                <p>إنشاء ملف Excel أصلي يحتوي على العملاء والمستخدمين وسجل العمليات.</p>
                <button className="primary-btn" onClick={exportBackup}>تنزيل النسخة الاحتياطية Excel</button>
              </div>
            </div>

            <div className="panel">
              <h3>سجل العمليات</h3>
              <div className="audit-list">
                {appState.auditLogs.map((log) => (
                  <div key={log.id} className="audit-card">
                    <strong>{log.action}</strong>
                    <p>بواسطة: {log.actor} — على: {log.target}</p>
                    <p>{log.details || 'لا توجد تفاصيل إضافية'}</p>
                    <span>{log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {editingCustomer ? (
        <div className="modal-backdrop" onClick={closeEditCustomer}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>تعديل بيانات العميل</h3>
                <p>واجهة احترافية لتحديث كل بيانات العميل والاشتراك من مكان واحد.</p>
              </div>
              <button className="ghost-btn small" type="button" onClick={closeEditCustomer}>إغلاق</button>
            </div>

            <div className="edit-summary">
              <div><span>العميل</span><strong>{editingCustomer.name}</strong></div>
              <div><span>الرقم التسلسلي</span><strong>{editingCustomer.serialNumber}</strong></div>
              <div><span>رقم العميل</span><strong>{displaySaudiPhone(editingCustomer.customerPhone)}</strong></div>
              <div><span>رقم الخدمة</span><strong>{editingCustomer.serviceNumber || '-'}</strong></div>
            </div>

            <form className="form-grid" onSubmit={handleCustomerUpdate}>
              <CustomerFormFields form={editForm} setForm={setEditForm} idPrefix="edit" />
              <div className="full-span modal-actions">
                <button className="ghost-btn" type="button" onClick={closeEditCustomer}>إلغاء</button>
                <button className="primary-btn" type="submit">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="invoice-hidden">
        <div ref={invoiceRef} className="invoice-sheet">
          {invoiceCustomer ? (
            <>
              <div className="invoice-header">
                <img src="/alsmad-logo.jpeg" alt="شعار الصماد" />
                <div>
                  <h2>فاتورة اشتراك</h2>
                  <p>متجر الصماد</p>
                </div>
              </div>
              <div className="invoice-meta">
                <div><strong>رقم الفاتورة</strong><span>{createInvoiceNumber(invoiceCustomer.serialNumber)}</span></div>
                <div><strong>تاريخ الإصدار</strong><span>{formatDate(new Date().toISOString().split('T')[0])}</span></div>
              </div>
              <div className="invoice-grid">
                <div><strong>اسم العميل</strong><span>{invoiceCustomer.name}</span></div>
                <div><strong>الرقم التسلسلي للشريحة</strong><span>{invoiceCustomer.serialNumber}</span></div>
                <div><strong>رقم الطلب</strong><span>{invoiceCustomer.orderNumber}</span></div>
                <div><strong>رقم العميل</strong><span>{displaySaudiPhone(invoiceCustomer.customerPhone)}</span></div>
                <div><strong>رقم الخدمة</strong><span>{invoiceCustomer.serviceNumber || '-'}</span></div>
                <div><strong>نوع الاشتراك</strong><span>{invoiceCustomer.subscriptionType}</span></div>
                <div><strong>المدة</strong><span>{invoiceCustomer.durationMonths} شهر</span></div>
                <div><strong>البداية</strong><span>{formatDate(invoiceCustomer.startDate)}</span></div>
                <div><strong>النهاية</strong><span>{formatDate(invoiceCustomer.endDate)}</span></div>
              </div>
              <div className="invoice-total"><strong>الإجمالي</strong><span>{currency(invoiceCustomer.amount)}</span></div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function CustomerFormFields({ form, setForm, idPrefix = 'customer' }) {
  return (
    <>
      <label>اسم العميل<input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
      <label>
        رقم العميل (واتساب)
        <span className="field-hint">مفتاح الدولة +966 مضاف تلقائيًا ومخفي — أدخل الرقم بدون الصفر، مثال: 512345678</span>
        <div className="phone-input-wrap">
          <span className="phone-prefix">+966</span>
          <input
            required
            inputMode="numeric"
            dir="ltr"
            placeholder="512345678"
            value={form.customerPhone}
            onChange={(e) => setForm((p) => ({ ...p, customerPhone: extractLocalSaudiPhone(e.target.value) }))}
          />
        </div>
      </label>
      <label>الرقم التسلسلي للشريحة<input placeholder="يُنشأ تلقائيًا عند الإضافة الجديدة" value={form.serialNumber || ''} onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))} /></label>
      <label>رقم الخدمة<input required value={form.serviceNumber} onChange={(e) => setForm((p) => ({ ...p, serviceNumber: e.target.value }))} /></label>
      <label>رقم الطلب بالمتجر<input required value={form.orderNumber} onChange={(e) => setForm((p) => ({ ...p, orderNumber: e.target.value }))} /></label>

      <label className="full-span">
        نوع الاشتراك
        <span className="field-hint">اختر مباشرة من الخيارات أو اكتب يدويًا</span>
        <QuickOptionSelector
          options={subscriptionTypeOptions}
          currentValue={form.subscriptionType}
          onSelect={(value) => setForm((p) => ({ ...p, subscriptionType: value }))}
        />
        <input
          list={`${idPrefix}-subscription-type-options`}
          value={form.subscriptionType}
          placeholder="اختر من القائمة أو أدخل يدويًا"
          onChange={(e) => setForm((p) => ({ ...p, subscriptionType: e.target.value }))}
        />
        <datalist id={`${idPrefix}-subscription-type-options`}>
          {subscriptionTypeOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>

      <label className="full-span">
        مدة الاشتراك
        <span className="field-hint">اضغط مباشرة على المدة المطلوبة</span>
        <QuickOptionSelector
          options={durationOptions.map((value) => ({
            value: String(value),
            label:
              value === 1 ? '1 شهر'
              : value === 2 ? '2 شهرين'
              : value === 3 ? '3 اشهر'
              : value === 6 ? '6 اشهر'
              : '12 شهر',
          }))}
          currentValue={String(form.durationMonths)}
          onSelect={(value) => setForm((p) => ({ ...p, durationMonths: value }))}
        />
        <input
          list={`${idPrefix}-duration-options`}
          type="number"
          min="1"
          value={form.durationMonths}
          placeholder="اختر من القائمة أو أدخل يدويًا"
          onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
        />
        <datalist id={`${idPrefix}-duration-options`}>
          {durationOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </label>

      <label>تاريخ البداية<input className="date-input" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
      <label>قيمة الفاتورة<input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} /></label>
      <label className="full-span">ملاحظات<textarea rows="3" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>
    </>
  )
}

function QuickOptionSelector({ options, currentValue, onSelect }) {
  return (
    <div className="quick-options">
      {options.map((option) => {
        const normalized = typeof option === 'string' ? { value: option, label: option } : option
        const isActive = String(currentValue) === String(normalized.value)
        return (
          <button
            key={normalized.value}
            className={isActive ? 'option-chip active' : 'option-chip'}
            type="button"
            onClick={() => onSelect(normalized.value)}
          >
            {normalized.label}
          </button>
        )
      })}
    </div>
  )
}
