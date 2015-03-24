/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleSheet
 * @flow
 */
'use strict';

var StyleSheetRegistry = require('StyleSheetRegistry');
var StyleSheetValidation = require('StyleSheetValidation');

/**
 * A StyleSheet is an abstraction similar to CSS StyleSheets
 *
 * Create a new StyleSheet:
 *
 * ```
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
 * });
 * ```
 *
 * Use a StyleSheet:
 *
 * ```
 * <View style={styles.container}>
 *   <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
 * </View>
 * ```
 *
 * Code quality:
 *
 *  - By moving styles away from the render function, you're making the code
 *  code easier to understand.
 *  - Naming the styles is a good way to add meaning to the low level components
 *  in the render function.
 *
 * Performance:
 *
 *  - Making a stylesheet from a style object makes it possible to refer to it
 * by ID instead of creating a new style object every time.
 *  - It also allows to send the style only once through the bridge. All
 * subsequent uses are going to refer an id (not implemented yet).
 */
class StyleSheet {
  static create(obj: {[key: string]: any}): {[key: string]: number} {
    var result = {};
    for (var key in obj) {
      StyleSheetValidation.validateStyle(key, obj);
      result[key] = StyleSheetRegistry.registerStyle(obj[key]);
    }
    return result;
  }
}

module.exports = StyleSheet;
