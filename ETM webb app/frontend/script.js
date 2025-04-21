"use strict";

// ======================
// DOM Elements
// ======================
const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDesEl = document.querySelector(".expense_input");
const expenseAmountEl = document.querySelector(".expense_amount");
const expenseCategoryEl = document.querySelector("#expense-category");
const expenseDateEl = document.querySelector("#expense-date");
const tblRecordEl = document.querySelector(".tbl_data");
const budgetCardEl = document.querySelector(".budget_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");
const totalBudgetEl = document.querySelector("#total-budget");
const totalExpensesEl = document.querySelector("#total-expenses");
const remainingBalanceEl = document.querySelector("#remaining-balance");
const spendingListEl = document.querySelector("#spending-list");
const chartCanvasEl = document.getElementById("spending-chart");
const incomeSourceInput = document.getElementById('income-source');
const incomeAmountInput = document.getElementById('income-amount');
const incomeDateInput = document.getElementById('income-date');
const recentIncomeList = document.getElementById('recent-income-list');
const allIncomeList = document.getElementById('all-income-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const cancelExpenseEditBtn = document.getElementById('cancel-expense-edit');

// ======================
// Global Variables
// ======================
let spendingChart;
let itemList = [];
let incomeList = [];
let chartType = 'pie';
let editingExpenseId = null;
let isAddingExpense = false;
let isEditingIncome = false;
let currentEditIncomeId = null;

// ======================
// Helper Functions
// ======================

// API call with authentication
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// Display error messages
function errorMessage(message) {
    errorMesgEl.innerHTML = `<p>${message}</p>`;
    errorMesgEl.classList.add("error");
    setTimeout(() => errorMesgEl.classList.remove("error"), 2500);
}

// Calculate total expenses
function totalExpenses() {
    return itemList.reduce((acc, curr) => acc + curr.amount, 0);
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Technology': 'bx bx-laptop',
        'Groceries': 'bx bx-shopping-bag',
        'Entertainment': 'bx bx-movie-play',
        'Bills': 'bx bx-receipt',
        'Food': 'bx bx-food-menu',
        'Travel': 'bx bx-plane',
        'Health': 'bx bx-heart',
        'Shopping': 'bx bx-shopping-cart',
        'Transportation': 'bx bx-car',
        'Education': 'bx bx-book',
        'self-care': 'bx bx-smile',
        'Fitness': 'bx bx-dumbbell',
        'Home': 'bx bx-home',
        'Pets': 'bx bx-paw',
        'Gifts': 'bx bx-gift',
        'Other': 'bx bx-category'
    };
    return icons[category] || 'bx bx-category';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ======================
// Income Functions
// ======================

// Handle budget/income submission
async function budgetFun() {
    const incomeSource = incomeSourceInput.value;
    const budgetValue = incomeAmountInput.value;
    const incomeDate = incomeDateInput.value;

    if (!incomeSource || !budgetValue || isNaN(parseFloat(budgetValue))) {
        errorMessage("Please enter valid income details");
        return;
    }

    try {
        if (isEditingIncome) {
            // Update existing income
            const updatedIncome = await fetchWithAuth(`http://localhost:3000/incomes/${currentEditIncomeId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    source: incomeSource,
                    amount: parseFloat(budgetValue),
                    date: incomeDate
                })
            });
            
            // Update local list
            const index = incomeList.findIndex(item => item._id === currentEditIncomeId);
            if (index !== -1) {
                incomeList[index] = updatedIncome;
            }
            
            // Reset form
            isEditingIncome = false;
            currentEditIncomeId = null;
            document.getElementById('btn_budget').textContent = 'Add Income';
            cancelEditBtn.style.display = 'none';
        } else {
            // Create new income
            const newIncome = await fetchWithAuth('http://localhost:3000/incomes', {
                method: 'POST',
                body: JSON.stringify({
                    source: incomeSource,
                    amount: parseFloat(budgetValue),
                    date: incomeDate
                })
            });
            incomeList.push(newIncome);
        }

        // Clear form
        incomeSourceInput.value = "";
        incomeAmountInput.value = "";
        incomeDateInput.value = new Date().toISOString().split('T')[0];

        // Refresh data
        await updateIncomeHistory();
        updateTotalBudget();
        showBalance();
        updateChart();
        updateBudgetDetails();
    } catch (error) {
        errorMessage(error.message || 'Failed to process income');
    }
}

// Update income history display
async function updateIncomeHistory() {
    try {
        incomeList = await fetchWithAuth('http://localhost:3000/incomes');
        incomeList.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Clear existing lists
        recentIncomeList.innerHTML = '';
        allIncomeList.innerHTML = '';
        
        // Display recent (last 3) incomes
        const recentIncomes = incomeList.slice(0, 3);
        recentIncomes.forEach(income => {
            const date = formatDate(income.date);
            recentIncomeList.insertAdjacentHTML('beforeend', `
                <div class="income-item" data-id="${income._id}">
                    <span class="income-source">${income.source}</span>
                    <span class="income-amount">$${income.amount.toFixed(2)}</span>
                    <span class="income-date">${date}</span>
                    <div class="income-actions">
                        <button class="btn-icon edit-income" title="Edit">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="btn-icon delete-income" title="Delete">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `);
        });
        
        // Display all incomes
        incomeList.forEach(income => {
            const date = formatDate(income.date);
            allIncomeList.insertAdjacentHTML('beforeend', `
                <div class="income-item" data-id="${income._id}">
                    <span class="income-source">${income.source}</span>
                    <span class="income-amount">$${income.amount.toFixed(2)}</span>
                    <span class="income-date">${date}</span>
                    <div class="income-actions">
                        <button class="btn-icon edit-income" title="Edit">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="btn-icon delete-income" title="Delete">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            `);
        });

        // Add event listeners
        document.querySelectorAll('.edit-income').forEach(btn => {
            btn.addEventListener('click', handleEditIncome);
        });
        
        document.querySelectorAll('.delete-income').forEach(btn => {
            btn.addEventListener('click', handleDeleteIncome);
        });
        
    } catch (error) {
        console.error('Error loading income history:', error);
        errorMessage('Failed to load income history');
    }
}

// Handle edit income
function handleEditIncome(e) {
    const incomeItem = e.target.closest('.income-item');
    const incomeId = incomeItem.dataset.id;
    const income = incomeList.find(item => item._id === incomeId);
    
    if (!income) return;

    // Set editing state
    isEditingIncome = true;
    currentEditIncomeId = incomeId;
    
    // Populate form
    incomeSourceInput.value = income.source;
    incomeAmountInput.value = income.amount;
    incomeDateInput.value = income.date ? income.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Update button
    document.getElementById('btn_budget').textContent = 'Update Income';
    cancelEditBtn.style.display = 'inline-block';
    
    // Scroll to form
    document.getElementById('income-form').scrollIntoView({ behavior: 'smooth' });
}

// Handle delete income
async function handleDeleteIncome(e) {
    const incomeItem = e.target.closest('.income-item');
    const incomeId = incomeItem.dataset.id;
    
    if (confirm('Are you sure you want to delete this income record?')) {
        try {
            await fetchWithAuth(`http://localhost:3000/incomes/${incomeId}`, {
                method: 'DELETE'
            });
            
            // Update local list
            incomeList = incomeList.filter(item => item._id !== incomeId);
            
            // Update UI
            incomeItem.remove();
            updateTotalBudget();
            showBalance();
            updateChart();
            updateBudgetDetails();
            
        } catch (error) {
            console.error('Error deleting income:', error);
            errorMessage('Failed to delete income record');
        }
    }
}

