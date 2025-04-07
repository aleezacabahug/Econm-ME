"use strict";

const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDesEl = document.querySelector(".expense_input");
const expenseAmountEl = document.querySelector(".expense_amount");
const expenseCategoryEl = document.querySelector("#expense-category");
const tblRecordEl = document.querySelector(".tbl_data");
const budgetCardEl = document.querySelector(".budget_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");
const totalBudgetEl = document.querySelector("#total-budget");
const totalExpensesEl = document.querySelector("#total-expenses");
const remainingBalanceEl = document.querySelector("#remaining-balance");
const spendingListEl = document.querySelector("#spending-list");
const chartCanvasEl = document.getElementById("spending-chart");

let spendingChart;
let itemList = [];
let itemId = 0;
let chartType = 'pie';

function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(itemList));
    localStorage.setItem('budget', budgetCardEl.textContent);
}

function loadFromLocalStorage() {
    itemList = JSON.parse(localStorage.getItem('expenses')) || [];
    itemId = itemList.length > 0 ? Math.max(...itemList.map(item => item.id)) + 1 : 0;
    budgetCardEl.textContent = localStorage.getItem('budget') || '0';
    itemList.forEach(addExpenses);
    showBalance();
    updateChart();
    updateBudgetDetails();
}

function btnEvents() {
    document.querySelector("#btn_budget").addEventListener("click", (e) => {
        e.preventDefault();
        budgetFun();
    });

    document.querySelector("#btn_expense").addEventListener("click", (e) => {
        e.preventDefault();
        expensesFun();
    });
}

function expensesFun() {
    const expensesDescValue = expenseDesEl.value;
    const expenseAmountValue = expenseAmountEl.value;
    const expenseCategoryValue = expenseCategoryEl.value;

    if (!expensesDescValue || !expenseAmountValue || isNaN(parseInt(expenseAmountValue)) || parseInt(expenseAmountValue) <= 0) {
        errorMessage("Please enter valid description and amount greater than 0");
        return;
    }

    const amount = parseInt(expenseAmountValue);
    const expenses = { id: itemId++, title: expensesDescValue, amount, category: expenseCategoryValue };
    itemList.push(expenses);
    addExpenses(expenses);
    expenseDesEl.value = "";
    expenseAmountEl.value = "";
    expenseCategoryEl.value = "Technology";
    showBalance();
    updateChart();
    updateBudgetDetails();
    saveToLocalStorage();
}

function addExpenses(expensesPara) {
    const html = `
    <div class="tbl-row" data-id="${expensesPara.id}">
        <div class="tbl-cell">${expensesPara.id}</div>
        <div class="tbl-cell">${expensesPara.title}</div>
        <div class="tbl-cell amount">$${expensesPara.amount}</div>
        <div class="tbl-cell category ${expensesPara.category.toLowerCase()}">${expensesPara.category}</div>
        <div class="tbl-cell actions">
            <button type="button" class="btn-icon btn-edit" title="Edit">
                <i class='bx bx-edit-alt'></i>
            </button>
            <button type="button" class="btn-icon btn-delete" title="Delete">
                <i class='bx bx-trash'></i>
            </button>
        </div>
    </div>`;
    tblRecordEl.insertAdjacentHTML("beforeend", html);
    updateSpendingList();

    const rowElement = tblRecordEl.lastElementChild;
    const btnEdit = rowElement.querySelector(".btn-edit");
    const btnDel = rowElement.querySelector(".btn-delete");

    btnEdit.addEventListener("click", (e) => {
        const element = e.target.closest(".tbl-row");
        const id = element.dataset.id;
        const expense = itemList.find(item => item.id == id);
        
        expenseDesEl.value = expense.title;
        expenseAmountEl.value = expense.amount;
        expenseCategoryEl.value = expense.category;
        
        itemList = itemList.filter(item => item.id != id);
        element.remove();
        
        updateSpendingList();
        showBalance();
        updateChart();
        updateBudgetDetails();
        saveToLocalStorage();
    });

    btnDel.addEventListener("click", (e) => {
        const element = e.target.closest(".tbl-row");
        const id = element.dataset.id;
        itemList = itemList.filter(item => item.id != id);
        element.remove();
        updateSpendingList();
        showBalance();
        updateChart();
        updateBudgetDetails();
        saveToLocalStorage();
    });
}

