module.exports = function makeSolutionPatch(windowsConfig) {

  const solutionInsert = `Project("{${windowsConfig.projectGUID.toUpperCase()}}") = "${windowsConfig.projectName}", "${windowsConfig.relativeProjPath}", "{${windowsConfig.pathGUID.toUpperCase()}}"
EndProject
`;

  return {
    pattern: 'Global',
    patch: solutionInsert,
    unpatch: new RegExp(`Project.+${windowsConfig.projectName}.+\\s+EndProject\\s+`),
  };
};
