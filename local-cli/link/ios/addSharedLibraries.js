const createGroupWithMessage = require('./createGroupWithMessage');
const getTarget = require('./getTarget');

module.exports = function addSharedLibraries(project, libraries, projectConfig) {
  if (!libraries.length) {
    return;
  }

  // Create a Frameworks group if necessary.
  createGroupWithMessage(project, 'Frameworks');

  const target = getTarget(project, projectConfig).uuid;

  for (var name of libraries) {
    project.addFramework(name, { target });
  }
};
