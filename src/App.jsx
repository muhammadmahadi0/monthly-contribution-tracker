import { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useUndoRedo, generateId, formatMonthYear, formatDate } from './hooks/useUndoRedo';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// ============= THEME & LANGUAGE CONTEXT =============

const THEME_KEY = 'ledger-theme';
const LANGUAGE_KEY = 'ledger-language';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function getStoredLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) || 'en';
}

function setStoredLanguage(lang) {
  localStorage.setItem(LANGUAGE_KEY, lang);
}

// ============= TRANSLATIONS =============

const translations = {
  en: {
    // App Header
    appTitle: 'Contribution Tracker',
    appSubtitle: 'Monthly payment management',

    // Buttons & Actions
    addMember: 'Add Member',
    editMember: 'Edit Member',
    update: 'Update',
    cancel: 'Cancel',
    delete: 'Delete',
    addPayment: '+ Add Payment',
    exportCSV: 'Export CSV',
    edit: 'Edit',

    // Member Modal
    memberName: 'Name',
    memberNamePlaceholder: 'Enter member name',
    monthlyAmount: 'Monthly Amount (TK)',
    startMonth: 'Start Month',
    debtCalculationNote: 'Debt calculation starts from this month.',
    addNewMember: 'Add New Member',

    // Payment Modal
    addPaymentTitle: 'Add Payment',
    editPaymentTitle: 'Edit Payment',
    amount: 'Amount (TK)',
    amountPlaceholder: 'Enter amount',
    date: 'Date',
    description: 'Description (Optional)',
    descriptionPlaceholder: 'e.g., Monthly contribution',
    add: 'Add',

    // Status
    paid: 'Paid',
    advanced: 'Advanced',
    due: 'Due',
    paidInFull: 'All payments up to date',
    advancedDesc: 'surplus',
    dueDesc: 'deficit',

    // Dashboard
    expected: 'Expected',
    collected: 'Collected',
    due: 'Due',
    currentBalance: 'Current Balance',
    thisMonth: 'This Month',
    paidLabel: 'Paid',
    dueLabel: 'Due',
    lifetimeSummary: 'Lifetime Summary',
    totalPaid: 'Total Paid',

    // Tabs
    dashboard: 'Dashboard',
    globalLedger: 'Global Ledger',
    history: 'History',

    // Global Ledger
    allTransactions: 'All Transactions',
    showingPayments: 'Showing all payments from all members',
    total: 'Total',
    noTransactions: 'No transactions yet.',

    // Member History
    memberHistory: 'History',
    lifetimePaid: 'Lifetime Paid',
    noTransactionsYet: 'No transactions yet.',
    payment: 'Payment',
    unknown: 'Unknown',

    // Empty State
    noMembers: 'No members yet',
    addFirstMember: 'Add your first member to start tracking',

    // Delete Confirm
    deleteMember: 'Delete Member',
    deleteTransaction: 'Delete Transaction',
    deleteMemberMsg: 'Delete this member and all their transactions? This cannot be undone.',
    deleteTransactionMsg: 'Delete this transaction? This cannot be undone.',

    // History Tab
    editHistory: 'Edit History',
    noHistory: 'No history yet.',

    // Summary Bar
    collectedLabel: 'Collected',
    dueLabel: 'Due',

    // Theme
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',

    // Misc
    month: '/month',
  },
  bn: {
    // App Header
    appTitle: 'কন্ট্রিবিউশন ট্র্যাকার',
    appSubtitle: 'মাসিক পেমেন্ট ব্যবস্থাপনা',

    // Buttons & Actions
    addMember: 'সদস্য যোগ',
    editMember: 'সদস্য সম্পাদনা',
    update: 'আপডেট',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    addPayment: '+ পেমেন্ট যোগ',
    exportCSV: 'CSV রপ্তানি',
    edit: 'সম্পাদনা',

    // Member Modal
    memberName: 'নাম',
    memberNamePlaceholder: 'সদস্যের নাম লিখুন',
    monthlyAmount: 'মাসিক টাকা (টাকা)',
    startMonth: 'শুরুর মাস',
    debtCalculationNote: 'এই মাস থেকে ঋণ গণনা শুরু হবে।',
    addNewMember: 'নতুন সদস্য যোগ করুন',

    // Payment Modal
    addPaymentTitle: 'পেমেন্ট যোগ',
    editPaymentTitle: 'পেমেন্ট সম্পাদনা',
    amount: 'টাকার পরিমাণ (টাকা)',
    amountPlaceholder: 'টাকার পরিমাণ লিখুন',
    date: 'তারিখ',
    description: 'বিবরণ (ঐচ্ছিক)',
    descriptionPlaceholder: 'যেমন: মাসিক কন্ট্রিবিউশন',
    add: 'যোগ',

    // Status
    paid: 'পরিশোধিত',
    advanced: 'অগ্রিম',
    due: 'বাকি',
    paidInFull: 'সব পেমেন্ট আপ টু ডেট',
    advancedDesc: 'উদ্বৃত্ত',
    dueDesc: 'ঘাটতি',

    // Dashboard
    expected: 'প্রত্যাশিত',
    collected: 'সংগ্রহিত',
    due: 'বাকি',
    currentBalance: 'বর্তমান ব্যালেন্স',
    thisMonth: 'এই মাসে',
    paidLabel: 'দেওয়া',
    dueLabel: 'দেওয়া বাকি',
    lifetimeSummary: 'আজীবন সারসংক্ষেপ',
    totalPaid: 'মোট দেওয়া',

    // Tabs
    dashboard: 'ড্যাশবোর্ড',
    globalLedger: 'গ্লোবাল লেজার',
    history: 'ইতিহাস',

    // Global Ledger
    allTransactions: 'সমস্ত লেনদেন',
    showingPayments: 'সমস্ত সদস্যের পেমেন্ট দেখাচ্ছে',
    total: 'মোট',
    noTransactions: 'কোনো লেনদেন নেই।',

    // Member History
    memberHistory: 'ইতিহাস',
    lifetimePaid: 'আজীবন দেওয়া',
    noTransactionsYet: 'কোনো লেনদেন নেই।',
    payment: 'পেমেন্ট',
    unknown: 'অজানা',

    // Empty State
    noMembers: 'কোনো সদস্য নেই',
    addFirstMember: 'ট্র্যাকিং শুরু করতে আপনার প্রথম সদস্য যোগ করুন',

    // Delete Confirm
    deleteMember: 'সদস্য মুছুন',
    deleteTransaction: 'লেনদেন মুছুন',
    deleteMemberMsg: 'এই সদস্য এবং তাদের সমস্ত লেনদেন মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যায় না।',
    deleteTransactionMsg: 'এই লেনদেন মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যায় না।',

    // History Tab
    editHistory: 'সম্পাদনা ইতিহাস',
    noHistory: 'এখনও কোনো ইতিহাস নেই।',

    // Summary Bar
    collectedLabel: 'সংগ্রহ',
    dueLabel: 'বাকি',

    // Theme
    lightMode: 'লাইট মোড',
    darkMode: 'ডার্ক মোড',

    // Misc
    month: '/মাস',
  },
};