// Cancel income edit
function cancelIncomeEdit() {
    isEditingIncome = false;
    currentEditIncomeId = null;
    incomeSourceInput.value = "";
    incomeAmountInput.value = "";
    incomeDateInput.value = new Date().toISOString().split('T')[0];
    document.getElementById('btn_budget').textContent = 'Add Income';
    cancelEditBtn.style.display = 'none';
}

// Update total budget display
function updateTotalBudget() {
    const totalBudget = incomeList.reduce((sum, income) => sum + income.amount, 0);
    budgetCardEl.textContent = totalBudget.toFixed(2);
    totalBudgetEl.textContent = totalBudget.toFixed(2);
}

// ======================
// Expense Functions
// ======================

// ======================
// Transaction Functions
// ======================

// Update recent transactions list
function updateRecentTransactions() {
    spendingListEl.innerHTML = "";

    if (itemList.length === 0) {
        spendingListEl.innerHTML = `
            <li class="no-transactions">
                <i class='bx bx-info-circle'></i>
                <span>No transactions recorded yet</span>
            </li>`;
        return;
    }

    // Sort by most recent first (using date or current date if not set)
    const sortedTransactions = [...itemList].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    // Show only the most recent 5 transactions by default
    const toggleBtn = document.getElementById('toggle-recent-transactions');
    const showAll = toggleBtn && toggleBtn.dataset.showAll === 'true';
    const transactionsToShow = showAll ? sortedTransactions : sortedTransactions.slice(0, 5);
    
    transactionsToShow.forEach(transaction => {
        // Always show date - use current date if not set
        const transactionDate = transaction.date 
            ? formatDate(transaction.date)
            : formatDate(new Date());
            
        spendingListEl.insertAdjacentHTML("beforeend", `
            <li class="transaction-item" data-id="${transaction._id}">
                <div class="transaction-main">
                    <span class="transaction-category ${transaction.category.toLowerCase()}">
                        <i class='${getCategoryIcon(transaction.category)}'></i>
                    </span>
                    <div class="transaction-details">
                        <span class="transaction-title">${transaction.title}</span>
                        <span class="transaction-date">${transactionDate}</span>
                    </div>
                    <span class="transaction-amount">-$${transaction.amount.toFixed(2)}</span>
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon transaction-edit" title="Edit">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-icon transaction-delete" title="Delete">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </li>
        `);
    });

    if (toggleBtn) {
        toggleBtn.textContent = showAll ? 'Show Recent' : 'Show All';
    }

    // Add event listeners
    document.querySelectorAll('.transaction-edit').forEach(btn => {
        btn.addEventListener('click', handleEditTransaction);
    });

    document.querySelectorAll('.transaction-delete').forEach(btn => {
        btn.addEventListener('click', handleDeleteTransaction);
    });
}

