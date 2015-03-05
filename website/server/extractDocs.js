var docs = require('../react-docgen');
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
  var json = docs.parse(
    fs.readFileSync(filepath),
    function(node, recast) {
      return docs.resolver.findExportedReactCreateClassCall(node, recast) ||
        docs.resolver.findAllReactCreateClassCalls(node, recast)[0];
    }
  );
  var componentName = getNameFromPath(filepath);

  var docFilePath = '../docs/' + componentName + '.md';
  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }

  var res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: Components',
    'permalink: docs/' + slugify(componentName) + '.html',
    components[i + 1] && ('next: ' + slugify(getNameFromPath(components[i + 1]))),
    '---',
    JSON.stringify(json, null, 2),
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

var components = [
  '../Libraries/Components/ActivityIndicatorIOS/ActivityIndicatorIOS.ios.js',
  '../Libraries/Text/ExpandingText.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/Components/ListView/ListView.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/ScrollView/ScrollView.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.ios.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
];

module.exports = function() {
  return components.map(docsToMarkdown);
};
