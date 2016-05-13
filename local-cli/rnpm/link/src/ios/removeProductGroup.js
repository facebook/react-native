module.exports = function removeProductGroup(project, productGroupId) {
  const section = project.hash.project.objects.PBXGroup;

  for (var key of Object.keys(section)) {
    if (key === productGroupId) {
      delete section[key];
    }
  }

  return;
};
