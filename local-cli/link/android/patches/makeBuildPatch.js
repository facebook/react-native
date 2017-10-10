module.exports = function makeBuildPatch(name, buildPatch) {
  const installPattern = new RegExp(
    `\\s{4}(compile)(\\(|\\s)(project)\\(\\\':${name}\\\'\\)(\\)|\\s)`
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {\n/,
    patch: buildPatch || `    compile project(':${name}')\n`
  };
};
