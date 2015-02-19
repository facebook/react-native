var docs = require('../react-docgen');
var findExportedReactCreateClassCall = require(
  '../react-docgen/dist/strategies/findExportedReactCreateClassCall'
);
var findAllReactCreateClassCalls = require(
  '../react-docgen/dist/strategies/findAllReactCreateClassCalls'
);
var fs = require('fs');
var path = require('path');
var slugify = require('../core/slugify');

function getNameFromPath(filepath) {
  var ext = null;
  while (ext = path.extname(filepath)) {
    filepath = path.basename(filepath, ext);
  }
  return filepath;
}

function docsToMarkdown(filepath, i) {
  var json = docs.parseSource(
    fs.readFileSync(filepath),
    function(node, recast) {
      return findExportedReactCreateClassCall(node, recast) ||
        findAllReactCreateClassCalls(node, recast)[0];
    }
  )

  var componentName = getNameFromPath(filepath);

  var res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: docs',
    'category: Components',
    'permalink: docs/' + slugify(componentName) + '.html',
    components[i + 1] && ('next: ' + slugify(getNameFromPath(components[i + 1]))),
    '---',
    ' ',
    json.description,
    ' ',
    '# Props',
    '```',
    JSON.stringify(json.props, null, 2),
    '```',
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

var components = [
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/Image/Image.ios.js',
  '../Libraries/Components/ListView/ListView.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/ScrollView/ScrollView.ios.js',
  '../Libraries/Components/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.ios.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
];

module.exports = function() {
  return components.map(docsToMarkdown);
};
