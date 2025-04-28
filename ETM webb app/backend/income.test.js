// Simulated income tracking system with user input

const readline = require('readline');

let incomeList = [];
let showAllIncome = false;

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Simulate adding income
function addIncome(source, amount, date) {
  if (!source || isNaN(amount) || amount <= 0 || !date) {
    throw new Error("Invalid income data");
  }
  
  const newIncome = {
    id: Date.now(),
    source,
    amount,
    date,
    timestamp: new Date(date).getTime()
  };
  
  incomeList.unshift(newIncome);
  console.log(`Added income: ${source} - $${amount} on ${date}`);
  renderIncomeLists();
}

// Simulate editing income
function editIncome(id, newSource, newAmount, newDate) {
  const income = incomeList.find(item => item.id === id);
  if (!income) {
    throw new Error("Income not found");
  }

  income.source = newSource;
  income.amount = newAmount;
  income.date = newDate;
  console.log(`Edited income: ${newSource} - $${newAmount} on ${newDate}`);
  renderIncomeLists();
}

// Simulate deleting income
function deleteIncome(id) {
  const incomeIndex = incomeList.findIndex(item => item.id === id);
  if (incomeIndex === -1) {
    throw new Error("Income not found");
  }

  const removedIncome = incomeList.splice(incomeIndex, 1)[0];
  console.log(`Deleted income: ${removedIncome.source} - $${removedIncome.amount} on ${removedIncome.date}`);
  renderIncomeLists();
}

// Simulate toggling between recent and all income views
function toggleIncomeView() {
  showAllIncome = !showAllIncome;
  console.log(showAllIncome ? "Showing all income" : "Showing recent income");
  renderIncomeLists();
}

// Simulate rendering income lists
function renderIncomeLists() {
  console.log("\nIncome List:");
  if (incomeList.length === 0) {
    console.log("No income recorded.");
    return;
  }

  const incomesToShow = showAllIncome ? incomeList : incomeList.slice(0, 3);
  incomesToShow.forEach(income => {
    console.log(`${income.source} - $${income.amount} on ${new Date(income.date).toLocaleDateString()} (ID: ${income.id})`);
  });
  console.log("\n");
}

// Function to prompt the user for adding income
function promptAddIncome() {
  rl.question("Enter the income source: ", (source) => {
    rl.question("Enter the income amount: ", (amount) => {
      rl.question("Enter the income date (YYYY-MM-DD): ", (date) => {
        try {
          addIncome(source, parseFloat(amount), date);
        } catch (error) {
          console.error(error.message);
        }
        showMenu();
      });
    });
  });
}

// Function to prompt the user for editing income
function promptEditIncome() {
  rl.question("Enter the ID of the income you want to edit: ", (id) => {
    const income = incomeList.find(item => item.id === parseInt(id));
    if (!income) {
      console.log("Income not found.");
      showMenu();
      return;
    }
    
    rl.question("Enter the new income source (leave blank to keep current): ", (newSource) => {
      rl.question("Enter the new income amount (leave blank to keep current): ", (newAmount) => {
        rl.question("Enter the new income date (leave blank to keep current): ", (newDate) => {
          editIncome(
            income.id,
            newSource || income.source,
            newAmount ? parseFloat(newAmount) : income.amount,
            newDate || income.date
          );
          showMenu();
        });
      });
    });
  });
}

// Function to prompt the user for deleting income
function promptDeleteIncome() {
  rl.question("Enter the ID of the income you want to delete: ", (id) => {
    try {
      deleteIncome(parseInt(id));
    } catch (error) {
      console.error(error.message);
    }
    showMenu();
  });
}

// Function to prompt the user for toggling income views
function promptToggleView() {
  toggleIncomeView();
  showMenu();
}

// Function to show the main menu
function showMenu() {
  console.log("\nSelect an option:");
  console.log("1. Add income");
  console.log("2. Edit income");
  console.log("3. Delete income");
  console.log("4. Toggle between recent and all income views");
  console.log("5. Exit");
  
  rl.question("Choose an option: ", (choice) => {
    switch (choice) {
      case '1':
        promptAddIncome();
        break;
      case '2':
        promptEditIncome();
        break;
      case '3':
        promptDeleteIncome();
        break;
      case '4':
        promptToggleView();
        break;
      case '5':
        rl.close();
        break;
      default:
        console.log("Invalid choice, please try again.");
        showMenu();
    }
  });
}

// Initialize the application
showMenu();
