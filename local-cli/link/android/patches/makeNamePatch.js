/*
 * Fix gradle sync failure in Android Studio 3.0 when
 * module name has a scope (e.g `@username/project-name`)
 * https://github.com/facebook/react-native/issues/17029
 */
module.exports = function makeNamePatch(name) {
  return name.replace(/\//g, ':');
};
