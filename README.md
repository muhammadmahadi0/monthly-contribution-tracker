# Cumulative Ledger System

A React-based financial ledger application for tracking member contributions with running balances, advanced payment carry-over, and comprehensive transaction management.

## Features

### Core Functionality

- **Running Balance Calculation**: Automatically calculates total due based on months elapsed since a member's join date
  - Total Due = (Fixed Monthly Amount) × (Number of months since joining)
  - Total Paid = Sum of all transaction entries for that member
  - Current Balance = Total Paid - Total Due

- **Advanced Carry-over**: When a member pays more than their monthly amount, the surplus automatically applies to future months
  - Shows "Paid (Advanced)" status when balance exceeds current month's commitment
  - Surplus carries forward until exhausted

- **Status Labels**:
  - **Paid**: Balance ≥ 0 and current month's commitment met
  - **Due**: Balance is negative (shows exact deficit)
  - **Advanced**: Balance is positive and exceeds current month (shows surplus)

### Member Management

- **Join Date Tracking**: Each member has a join date that determines their payment obligations
- **Fixed Monthly Amount**: Configurable per-member contribution amount
- **Edit/Delete Members**: Full CRUD operations with confirmation dialogs

### Transaction Management

- **Transaction History**: Full ledger view showing every payment
- **Editable Transactions**: Modify amount, date, and description of any entry
- **Transaction Log**: Recent activity feed across all members
- **Delete Transactions**: Remove individual entries with confirmation

### Dashboard & Reporting

- **Global Dashboard**: Shows Total Group Balance, Total Collected, and Total Expected
- **Member Balance Display**: Clear balance shown next to each member name
- **CSV Export**: Export all transactions with running balances

### User Experience

- **Undo/Redo**: Full history support for all ledger edits and member changes
- **LocalStorage Persistence**: All data automatically synced to browser storage
- **Month Selection**: View ledger state at any point in time
- **Responsive Design**: Works on desktop and mobile devices

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- LocalStorage (persistence)

## Usage

### Adding a Member

1. Click "Add Member" button
2. Enter member name
3. Set fixed monthly contribution amount
4. Select join date (determines payment calculation)
5. Click "Add Member"

### Recording a Payment

1. Find the member in the list
2. Click "+ Add" button next to their name
3. Enter payment amount
4. Select payment date
5. Optionally add a description
6. Click "Add Transaction"

### Viewing Ledger

- **Dashboard Tab**: Shows overview with member balances and recent activity
- **Full Ledger Tab**: Complete transaction table with sorting and filtering

### Understanding Status

- **Paid**: Member has paid all dues up to the selected month
- **Due**: Member owes money (shown in red with deficit amount)
- **Advanced**: Member has surplus that covers future months (shown in purple)

## Project Structure

```
src/
├── App.jsx              # Main application component
├── main.jsx             # React entry point
├── index.css            # Tailwind CSS imports
└── hooks/
    └── useUndoRedo.js   # Undo/Redo state management hook
```

## Keyboard Shortcuts

- **Ctrl+Z**: Undo last action
- **Ctrl+Y**: Redo last undone action

## Data Model

### Member
```javascript
{
  id: string,
  name: string,
  fixedAmount: number,     // Monthly contribution amount
  joinDate: string        // ISO date string (YYYY-MM-DD)
}
```

### Transaction
```javascript
{
  id: string,
  memberId: string,
  amount: number,
  date: string,           // ISO date string (YYYY-MM-DD)
  description: string     // Optional notes
}
```

## License

MIT