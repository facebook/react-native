/**
 * Given xcodeproj it returns list of targets
 */
module.exports = function getTargets(project) {
  let targets = project.getFirstProject()['firstProject']['targets'];
  let nativeTargetSection = project.pbxNativeTargetSection();
  return targets.map(function(target) {
    let key = target.value;
    let configurationListId = project.pbxNativeTargetSection()[key].buildConfigurationList;
    let configurationList = project.pbxXCConfigurationList()[configurationListId];
    let buildConfigurationId = configurationList.buildConfigurations[0].value;
    let buildConfiguration = project.pbxXCBuildConfigurationSection()[buildConfigurationId];
    return {
      uuid: key,
      target: nativeTargetSection[key],
      isTVOS: (buildConfiguration.buildSettings.SDKROOT && (buildConfiguration.buildSettings.SDKROOT.indexOf('appletv') !== -1)) || false
    }
  });
};
