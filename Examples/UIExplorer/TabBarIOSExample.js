/**
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
 *
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  TabBarIOS,
  Text,
  View,
} = React;

var base64Icon = 'data:image/jpeg;base64,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'

var TabBarExample = React.createClass({
  statics: {
    title: '<TabBarIOS>',
    description: 'Tab-based navigation.'
  },

  getInitialState: function() {
    return {
      selectedTab: 'redTab',
      notifCount: 0,
      presses: 0,
    };
  },

  _renderContent: function(color: string, pageText: string) {
    return (
      <View style={[styles.tabContent, {backgroundColor: color}]}>
        <Text style={styles.tabText}>{pageText}</Text>
        <Text style={styles.tabText}>{this.state.presses} re-renders of the More tab</Text>
      </View>
    );
  },

  render: function() {
    return (
      <TabBarIOS
        tintColor="black"
        barTintColor="#3abeff">
        <TabBarIOS.Item
          title="Blue Tab"
          icon = {{uri:{'path':base64Icon,'scale':3.0}}}
          selected={this.state.selectedTab === 'blueTab'}
          onPress={() => {
            this.setState({
              selectedTab: 'blueTab',
            });
          }}>
          {this._renderContent('#414A8C', 'Blue Tab')}
        </TabBarIOS.Item>
        <TabBarIOS.Item
          systemIcon="history"
          badge={this.state.notifCount > 0 ? this.state.notifCount : undefined}
          selected={this.state.selectedTab === 'redTab'}
          onPress={() => {
            this.setState({
              selectedTab: 'redTab',
              notifCount: this.state.notifCount + 1,
            });
          }}>
          {this._renderContent('#783E33', 'Red Tab')}
        </TabBarIOS.Item>
        <TabBarIOS.Item
          systemIcon="more"
          selected={this.state.selectedTab === 'greenTab'}
          onPress={() => {
            this.setState({
              selectedTab: 'greenTab',
              presses: this.state.presses + 1
            });
          }}>
          {this._renderContent('#21551C', 'Green Tab')}
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  },

});

var styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: 'white',
    margin: 50,
  },
});

module.exports = TabBarExample;
