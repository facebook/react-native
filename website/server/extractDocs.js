/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const docgen = require('react-docgen');
const docgenHelpers = require('./docgenHelpers');
const fs = require('fs');
const jsDocs = require('../jsdocs/jsdocs.js');
const path = require('path');
const slugify = require('../core/slugify');

const ANDROID_SUFFIX = 'android';
const CROSS_SUFFIX = 'cross';
const IOS_SUFFIX = 'ios';

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function removeExtName(filepath) {
  let ext = path.extname(filepath);
  while (ext) {
    filepath = path.basename(filepath, ext);
    ext = path.extname(filepath);
  }
  return filepath;
}

function getNameFromPath(filepath) {
  filepath = removeExtName(filepath);
  if (filepath === 'LayoutPropTypes') {
    return 'Flexbox';
  } else if (filepath === 'TransformPropTypes') {
    return 'Transforms';
  } else if (filepath === 'TabBarItemIOS') {
    return 'TabBarIOS.Item';
  } else if (filepath === 'AnimatedImplementation') {
    return 'Animated';
  }
  return filepath;
}

function getPlatformFromPath(filepath) {
  filepath = removeExtName(filepath);
  if (endsWith(filepath, 'Android')) {
    return ANDROID_SUFFIX;
  } else if (endsWith(filepath, 'IOS')) {
    return IOS_SUFFIX;
  }
  return CROSS_SUFFIX;
}

function getExamplePaths(componentName, componentPlatform) {
  var componentExample = '../Examples/UIExplorer/' + componentName + 'Example.';
  var pathsToCheck = [
    componentExample + 'js',
    componentExample + componentPlatform + '.js',
  ];
  if (componentPlatform === CROSS_SUFFIX) {
    pathsToCheck.push(
      componentExample + IOS_SUFFIX + '.js',
      componentExample + ANDROID_SUFFIX + '.js'
    );
  }
  var paths = [];
  pathsToCheck.map((p) => {
    if (fs.existsSync(p)) {
      paths.push(p);
    }
  });
  return paths;
}

