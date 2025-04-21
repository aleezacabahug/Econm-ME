# Econm-ME
Here are the instructions on how to run the backend and database: 
Make sure everything is updated on the github repository: 
https://github.com/aleezacabahug/Econm-ME  

Download mongodb here: https://www.mongodb.com/try/download/community  
Download the installer and set up mongodb compass 
Open your terminal and navigate to the repository (you can also use the terminal on vscode 
because it goes directly to the folder you are working on)  
Example: cd "c:\Users\aleez\OneDrive\Desktop\aleezacabahug.github.io\Econm-ME\" 
cd "ETM webb app\backend"  

Run these commands on your terminal: 
npm init -y 
npm install express jsonwebtoken dotenv 
npm install mongoose 

Restart your terminal (close it) and then on your search bar go to advanced system settings in 
the control panel, click environment variables, click on path under system variables. Add the 
filepath: C:\Program Files\MongoDB\Server\8.0\bin to it. Then open up your terminal again and 
run these commands: 

mongod 
npm install 
node server.js 

If you did it all right, you should have this: (now the server should be running) 
On any browser, look up http://localhost:3000/homepage.html  

Make an account and log in. 
Now you can visit the navigation bar and see how EconoMe works.  
