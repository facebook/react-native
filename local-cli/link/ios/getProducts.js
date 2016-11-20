/**
 * Given xcodeproj it returns list of products ending with
 * .a extension, so that we know what elements add to target
 * project static library
 */
module.exports = function getProducts(project) {
  return project
    .pbxGroupByName('Products')
    .children
    .map(c => c.comment)
    .filter(c => c.indexOf('.a') > -1);
};
