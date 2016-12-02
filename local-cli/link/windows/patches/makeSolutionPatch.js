module.exports = function makeProjectPatch(solutionInsert) {
  return {
    pattern: 'Global',
    patch: solutionInsert,
  };
};
