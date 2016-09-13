module.exports = function removeSharedLibraries(project, libraries) {
  if (!libraries.length) {
    return;
  }

  const target = project.getFirstTarget().uuid;

  for (var name of libraries) {
    project.removeFramework(name, { target });
  }
};