// ============= LANGUAGE CONTEXT =============

const LanguageContext = createContext();

function LanguageProvider({ children, language, setLanguage }) {
  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const months = language === 'bn'
    ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage, months }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  return useContext(LanguageContext);
}

// ============= UTILITY FUNCTIONS =============

function calculateMonthsElapsed(joinDate, selectedYear, selectedMonth) {
  const join = new Date(joinDate);
  const selected = new Date(selectedYear, selectedMonth, 1);

  if (selected < join) return 0;

  const yearsDiff = selected.getFullYear() - join.getFullYear();
  const monthsDiff = selected.getMonth() - join.getMonth();

  return yearsDiff * 12 + monthsDiff + 1;
}

function calculateTotalDue(member, selectedYear, selectedMonth) {
  const monthsElapsed = calculateMonthsElapsed(member.joinDate, selectedYear, selectedMonth);
  return member.fixedAmount * monthsElapsed;
}

function calculateTotalPaid(transactions, memberId, joinDate, selectedYear, selectedMonth) {
  const cutoffDate = new Date(selectedYear, selectedMonth + 1, 0);
  const memberJoinDate = new Date(joinDate);

  let total = 0;

  transactions.forEach(t => {
    if (t.memberId !== memberId) return;

    const txDate = new Date(t.date);

    if (txDate >= memberJoinDate && txDate <= cutoffDate) {
      total += t.amount;
    }
  });

  return total;
}

