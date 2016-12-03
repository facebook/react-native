module.exports = function makeSolutionPatch(solutionInsert, projectName = '') {
  return {
    pattern: 'Global',
    patch: solutionInsert,
    unpatch: new RegExp(`Project.+${projectName}.+\\s+EndProject\\s+`),
  };
};
