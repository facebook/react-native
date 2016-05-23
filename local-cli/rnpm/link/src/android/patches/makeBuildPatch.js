module.exports = function makeBuildPatch(name) {
  return {
    pattern: /[^ \t]dependencies {\n/,
    patch: `    compile project(':${name}')\n`,
  };
};