function calculateBalance(transactions, member, selectedYear, selectedMonth) {
  const totalDue = calculateTotalDue(member, selectedYear, selectedMonth);
  const totalPaid = calculateTotalPaid(
    transactions,
    member.id,
    member.joinDate,
    selectedYear,
    selectedMonth
  );
  return totalPaid - totalDue;
}

function getStatusInfo(balance, t) {
  if (balance === 0) {
    return {
      status: 'paid',
      label: t('paid'),
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      description: t('paidInFull')
    };
  } else if (balance > 0) {
    return {
      status: 'advanced',
      label: t('advanced'),
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      description: `+${balance} TK ${t('advancedDesc')}`
    };
  } else {
    return {
      status: 'due',
      label: t('due'),
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      description: `${Math.abs(balance)} TK ${t('dueDesc')}`
    };
  }
}

function getFirstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function formatCurrency(amount) {
  return `${amount.toLocaleString()} TK`;
}

// ============= COMPONENTS =============

function LanguageToggle({ language, setLanguage }) {
  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
      className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      {language === 'en' ? 'বাং' : 'EN'}
    </button>
  );
}

function ThemeToggle({ isDark, toggleTheme, t }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title={isDark ? t('lightMode') : t('darkMode')}
    >
      {isDark ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function MonthPicker({ selectedYear, selectedMonth, onYearChange, onMonthChange, months }) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => currentYear - 3 + i);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200 text-base"
      >
        {months.map((month, index) => (
          <option key={month} value={index}>{month}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200 text-base"
      >
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
}

function MemberModal({ isOpen, onClose, onSave, member = null }) {
  const { t } = useLanguage();
  const defaultJoinDate = getFirstDayOfMonth();
  const [name, setName] = useState(member?.name || '');
  const [fixedAmount, setFixedAmount] = useState(member?.fixedAmount || 500);
  const [joinDate, setJoinDate] = useState(member?.joinDate || defaultJoinDate);

  useEffect(() => {
    if (isOpen && !member) {
      setName('');
      setFixedAmount(500);
      setJoinDate(defaultJoinDate);
    }
  }, [isOpen, member, defaultJoinDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || fixedAmount <= 0 || !joinDate) return;
    onSave({
      name: name.trim(),
      fixedAmount: parseFloat(fixedAmount),
      joinDate
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">{member ? t('editMember') : t('addNewMember')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('memberName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-base"
              placeholder={t('memberNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('monthlyAmount')}</label>
            <input
              type="number"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white text-base"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('startMonth')}</label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white text-base"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('debtCalculationNote')}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-base"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-base"
            >
              {member ? t('update') : t('addMember')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionModal({ isOpen, onClose, onSave, transaction = null, memberName = '', defaultDate = null }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [date, setDate] = useState(transaction?.date || defaultDate || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setAmount(transaction.amount.toString());
        setDate(transaction.date);
        setDescription(transaction.description || '');
      } else {
        setAmount('');
        setDate(defaultDate || new Date().toISOString().split('T')[0]);
        setDescription('');
      }
    }
  }, [transaction, isOpen, defaultDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !date) return;
    onSave({
      amount: parseFloat(amount),
      date,
      description: description.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {transaction ? `${t('editPaymentTitle')} - ${memberName}` : `${t('addPaymentTitle')} - ${memberName}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('amount')}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white text-base"
              placeholder={t('amountPlaceholder')}
              min="1"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white text-base"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-base"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-base"
            >
              {transaction ? t('update') : t('add')} {t('addPayment').replace('+ ', '')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-2 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-base"
          >
            {useLanguage().t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-base"
          >
            {useLanguage().t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= MOBILE-FIRST CARD COMPONENTS =============

function StatsDashboard({ members, transactions, selectedYear, selectedMonth }) {
  const { t } = useLanguage();
  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalDue = 0;

    members.forEach((member) => {
      const due = calculateTotalDue(member, selectedYear, selectedMonth);
      const paid = calculateTotalPaid(
        transactions,
        member.id,
        member.joinDate,
        selectedYear,
        selectedMonth
      );

      totalExpected += due;
      totalCollected += paid;
      totalDue += Math.max(0, due - paid);
    });

    return { totalExpected, totalCollected, totalDue };
  }, [members, transactions, selectedYear, selectedMonth]);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('expected')}</div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {formatCurrency(stats.totalExpected)}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('collected')}</div>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          {formatCurrency(stats.totalCollected)}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('due')}</div>
        <div className="text-lg font-bold text-red-600 dark:text-red-400">
          {formatCurrency(stats.totalDue)}
        </div>
      </div>
    </div>
  );
}

function StickySummaryBar({ members, transactions, selectedYear, selectedMonth }) {
  const { t } = useLanguage();
  const totals = useMemo(() => {
    let totalCollected = 0;
    let totalDue = 0;

    members.forEach((member) => {
      const due = calculateTotalDue(member, selectedYear, selectedMonth);
      const paid = calculateTotalPaid(
        transactions,
        member.id,
        member.joinDate,
        selectedYear,
        selectedMonth
      );

      totalCollected += paid;
      totalDue += Math.max(0, due - paid);
    });

    return { totalCollected, totalDue };
  }, [members, transactions, selectedYear, selectedMonth]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 shadow-lg z-30 md:hidden">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('collectedLabel')}</div>
          <div className="text-base font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.totalCollected)}
          </div>
        </div>
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('dueLabel')}</div>
          <div className="text-base font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.totalDue)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  balance,
  statusInfo,
  totalDue,
  totalPaid,
  lifetimePaid = 0,
  onAddTransaction,
  onEdit,
  onDelete,
  onViewHistory
}) {
  const { t } = useLanguage();

  // Progress bar calculation
  const progressPercent = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(member.fixedAmount)}{t('month')}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{t('paidLabel')}: {formatCurrency(totalPaid)}</span>
            <span>{t('expected')}: {formatCurrency(totalDue)}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent >= 100 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('currentBalance')}</div>
            <div className={`text-xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('thisMonth')}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div>{t('paidLabel')}: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span></div>
              <div>{t('dueLabel')}: <span className="font-medium">{formatCurrency(totalDue)}</span></div>
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('lifetimeSummary')}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('lifetimePaid')}: <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(lifetimePaid)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onAddTransaction}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-base min-h-[44px]"
        >
          {t('addPayment')}
        </button>
        <button
          onClick={onViewHistory}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-base min-h-[44px]"
          title={t('memberHistory')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-base min-h-[44px]"
          title={t('edit')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-base min-h-[44px]"
          title={t('delete')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MemberHistoryModal({ isOpen, onClose, member, transactions }) {
  const { t } = useLanguage();
  const memberTransactions = useMemo(() => {
    return transactions
      .filter(t => t.memberId === member?.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, member]);

  const lifetimeTotal = useMemo(() => {
    return memberTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [memberTransactions]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">{member.name} - {t('memberHistory')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('lifetimePaid')}: {formatCurrency(lifetimeTotal)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {memberTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t('noTransactionsYet')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {memberTransactions.map((t) => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(t.amount)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.description || t('payment')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(t.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GlobalLedger({ members, transactions, onEditTransaction, onDeleteTransaction, onBack }) {
  const { t } = useLanguage();

  // Safety check: ensure transactions is an array
  const safeTransactions = (transactions || []);

  // Safety check: ensure members is an array
  const safeMembers = (members || []);

  // Bulletproof member lookup
  const getMemberName = (memberId) => {
    if (!memberId) return 'Unknown Member';
    const member = safeMembers.find(m => String(m.id) === String(memberId));
    return member ? member.name : 'Unknown Member';
  };

  const sortedTransactions = useMemo(() => {
    if (!Array.isArray(safeTransactions)) return [];
    return [...safeTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [safeTransactions]);

  const totalSum = useMemo(() => {
    if (!Array.isArray(safeTransactions)) return 0;
    return safeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [safeTransactions]);

  if (!Array.isArray(safeTransactions) || safeTransactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        {/* Grand Total Card - Empty State */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-lg p-5 text-white">
          <div className="text-sm opacity-80 mb-1">{t('total')}</div>
          <div className="text-3xl font-bold">0 TK</div>
          <div className="text-sm opacity-80 mt-1">{t('noTransactions')}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{t('noTransactions')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Dashboard</span>
      </button>

      {/* Grand Total Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-lg p-5 text-white">
        <div className="text-sm opacity-80 mb-1">{t('total')}</div>
        <div className="text-3xl font-bold">{formatCurrency(totalSum)}</div>
        <div className="text-sm opacity-80 mt-1">{t('showingPayments')}</div>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
        {sortedTransactions.map((transaction) => {
          // Bulletproof member lookup for each transaction
          const displayName = getMemberName(transaction.memberId);
          const amount = Number(transaction.amount) || 0;

          return (
            <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</span>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">{displayName}</div>
                  {transaction.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{transaction.description}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(amount)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditTransaction && onEditTransaction(transaction)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors"
                      title={t('edit')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteTransaction && onDeleteTransaction(transaction)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title={t('delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryTab({ history }) {
  const { t } = useLanguage();
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [history]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <span className="w-2 h-2 bg-green-500 rounded-full"></span>;
      case 'edit':
        return <span className="w-2 h-2 bg-blue-500 rounded-full"></span>;
      case 'delete':
        return <span className="w-2 h-2 bg-red-500 rounded-full"></span>;
      default:
        return <span className="w-2 h-2 bg-gray-500 rounded-full"></span>;
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('editHistory')}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">{t('editHistory')}</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {sortedHistory.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getActionIcon(item.action)}
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.targetName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{item.description}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function exportToCSV(members, transactions, selectedYear, selectedMonth) {
  const rows = [['Date', 'Member', 'Description', 'Amount', 'Balance After']];

  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const memberBalances = {};

  sortedTransactions.forEach((t) => {
    const member = members.find(m => m.id === t.memberId);
    if (!member) return;

    if (!memberBalances[t.memberId]) {
      const monthsElapsed = calculateMonthsElapsed(member.joinDate, new Date(t.date).getFullYear(), new Date(t.date).getMonth());
      const totalDue = member.fixedAmount * monthsElapsed;
      memberBalances[t.memberId] = -totalDue;
    }

    memberBalances[t.memberId] += t.amount;

    rows.push([t.date, member.name, t.description || '', t.amount, memberBalances[t.memberId]]);
  });

  const csvContent = rows.map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(csvContent)));
      await Filesystem.writeFile({
        path: 'hisab_ledger.csv',
        data: base64,
        directory: Directory.Documents,
        encoding: 'base64'
      });
      alert('File saved to Documents/hisab_ledger.csv');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file. Please check storage permissions.');
    }
  } else {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ledger-${selectedYear}-${selectedMonth + 1}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ============= MAIN APP =============

const initialData = {
  members: [],
  transactions: [],
};

export default function App() {
  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialData);
  const { members, transactions } = state;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [historyMember, setHistoryMember] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [isDark, setIsDark] = useState(() => getStoredTheme() === 'dark');
  const [language, setLanguage] = useState(() => getStoredLanguage());
  const [editHistory, setEditHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStoredTheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  const toggleTheme = () => setIsDark(!isDark);

  const addToHistory = (action, targetName, description) => {
    setEditHistory(prev => [...prev, {
      id: generateId(),
      action,
      targetName,
      description,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleViewHistory = (member) => {
    setHistoryMember(member);
  };

  const handleAddMember = (memberData) => {
    const newMember = { id: generateId(), ...memberData };
    setState((prev) => ({ ...prev, members: [...prev.members, newMember] }));
    addToHistory('create', memberData.name, `Added (${memberData.fixedAmount} TK/month)`);
  };

  const handleUpdateMember = (memberData) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === editingMember.id ? { ...m, ...memberData } : m
      ),
    }));
    addToHistory('edit', memberData.name, 'Updated member details');
    setEditingMember(null);
  };

  const handleDeleteMember = () => {
    if (!deletingItem) return;
    const memberName = deletingItem.name;
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== deletingItem.id),
      transactions: prev.transactions.filter((t) => t.memberId !== deletingItem.id),
    }));
    addToHistory('delete', memberName, 'Deleted member and all transactions');
    setDeletingItem(null);
    setIsDeleteModalOpen(false);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const confirmDeleteMember = (member) => {
    setDeletingItem(member);
    setIsDeleteModalOpen(true);
  };

  const handleAddTransaction = (member) => {
    setSelectedMember(member);
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (transactionData) => {
    const memberName = selectedMember?.name || 'Unknown';

    if (editingTransaction) {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === editingTransaction.id ? { ...t, ...transactionData } : t
        ),
      }));
      addToHistory('edit', memberName, `Updated to ${transactionData.amount} TK`);
    } else {
      const newTransaction = {
        id: generateId(),
        memberId: selectedMember.id,
        ...transactionData,
      };
      setState((prev) => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction],
      }));
      addToHistory('create', memberName, `Added ${transactionData.amount} TK`);
    }
    setSelectedMember(null);
    setEditingTransaction(null);
    setIsTransactionModalOpen(false);
  };

  const handleEditTransaction = (transaction) => {
    const member = members.find(m => m.id === transaction.memberId);
    setSelectedMember(member);
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setDeletingItem(transaction);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (!deletingItem || !deletingItem.memberId) return;
    const member = members.find(m => m.id === deletingItem.memberId);
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== deletingItem.id),
    }));
    addToHistory('delete', member?.name || 'Unknown', `Deleted ${deletingItem.amount} TK`);
    setDeletingItem(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem?.fixedAmount !== undefined) {
      handleDeleteMember();
    } else if (deletingItem?.memberId) {
      confirmDeleteTransaction();
    }
  };

  const handleExportCSV = () => {
    exportToCSV(members, transactions, selectedYear, selectedMonth);
  };

  const memberData = useMemo(() => {
    const t = (key) => translations[language]?.[key] || translations.en[key] || key;
    return members.map((member) => {
      const monthsElapsed = calculateMonthsElapsed(member.joinDate, selectedYear, selectedMonth);
      const totalDue = calculateTotalDue(member, selectedYear, selectedMonth);
      const totalPaid = calculateTotalPaid(
        transactions,
        member.id,
        member.joinDate,
        selectedYear,
        selectedMonth
      );
      const balance = calculateBalance(transactions, member, selectedYear, selectedMonth);
      const statusInfo = getStatusInfo(balance, t);

      // Calculate lifetime total (all transactions for this member)
      const lifetimePaid = (transactions || []).reduce((sum, t) => {
        return t.memberId === member.id ? sum + (t.amount || 0) : sum;
      }, 0);

      return {
        member,
        monthsElapsed,
        totalDue,
        totalPaid,
        balance,
        statusInfo,
        lifetimePaid,
      };
    });
  }, [members, transactions, selectedYear, selectedMonth, language]);

  // Get translation function
  const t = (key) => translations[language]?.[key] || translations.en[key] || key;
  const months = language === 'bn'
    ? ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors pb-20 md:pb-6">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('appTitle')}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('appSubtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
                  title="Undo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
                  title="Redo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
                <LanguageToggle language={language} setLanguage={setLanguage} />
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4">
          {/* Month Picker */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <MonthPicker
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
              months={months}
            />
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm whitespace-nowrap"
            >
              {t('addMember')}
            </button>
          </div>

          {/* Tabs - Mobile optimized */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {[
              { id: 'dashboard', label: t('dashboard') },
              { id: 'ledger', label: t('globalLedger') },
              { id: 'history', label: t('history') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          {activeTab === 'dashboard' && members.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'সদস্য খুঁজুন...' : 'Search members...'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-white text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' ? (
            <>
              <StatsDashboard
                members={members}
                transactions={transactions}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
              />

              {members.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('noMembers')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t('addFirstMember')}</p>
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {t('addMember')}
                  </button>
                </div>
              ) : (
                <>
                  {searchQuery && memberData.filter(m => m.member.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'bn' ? 'কোনো সদস্য পাওয়া যায়নি' : 'No members found'}
                      </p>
                    </div>
                  ) : (
                    memberData
                      .filter(m => !searchQuery || m.member.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((data) => (
                        <MemberCard
                          key={data.member.id}
                          member={data.member}
                          balance={data.balance}
                          statusInfo={data.statusInfo}
                          totalDue={data.totalDue}
                          totalPaid={data.totalPaid}
                          lifetimePaid={data.lifetimePaid}
                          onAddTransaction={() => handleAddTransaction(data.member)}
                          onEdit={() => handleEditMember(data.member)}
                          onDelete={() => confirmDeleteMember(data.member)}
                          onViewHistory={() => handleViewHistory(data.member)}
                        />
                      ))
                  )}
                </>
              )}

              {members.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="w-full mt-4 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  {t('exportCSV')}
                </button>
              )}
            </>
          ) : activeTab === 'ledger' ? (
            <GlobalLedger
              members={members}
              transactions={transactions}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBack={() => setActiveTab('dashboard')}
            />
          ) : (
            <HistoryTab history={editHistory} />
          )}
        </main>

        {/* Sticky Summary Bar - Mobile only */}
        {activeTab === 'dashboard' && members.length > 0 && (
          <StickySummaryBar
            members={members}
            transactions={transactions}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        )}

        {/* Modals */}
        <MemberModal
          isOpen={isMemberModalOpen}
          onClose={() => {
            setIsMemberModalOpen(false);
            setEditingMember(null);
          }}
          onSave={editingMember ? handleUpdateMember : handleAddMember}
          member={editingMember}
        />

        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setSelectedMember(null);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          transaction={editingTransaction}
          memberName={selectedMember?.name || ''}
        />

        <MemberHistoryModal
          isOpen={!!historyMember}
          onClose={() => setHistoryMember(null)}
          member={historyMember}
          transactions={transactions}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={deletingItem?.fixedAmount !== undefined ? t('deleteMember') : t('deleteTransaction')}
          message={
            deletingItem?.fixedAmount !== undefined
              ? t('deleteMemberMsg')
              : t('deleteTransactionMsg')
          }
        />
      </div>
    </LanguageProvider>
  );
}