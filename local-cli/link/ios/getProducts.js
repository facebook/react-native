/**
 * Given xcodeproj it returns list of products ending with
 * .a extension, so that we know what elements add to target
 * project static library
 */
module.exports = function getProducts(project) {
  debugger;
  let nativeTargetSection = project.pbxNativeTargetSection();
  var results = [];
  for (var key in nativeTargetSection) {
    if(key.indexOf('_comment') === -1) {
      let configurationListId = nativeTargetSection[key].buildConfigurationList;
      let configurationList = project.pbxXCConfigurationList()[configurationListId];
      let buildConfigurationId = configurationList.buildConfigurations[0].value;
      let buildConfiguration = project.pbxXCBuildConfigurationSection()[buildConfigurationId];
      if ( !buildConfiguration.buildSettings.SDKROOT || buildConfiguration.buildSettings.SDKROOT.indexOf('appletv') === -1) {
        results.push(nativeTargetSection[key].productReference_comment);
      }
    }
  }
  return results;
//  return project
//    .pbxGroupByName('Products')
//    .children
//    .map(c => c.comment)
//    .filter(c => c.indexOf('.a') > -1);
};
