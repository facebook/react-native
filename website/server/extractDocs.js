var docs = require('../react-docgen');
var fs = require('fs');
var path = require('path');
var slugify = require('../core/slugify');
var jsDocs = require('../jsdocs/jsdocs.js')

function getNameFromPath(filepath) {
  var ext = null;
  while (ext = path.extname(filepath)) {
    filepath = path.basename(filepath, ext);
  }
  return filepath;
}

function componentsToMarkdown(filepath, i) {
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
  '../Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  '../Libraries/Text/ExpandingText.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/Components/ListView/ListView.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/ScrollView/ScrollView.js',
  '../Libraries/Components/Slider/Slider.js',
  '../Libraries/Components/SwitchIOS/SwitchIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.ios.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
];


function apisToMarkdown(filepath, i) {
  var json = jsDocs(fs.readFileSync(filepath).toString());
  console.log(JSON.stringify(json, null, 2));
}

var apis = [
  '../Libraries/AppRegistry/AppRegistry.js',
];

module.exports = function() {
  return components.map(componentsToMarkdown);
};
