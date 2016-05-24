/**
 * For each file (.xcodeproj), there's an entry in `projectReferences` created
 * that has two entries - `ProjectRef` - reference to a file.uuid and
 * `ProductGroup` - uuid of a Products group.
 *
 * When projectReference is found - it's deleted and the removed value is returned
 * so that ProductGroup in PBXGroup section can be removed as well.
 *
 * Otherwise returns null
 */
module.exports = function removeFromProjectReferences(project, file) {
  const firstProject = project.getFirstProject().firstProject;

  const projectRef = firstProject.projectReferences.find(item => item.ProjectRef === file.uuid);

  if (!projectRef) {
    return null;
  }

  firstProject.projectReferences.splice(
    firstProject.projectReferences.indexOf(projectRef),
    1
  );

  return projectRef;
};