// Handle edit transaction
function handleEditTransaction(e) {
    const transactionItem = e.target.closest('.transaction-item');
    const transactionId = transactionItem.dataset.id;
    const transaction = itemList.find(item => item._id === transactionId);

    // SET editingExpenseId
    editingExpenseId = transactionId;

    // Update button text and show cancel button
    document.querySelector("#btn_expense").textContent = "Update Expense";
    cancelExpenseEditBtn.style.display = 'inline-block';

    // Populate the expense form
    expenseDesEl.value = transaction.title;
    expenseAmountEl.value = transaction.amount;
    expenseCategoryEl.value = transaction.category;
    expenseDateEl.value = transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0];

    // Focus and scroll to form
    expenseDesEl.focus();
    document.querySelector('.ur_expenses').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
    });
}

// Function to cancel expense editing
function cancelExpenseEdit() {
    // Clear form
    expenseDesEl.value = "";
    expenseAmountEl.value = "";
    expenseCategoryEl.value = "Technology";
    expenseDateEl.value = "";
    
    // Reset editing state
    editingExpenseId = null;
    document.querySelector("#btn_expense").textContent = "Add Expense";
    cancelExpenseEditBtn.style.display = 'none';
}

// Handle delete transaction
async function handleDeleteTransaction(e) {
    const transactionItem = e.target.closest('.transaction-item');
    const transactionId = transactionItem.dataset.id;

    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            await fetchWithAuth(`http://localhost:3000/expenses/${transactionId}`, {
                method: 'DELETE'
            });

            // Update local list and UI
            itemList = itemList.filter(item => item._id !== transactionId);
            transactionItem.remove();
            
            showBalance();
            updateChart();
            updateBudgetDetails();

            if (itemList.length === 0) {
                updateRecentTransactions();
            }
        } catch (error) {
            errorMessage(error.message || 'Failed to delete transaction');
        }
    }
}

