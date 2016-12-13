module.exports = function makeUsingPatch(packageImportPath) {
  return {
    pattern: 'using ReactNative.Modules.Core;',
    patch: '\n' + packageImportPath,
  };
};
