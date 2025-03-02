"use strict";

const errorMesgEl = document.querySelector(".error_message");
const budgetInputEl = document.querySelector(".budget_input");
const expenseDesEl = document.querySelector(".expense_input");
const expenseAmountEl = document.querySelector(".expense_amount");
const cardsContainer = document.querySelector(".cards");
const tblRecordEl = document.querySelector(".tbl_data");

// cards content
const budgetCardEl = document.querySelector(".bugdet_card");
const expensesCardEl = document.querySelector(".expenses_card");
const balanceCardEl = document.querySelector(".balance_card");

let itemList = [];
let itemId = 0;

// button event
function btnEvents() {
	const btnBudgetCal = document.querySelector("#btn_budget");
	const btnExpensesCal = document.querySelector("#btn_expense");

	// Budget Event
	btnBudgetCal.addEventListener("click", (e) => {
		e.preventDefault();
		budgetFun();
	});

	btnExpensesCal.addEventListener("click", (e) => {
		e.preventDefault();
		expensesFun();
	});
}

// Calling button event
document.addEventListener("DOMContentLoaded", btnEvents);

//Expense Function
function expensesFun() {
	let expensesDescValue = expenseDesEl.value;
	let expenseAmountValue = expenseAmountEl.value;

	if (expensesDescValue === "" || expenseAmountValue === "" || parseInt(expenseAmountValue) <= 0) {
		errorMessage("Please enter vaild description and amount greater than 0");
		return // Stop farther excution if invalid
	} else {
		let amount = parseInt(expenseAmountValue);

		expenseAmountEl.value = "";
		expenseDesEl.value = "";


		// storw the value inside the object
		let expenses = {
			id: itemId,
			title: expensesDescValue,
			amount: amount,
		};

		itemId++;
		itemList.push(expenses);
		// console.log(itemList);

		// add expenses insed the HTML page
		addExpenses(expenses);
		showBalance();
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

	const btnEdit = document.querySelectorAll(".btn_edit");
	const btnDel = document.querySelectorAll(".btn_delete");
	const content_id = document.querySelectorAll(".tbl_tr_content");

	btnEdit.forEach((btnedit) => {
		btnedit.addEventListener("click", (el) => {
			let id;
			content_id.forEach((ids) => {
				id = ids.firstElementChild.dataset.id;
			});
			let element = el.target.parentElement.parentElement;
			element.remove();

			let expenses = itemList.filter(function (item) {
				return item.id == id;
			});
			expenseDesEl.value = expenses[0].title;
			expenseAmountEl.value = expenses[0].amount;

			let temp_list =itemList.filter(function(item){
				return item.id != id;
			});
			itemList = temp_list;
		});
	});

	// btn delete
	btnDel.forEach((btndel) => {
		btndel.addEventListener("click", (el) => {
			let id;
			content_id.forEach((ids) => {
				id = ids.firstElementChild.dataset.id;
			});
			let element = el.target.parentElement.parentElement;
			element.remove();

			let temp_list =itemList.filter(function(item){
				return item.id != id;
			});
			itemList = temp_list;
			showBalance();
		});
	});
}

// Budget Function
function budgetFun() {
	const budgetValue = budgetInputEl.value;

	if (budgetValue == "" || budgetValue < 0) {
		errorMessage("Please enter your budget amount");
	} else {
		budgetCardEl.textContent = budgetValue;
		budgetInputEl.value = "";
		showBalance();
	}
}
// Show Balance
function showBalance() {
	const expenses = totalExpenses();
	const total = parseInt(budgetCardEl.textContent) - expenses;
	balanceCardEl.textContent = total;
}

// Total Expenses
function totalExpenses() {
	let total = 0;

	if (itemList.length > 0) {
		total = itemList.reduce(function (acc, curr) {
			acc += curr.amount;
			return acc;
		}, 0);
	}
	expensesCardEl.textContent = total;
	return total;
}

document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const sideMenu = document.querySelector('.side-menu');

    burgerMenu.addEventListener('click', function() {
        sideMenu.classList.toggle('active');
    });
});

// Error Message
function errorMessage(message) {
	errorMesgEl.innerHTML = `<p>${message}</p>`;
	errorMesgEl.classList.add("error");

	setTimeout(() => {
		errorMesgEl.classList.remove("error");
	}, 2500);
}



