var template = require('babel-template');
module.exports = function () {
  return {
    visitor: {
      CallExpression(path) {
        const callee = path.get("callee")
        if (callee.matchesPattern("console", true) && !callee.matchesPattern("console.error")) {
          path.node.callee = template(`Function.prototype`)().expression
        }
      }
    }
  };
}
