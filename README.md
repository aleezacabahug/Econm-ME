# EconoME – Setup Instructions

Follow the steps below to set up the backend and database for **EconoME**.

---

## 1. Clone the Repository
Ensure you have the latest version of the project by cloning or pulling from the GitHub repository:  
> [https://github.com/aleezacabahug/Econm-ME](https://github.com/aleezacabahug/Econm-ME)

---

## 2. Install MongoDB
Download and install MongoDB Community Server:  
> [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

During installation, set up **MongoDB Compass** (optional but recommended).

---

## 3. Set Up the Backend
- Open your terminal (or use the terminal built into Visual Studio Code).
- Navigate to the backend directory. Example:
  ```bash
  cd "C:\Users\aleez\OneDrive\Desktop\aleezacabahug.github.io\Econm-ME\ETM webb app\backend"
  ```

- Run the following commands to initialize the project and install dependencies:
  ```bash
  npm init -y
  npm install express jsonwebtoken dotenv
  npm install mongoose
  ```

---

## 4. Configure MongoDB Path
To enable MongoDB commands system-wide:

- Close and restart your terminal.
- Open **Advanced System Settings** → **Environment Variables**.
- Under **System Variables**, find and edit the `Path` variable.
- Add the following:
  ```
  C:\Program Files\MongoDB\Server\8.0\bin
  ```

---

## 5. Start MongoDB and Set Up the Database
- In a terminal window, start MongoDB:
  ```bash
  mongod
  ```

- In a **new terminal window** (in the backend folder), install any remaining dependencies:
  ```bash
  npm install
  ```

- Populate the database with sample data (only run this once):
  ```bash
  node initDatabase.js
  ```

---

## 6. Run the Backend Server
Start the backend server:
```bash
node server.js
```
If successful, the server will start and the application will automatically open in your default browser.

---

## 7. Create an Account and Explore
- Register a new account.
- Log in to access the platform.
- Use the navigation bar to explore the features of **EconoME**!

---

## Notes
- Make sure MongoDB is running when starting the backend.
- Only run `node initDatabase.js` **once** to avoid duplicating data.
