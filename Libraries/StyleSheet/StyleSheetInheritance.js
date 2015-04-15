/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleSheetInheritance
 * @flow
 */

var _ = require( 'underscore' );

/**
 * The StyleSheetInheritance object can be used to resolve StyleSheetInheritance.
 *
 * Instead of writing:
 *```javascript
 *  var styles = StyleSheet.create( {
 *    viewStyle: {
 *      marginTop: 5,
 *      marginBottom: 5,
 *      backgroundColor: '#bbbbbb',
 *      flex: 1
 *    },
 *    viewStyleEdit: {
 *      marginTop: 20,
 *      marginBottom: 5,
 *      backgroundColor: '#fffffff',
 *      flex: 1
 *    }
 *  });
 *```
 *
 *  You can simplify to:
 *   ```javascript
 *   var styles = StyleSheet.create( {
 *    viewStyle: {
 *      marginTop: 5,
 *      marginBottom: 5,
 *      backgroundColor: '#bbbbbb',
 *      flex: 1
 *    },
 *    viewStyleEdit: ["viewStyle". {
 *      marginTop: 20,
 *      backgroundColor: '#fffffff'
 *    } ]
 *  }); *
 *  ```
 *
 *  The StyleSheetInheritance takes care of resolving these dependencies.
 *
 */
class StyleSheetInheritance {
  static resolve( name, styles ) {
    if (!_.isArray( styles[name])) {
      return styles[name];
    }

    var resultStyle = {};

    var parentObjects = [];
    for (var index in styles[name]) {
      var parentName = styles[name][index];
      if (typeof parentName === 'string') {
        if (styles.hasOwnProperty(parentName)) {
          _.extend(resultStyle, styles[parentName]);
        }
      }
    }
    _.extend(resultStyle, _.last(styles[name]));

    return resultStyle;
  }
}

module.exports = StyleSheetInheritance;