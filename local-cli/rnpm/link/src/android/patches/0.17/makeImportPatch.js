module.exports = function makeImportPatch(packageImportPath) {
  return {
    pattern: 'import android.app.Activity;',
    patch: '\n' + packageImportPath,
  };
};
