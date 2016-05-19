/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict';

const NavigationExperimental = require('NavigationExperimental');
const React = require('react');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableOpacity = require('TouchableOpacity');
const View = require('View');
const {
  Reducer: NavigationReducer,
} = NavigationExperimental;
const {
  JumpToAction,
} = NavigationReducer.TabsReducer;

const NavigationExampleTabBar = React.createClass({
  render: function() {
    return (
      <View style={styles.tabBar}>
        {this.props.tabs.map(this._renderTab)}
      </View>
    );
  },
  _renderTab: function(tab, index) {
    const textStyle = [styles.tabButtonText];
    if (this.props.index === index) {
      textStyle.push(styles.selectedTabButtonText);
    }
    return (
      <TouchableOpacity
        style={styles.tabButton}
        key={tab.key}
        onPress={() => {
          this.props.onNavigate(JumpToAction(index));
        }}>
        <Text style={textStyle}>
          {tab.key}
        </Text>
      </TouchableOpacity>
    );
  },
});

const styles = StyleSheet.create({
  tabBar: {
    height: 50,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
  },
  tabButtonText: {
    paddingTop: 20,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '500',
  },
  selectedTabButtonText: {
    color: 'blue',
  },
});

module.exports = NavigationExampleTabBar;
