"use strict";

const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDesEl = document.querySelector(".expense_input");
const expenseAmountEl = document.querySelector(".expense_amount");
const tblRecordEl = document.querySelector(".tbl_data");
const budgetCardEl = document.querySelector(".budget_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");
const totalBudgetEl = document.querySelector("#total-budget");
const totalExpensesEl = document.querySelector("#total-expenses");
const remainingBalanceEl = document.querySelector("#remaining-balance");
const spendingListEl = document.querySelector("#spending-list");

let itemList = [];
let itemId = 0;

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(itemList));
    localStorage.setItem('budget', budgetCardEl.textContent);
}

// Load from localStorage
function loadFromLocalStorage() {
    itemList = JSON.parse(localStorage.getItem('expenses')) || [];
    itemId = itemList.length > 0 ? Math.max(...itemList.map(item => item.id)) + 1 : 0;
    const savedBudget = localStorage.getItem('budget') || '0';
    budgetCardEl.textContent = savedBudget;
    itemList.forEach(addExpenses);
    showBalance();
}

// Button events
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

// Expense Function
function expensesFun() {
    let expensesDescValue = expenseDesEl.value;
    let expenseAmountValue = expenseAmountEl.value;

    if (expensesDescValue === "" || expenseAmountValue === "" || parseInt(expenseAmountValue) <= 0) {
        errorMessage("Please enter valid description and amount greater than 0");
        return;
    } else {
        let amount = parseInt(expenseAmountValue);

        expenseAmountEl.value = "";
        expenseDesEl.value = "";

        let expenses = {
            id: itemId,
            title: expensesDescValue,
            amount: amount,
        };

        itemId++;
        itemList.push(expenses);
        addExpenses(expenses);
        showBalance();
        saveToLocalStorage();
    }
}

// Add Expenses
function addExpenses(expensesPara) {
    const html = `<ul class="tbl_tr_content">
                <li data-id="${expensesPara.id}">${expensesPara.id}</li>
                <li>${expensesPara.title}</li>
                <li><span>$</span>${expensesPara.amount}</li>
                <li>
                    <button type="button" class="btn_edit">Edit</button>
                    <button type="button" class="btn_delete">Delete</button>
                </li>
            </ul>`;
    tblRecordEl.insertAdjacentHTML("beforeend", html);

    const spendingHtml = `<li>${expensesPara.title}: $${expensesPara.amount}</li>`;
    spendingListEl.insertAdjacentHTML("beforeend", spendingHtml);

    const btnEdit = document.querySelectorAll(".btn_edit");
    const btnDel = document.querySelectorAll(".btn_delete");

    btnEdit.forEach((btnedit) => {
        btnedit.addEventListener("click", (el) => {
            let element = el.target.parentElement.parentElement;
            let id = element.firstElementChild.dataset.id;
            element.remove();

            let expenses = itemList.filter(item => item.id == id);
            expenseDesEl.value = expenses[0].title;
            expenseAmountEl.value = expenses[0].amount;

            itemList = itemList.filter(item => item.id != id);
            updateSpendingList();
            showBalance();
            saveToLocalStorage();
        });
    });

    btnDel.forEach((btndel) => {
        btndel.addEventListener("click", (el) => {
            let element = el.target.parentElement.parentElement;
            let id = element.firstElementChild.dataset.id;
            element.remove();

            itemList = itemList.filter(item => item.id != id);
            updateSpendingList();
            showBalance();
            saveToLocalStorage();
        });
    });
}

// Budget Function
function budgetFun() {
    const budgetValue = budgetInputEl.value;

    if (budgetValue === "" || budgetValue < 0) {
        errorMessage("Please enter your budget amount");
    } else {
        budgetCardEl.textContent = parseInt(budgetValue);
        budgetInputEl.value = "";
        showBalance();
        saveToLocalStorage();
    }
}

// Show Balance
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

// Total Expenses
function totalExpenses() {
    return itemList.length > 0 ? itemList.reduce((acc, curr) => acc + curr.amount, 0) : 0;
}

// Update Spending List
function updateSpendingList() {
    spendingListEl.innerHTML = "";
    itemList.forEach(expense => {
        const html = `<li>${expense.title}: $${expense.amount}</li>`;
        spendingListEl.insertAdjacentHTML("beforeend", html);
    });
}

// Error Message
function errorMessage(message) {
    errorMesgEl.innerHTML = `<p>${message}</p>`;
    errorMesgEl.classList.add("error");
    setTimeout(() => errorMesgEl.classList.remove("error"), 2500);
}

// Single DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    btnEvents();

    // Burger menu logic (assuming .side-bar is toggled)
    const burgerMenu = document.querySelector('.burger-menu');
    const sideMenu = document.querySelector('.side-bar');
    if (burgerMenu && sideMenu) {
        burgerMenu.addEventListener('click', () => {
            sideMenu.classList.toggle('active');
        });
    }
});