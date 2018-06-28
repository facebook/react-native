/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Image = require('Image');
const React = require('React');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TextInput = require('TextInput');
const TouchableBounce = require('TouchableBounce');
const TouchableHighlight = require('TouchableHighlight');
const TouchableOpacity = require('TouchableOpacity');
const TouchableWithoutFeedback = require('TouchableWithoutFeedback');
const View = require('View');

/**
 * All the views implemented on Android, each with the nativeID property set.
 * We test that:
 * - The app renders fine
 * - The nativeID property is passed to the native views
 */
class NativeIdTestApp extends React.Component<{}> {
  render() {
    const uri =
      'data:image/gif;base64,' +
      'R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapy' +
      'uvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/' +
      'TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5' +
      'iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97V' +
      'riy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7';
    return (
      <View>
        <Image nativeID="Image" source={{uri: uri}} style={styles.base} />
        <Text nativeID="Text">text</Text>
        <TextInput nativeID="TextInput" value="Text input" />
        <TouchableBounce nativeID="TouchableBounce">
          <Text>TouchableBounce</Text>
        </TouchableBounce>
        <TouchableHighlight nativeID="TouchableHighlight">
          <Text>TouchableHighlight</Text>
        </TouchableHighlight>
        <TouchableOpacity nativeID="TouchableOpacity">
          <Text>TouchableOpacity</Text>
        </TouchableOpacity>
        <TouchableWithoutFeedback nativeID="TouchableWithoutFeedback">
          <View>
            <Text>TouchableWithoutFeedback</Text>
          </View>
        </TouchableWithoutFeedback>
        <View nativeID="View" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  base: {
    width: 150,
    height: 50,
  },
});

module.exports = {
  NativeIdTestApp: NativeIdTestApp,
};
