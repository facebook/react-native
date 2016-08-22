const toCamelCase = require('lodash').camelCase;

module.exports = function makeStringsPatch(params, prefix) {
  const values = Object.keys(params)
    .map(param => {
      const name = toCamelCase(prefix) + '_' + param;
      return '    ' +
        `<string moduleConfig="true" name="${name}">${params[param]}</string>`;
    });

  const patch = values.length > 0
    ? values.join('\n') + '\n'
    : '';

  return {
    pattern: '<resources>\n',
    patch,
  };
};
