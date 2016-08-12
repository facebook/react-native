const toCamelCase = require('lodash').camelCase;

module.exports = function applyParams(str, params, prefix) {
  return str.replace(
    /\$\{(\w+)\}/g,
    (pattern, param) => {
      const name = toCamelCase(prefix) + '_' + param;

      return params[param]
        ? `getResources().getString(R.string.${name})`
        : null;
    }
  );
};
