import { useState, useMemo, useEffect } from 'react';
import { useUndoRedo, generateId, formatMonthYear, formatDate, parseMonthYearString } from './hooks/useUndoRedo';

// ============= THEME CONTEXT =============

const THEME_KEY = 'ledger-theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ============= UTILITY FUNCTIONS =============

/**
 * Calculate months between two dates using the correct formula:
 * monthsActive = (currentYear - joinYear) * 12 + (currentMonth - joinMonth) + 1
 * The +1 ensures that even in the first month, they owe their first fixed amount.
 */
function calculateMonthsElapsed(joinDate, selectedYear, selectedMonth) {
  const join = new Date(joinDate);
  const selected = new Date(selectedYear, selectedMonth, 1);

  if (selected < join) return 0;

  const yearsDiff = selected.getFullYear() - join.getFullYear();
  const monthsDiff = selected.getMonth() - join.getMonth();

  return yearsDiff * 12 + monthsDiff + 1;
}

/**
 * Calculate total due for a member up to a specific month
 */
function calculateTotalDue(member, selectedYear, selectedMonth) {
  const monthsElapsed = calculateMonthsElapsed(member.joinDate, selectedYear, selectedMonth);
  return member.fixedAmount * monthsElapsed;
}

/**
 * Calculate total paid by a member (all transactions up to selected month)
 */
