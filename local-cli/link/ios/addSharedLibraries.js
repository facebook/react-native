const createGroupWithMessage = require('./createGroupWithMessage');

module.exports = function addSharedLibraries(project, libraries) {
  if (!libraries.length) {
    return;
  }

  // Create a Frameworks group if necessary.
  createGroupWithMessage(project, 'Frameworks');

  const target = project.getFirstTarget().uuid;

  for (var name of libraries) {
    project.addFramework(name, { target });
  }
};
