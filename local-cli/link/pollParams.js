var inquirer = require('inquirer');

module.exports = (questions) => new Promise((resolve, reject) => {
  if (!questions) {
    return resolve({});
  }

  inquirer.prompt(questions, resolve);
});
