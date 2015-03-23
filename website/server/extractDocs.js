/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var docgen = require('react-docgen');
var docgenHelpers = require('./docgenHelpers');
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

function componentsToMarkdown(type, json, filepath, i, styles) {
  var componentName = getNameFromPath(filepath);

  var docFilePath = '../docs/' + componentName + '.md';
  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }
  json.type = type;
  if (styles) {
    json.styles = styles;
  }

  var res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: ' + type + 's',
    'permalink: docs/' + slugify(componentName) + '.html',
    'next: ' + (all[i + 1] ?
      slugify(getNameFromPath(all[i + 1])) :
      'network'),
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

var styles = [
  '../Libraries/StyleSheet/LayoutPropTypes.js',
  '../Libraries/Components/View/ViewStylePropTypes.js',
  '../Libraries/Text/TextStylePropTypes.js',
  '../Libraries/Image/ImageStylePropTypes.js',
];

var all = components.concat(apis).concat(styles.slice(0, 1));
var styleDocs = styles.slice(1).reduce(function(docs, filepath) {
  docs[path.basename(filepath).replace(path.extname(filepath), '')] =
    docgen.parse(
      fs.readFileSync(filepath),
      docgenHelpers.findExportedObject,
      [docgen.handlers.propTypeHandler]
    );
  return docs;
}, {});

module.exports = function() {
  var i = 0;
  return [].concat(
    components.map(function(filepath) {
      var json = docgen.parse(
        fs.readFileSync(filepath),
        docgenHelpers.findExportedOrFirst,
        docgen.defaultHandlers.concat(docgenHelpers.stylePropTypeHandler)
      );
      return componentsToMarkdown('component', json, filepath, i++, styleDocs);
    }),
    apis.map(function(filepath) {
      try {
        var json = jsDocs(fs.readFileSync(filepath).toString());
      } catch(e) {
        console.error('Cannot parse file', filepath);
        var json = {};
      }
      return componentsToMarkdown('api', json, filepath, i++);
    }),
    styles.slice(0, 1).map(function(filepath) {
      var json = docgen.parse(
        fs.readFileSync(filepath),
        docgenHelpers.findExportedObject,
        [docgen.handlers.propTypeHandler]
      );
      return componentsToMarkdown('style', json, filepath, i++);
    })
  );
};
