/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TestIdTestModule
 */

'use strict';

var Image = require('Image');
var ProgressBarAndroid = require('ProgressBarAndroid');
var React = require('React');
var ScrollView = require('ScrollView');
var Picker = require('Picker');
var StyleSheet = require('StyleSheet');
var SwitchAndroid = require('SwitchAndroid');
var Text = require('Text');
var TextInput = require('TextInput');
var ToolbarAndroid = require('ToolbarAndroid');
var TouchableBounce = require('TouchableBounce');
var TouchableHighlight = require('TouchableHighlight');
var TouchableOpacity = require('TouchableOpacity');
var TouchableWithoutFeedback = require('TouchableWithoutFeedback');
var View = require('View');
var WebView = require('WebView');

/**
 * All the views implemented on Android, each with the testID property set.
 * We test that:
 * - The app renders fine
 * - The testID property is passed to the native views
 */
var TestIdTestApp = React.createClass({
  render: function() {
    return (
      <View>

        <Image
          testID="Image"
          source={{uri: 'data:image/gif;base64,' +
              'R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapy' +
              'uvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/' +
              'TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5' +
              'iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97V' +
              'riy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7'}}
          style={styles.base} />

        <ProgressBarAndroid
          testID="ProgressBar"
          styleAttr="Horizontal"
          style={styles.base} />

        <ScrollView
          testID="ScrollView"
          style={styles.base}>
          <Text testID="ScrollView Item (same id used for all items)">Item 1</Text>
          <Text testID="ScrollView Item (same id used for all items)">Item 2</Text>
        </ScrollView>

        <ScrollView
          testID="Horizontal ScrollView"
          horizontal={true}
          style={styles.base}>
          <Text testID="ScrollView Item (same id used for all items)">Item 1</Text>
          <Text testID="ScrollView Item (same id used for all items)">Item 2</Text>
        </ScrollView>

        <Picker
          testID="Dropdown Picker"
          mode={Picker.MODE_DROPDOWN}
          style={styles.base}>
          <Picker.Item label="Dropdown picker" value="key0" />
        </Picker>

        <Picker
          testID="Dialog Picker"
          mode={Picker.MODE_DIALOG}
          style={styles.base}>
          <Picker.Item label="Dialog picker" value="key0" />
        </Picker>

        <SwitchAndroid testID="Switch" value={true} />

        <Text testID="Text">text</Text>

        <ToolbarAndroid testID="Toolbar" style={styles.base} subtitle="toolbar" />

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

        {/*
          Webview gets tests crashing or stalling occasionally
          e.g. https://circleci.com/gh/facebook/react-native/7054
          TODO t11449130
          <WebView
          testID="WebView"
          url={'http://newsroom.fb.com'}
          renderError={() => <View /> }
          style={styles.base}
        />*/}

      </View>
    );
  },
});

var styles = StyleSheet.create({
  base: {
    width: 150,
    height: 50,
  },
});

module.exports = {
  TestIdTestApp: TestIdTestApp,
};
