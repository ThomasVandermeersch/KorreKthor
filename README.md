# KorreKthor <!-- omit in TOC -->

- [Web interface](#web-interface)
  - [Install dependencies](#install-dependencies)
  - [Run Project](#run-project)
  - [How to use](#how-to-use)
  - [Student list format](#student-list-format)
- [Code structure](#code-structure)

## Web interface
### Install dependencies
````
npm install
````
### Run Project
Run :
````cmd
node app.js
````
or, if you want to automaticly reload the server when changes :
````cmd
npm run start
````

### How to use
First, open your favorit browser and enter this url : http://localhost:8000/.

Then, upload you student list and click **Submit file**.
> Note : this list must follow the [Student list format section](#student-list-format)

After, upload you different exam version and click **Submit all files**. 

For each version, select the correct answer(s) and click **Send**
> You can add or delete a question by clicking **Add Question** or **Remove Quesiton**
> 
> You can also click the **+** button to add an answer in a question

Wait a few seconds and your file is ready! Just click **Download**

### Student list format
The student list must contain at least 3 columns :
- *matricule* 
- *etudiant*
- *version*


Here is an example of stuent list :

![Student list exemple](Images/StudentList.png)

## Code structure
The main file to run is in "Interface Web"/

The embedded javascript files are in "Interface web"/public/javascript/

The backend files are located in "Interface web"/node_scripts/

The .pug view files are in  "Interface web"/views/