'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

const STORAGE_KEY = 'alsmad-next-clean-state-v1'
const MAIN_ADMIN_USERNAME = 'Al-Samad'
const MAIN_ADMIN_PASSWORD = '102030'

const roleLabels = {
  admin: 'أدمن رئيسي',
  sales_manager: 'مدير مبيعات',
  accountant: 'محاسب',
  support: 'دعم',
}

const subscriptionTypeOptions = ['باقة القمة', 'باقة التميز', 'اشتراك بيانات', 'خدمة مخصصة']
const durationOptions = [1, 3, 6, 12, 24]

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
  customerNumber: customer.customerNumber,
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
      customerNumber: '966501234567',
      name: 'أحمد الشمري',
      phone: '966501234567',
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
      customerNumber: '966509876543',
      name: 'خالد المطيري',
      phone: '966509876543',
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
  phone: '',
  orderNumber: '',
  subscriptionType: 'باقة القمة',
  durationMonths: '12',
  startDate: new Date().toISOString().split('T')[0],
  amount: '',
  renewalStatus: 'pending',
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
    return {
      ...initialState,
      ...parsed,
      users: parsed.users || initialState.users,
      customers: parsed.customers || initialState.customers,
      auditLogs: parsed.auditLogs || initialState.auditLogs,
      deletedCustomers: parsed.deletedCustomers || [],
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
      const haystack = [customer.name, customer.customerNumber, customer.orderNumber, customer.phone]
        .join(' ')
        .toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesFilter =
        filter === 'all' ? true : customer.subscriptionStatus === filter || customer.renewalStatus === filter
      return matchesSearch && matchesFilter
    })
  }, [customers, filter, search])

  const stats = useMemo(() => {
    return {
      totalSubscriptions: customers.length,
      activeCustomers: customers.filter((item) => item.subscriptionStatus === 'active').length,
      expiringSoon: customers.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3).length,
      expired: customers.filter((item) => item.subscriptionStatus === 'expired').length,
      renewed: customers.filter((item) => item.renewalStatus === 'renewed').length,
      pending: customers.filter((item) => item.renewalStatus !== 'renewed').length,
    }
  }, [customers])

  const alerts = useMemo(
    () => customers.filter((customer) => customer.daysLeft >= 0 && customer.daysLeft <= 3),
    [customers],
  )

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
    if (!durationMonths || durationMonths < 1) {
      setMessage('أدخل مدة اشتراك صحيحة بالشهور')
      return
    }
    const nextId = Date.now()
    const manualSubscriptionType = !subscriptionTypeOptions.includes(customerForm.subscriptionType)
    const manualDuration = !durationOptions.includes(durationMonths)
    const newCustomer = {
      id: nextId,
      ...customerForm,
      customerNumber: customerForm.phone,
      phone: customerForm.phone,
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
          renewalStatus: 'renewed',
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
    const text = encodeURIComponent(
      `مرحباً ${customer.name}، نود تذكيركم بأن اشتراك ${customer.subscriptionType} سينتهي بتاريخ ${customer.endDate}.`,
    )
    window.open(`https://wa.me/${customer.phone}?text=${text}`, '_blank')
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
    pdf.save(`invoice-${customer.customerNumber}.pdf`)
    addAuditLog('تحميل فاتورة', currentUser.username, customer.name, `رقم الشريحة: ${customer.customerNumber}`)
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
          'رقم الشريحة': item.customerNumber,
          'رقم الجوال': item.phone,
          'رقم الطلب': item.orderNumber,
          'نوع الاشتراك': item.subscriptionType,
          'مدة الاشتراك': `${item.durationMonths} شهر`,
          'تاريخ البداية': item.startDate,
          'تاريخ النهاية': item.endDate,
          'حالة التجديد': item.renewalStatus === 'renewed' ? 'تم التجديد' : item.renewalStatus === 'not-renewed' ? 'لم يتم التجديد' : 'بانتظار التجديد',
          'القيمة': Number(item.amount || 0),
          'ملاحظات': item.notes || '-',
        }))
        .sort((a, b) => a['اسم العميل'].localeCompare(b['اسم العميل'], 'ar')),
      [22, 16, 18, 16, 18, 14, 16, 16, 18, 12, 28],
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
        'رقم الشريحة': item.customerNumber,
        'رقم الطلب': item.orderNumber,
        'سبب الحذف': item.reason,
        'تم الحذف بواسطة': item.actor,
        'تاريخ الحذف': item.date,
      })),
      [22, 16, 16, 40, 18, 22],
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
          <h1>متجر الصماد لإدارة الاشتراكات والعملاء والفواتير</h1>
          <p>منصة احترافية لإدارة العملاء والاشتراكات والفواتير والتنبيهات ضمن واجهة واضحة ودقيقة.</p>

          <div className="hero-grid">
            <div className="hero-card">
              <strong>إدارة الاشتراكات</strong>
              <p>متابعة دقيقة لتواريخ البداية والنهاية والتنبيه قبل الانتهاء وإدارة التجديد بسهولة.</p>
            </div>
            <div className="hero-card">
              <strong>حالة العميل</strong>
              <p>نشط / سينتهي قريباً / منتهي / تم التجديد / لم يتم التجديد.</p>
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
              <StatCard title="تم تجديدهم" value={stats.renewed} />
              <StatCard title="لم يجددوا بعد" value={stats.pending} />
            </div>

            <div className="panel two-col">
              <div>
                <h3>إضافة عميل جديد</h3>
                <p className="muted">في حقول الاشتراك يمكنك الاختيار من الموجود أو إدخال قيمة يدويًا.</p>
                <form className="form-grid" onSubmit={handleCustomerSubmit}>
                  <label>اسم العميل<input required value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} /></label>
                  <label>رقم الشريحة<input required value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} /></label>
                  <label>رقم الطلب بالمتجر<input required value={customerForm.orderNumber} onChange={(e) => setCustomerForm((p) => ({ ...p, orderNumber: e.target.value }))} /></label>
                  <label>
                    نوع الاشتراك
                    <span className="field-hint">اختر من القائمة أو أدخل يدويًا</span>
                    <input
                      list="subscription-type-options"
                      value={customerForm.subscriptionType}
                      placeholder="اختر من القائمة أو أدخل يدويًا"
                      onChange={(e) => setCustomerForm((p) => ({ ...p, subscriptionType: e.target.value }))}
                    />
                    <datalist id="subscription-type-options">
                      {subscriptionTypeOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    مدة الاشتراك
                    <span className="field-hint">اختر من القائمة أو أدخل يدويًا</span>
                    <input
                      list="duration-options"
                      type="number"
                      min="1"
                      value={customerForm.durationMonths}
                      placeholder="اختر من القائمة أو أدخل يدويًا"
                      onChange={(e) => setCustomerForm((p) => ({ ...p, durationMonths: e.target.value }))}
                    />
                    <datalist id="duration-options">
                      {durationOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </label>
                  <label>تاريخ البداية<input className="date-input" type="date" value={customerForm.startDate} onChange={(e) => setCustomerForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
                  <label>قيمة الفاتورة<input type="number" value={customerForm.amount} onChange={(e) => setCustomerForm((p) => ({ ...p, amount: e.target.value }))} /></label>
                  <label>
                    حالة التجديد
                    <select value={customerForm.renewalStatus} onChange={(e) => setCustomerForm((p) => ({ ...p, renewalStatus: e.target.value }))}>
                      <option value="pending">بانتظار التجديد</option>
                      <option value="renewed">تم التجديد</option>
                      <option value="not-renewed">لم يتم التجديد</option>
                    </select>
                  </label>
                  <label className="full-span">ملاحظات<textarea rows="3" value={customerForm.notes} onChange={(e) => setCustomerForm((p) => ({ ...p, notes: e.target.value }))} /></label>
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
                      <span>متبقي {customer.daysLeft} يوم - {customer.subscriptionType}</span>
                      <span>رقم الطلب: {customer.orderNumber}</span>
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
              <input className="search-input" placeholder="ابحث باسم العميل أو رقم الشريحة أو رقم الطلب" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="expiring">سينتهي قريباً</option>
                <option value="expired">منتهي</option>
                <option value="renewed">تم التجديد</option>
                <option value="pending">بانتظار التجديد</option>
                <option value="not-renewed">لم يتم التجديد</option>
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم العميل</th><th>رقم الشريحة</th><th>رقم الطلب</th><th>نوع الاشتراك</th><th>المدة</th><th>البداية</th><th>النهاية</th><th>الحالة</th><th>التجديد</th><th>الفاتورة</th><th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>{customer.name}</strong><span className="cell-note">رقم الشريحة: {customer.customerNumber}</span></td>
                      <td>{customer.customerNumber}</td>
                      <td>{customer.orderNumber}</td>
                      <td>{customer.subscriptionType}</td>
                      <td>{customer.durationMonths} شهر</td>
                      <td>{customer.startDate}</td>
                      <td>{customer.endDate}</td>
                      <td><span className={`status-pill ${customer.subscriptionStatus}`}>{customer.subscriptionStatus === 'active' ? 'نشط' : customer.subscriptionStatus === 'expiring' ? `باقي ${customer.daysLeft} يوم` : 'منتهي'}</span></td>
                      <td><span className={`status-pill renewal ${customer.renewalStatus}`}>{customer.renewalStatus === 'renewed' ? 'تم التجديد' : customer.renewalStatus === 'not-renewed' ? 'لم يتم التجديد' : 'بانتظار التجديد'}</span></td>
                      <td><button className="ghost-btn small" onClick={() => downloadInvoice(customer)}>تحميل الفاتورة</button></td>
                      <td><div className="row-actions vertical"><button className="primary-btn small" onClick={() => openWhatsApp(customer)}>واتساب</button><button className="ghost-btn small" onClick={() => renewCustomer(customer.id)}>تجديد</button><button className="ghost-btn small danger-btn" onClick={() => deleteCustomer(customer.id)}>حذف العميل</button></div></td>
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
                    <p>رقم الشريحة: {customer.customerNumber} — رقم الطلب: {customer.orderNumber}</p>
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

            <div className="panel">
              <h3>العملاء المحذوفون</h3>
              <div className="audit-list">
                {appState.deletedCustomers?.length ? appState.deletedCustomers.map((item) => (
                  <div key={item.id} className="audit-card">
                    <strong>{item.customerName}</strong>
                    <p>رقم الشريحة: {item.customerNumber} — رقم الطلب: {item.orderNumber}</p>
                    <p>سبب الحذف: {item.reason}</p>
                    <span>{item.date} — بواسطة {item.actor}</span>
                  </div>
                )) : <p className="muted">لا يوجد عملاء محذوفون حتى الآن.</p>}
              </div>
            </div>
          </section>
        )}
      </main>

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
                <div><strong>رقم الفاتورة</strong><span>{createInvoiceNumber(invoiceCustomer.customerNumber)}</span></div>
                <div><strong>تاريخ الإصدار</strong><span>{formatDate(new Date().toISOString().split('T')[0])}</span></div>
              </div>
              <div className="invoice-grid">
                <div><strong>اسم العميل</strong><span>{invoiceCustomer.name}</span></div>
                <div><strong>رقم الشريحة</strong><span>{invoiceCustomer.customerNumber}</span></div>
                <div><strong>رقم الطلب</strong><span>{invoiceCustomer.orderNumber}</span></div>
                <div><strong>الجوال</strong><span>{invoiceCustomer.phone}</span></div>
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
