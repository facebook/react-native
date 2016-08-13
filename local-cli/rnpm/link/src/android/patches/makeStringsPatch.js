const toCamelCase = require('lodash').camelCase;

module.exports = function makeStringsPatch(params, prefix) {
  const patch = Object.keys(params).map(param => {
    const name = toCamelCase(prefix) + '_' + param;
    return '    ' +
      `<string moduleConfig="true" name="${name}">${params[param]}</string>`;
  }).join('\n') + '\n';

  return {
    pattern: '<resources>\n',
    patch: patch,
  };
};
