module.exports = function makeBuildPatch(name) {
  const installPattern = new RegExp(
    `\\s{4}(api)(\\(|\\s)(project)\\(\\\':${name}\\\'\\)(\\)|\\s)`
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {\n/,
    patch: `    api project(':${name}')\n`
  };
};