// Add expense to table
function addExpenses(expense) {
    const expenseDate = expense.date ? formatDate(expense.date) : 'Not set';
    
    const html = `
    <div class="tbl-row" data-id="${expense._id}" data-date="${expense.date || ''}">
        <div class="tbl-cell">
            <span class="transaction-category ${expense.category.toLowerCase()}">
                <i class='${getCategoryIcon(expense.category)}'></i>
            </span>
        </div>
        <div class="tbl-cell">${expense.title}</div>
        <div class="tbl-cell date-cell">${expenseDate}</div>
        <div class="tbl-cell amount">$${expense.amount}</div>
        <div class="tbl-cell actions">
            <button type="button" class="btn-icon btn-edit" title="Edit">
                <i class='bx bx-edit-alt'></i>
            </button>
            <button type="button" class="btn-icon btn-delete" title="Delete">
                <i class='bx bx-trash'></i>
            </button>
        </div>
    </div>`;
    
    // Insert at correct position to maintain sort
    const rows = Array.from(tblRecordEl.querySelectorAll('.tbl-row'));
    const newDate = new Date(expense.date || 0);
    
    let insertBefore = null;
    for (const row of rows) {
        const rowDate = new Date(row.dataset.date || 0);
        if (newDate > rowDate) {
            insertBefore = row;
            break;
        }
    }
    
    if (insertBefore) {
        insertBefore.insertAdjacentHTML('beforebegin', html);
    } else {
        tblRecordEl.insertAdjacentHTML('beforeend', html);
    }

    // Add event listeners to the new row
    const rowElement = insertBefore ? insertBefore.previousElementSibling : tblRecordEl.lastElementChild;
    setupExpenseRowEvents(rowElement);
}

// Setup event listeners for a row
function setupExpenseRowEvents(rowElement) {
    const btnEdit = rowElement.querySelector(".btn-edit");
    const btnDel = rowElement.querySelector(".btn-delete");

    btnEdit.addEventListener("click", (e) => {
        const element = e.target.closest(".tbl-row");
        const id = element.dataset.id;
        const expense = itemList.find(item => item._id === id);
        
        // Set editing state
        editingExpenseId = id;
        document.querySelector("#btn_expense").textContent = "Update Expense";

        cancelExpenseEditBtn.style.display = 'inline-block';
        
        // Populate form
        expenseDesEl.value = expense.title;
        expenseAmountEl.value = expense.amount;
        expenseCategoryEl.value = expense.category;
        expenseDateEl.value = expense.date ? expense.date.split('T')[0] : '';
        
        // Scroll to form
        document.querySelector('.ur_expenses').scrollIntoView({ behavior: 'smooth' });
    });

    btnDel.addEventListener("click", async (e) => {
        const element = e.target.closest(".tbl-row");
        const id = element.dataset.id;
        
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                await fetchWithAuth(`http://localhost:3000/expenses/${id}`, {
                    method: 'DELETE'
                });
                
                // Clear editing state if deleting the item being edited
                if (editingExpenseId === id) {
                    editingExpenseId = null;
                    document.querySelector("#btn_expense").textContent = "Add Expense";
                }
                
                itemList = itemList.filter(item => item._id !== id);
                element.remove();
                
                // Refresh display
                refreshExpensesDisplay();
            } catch (error) {
                errorMessage(error.message || 'Failed to delete expense');
            }
        }
    });
}

