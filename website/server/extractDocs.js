var docs = require('react-docgen');
var fs = require('fs');
var path = require('path');
var slugify = require('../core/slugify');
var jsDocs = require('../jsdocs/jsdocs.js');

function getNameFromPath(filepath) {
  var ext = null;
  while (ext = path.extname(filepath)) {
    filepath = path.basename(filepath, ext);
  }
  return filepath;
}

function componentsToMarkdown(type, json, filepath, i) {
  var componentName = getNameFromPath(filepath);

  var docFilePath = '../docs/' + componentName + '.md';
  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }
  json.type = type;

  var res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: ' + type + 's',
    'permalink: docs/' + slugify(componentName) + '.html',
    all[i + 1] && ('next: ' + slugify(getNameFromPath(all[i + 1]))),
    '---',
    JSON.stringify(json, null, 2),
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

var components = [
  '../Libraries/Components/ActivityIndicatorIOS/ActivityIndicatorIOS.ios.js',
  '../Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/CustomComponents/ListView/ListView.js',
  '../Libraries/Components/MapView/MapView.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Picker/PickerIOS.ios.js',
  '../Libraries/Components/ScrollView/ScrollView.js',
  '../Libraries/Components/SliderIOS/SliderIOS.js',
  '../Libraries/Components/SwitchIOS/SwitchIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.ios.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
  '../Libraries/Components/WebView/WebView.ios.js',
];

var apis = [
  '../Libraries/Utilities/AlertIOS.js',
  '../Libraries/Animation/Animation.js',
  '../Libraries/AppRegistry/AppRegistry.js',
  '../Libraries/AppState/AppState.js',
  '../Libraries/AppStateIOS/AppStateIOS.ios.js',
  '../Libraries/Storage/AsyncStorage.ios.js',
  '../Libraries/CameraRoll/CameraRoll.js',
  '../Libraries/Interaction/InteractionManager.js',
  '../Libraries/Animation/LayoutAnimation.js',
  '../Libraries/Network/NetInfo.js',
  '../Libraries/Utilities/PixelRatio.js',
  '../Libraries/Components/StatusBar/StatusBarIOS.ios.js',
  '../Libraries/StyleSheet/StyleSheet.js',
  '../Libraries/Vibration/VibrationIOS.ios.js',
];

var all = components.concat(apis);

module.exports = function() {
  var i = 0;
  return [].concat(
    components.map(function(filepath) {
      var json = docs.parse(
        fs.readFileSync(filepath),
        function(node, recast) {
          return docs.resolver.findExportedReactCreateClassCall(node, recast) ||
            docs.resolver.findAllReactCreateClassCalls(node, recast)[0];
        }
      );
      return componentsToMarkdown('component', json, filepath, i++);
    }),
    apis.map(function(filepath) {
      try {
        var json = jsDocs(fs.readFileSync(filepath).toString());
      } catch(e) {
        console.error('Cannot parse file', filepath);
        var json = {};
      }
      return componentsToMarkdown('api', json, filepath, i++);
    })
  );
};
