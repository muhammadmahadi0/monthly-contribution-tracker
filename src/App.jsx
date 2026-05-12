import { useState, useMemo } from 'react';
import { useUndoRedo, generateId, formatMonthYear, formatDate, parseMonthYearString, calculateMemberStatus, calculatePreviousMonthSurplus, exportToCSV } from './hooks/useUndoRedo';

const initialData = {
  members: [],
  transactions: [],
};

function MonthPicker({ selectedYear, selectedMonth, onYearChange, onMonthChange }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || fixedAmount <= 0) return;
    onSave({ name: name.trim(), fixedAmount: parseFloat(fixedAmount) });
    onClose();
    if (!member) {
      setName('');
      setFixedAmount(500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">{member ? 'Edit Member' : 'Add New Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter member name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Monthly Amount (TK)</label>
            <input
              type="number"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              className="input-field"
              min="1"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {member ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionModal({ isOpen, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSave({ amount: parseFloat(amount), date });
    onClose();
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TK)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="Enter amount"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberRow({ member, statusInfo, transactions, onAddTransaction, onEdit, onDelete, highlightAmount }) {
  const [showTransactions, setShowTransactions] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">{member.name}</span>
            <span className="text-sm text-gray-500">Fixed: {member.fixedAmount} TK</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {statusInfo.carriedSurplus > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Prev. Advance: {statusInfo.carriedSurplus} TK
              </span>
            )}
            {statusInfo.status === 'paid' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full status-paid">Paid</span>
            )}
            {statusInfo.status === 'due' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full status-due">
                Due: {statusInfo.difference} TK
              </span>
            )}
            {statusInfo.status === 'advanced' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full status-advanced">
                Advanced: +{statusInfo.difference} TK
              </span>
            )}
            <span className="text-sm text-gray-500">
              Paid: {statusInfo.totalPaid} TK
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="View transactions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => onAddTransaction()}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            + Add
          </button>
          <button
            onClick={() => onEdit()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit member"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete()}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete member"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {showTransactions && transactions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium text-gray-600 mb-2">Transactions</div>
            {transactions.map((t) => (
              <div key={t.id} className={`flex items-center justify-between text-sm ${highlightAmount(t.amount, member.fixedAmount) ? 'bg-yellow-100 px-2 py-1 rounded' : ''}`}>
                <span className="text-gray-600">{formatDate(t.date)}</span>
                <span className="font-medium">{t.amount} TK</span>
                {highlightAmount(t.amount, member.fixedAmount) && (
                  <span className="text-xs text-yellow-700 font-medium">Large</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Totalizer({ members, transactions, monthYear }) {
  const totals = useMemo(() => {
    let totalCollected = 0;
    let totalExpected = 0;

    members.forEach((member) => {
      const statusInfo = calculateMemberStatus(transactions, member, monthYear);
      totalCollected += statusInfo.totalPaid;
      totalExpected += member.fixedAmount;
    });

    return { totalCollected, totalExpected };
  }, [members, transactions, monthYear]);

  return (
    <div className="card p-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Collected</div>
          <div className="text-2xl font-bold text-green-600">{totals.totalCollected} TK</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Expected</div>
          <div className="text-2xl font-bold text-gray-700">{totals.totalExpected} TK</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialData);
  const { members, transactions } = state;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const monthYear = parseMonthYearString(selectedYear, selectedMonth);

  const highlightAmount = (amount, fixedAmount) => amount > fixedAmount * 2;

  const handleAddMember = (memberData) => {
    const newMember = { id: generateId(), ...memberData };
    setState((prev) => ({ ...prev, members: [...prev.members, newMember] }));
  };

  const handleUpdateMember = (memberData) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === editingMember.id ? { ...m, ...memberData } : m
      ),
    }));
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId) => {
    if (confirm('Are you sure you want to delete this member? All their transactions will also be deleted.')) {
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        transactions: prev.transactions.filter((t) => t.memberId !== memberId),
      }));
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleAddTransaction = (member) => {
    setSelectedMember(member);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (transactionData) => {
    const newTransaction = {
      id: generateId(),
      memberId: selectedMember.id,
      ...transactionData,
      monthYear,
    };
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
    setSelectedMember(null);
  };

  const handleExportCSV = () => {
    exportToCSV(members, transactions, monthYear);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Monthly Contribution Tracker</h1>
              <p className="text-sm text-gray-500">Track member contributions effortlessly</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Redo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <MonthPicker
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn-secondary text-sm">
              Export CSV
            </button>
            <button onClick={() => setIsMemberModalOpen(true)} className="btn-primary text-sm">
              + Add Member
            </button>
          </div>
        </div>

        <Totalizer members={members} transactions={transactions} monthYear={monthYear} />

        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">{formatMonthYear(selectedYear, selectedMonth)}</h2>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No members yet</h3>
              <p className="text-gray-500 mb-4">Add your first member to start tracking contributions</p>
              <button onClick={() => setIsMemberModalOpen(true)} className="btn-primary">
                + Add Member
              </button>
            </div>
          ) : (
            <div>
              {members.map((member) => {
                const memberTransactions = transactions.filter(
                  (t) => t.memberId === member.id && t.monthYear === monthYear
                );
                const previousMonthSurplus = calculatePreviousMonthSurplus(transactions, member, selectedYear, selectedMonth);
                const statusInfo = calculateMemberStatus(transactions, member, monthYear, previousMonthSurplus);
                return (
                  <MemberRow
                    key={member.id}
                    member={member}
                    statusInfo={statusInfo}
                    transactions={memberTransactions}
                    onAddTransaction={() => handleAddTransaction(member)}
                    onEdit={() => handleEditMember(member)}
                    onDelete={() => handleDeleteMember(member.id)}
                    highlightAmount={highlightAmount}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

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
        }}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