// Handle expense submission
async function expensesFun() {
    // Prevent duplicate submissions
    if (isAddingExpense) return;
    isAddingExpense = true;

    const expensesDescValue = expenseDesEl.value;
    const expenseAmountValue = expenseAmountEl.value;
    const expenseCategoryValue = expenseCategoryEl.value;
    const expenseDateValue = expenseDateEl.value;
    const expenseBtn = document.querySelector("#btn_expense");

    if (!expensesDescValue || !expenseAmountValue || isNaN(parseInt(expenseAmountValue))) {
        errorMessage("Please enter valid description and amount");
        isAddingExpense = false;
        return;
    }

    try {
        const amount = parseInt(expenseAmountValue);
        let newExpense;

        if (editingExpenseId) {
            // UPDATE existing expense
            newExpense = await fetchWithAuth(`http://localhost:3000/expenses/${editingExpenseId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: expensesDescValue,
                    amount,
                    category: expenseCategoryValue,
                    date: expenseDateValue || new Date().toISOString() // Use the selected date
                })
            });

            // Update local list
            const index = itemList.findIndex(item => item._id === editingExpenseId);
            if (index !== -1) {
                itemList[index] = newExpense;
            }

            // Reset editing state
            editingExpenseId = null;
            expenseBtn.textContent = "Add Expense";
            cancelExpenseEditBtn.style.display = 'none';
        } else {
            // CREATE new expense
            newExpense = await fetchWithAuth('http://localhost:3000/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    title: expensesDescValue,
                    amount,
                    category: expenseCategoryValue,
                    date: expenseDateValue || new Date().toISOString() // Use the selected date
                })
            });
            itemList.push(newExpense);
        }
        // Clear form and reset state
        clearExpenseForm();
        
        // Refresh UI with proper sorting
        refreshExpensesDisplay();

    } catch (error) {
        errorMessage(error.message || 'Failed to process expense');
    } finally {
        isAddingExpense = false;
    }
}

function clearExpenseForm() {
    expenseDesEl.value = "";
    expenseAmountEl.value = "";
    expenseCategoryEl.value = "Technology";
    expenseDateEl.value = "";
    editingExpenseId = null;
    document.querySelector("#btn_expense").textContent = "Add Expense";
}

function refreshExpensesDisplay() {
    // Sort by date (newest first)
    itemList.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA; // Newest first
    });

    // Clear and rebuild table to ensure proper order
    tblRecordEl.innerHTML = '';
    itemList.forEach((expense, idx) => {
        // Use the sorted index
        addExpenses(expense, idx);
    });
    
    // Reset the toggle button state
    const toggleBtn = document.getElementById('toggle-budget-details');
    if (toggleBtn) {
        toggleBtn.dataset.state = 'recent';
        toggleBtn.textContent = 'Show Details';
        // Apply initial visibility
        const rows = tblRecordEl.querySelectorAll('.tbl-row');
        rows.forEach((row, index) => {
            row.style.display = index < 3 ? 'flex' : 'none';
        });
    }

    // Refresh table
    tblRecordEl.innerHTML = '';
    itemList.forEach((expense, idx) => addExpenses(expense, idx));
    
    // Update other UI elements
    updateRecentTransactions();
    showBalance();
    updateChart();
    updateBudgetDetails();
}

// ======================
// Balance & Chart Functions
// ======================

// Update balance display
function showBalance() {
    const expenses = totalExpenses();
    const budget = parseFloat(budgetCardEl.textContent) || 0;
    const total = budget - expenses;
    
    balanceCardEl.textContent = total.toFixed(2);
    expensesCardEl.textContent = expenses.toFixed(2);
    totalBudgetEl.textContent = budget.toFixed(2);
    totalExpensesEl.textContent = expenses.toFixed(2);
    remainingBalanceEl.textContent = total.toFixed(2);
}

// Update budget details
function updateBudgetDetails() {
    const expenses = totalExpenses();
    const budget = parseFloat(budgetCardEl.textContent) || 0;
    const total = budget - expenses;
    
    document.getElementById('chart-total-budget').textContent = `$${budget.toFixed(2)}`;
    document.getElementById('chart-total-spent').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('chart-remaining').textContent = `$${total.toFixed(2)}`;
}

// Update chart
function updateChart() {
    const budget = parseFloat(budgetCardEl.textContent) || 0;
    const expenses = totalExpenses();
    const balance = budget - expenses > 0 ? budget - expenses : 0;

    const categoryTotals = {};
    itemList.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals).length > 0 ? 
        [...Object.keys(categoryTotals)] : ['No Expenses'];
    const data = Object.values(categoryTotals).length > 0 ? 
        [...Object.values(categoryTotals)] : [1];
    const colors = [
        'rgba(255, 99, 132, 0.7)', // Technology
        'rgba(75, 192, 192, 0.7)', // Groceries
        'rgba(255, 206, 86, 0.7)', // Entertainment
        'rgba(153, 102, 255, 0.7)', // Bills
        'rgba(201, 203, 207, 0.7)',  // Other
        'rgba(3, 252, 236, 0.7)', // Travel
        'rgba(172, 3, 147, 0.54)', // Health
        'rgba(36, 89, 89, 0.7)', // Home
        'rgba(201, 252, 150, 0.7)', // Transportation
        'rgba(37, 23, 147, 0.7)', // Education
        'rgba(251, 111, 167, 0.7)'  // Clothing
        
    ].slice(0, labels.length);
    const borderColors = colors.map(color => color.replace('0.7', '1'));

    const ctx = document.getElementById('spending-chart').getContext('2d');

    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount Spent',
                data: data,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 20,
                        padding: 10
                    }
                },
                title: {
                    display: true,
                    text: chartType === 'pie' ? 'Spending by Category' : 'Category Breakdown',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            },
            scales: chartType === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            } : undefined
        }
    });
}

// ======================
// UI Toggle Functions
// ======================

// Toggle income history view
function setupIncomeToggle() {
    const toggleBtn = document.getElementById('toggle-income-history');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const recentIncome = document.querySelector('.recent-income');
        const allIncome = document.querySelector('.all-income');
        
        if (recentIncome && allIncome) {
            const isRecentVisible = recentIncome.style.display !== 'none';
            recentIncome.style.display = isRecentVisible ? 'none' : 'block';
            allIncome.style.display = isRecentVisible ? 'block' : 'none';
            toggleBtn.textContent = isRecentVisible ? 'Show Recent' : 'Show All';
        }
    });
}

// Toggle budget details view
function setupBudgetToggle() {
    const toggleBtn = document.getElementById('toggle-budget-details');
    const tblData = document.querySelector('.tbl_data');
    if (!toggleBtn || !tblData) return;

    // Always sort by date (newest first) before showing/hiding
    const sortAndDisplayRows = () => {
        // Get all rows and convert to array
        const rows = Array.from(tblData.querySelectorAll('.tbl-row'));
        
        // Sort rows by date (newest first)
        rows.sort((a, b) => {
            const dateA = new Date(a.querySelector('.tbl-cell:nth-child(3)').textContent || 0);
            const dateB = new Date(b.querySelector('.tbl-cell:nth-child(3)').textContent || 0);
            return dateB - dateA;
        });

        // Re-append rows in sorted order
        rows.forEach(row => tblData.appendChild(row));
        
        // Now apply show/hide logic
        const showAll = toggleBtn.dataset.state === 'all';
        rows.forEach((row, index) => {
            row.style.display = (index < 3 || showAll) ? 'flex' : 'none';
        });
    };

    toggleBtn.addEventListener('click', () => {
        const currentlyShowingAll = toggleBtn.dataset.state === 'all';
        toggleBtn.dataset.state = currentlyShowingAll ? 'recent' : 'all';
        toggleBtn.textContent = currentlyShowingAll ? 'Show Details' : 'Hide Details';
        
        // Apply sorting before toggling visibility
        sortAndDisplayRows();
    });

    // Initial display (show recent 3, sorted)
    toggleBtn.dataset.state = 'recent';
    sortAndDisplayRows();
}

// Toggle between showing recent and all transactions
function setupTransactionsToggle() {
    const toggleBtn = document.getElementById('toggle-recent-transactions');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const showingAll = toggleBtn.dataset.showAll === 'true';
        toggleBtn.dataset.showAll = !showingAll;
        updateRecentTransactions();
    });
}

// ======================
// Initialization Functions
// ======================

// Load all data from server
async function loadFromServer() {
    try {
        // Load expenses
        const expenses = await fetchWithAuth('http://localhost:3000/expenses');
        itemList = expenses;
        
        // Load incomes and calculate total budget
        incomeList = await fetchWithAuth('http://localhost:3000/incomes');
        const totalBudget = incomeList.reduce((sum, income) => sum + income.amount, 0);
        budgetCardEl.textContent = totalBudget.toFixed(2);
        
        // Update UI
        tblRecordEl.innerHTML = '';
        itemList.forEach((expense, index) => addExpenses(expense, index));
        showBalance();
        updateChart();
        updateBudgetDetails();
        updateRecentTransactions();
        await updateIncomeHistory();
    } catch (error) {
        console.error('Error loading data:', error);
        errorMessage(error.message || 'Failed to load data');
    }
}

// Set up button events
function btnEvents() {
    document.querySelector("#btn_budget").addEventListener("click", (e) => {
        e.preventDefault();
        budgetFun();
    });

    document.querySelector("#btn_expense").addEventListener("click", (e) => {
        e.preventDefault();
        expensesFun();
    });

    // Cancel edit button
    cancelEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cancelIncomeEdit();
    });

    // Cancel expense edit button
    cancelExpenseEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cancelExpenseEdit();
    });

    // Dark mode toggle
    document.querySelector('.mode-switch').addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const icon = document.querySelector('.mode-switch i');
        icon.classList.toggle("bx-moon");
        icon.classList.toggle("bx-sun");
    });

    // Clear all incomes button
    document.getElementById('clear-all-incomes').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to clear all income records? This cannot be undone.')) {
            return;
        }

        try {
            // Clear incomes on the server
            await fetchWithAuth('http://localhost:3000/incomes/clear', {
                method: 'DELETE'
            });

            // Clear local income list
            incomeList = [];
            
            // Update UI
            recentIncomeList.innerHTML = '<p class="no-income">No income recorded yet</p>';
            allIncomeList.innerHTML = '<p class="no-income">No income recorded yet</p>';
            
            // Update totals and charts
            updateTotalBudget();
            showBalance();
            updateChart();
            updateBudgetDetails();

            // Show success message
            errorMessage('All income records cleared successfully');
            
        } catch (error) {
            console.error('Error clearing incomes:', error);
            errorMessage(error.message || 'Failed to clear income records');
        }
    });

    // Clear all expenses
    document.getElementById('clear-all').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all expenses?')) {
            try {
                await fetchWithAuth('http://localhost:3000/expenses/clear', {
                    method: 'DELETE'
                });
                
                itemList = [];
                tblRecordEl.innerHTML = '';
                spendingListEl.innerHTML = '';
                showBalance();
                updateChart();
            } catch (error) {
                errorMessage(error.message || 'Failed to clear expenses');
            }
        }
    });

    // Export data
    document.getElementById('export-data').addEventListener('click', () => {
        const data = {
            budget: budgetCardEl.textContent,
            expenses: itemList,
            incomes: incomeList
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `econme-data-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Toggle chart type
    document.getElementById('toggle-chart-type').addEventListener('click', () => {
        chartType = chartType === 'pie' ? 'bar' : 'pie';
        document.getElementById('toggle-chart-type').textContent = 
            chartType === 'pie' ? 'Switch to Bar' : 'Switch to Pie';
        updateChart();
    });

    // Download chart
    document.getElementById('download-chart').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'econme-spending-chart.png';
        link.href = document.getElementById('spending-chart').toDataURL('image/png');
        link.click();
    });

    // Reset budget
    document.getElementById('reset-budget').addEventListener('click', () => {
        if (confirm("Are you sure you want to reset your budget?")) {
            budgetCardEl.textContent = "0";
            showBalance();
            updateChart();
            updateBudgetDetails();
        }
    });

    // Profile navigation
    const profileElement = document.querySelector('.top-bar-right .profile');
    if (profileElement) {
        profileElement.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
}

// Initialize all app features
function initializeAppFeatures() {
    setupIncomeToggle();
    setupBudgetToggle();
    setupTransactionsToggle();
}

// ======================
// Main Initialization
// ======================
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set default date for income form
    incomeDateInput.value = new Date().toISOString().split('T')[0];

    // Make sure cancel button is hidden initially
    cancelExpenseEditBtn.style.display = 'none';

    await loadFromServer();
    btnEvents();
    initializeAppFeatures();
});

// Toggle sidebar
document.querySelector('.hamburger-btn').addEventListener('click', function() {
    document.querySelector('.side-bar').classList.toggle('active');
    document.querySelector('.contents').classList.toggle('sidebar-collapsed');
});

// Make navbar sticky on scroll
window.addEventListener('scroll', function() {
    const topBar = document.querySelector('.top-bar');
    if (window.scrollY > 0) {
        topBar.classList.add('sticky');
    } else {
        topBar.classList.remove('sticky');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', function() {
        document.querySelector('.side-bar').classList.remove('active');
        document.querySelector('.contents').classList.remove('sidebar-collapsed');
        overlay.style.display = 'none';
    });
    
    // Update overlay visibility when toggling sidebar
    document.querySelector('.hamburger-btn').addEventListener('click', function() {
        if (document.querySelector('.side-bar').classList.contains('active')) {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    });
});
