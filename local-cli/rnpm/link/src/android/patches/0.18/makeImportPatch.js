module.exports = function makeImportPatch(packageImportPath) {
  return {
    pattern: 'import com.facebook.react.ReactActivity;',
    patch: '\n' + packageImportPath,
  };
};
