var template = require('babel-template');
module.exports = function (babel) {
  var t = babel.types;
  return {
    visitor: {
      CallExpression(path) {
        if (path.get("callee").matchesPattern("console", true)) {
         path.node.callee = template(`
          (function () {              
            Array.prototype.slice.call(arguments).forEach(m => (typeof m === 'function') ? m() : m)
          })
          `)().expression 
        }
      }
    }
  };
}
