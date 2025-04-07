"use strict";

const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDesEl = document.querySelector(".expense_input");
const expenseAmountEl = document.querySelector(".expense_amount");
const expenseCategoryEl = document.querySelector("#expense-category"); // New selector
const tblRecordEl = document.querySelector(".tbl_data");
const budgetCardEl = document.querySelector(".budget_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");
const totalBudgetEl = document.querySelector("#total-budget");
const totalExpensesEl = document.querySelector("#total-expenses");
const remainingBalanceEl = document.querySelector("#remaining-balance");
const spendingListEl = document.querySelector("#spending-list");

let spendingChart;
let itemList = [];
let itemId = 0;

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
    updatePieChart();
}

function btnEvents() {
    const btnBudgetCal = document.querySelector("#btn_budget");
    const btnExpensesCal = document.querySelector("#btn_expense");

    btnBudgetCal.addEventListener("click", (e) => {
        e.preventDefault();
        budgetFun();
    });

    btnExpensesCal.addEventListener("click", (e) => {
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
    expenseCategoryEl.value = "Technology"; // Reset to default (optional)
    showBalance();
    updatePieChart();
    saveToLocalStorage();
}

function addExpenses(expensesPara) {
    const html = `<ul class="tbl_tr_content">
                <li data-id="${expensesPara.id}">${expensesPara.id}</li>
                <li>${expensesPara.title}</li>
                <li><span>$</span>${expensesPara.amount}</li>
                <li>${expensesPara.category}</li> <!-- Show category in table -->
                <li>
                    <button type="button" class="btn_edit">Edit</button>
                    <button type="button" class="btn_delete">Delete</button>
                </li>
            </ul>`;
    tblRecordEl.insertAdjacentHTML("beforeend", html);
    updateSpendingList();

    const btnEdit = document.querySelectorAll(".btn_edit");
    const btnDel = document.querySelectorAll(".btn_delete");

    btnEdit.forEach(btn => btn.addEventListener("click", (e) => {
        const element = e.target.parentElement.parentElement;
        const id = element.firstElementChild.dataset.id;
        element.remove();
        const expense = itemList.find(item => item.id == id);
        expenseDesEl.value = expense.title;
        expenseAmountEl.value = expense.amount;
        expenseCategoryEl.value = expense.category; // Restore category
        itemList = itemList.filter(item => item.id != id);
        updateSpendingList();
        showBalance();
        updatePieChart();
        saveToLocalStorage();
    }));

    btnDel.forEach(btn => btn.addEventListener("click", (e) => {
        const element = e.target.parentElement.parentElement;
        const id = element.firstElementChild.dataset.id;
        element.remove();
        itemList = itemList.filter(item => item.id != id);
        updateSpendingList();
        showBalance();
        updatePieChart();
        saveToLocalStorage();
    }));
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
    updatePieChart();
    saveToLocalStorage();
}

function showBalance() {
    const expenses = totalExpenses();
    const budget = parseInt(budgetCardEl.textContent) || 0;
    const total = budget - expenses;
    balanceCardEl.textContent = total;
    expensesCardEl.textContent = expenses;
    totalBudgetEl.textContent = `$${budget}`;
    totalExpensesEl.textContent = `$${expenses}`;
    remainingBalanceEl.textContent = `$${total}`;
}

function totalExpenses() {
    return itemList.length > 0 ? itemList.reduce((acc, curr) => acc + curr.amount, 0) : 0;
}

function updateSpendingList() {
    spendingListEl.innerHTML = "";
    itemList.forEach(expense => {
        spendingListEl.insertAdjacentHTML("beforeend", `<li>${expense.title}: $${expense.amount} (${expense.category})</li>`);
    });
}

function updatePieChart() {
    const budget = parseInt(budgetCardEl.textContent) || 0;
    const expenses = totalExpenses();
    const balance = budget - expenses > 0 ? budget - expenses : 0;

    // Aggregate expenses by category
    const categoryTotals = {};
    itemList.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = ['Remaining', ...Object.keys(categoryTotals)];
    const data = [balance, ...Object.values(categoryTotals)];
    const colors = [
        'rgba(54, 162, 235, 0.7)', // Remaining
        'rgba(255, 99, 132, 0.7)', // Technology
        'rgba(75, 192, 192, 0.7)', // Groceries
        'rgba(255, 206, 86, 0.7)', // Entertainment
        'rgba(153, 102, 255, 0.7)', // Bills
        'rgba(201, 203, 207, 0.7)' // Other
    ].slice(0, labels.length); // Match number of segments
    const borderColors = colors.map(color => color.replace('0.7', '1'));

    const ctx = document.getElementById('spending-chart').getContext('2d');

    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
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
                    text: 'Spending by Category'
                }
            }
        }
    });
}

function errorMessage(message) {
    errorMesgEl.innerHTML = `<p>${message}</p>`;
    errorMesgEl.classList.add("error");
    setTimeout(() => errorMesgEl.classList.remove("error"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    btnEvents();
});