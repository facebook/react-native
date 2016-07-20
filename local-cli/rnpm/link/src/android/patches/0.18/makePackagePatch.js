const applyParams = require('../applyParams');

module.exports = function makePackagePatch(packageInstance, params, prefix) {
  const processedInstance = applyParams(packageInstance, params, prefix);

  return {
    pattern: 'new MainReactPackage()',
    patch: ',\n        ' + processedInstance,
  };
};
