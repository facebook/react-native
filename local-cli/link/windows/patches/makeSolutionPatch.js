module.exports = function makeSolutionPatch(solutionInsert) {
  return {
    pattern: 'Global',
    patch: solutionInsert,
  };
};
