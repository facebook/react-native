/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} = require('react-native');
const TouchableBounce = require('react-native/Libraries/Components/Touchable/TouchableBounce');

/**
 * All the views implemented on Android, each with the testID property set.
 * We test that:
 * - The app renders fine
 * - The testID property is passed to the native views
 */
class TestIdTestApp extends React.Component {
  render() {
    return (
      <View>
        <Image
          testID="Image"
          source={{
            uri:
              'data:image/gif;base64,' +
              'R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapy' +
              'uvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/' +
              'TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5' +
              'iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97V' +
              'riy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
          }}
          style={styles.base}
        />

        <Text testID="Text">text</Text>

        <TextInput testID="TextInput" value="Text input" />

        <TouchableBounce testID="TouchableBounce">
          <Text>TouchableBounce</Text>
        </TouchableBounce>

        <TouchableHighlight testID="TouchableHighlight">
          <Text>TouchableHighlight</Text>
        </TouchableHighlight>

        <TouchableOpacity testID="TouchableOpacity">
          <Text>TouchableOpacity</Text>
        </TouchableOpacity>

        <TouchableWithoutFeedback testID="TouchableWithoutFeedback">
          <View>
            <Text>TouchableWithoutFeedback</Text>
          </View>
        </TouchableWithoutFeedback>

        <View testID="View" />
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
  TestIdTestApp: TestIdTestApp,
};
