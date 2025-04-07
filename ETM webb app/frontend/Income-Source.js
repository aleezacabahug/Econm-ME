"use strict";

document.addEventListener('DOMContentLoaded', function() {
    // Income Tracking System
    const incomeForm = document.getElementById('income-form');
    const incomeSourceInput = document.getElementById('income-source');
    const incomeAmountInput = document.getElementById('income-amount');
    const incomeDateInput = document.getElementById('income-date');
    const recentIncomeList = document.getElementById('recent-income-list');
    const allIncomeList = document.getElementById('all-income-list');
    const toggleHistoryBtn = document.getElementById('toggle-income-history');

    let incomeList = [];
    let showAllIncome = false;

    // Initialize income tracking
    function initIncomeTracking() {
        // Set default date to today
        incomeDateInput.valueAsDate = new Date();
        
        // Load existing data
        loadIncomeData();
        
        // Set up event listeners
        if (incomeForm) incomeForm.addEventListener('submit', addIncome);
        if (toggleHistoryBtn) toggleHistoryBtn.addEventListener('click', toggleIncomeView);
        
        // Initialize view
        updateView();
    }

    // Load income data from localStorage
    function loadIncomeData() {
        const savedIncome = localStorage.getItem('incomeList');
        if (savedIncome) {
            incomeList = JSON.parse(savedIncome);
            // Sort by date (newest first)
            incomeList.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderIncomeLists();
        }
    }

    // Save income data to localStorage
    function saveIncomeData() {
        localStorage.setItem('incomeList', JSON.stringify(incomeList));
    }

    // Add new income
    function addIncome(event) {
        event.preventDefault();
        
        const source = incomeSourceInput.value.trim();
        const amount = parseFloat(incomeAmountInput.value);
        const date = incomeDateInput.value;
        
        if (!source || isNaN(amount) || amount <= 0 || !date) {
            alert('Please fill all fields with valid values');
            return;
        }
        
        const newIncome = {
            id: Date.now(),
            source,
            amount,
            date,
            timestamp: new Date(date).getTime()
        };
        
        incomeList.unshift(newIncome); // Add to beginning to maintain newest first
        saveIncomeData();
        renderIncomeLists();
        
        // Reset form
        incomeForm.reset();
        incomeDateInput.valueAsDate = new Date();
        
        // Update budget display
        updateTotalBudget();
    }

    // Render income lists
    function renderIncomeLists() {
        if (!recentIncomeList || !allIncomeList) return;
        
        recentIncomeList.innerHTML = '';
        allIncomeList.innerHTML = '';
        
        if (incomeList.length === 0) {
            recentIncomeList.innerHTML = '<p class="no-income">No income recorded yet</p>';
            allIncomeList.innerHTML = '<p class="no-income">No income recorded yet</p>';
            return;
        }
        
        // Show most recent 3 incomes in recent list
        const recentIncomes = incomeList.slice(0, 3);
        recentIncomes.forEach(income => {
            recentIncomeList.appendChild(createIncomeItem(income));
        });
        
        // Show all incomes in full list
        incomeList.forEach(income => {
            allIncomeList.appendChild(createIncomeItem(income));
        });
    }

    // Create income item element
    function createIncomeItem(income) {
        const item = document.createElement('div');
        item.className = 'income-item';
        item.dataset.id = income.id;
        
        const formattedDate = new Date(income.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        item.innerHTML = `
            <div class="income-info">
                <span class="income-source">${income.source}</span>
                <span class="income-date">${formattedDate}</span>
            </div>
            <span class="income-amount">$${income.amount.toFixed(2)}</span>
            <div class="income-actions">
                <button class="btn-icon edit-income" title="Edit"><i class='bx bx-edit-alt'></i></button>
                <button class="btn-icon delete-income" title="Delete"><i class='bx bx-trash'></i></button>
            </div>
        `;
        
        // Add event listeners
        item.querySelector('.delete-income').addEventListener('click', () => deleteIncome(income.id));
        item.querySelector('.edit-income').addEventListener('click', () => editIncome(income.id));
        
        return item;
    }

    // Delete income
    function deleteIncome(id) {
        if (confirm('Are you sure you want to delete this income record?')) {
            incomeList = incomeList.filter(income => income.id !== id);
            saveIncomeData();
            renderIncomeLists();
            updateTotalBudget();
        }
    }

    // Edit income
    function editIncome(id) {
        const income = incomeList.find(item => item.id === id);
        if (!income) return;
        
        incomeSourceInput.value = income.source;
        incomeAmountInput.value = income.amount;
        incomeDateInput.value = income.date;
        
        // Remove the income being edited
        incomeList = incomeList.filter(item => item.id !== id);
        saveIncomeData();
        renderIncomeLists();
        updateTotalBudget();
    }

    // Toggle between recent and all income views
    function toggleIncomeView() {
        showAllIncome = !showAllIncome;
        updateView();
    }

    // Update the view based on current state
    function updateView() {
        const recentIncomeSection = document.querySelector('.recent-income');
        const allIncomeSection = document.querySelector('.all-income');
        
        if (!recentIncomeSection || !allIncomeSection) return;
        
        if (showAllIncome) {
            recentIncomeSection.style.display = 'none';
            allIncomeSection.style.display = 'block';
            toggleHistoryBtn.textContent = 'Show Recent';
        } else {
            recentIncomeSection.style.display = 'block';
            allIncomeSection.style.display = 'none';
            toggleHistoryBtn.textContent = 'Show All';
        }
    }

    // Calculate and update total budget
    function updateTotalBudget() {
        const total = incomeList.reduce((sum, income) => sum + income.amount, 0);
        const budgetCard = document.querySelector('.budget_card');
        if (budgetCard) budgetCard.textContent = total.toFixed(2);
        
        // If showBalance function exists (from script.js), call it
        if (typeof showBalance === 'function') {
            showBalance();
        }
    }

    // Initialize the income tracking system
    initIncomeTracking();
});