function calculateTotalPaid(transactions, memberId, selectedYear, selectedMonth) {
  const cutoffDate = new Date(selectedYear, selectedMonth + 1, 0);

  return transactions
    .filter(t => {
      if (t.memberId !== memberId) return false;
      const txDate = new Date(t.date);
      return txDate <= cutoffDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate current balance for a member
 */
function calculateBalance(transactions, member, selectedYear, selectedMonth) {
  const totalDue = calculateTotalDue(member, selectedYear, selectedMonth);
  const totalPaid = calculateTotalPaid(transactions, member.id, selectedYear, selectedMonth);
  return totalPaid - totalDue;
}

/**
 * Get status label and info based on balance
 * FIXED LOGIC:
 * - Due (Red): Balance < 0 (Total Paid < Total Due)
 * - Paid (Green): Balance == 0 (Total Paid == Total Due)
 * - Advanced (Blue): Balance > 0 (Total Paid > Total Due - strictly greater)
 */
function getStatusInfo(balance) {
  if (balance === 0) {
    return {
      status: 'paid',
      label: 'Paid',
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      borderColor: 'border-green-500',
      description: 'All payments up to date'
    };
  } else if (balance > 0) {
    return {
      status: 'advanced',
      label: 'Advanced',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      borderColor: 'border-blue-500',
      description: `+${balance} TK surplus`
    };
  } else {
    return {
      status: 'due',
      label: 'Due',
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      borderColor: 'border-red-500',
      description: `${Math.abs(balance)} TK deficit`
    };
  }
}

/**
 * Get first day of current month for default join date
 */
function getFirstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return `${amount.toLocaleString()} TK`;
}

// ============= COMPONENTS =============

function ThemeToggle({ isDark, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function MonthPicker({ selectedYear, selectedMonth, onYearChange, onMonthChange }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => currentYear - 3 + i);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200"
      >
        {months.map((month, index) => (
          <option key={month} value={index}>
            {month}
          </option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

function MemberModal({ isOpen, onClose, onSave, member = null }) {
  const [name, setName] = useState(member?.name || '');
  const [fixedAmount, setFixedAmount] = useState(member?.fixedAmount || 500);
  const [joinDate, setJoinDate] = useState(member?.joinDate || getFirstDayOfMonth());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || fixedAmount <= 0 || !joinDate) return;
    onSave({
      name: name.trim(),
      fixedAmount: parseFloat(fixedAmount),
      joinDate
    });
    onClose();
    if (!member) {
      setName('');
      setFixedAmount(500);
      setJoinDate(getFirstDayOfMonth());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">{member ? 'Edit Member' : 'Add New Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Enter member name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Monthly Amount (TK)</label>
            <input
              type="number"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Date</label>
            <input
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This determines how many months of contributions are due</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              {member ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionModal({ isOpen, onClose, onSave, transaction = null, memberName = '' }) {
  const [amount, setAmount] = useState(transaction?.amount || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setDate(transaction.date);
      setDescription(transaction.description || '');
    } else {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [transaction, isOpen]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {transaction ? `Edit Transaction - ${memberName}` : `Add Transaction - ${memberName}`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (TK)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Monthly contribution"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              {transaction ? 'Update' : 'Add'} Transaction
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-2 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function LedgerView({ members, transactions, selectedYear, selectedMonth, onEditTransaction, onDeleteTransaction }) {
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (selectedMemberId !== 'all') {
      filtered = filtered.filter(t => t.memberId === selectedMemberId);
    }

    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, selectedMemberId, sortOrder]);

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No members to display. Add a member to see their ledger.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex flex-wrap gap-3 items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Transaction Ledger</h2>
        <div className="flex gap-2">
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">All Members</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No transactions found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {getMemberName(t.memberId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {t.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded transition-colors"
                        title="Edit transaction"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                        title="Delete transaction"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ history }) {
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [history]);

  const getActionIcon = (action) => {
    if (action === 'create') {
      return <span className="w-2 h-2 bg-green-500 rounded-full"></span>;
    } else if (action === 'edit') {
      return <span className="w-2 h-2 bg-blue-500 rounded-full"></span>;
    } else if (action === 'delete') {
      return <span className="w-2 h-2 bg-red-500 rounded-full"></span>;
    }
    return <span className="w-2 h-2 bg-gray-500 rounded-full"></span>;
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Edit History</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No history yet. All transaction and member changes will be logged here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Edit History</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {sortedHistory.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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

function TransactionLog({ transactions, members, onViewLedger }) {
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }, [transactions]);

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Transaction Log</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Recent Activity</h2>
        <button
          onClick={onViewLedger}
          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
        >
          View Full Ledger →
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {recentTransactions.map((t) => (
          <div key={t.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{getMemberName(t.memberId)}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t.description || 'Payment'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(t.amount)}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{formatDate(t.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member, balance, statusInfo, monthsElapsed, totalDue, totalPaid, onAddTransaction, onEdit, onDelete, onViewLedger }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
              {statusInfo.status === 'due' && `: ${Math.abs(balance)} TK`}
              {statusInfo.status === 'advanced' && `: +${balance} TK`}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Joined: {formatDate(member.joinDate)} ({monthsElapsed} months)
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Fixed: {formatCurrency(member.fixedAmount)}/mo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Paid: {formatCurrency(totalPaid)} / Due: {formatCurrency(totalDue)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewLedger(member)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors"
              title="View ledger"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button
              onClick={() => onAddTransaction()}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors text-sm font-medium"
            >
              + Add
            </button>
            <button
              onClick={() => onEdit()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Edit member"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete()}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
              title="Delete member"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalDashboard({ members, transactions, selectedYear, selectedMonth }) {
  const totals = useMemo(() => {
    let totalGroupBalance = 0;
    let totalCollected = 0;
    let totalExpected = 0;

    members.forEach((member) => {
      const balance = calculateBalance(transactions, member, selectedYear, selectedMonth);
      const totalDue = calculateTotalDue(member, selectedYear, selectedMonth);
      const totalPaid = calculateTotalPaid(transactions, member.id, selectedYear, selectedMonth);

      totalGroupBalance += balance;
      totalCollected += totalPaid;
      totalExpected += totalDue;
    });

    return { totalGroupBalance, totalCollected, totalExpected };
  }, [members, transactions, selectedYear, selectedMonth]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Total Group Balance</div>
        <div className={`text-2xl font-bold ${totals.totalGroupBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatCurrency(totals.totalGroupBalance)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {totals.totalGroupBalance >= 0 ? 'Surplus' : 'Deficit'}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Total Collected</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.totalCollected)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All payments to date</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Total Expected</div>
        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{formatCurrency(totals.totalExpected)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Through {formatMonthYear(selectedYear, selectedMonth)}</div>
      </div>
    </div>
  );
}

function exportToCSV(members, transactions, selectedYear, selectedMonth) {
  const rows = [
    ['Date', 'Member', 'Description', 'Amount', 'Balance After'],
  ];

  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const memberBalances = {};

  sortedTransactions.forEach((t) => {
    const member = members.find(m => m.id === t.memberId);
    if (!member) return;

    if (!memberBalances[t.memberId]) {
      const joinYear = new Date(member.joinDate).getFullYear();
      const joinMonth = new Date(member.joinDate).getMonth();
      const txDate = new Date(t.date);

      let monthsElapsed = 0;
      if (txDate >= new Date(member.joinDate)) {
        monthsElapsed = (txDate.getFullYear() - joinYear) * 12 + (txDate.getMonth() - joinMonth) + 1;
      }
      const totalDue = member.fixedAmount * monthsElapsed;
      memberBalances[t.memberId] = -totalDue;
    }

    memberBalances[t.memberId] += t.amount;

    rows.push([
      t.date,
      member.name,
      t.description || '',
      t.amount,
      memberBalances[t.memberId]
    ]);
  });

  const csvContent = rows.map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
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
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Dark mode state
  const [isDark, setIsDark] = useState(() => getStoredTheme() === 'dark');

  // History for tracking edits
  const [editHistory, setEditHistory] = useState([]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStoredTheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Add to history
  const addToHistory = (action, targetName, description) => {
    setEditHistory(prev => [...prev, {
      id: generateId(),
      action,
      targetName,
      description,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleViewLedger = (member) => {
    setSelectedMember(member);
    setActiveTab('ledger');
  };

  // Member CRUD
  const handleAddMember = (memberData) => {
    const newMember = { id: generateId(), ...memberData };
    setState((prev) => ({ ...prev, members: [...prev.members, newMember] }));
    addToHistory('create', memberData.name, `Added as member (${memberData.fixedAmount} TK/month)`);
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

  // Transaction CRUD
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
      addToHistory('edit', memberName, `Updated transaction: ${transactionData.amount} TK`);
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
      addToHistory('create', memberName, `Added transaction: ${transactionData.amount} TK`);
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
    addToHistory('delete', member?.name || 'Unknown', `Deleted transaction: ${deletingItem.amount} TK`);
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
    return members.map((member) => {
      const monthsElapsed = calculateMonthsElapsed(member.joinDate, selectedYear, selectedMonth);
      const totalDue = calculateTotalDue(member, selectedYear, selectedMonth);
      const totalPaid = calculateTotalPaid(transactions, member.id, selectedYear, selectedMonth);
      const balance = calculateBalance(transactions, member, selectedYear, selectedMonth);
      const statusInfo = getStatusInfo(balance);

      return {
        member,
        monthsElapsed,
        totalDue,
        totalPaid,
        balance,
        statusInfo,
      };
    });
  }, [members, transactions, selectedYear, selectedMonth]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cumulative Ledger System</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track member contributions with running balances</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <MonthPicker
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              Export CSV
            </button>
            <button onClick={() => setIsMemberModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
              + Add Member
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Full Ledger
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            <GlobalDashboard
              members={members}
              transactions={transactions}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />

            <TransactionLog
              transactions={transactions}
              members={members}
              onViewLedger={() => setActiveTab('ledger')}
            />

            {/* Member List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mt-6">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200">Members - {formatMonthYear(selectedYear, selectedMonth)}</h2>
              </div>

              {members.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No members yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first member to start tracking contributions</p>
                  <button onClick={() => setIsMemberModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    + Add Member
                  </button>
                </div>
              ) : (
                memberData.map((data) => (
                  <MemberRow
                    key={data.member.id}
                    member={data.member}
                    balance={data.balance}
                    statusInfo={data.statusInfo}
                    monthsElapsed={data.monthsElapsed}
                    totalDue={data.totalDue}
                    totalPaid={data.totalPaid}
                    onAddTransaction={() => handleAddTransaction(data.member)}
                    onEdit={() => handleEditMember(data.member)}
                    onDelete={() => confirmDeleteMember(data.member)}
                    onViewLedger={handleViewLedger}
                  />
                ))
              )}
            </div>
          </>
        ) : activeTab === 'ledger' ? (
          <LedgerView
            members={members}
            transactions={transactions}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        ) : (
          <HistoryTab history={editHistory} />
        )}
      </main>

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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deletingItem?.fixedAmount !== undefined ? "Delete Member" : "Delete Transaction"}
        message={
          deletingItem?.fixedAmount !== undefined
            ? "Are you sure you want to delete this member? All their transactions will also be deleted. This action cannot be undone."
            : "Are you sure you want to delete this transaction? This action cannot be undone."
        }
      />
    </div>
  );
}