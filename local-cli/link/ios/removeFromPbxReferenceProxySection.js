/**
 * Every file added to the project from another project is attached to
 * `PBXItemContainerProxy` through `PBXReferenceProxy`.
 */
module.exports = function removeFromPbxReferenceProxySection(project, file) {
  const section = project.hash.project.objects.PBXReferenceProxy;

  for (var key of Object.keys(section)) {
    if (section[key].path === file.basename) {
      delete section[key];
    }
  }

  return;
};
