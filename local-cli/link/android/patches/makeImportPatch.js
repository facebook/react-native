module.exports = function makeImportPatch(packageImportPath) {
  return {
    pattern: 'import com.facebook.react.ReactApplication;',
    patch: '\n' + packageImportPath,
  };
};
