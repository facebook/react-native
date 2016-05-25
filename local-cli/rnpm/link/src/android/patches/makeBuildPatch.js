module.exports = function makeBuildPatch(name) {
  return {
    pattern: /[^ \t]dependencies {\n/,
    patch: `    compile project(':${name}') {
        exclude group: 'com.facebook.react', module: 'react-native'
    }\n`,
  };
};
