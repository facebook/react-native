/**
 * Gets build property from the main target build section
 *
 * It differs from the project.getBuildProperty exposed by xcode in the way that:
 * - it only checks for build property in the main target `Debug` section
 * - `xcode` library iterates over all build sections and because it misses
 * an early return when property is found, it will return undefined/wrong value
 * when there's another build section typically after the one you want to access
 * without the property defined (e.g. CocoaPods sections appended to project
 * miss INFOPLIST_FILE), see: https://github.com/alunny/node-xcode/blob/master/lib/pbxProject.js#L1765
 */
module.exports = function getBuildProperty(project, prop) {
  const target = project.getFirstTarget().firstTarget;
  const config = project.pbxXCConfigurationList()[target.buildConfigurationList];
  const buildSection = project.pbxXCBuildConfigurationSection()[config.buildConfigurations[0].value];

  return buildSection.buildSettings[prop];
};
