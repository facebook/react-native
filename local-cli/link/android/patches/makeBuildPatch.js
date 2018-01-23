module.exports = function makeBuildPatch(name) {
  const installPattern = new RegExp(
    `\\s{4}(compile)(\\(|\\s)(project)\\(\\\':${name}\\\'\\)(\\)|\\s)`
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {\n/,
    patch: `    compile project(':${name}')\n`
  };
};
