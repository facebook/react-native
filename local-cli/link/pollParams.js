var inquirer = require('inquirer');

module.exports = (questions) => new Promise((resolve, reject) => {
  if (!questions || (Array.isArray(questions) && questions.length == 0)) {
    return resolve({});
  }

  inquirer.prompt(questions, resolve);
});