function budgetFun() {
    const budgetValue = budgetInputEl.value;

    if (!budgetValue || isNaN(parseInt(budgetValue)) || parseInt(budgetValue) < 0) {
        errorMessage("Please enter a valid positive budget amount");
        return;
    }

    budgetCardEl.textContent = parseInt(budgetValue);
    budgetInputEl.value = "";
    showBalance();
    updateChart();
    updateBudgetDetails();
    saveToLocalStorage();
}

function showBalance() {
    const expenses = totalExpenses();
    // const budget = parseInt(budgetCardEl.textContent) || 0;
    const budget = parseFloat(document.querySelector('.budget_card').textContent) || 0;
    const total = budget - expenses;
    
    // balanceCardEl.textContent = total;
    // expensesCardEl.textContent = expenses;
    balanceCardEl.textContent = total.toFixed(2);
    expensesCardEl.textContent = expenses.toFixed(2);
    totalBudgetEl.textContent = budget;
    totalExpensesEl.textContent = expenses;
    // remainingBalanceEl.textContent = total;
    remainingBalanceEl.textContent = total.toFixed(2);
}

function totalExpenses() {
    return itemList.length > 0 ? itemList.reduce((acc, curr) => acc + curr.amount, 0) : 0;
}

function updateSpendingList() {
    spendingListEl.innerHTML = "";
    if (itemList.length === 0) {
        spendingListEl.innerHTML = "<li class='no-expenses'>No expenses recorded yet</li>";
        return;
    }
    
    itemList.forEach(expense => {
        spendingListEl.insertAdjacentHTML("beforeend", `
            <li class="spending-item">
                <span class="spending-title">${expense.title}</span>
                <span class="spending-amount">$${expense.amount}</span>
                <span class="spending-category ${expense.category.toLowerCase()}">${expense.category}</span>
            </li>
        `);
    });
}

function updateBudgetDetails() {
    const expenses = totalExpenses();
    const budget = parseInt(budgetCardEl.textContent) || 0;
    const total = budget - expenses;
    
    document.getElementById('chart-total-budget').textContent = `$${budget}`;
    document.getElementById('chart-total-spent').textContent = `$${expenses}`;
    document.getElementById('chart-remaining').textContent = `$${total}`;
}

function updateChart() {
    const budget = parseInt(budgetCardEl.textContent) || 0;
    const expenses = totalExpenses();
    const balance = budget - expenses > 0 ? budget - expenses : 0;

    // Aggregate expenses by category
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
        'rgba(201, 203, 207, 0.7)'  // Other
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

function errorMessage(message) {
    errorMesgEl.innerHTML = `<p>${message}</p>`;
    errorMesgEl.classList.add("error");
    setTimeout(() => errorMesgEl.classList.remove("error"), 2500);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    btnEvents();
    initIncomeTracking();
});

document.querySelector('.mode-switch').addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const icon = document.querySelector('.mode-switch i');
    icon.classList.toggle("bx-moon");
    icon.classList.toggle("bx-sun");
});

document.getElementById('clear-all').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all expenses?')) {
        itemList = [];
        tblRecordEl.innerHTML = '';
        spendingListEl.innerHTML = '';
        showBalance();
        updateChart();
        saveToLocalStorage();
    }
});

document.getElementById('export-data').addEventListener('click', () => {
    const data = {
        budget: budgetCardEl.textContent,
        expenses: itemList
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

document.getElementById('toggle-chart-type').addEventListener('click', () => {
    chartType = chartType === 'pie' ? 'bar' : 'pie';
    document.getElementById('toggle-chart-type').textContent = 
        chartType === 'pie' ? 'Switch to Bar' : 'Switch to Pie';
    updateChart();
});

document.getElementById('download-chart').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'econme-spending-chart.png';
    link.href = document.getElementById('spending-chart').toDataURL('image/png');
    link.click();
});

document.getElementById('reset-budget').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your budget?")) {
        budgetCardEl.textContent = "0";
        showBalance();
        updateChart();
        updateBudgetDetails();
        saveToLocalStorage();
    }
});


