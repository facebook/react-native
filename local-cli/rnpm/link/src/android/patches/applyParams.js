const toCamelCase = require('lodash').camelCase;

module.exports = function applyParams(str, params, prefix) {
  return str.replace(
    /\$\{(\w+)\}/g,
    (pattern, param) => {
      const name = toCamelCase(prefix) + '_' + param;

      return params[param]
        ? `this.getResources().getString(R.strings.${name})`
        : null;
    }
  );
};
