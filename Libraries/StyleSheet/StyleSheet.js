/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule StyleSheet
 */
'use strict';

var ImageStylePropTypes = require('ImageStylePropTypes');
var ReactPropTypeLocations = require('ReactPropTypeLocations');
var StyleSheetRegistry = require('StyleSheetRegistry');
var TextStylePropTypes = require('TextStylePropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');

var invariant = require('invariant');

/**
 * A StyleSheet is an abstraction similar to CSS StyleSheets
 *
 * Create a new StyleSheet:
 *
 * var styles = StyleSheet.create({
 *   container: {
 *     borderRadius: 4,
 *     borderWidth: 0.5,
 *     borderColor: '#d6d7da',
 *   },
 *   title: {
 *     fontSize: 19,
 *     fontWeight: 'bold',
 *   },
 *   activeTitle: {
 *     color: 'red',
 *   },
 * })
 *
 * Use a StyleSheet:
 *
 * <View style={styles.container}>
 *   <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
 * </View>
 *
 * Code quality:
 *  - By moving styles away from the render function, you're making the code
 *  code easier to understand.
 *  - Naming the styles is a good way to add meaning to the low level components
 *  in the render function.
 *
 * Performance:
 *  - Making a stylesheet from a style object makes it possible to refer to it
 * by ID instead of creating a new style object every time.
 *  - It also allows to send the style only once through the bridge. All
 * subsequent uses are going to refer an id (not implemented yet).
 */
class StyleSheet {
  static create(obj) {
    var result = {};
    for (var key in obj) {
      StyleSheet.validateStyle(key, obj);
      result[key] = StyleSheetRegistry.registerStyle(obj[key]);
    }
    return result;
  }

  static validateStyleProp(prop, style, caller) {
    if (!__DEV__) {
      return;
    }
    if (allStylePropTypes[prop] === undefined) {
      var message1 = '"' + prop + '" is not a valid style property.';
      var message2 = '\nValid style props: ' +
        JSON.stringify(Object.keys(allStylePropTypes), null, '  ');
      styleError(message1, style, caller, message2);
    }
    var error = allStylePropTypes[prop](
      style,
      prop,
      caller,
      ReactPropTypeLocations.prop
    );
    if (error) {
      styleError(error.message, style, caller);
    }
  }

  static validateStyle(name, styles) {
    if (!__DEV__) {
      return;
    }
    for (var prop in styles[name]) {
      StyleSheet.validateStyleProp(prop, styles[name], 'StyleSheet ' + name);
    }
  }

  static addValidStylePropTypes(stylePropTypes) {
    for (var key in stylePropTypes) {
      invariant(
        allStylePropTypes[key] === undefined ||
          allStylePropTypes[key] === stylePropTypes[key],
        'Attemped to redefine existing style prop type "' + key + '".'
      );
      allStylePropTypes[key] = stylePropTypes[key];
    }
  }
}

var styleError = function(message1, style, caller, message2) {
  invariant(
    false,
    message1 + '\n' + (caller || '<<unknown>>') + ': ' +
    JSON.stringify(style, null, '  ') + (message2 || '')
  );
};

var allStylePropTypes = {};

StyleSheet.addValidStylePropTypes(ImageStylePropTypes);
StyleSheet.addValidStylePropTypes(TextStylePropTypes);
StyleSheet.addValidStylePropTypes(ViewStylePropTypes);

module.exports = StyleSheet;
