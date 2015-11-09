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
  Text,
  View,
} = React;
var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var SwitchAndroid = require('SwitchAndroid');
var ToolbarAndroid = require('ToolbarAndroid');

var ToolbarAndroidExample = React.createClass({
  statics: {
    title: '<ToolbarAndroid>',
    description: 'Examples of using the Android toolbar.'
  },
  getInitialState: function() {
    return {
      actionText: 'Example app with toolbar component',
      toolbarSwitch: false,
      colorProps: {
        titleColor: '#3b5998',
        subtitleColor: '#6a7180',
      },
    };
  },
  render: function() {
    return (
      <UIExplorerPage title="<ToolbarAndroid>">
        <UIExplorerBlock title="Toolbar with title/subtitle and actions">
          <ToolbarAndroid
            actions={toolbarActions}
            navIcon={require('image!ic_menu_black_24dp')}
            onActionSelected={this._onActionSelected}
            onIconClicked={() => this.setState({actionText: 'Icon clicked'})}
            style={styles.toolbar}
            subtitle={this.state.actionText}
            title="Toolbar" />
          <Text>{this.state.actionText}</Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with logo & custom title view (a View with Switch+Text)">
          <ToolbarAndroid
            logo={require('image!launcher_icon')}
            style={styles.toolbar}>
            <View style={{height: 56, flexDirection: 'row', alignItems: 'center'}}>
              <SwitchAndroid
                value={this.state.toolbarSwitch}
                onValueChange={(value) => this.setState({'toolbarSwitch': value})} />
              <Text>{'\'Tis but a switch'}</Text>
            </View>
          </ToolbarAndroid>
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with no icon">
          <ToolbarAndroid
            actions={toolbarActions}
            style={styles.toolbar}
            subtitle="There be no icon here" />
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with navIcon & logo, no title">
          <ToolbarAndroid
            actions={toolbarActions}
            logo={require('image!launcher_icon')}
            navIcon={require('image!ic_menu_black_24dp')}
            style={styles.toolbar} />
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with custom title colors">
          <ToolbarAndroid
            navIcon={require('image!ic_menu_black_24dp')}
            onIconClicked={() => this.setState({colorProps: {}})}
            title="Wow, such toolbar"
            style={styles.toolbar}
            subtitle="Much native"
            {...this.state.colorProps} />
          <Text>
            Touch the icon to reset the custom colors to the default (theme-provided) ones.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with remote logo & navIcon">
          <ToolbarAndroid
            actions={[{title: 'Bunny', icon: require('./bunny.png'), show: 'always'}]}
            logo={require('./hawk.png')}
            navIcon={require('./bunny.png')}
            title="Bunny and Hawk"
            style={styles.toolbar} />
        </UIExplorerBlock>
        <UIExplorerBlock title="Toolbar with custom overflowIcon">
          <ToolbarAndroid
            actions={toolbarActions}
            overflowIcon={require('./bunny.png')}
            style={styles.toolbar} />
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
  _onActionSelected: function(position) {
    this.setState({
      actionText: 'Selected ' + toolbarActions[position].title,
    });
  },
});

var toolbarActions = [
  {title: 'Create', icon: require('image!ic_create_black_48dp'), show: 'always'},
  {title: 'Filter'},
  {title: 'Settings', icon: require('image!ic_settings_black_48dp'), show: 'always'},
];

var styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#e9eaed',
    height: 56,
  },
});

module.exports = ToolbarAndroidExample;
