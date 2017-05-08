const getTarget = require('./getTarget');

module.exports = function removeSharedLibraries(project, libraries, projectConfig) {
  if (!libraries.length) {
    return;
  }

  const target = getTarget(project, projectConfig).uuid;

  for (var name of libraries) {
    project.removeFramework(name, { target });
  }
};
