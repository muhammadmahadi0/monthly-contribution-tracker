import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'monthly-contribution-tracker';

// Validate and sanitize state
function validateState(state) {
  return {
    members: Array.isArray(state.members) ? state.members : [],
    transactions: Array.isArray(state.transactions) ? state.transactions : [],
  };
}

export function useUndoRedo(initialState) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : initialState;
      console.log('[useUndoRedo] Loading from localStorage:', parsed);
      return validateState(parsed);
    } catch (error) {
      console.error('[useUndoRedo] Failed to parse stored data:', error);
      return initialState;
    }
  });

  const [history, setHistory] = useState([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [state]);

  const setStateWithHistory = useCallback((newState) => {
    setState((current) => {
      const nextState = typeof newState === 'function' ? newState(current) : newState;
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(nextState);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
      return nextState;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    state,
    setState: setStateWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getMonthYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return { year, month };
}

export function formatMonthYear(year, month) {
  const date = new Date(year, month);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function parseMonthYearString(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getPreviousMonthYear(year, month) {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

export function calculateMemberStatus(transactions, member, monthYear, previousMonthSurplus = 0) {
  const memberTransactions = transactions.filter(
    (t) => t.memberId === member.id && t.monthYear === monthYear
  );
  const totalPaid = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
  const fixedAmount = member.fixedAmount;

  const effectiveFixed = fixedAmount - previousMonthSurplus;
  const balanceAfterPreviousSurplus = totalPaid - previousMonthSurplus;

  if (balanceAfterPreviousSurplus === effectiveFixed) {
    return { status: 'paid', totalPaid, difference: 0, carriedSurplus: 0 };
  } else if (balanceAfterPreviousSurplus < effectiveFixed) {
    return { status: 'due', totalPaid, difference: effectiveFixed - balanceAfterPreviousSurplus, carriedSurplus: 0 };
  } else {
    return { status: 'advanced', totalPaid, difference: balanceAfterPreviousSurplus - effectiveFixed, carriedSurplus: previousMonthSurplus };
  }
}

export function calculatePreviousMonthSurplus(transactions, member, year, month) {
  const { year: prevYear, month: prevMonth } = getPreviousMonthYear(year, month);
  const prevMonthYear = parseMonthYearString(prevYear, prevMonth);
  const prevStatus = calculateMemberStatus(transactions, member, prevMonthYear);

  if (prevStatus.status === 'advanced') {
    return prevStatus.difference;
  }
  return 0;
}

export function exportToCSV(members, transactions, monthYear) {
  const rows = [
    ['Member Name', 'Fixed Amount', 'Date', 'Amount', 'Status'],
  ];

  members.forEach((member) => {
    const memberTransactions = transactions.filter(
      (t) => t.memberId === member.id && t.monthYear === monthYear
    );
    const statusInfo = calculateMemberStatus(transactions, member, monthYear);

    if (memberTransactions.length === 0) {
      rows.push([
        member.name,
        member.fixedAmount,
        '-',
        '0',
        statusInfo.status === 'due' ? `Due: ${statusInfo.difference}` : statusInfo.status,
      ]);
    } else {
      memberTransactions.forEach((t, index) => {
        rows.push([
          index === 0 ? member.name : '',
          index === 0 ? member.fixedAmount : '',
          t.date,
          t.amount,
          index === 0 ? (statusInfo.status === 'due' ? `Due: ${statusInfo.difference}` : statusInfo.status) : '',
        ]);
      });
    }
  });

  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `contributions-${monthYear}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