function getExamples(componentName, componentPlatform) {
  var paths = getExamplePaths(componentName, componentPlatform);
  if (paths) {
    var examples = [];
    paths.map((p) => {
      var platform = p.match(/Example\.(.*)\.js$/);
      var title = '';
      if ((componentPlatform === CROSS_SUFFIX) && (platform !== null)) {
        title = platform[1].toUpperCase();
      }
      examples.push(
        {
          path: p.replace(/^\.\.\//, ''),
          title: title,
          content: fs.readFileSync(p).toString(),
        }
      );
    });
    return examples;
  }
  return;
}

// Add methods that should not appear in the components documentation.
const methodsBlacklist = [
  // Native methods mixin.
  'getInnerViewNode',
  'setNativeProps',
  // Touchable mixin.
  'touchableHandlePress' ,
  'touchableHandleActivePressIn',
  'touchableHandleActivePressOut',
  'touchableHandleLongPress',
  'touchableGetPressRectOffset',
  'touchableGetHitSlop',
  'touchableGetHighlightDelayMS',
  'touchableGetLongPressDelayMS',
  'touchableGetPressOutDelayMS',
  // Scrollable mixin.
  'getScrollableNode',
  'getScrollResponder',
];

function filterMethods(method) {
  return method.name[0] !== '_' && methodsBlacklist.indexOf(method.name) === -1;
}

// Determines whether a component should have a link to a runnable example

function isRunnable(componentName, componentPlatform) {
  var paths = getExamplePaths(componentName, componentPlatform);
  if (paths && paths.length > 0) {
    return true;
  } else {
    return false;
  }
}

// Hide a component from the sidebar by making it return false from
// this function
const HIDDEN_COMPONENTS = [
  'Transforms',
  'ListViewDataSource',
];

function shouldDisplayInSidebar(componentName) {
  return HIDDEN_COMPONENTS.indexOf(componentName) === -1;
}

function getNextComponent(idx) {
  if (all[idx + 1]) {
    const nextComponentName = getNameFromPath(all[idx + 1]);

    if (shouldDisplayInSidebar(nextComponentName)) {
      return slugify(nextComponentName);
    } else {
      return getNextComponent(idx + 1);
    }
  } else {
    return 'network';
  }
}

function componentsToMarkdown(type, json, filepath, idx, styles) {
  const componentName = getNameFromPath(filepath);
  const componentPlatform = getPlatformFromPath(filepath);
  const docFilePath = '../docs/' + componentName + '.md';

  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }
  json.type = type;
  json.filepath = filepath.replace(/^\.\.\//, '');
  json.componentName = componentName;
  json.componentPlatform = componentPlatform;
  if (styles) {
    json.styles = styles;
  }
  json.examples = getExamples(componentName, componentPlatform);

  if (json.methods) {
    json.methods = json.methods.filter(filterMethods);
  }

  // Put Flexbox into the Polyfills category
  const category = (type === 'style' ? 'Polyfills' : type + 's');
  const next = getNextComponent(idx);

  const res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: ' + category,
    'permalink: docs/' + slugify(componentName) + '.html',
    'platform: ' + componentPlatform,
    'next: ' + next,
    'sidebar: ' + shouldDisplayInSidebar(componentName),
    'runnable:' + isRunnable(componentName, componentPlatform),
    'path:' + json.filepath,
    '---',
    JSON.stringify(json, null, 2),
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

let componentCount;

function renderComponent(filepath) {
  const json = docgen.parse(
    fs.readFileSync(filepath),
    docgenHelpers.findExportedOrFirst,
    docgen.defaultHandlers.concat([
      docgenHelpers.stylePropTypeHandler,
      docgenHelpers.deprecatedPropTypeHandler,
    ])
  );

  return componentsToMarkdown('component', json, filepath, componentCount++, styleDocs);
}

function renderAPI(type) {
  return function(filepath) {
    let json;
    try {
      json = jsDocs(fs.readFileSync(filepath).toString());
    } catch (e) {
      console.error('Cannot parse file', filepath, e);
      json = {};
    }
    return componentsToMarkdown(type, json, filepath, componentCount++);
  };
}

function renderStyle(filepath) {
  const json = docgen.parse(
    fs.readFileSync(filepath),
    docgenHelpers.findExportedObject,
    [docgen.handlers.propTypeHandler]
  );

  // Remove deprecated transform props from docs
  if (filepath === '../Libraries/StyleSheet/TransformPropTypes.js') {
    ['rotation', 'scaleX', 'scaleY', 'translateX', 'translateY'].forEach(function(key) {
      delete json.props[key];
    });
  }

  return componentsToMarkdown('style', json, filepath, componentCount++);
}

const components = [
  '../Libraries/Components/ActivityIndicator/ActivityIndicator.js',
  '../Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  '../Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/CustomComponents/ListView/ListView.js',
  '../Libraries/Components/MapView/MapView.js',
  '../Libraries/Modal/Modal.js',
  '../Libraries/CustomComponents/Navigator/Navigator.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Components/Picker/PickerIOS.ios.js',
  '../Libraries/Components/Picker/Picker.js',
  '../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.android.js',
  '../Libraries/Components/ProgressViewIOS/ProgressViewIOS.ios.js',
  '../Libraries/Components/RefreshControl/RefreshControl.js',
  '../Libraries/Components/ScrollView/ScrollView.js',
  '../Libraries/Components/SegmentedControlIOS/SegmentedControlIOS.ios.js',
  '../Libraries/Components/Slider/Slider.js',
  '../Libraries/Components/SliderIOS/SliderIOS.ios.js',
  '../Libraries/Components/StatusBar/StatusBar.js',
  '../Libraries/Components/Switch/Switch.js',
  '../Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarItemIOS.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.js',
  '../Libraries/Components/ToolbarAndroid/ToolbarAndroid.android.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableNativeFeedback.android.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
  '../Libraries/Components/ViewPager/ViewPagerAndroid.android.js',
  '../Libraries/Components/WebView/WebView.ios.js',
];

const apis = [
  '../Libraries/ActionSheetIOS/ActionSheetIOS.js',
  '../Libraries/Utilities/Alert.js',
  '../Libraries/Utilities/AlertIOS.js',
  '../Libraries/Animated/src/AnimatedImplementation.js',
  '../Libraries/AppRegistry/AppRegistry.js',
  '../Libraries/AppState/AppState.js',
  '../Libraries/Storage/AsyncStorage.js',
  '../Libraries/Utilities/BackAndroid.android.js',
  '../Libraries/CameraRoll/CameraRoll.js',
  '../Libraries/Components/Clipboard/Clipboard.js',
  '../Libraries/Components/DatePickerAndroid/DatePickerAndroid.android.js',
  '../Libraries/Utilities/Dimensions.js',
  '../Libraries/Components/Intent/IntentAndroid.android.js',
  '../Libraries/Interaction/InteractionManager.js',
  '../Libraries/LayoutAnimation/LayoutAnimation.js',
  '../Libraries/Linking/Linking.js',
  '../Libraries/LinkingIOS/LinkingIOS.js',
  '../Libraries/CustomComponents/ListView/ListViewDataSource.js',
  '../node_modules/react/lib/NativeMethodsMixin.js',
  '../Libraries/Network/NetInfo.js',
  '../Libraries/Interaction/PanResponder.js',
  '../Libraries/Utilities/PixelRatio.js',
  '../Libraries/PushNotificationIOS/PushNotificationIOS.js',
  '../Libraries/Components/StatusBar/StatusBarIOS.ios.js',
  '../Libraries/StyleSheet/StyleSheet.js',
  '../Libraries/Components/TimePickerAndroid/TimePickerAndroid.android.js',
  '../Libraries/Components/ToastAndroid/ToastAndroid.android.js',
  '../Libraries/Vibration/VibrationIOS.ios.js',
  '../Libraries/Vibration/Vibration.js',
];

const stylesWithPermalink = [
  '../Libraries/StyleSheet/LayoutPropTypes.js',
  '../Libraries/StyleSheet/TransformPropTypes.js',
  '../Libraries/Components/View/ShadowPropTypesIOS.js',
];

const stylesForEmbed = [
  '../Libraries/Components/View/ViewStylePropTypes.js',
  '../Libraries/Text/TextStylePropTypes.js',
  '../Libraries/Image/ImageStylePropTypes.js',
];

const polyfills = [
  '../Libraries/Geolocation/Geolocation.js',
];

const all = components
  .concat(apis)
  .concat(stylesWithPermalink)
  .concat(polyfills);

const styleDocs = stylesForEmbed.reduce(function(docs, filepath) {
  docs[path.basename(filepath).replace(path.extname(filepath), '')] =
    docgen.parse(
      fs.readFileSync(filepath),
      docgenHelpers.findExportedObject,
      [
        docgen.handlers.propTypeHandler,
        docgen.handlers.propTypeCompositionHandler,
        docgen.handlers.propDocBlockHandler,
      ]
    );

  return docs;
}, {});

module.exports = function() {
  componentCount = 0;
  return [].concat(
    components.map(renderComponent),
    apis.map(renderAPI('api')),
    stylesWithPermalink.map(renderStyle),
    polyfills.map(renderAPI('Polyfill'))
  );
};
