/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');

const nativeImageSource = require('nativeImageSource');
const {StyleSheet, Text, View} = ReactNative;
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterPage = require('./RNTesterPage');

const Switch = require('Switch');
const ToolbarAndroid = require('ToolbarAndroid');

class ToolbarAndroidExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    actionText: 'Example app with toolbar component',
    toolbarSwitch: false,
    colorProps: {
      titleColor: '#3b5998',
      subtitleColor: '#6a7180',
    },
  };

  render() {
    return (
      <RNTesterPage title="<ToolbarAndroid>">
        <RNTesterBlock title="Toolbar with title/subtitle and actions">
          <ToolbarAndroid
            actions={toolbarActions}
            navIcon={nativeImageSource({
              android: 'ic_menu_black_24dp',
              width: 48,
              height: 48,
            })}
            onActionSelected={this._onActionSelected}
            onIconClicked={() => this.setState({actionText: 'Icon clicked'})}
            style={styles.toolbar}
            subtitle={this.state.actionText}
            title="Toolbar"
          />
          <Text>{this.state.actionText}</Text>
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with logo & custom title view (a View with Switch+Text)">
          <ToolbarAndroid
            logo={nativeImageSource({
              android: 'launcher_icon',
              width: 132,
              height: 144,
            })}
            style={styles.toolbar}>
            <View style={styles.switchWrapper}>
              <Switch
                value={this.state.toolbarSwitch}
                onValueChange={value => this.setState({toolbarSwitch: value})}
              />
              <Text>{"'Tis but a switch"}</Text>
            </View>
          </ToolbarAndroid>
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with no icon">
          <ToolbarAndroid
            actions={toolbarActions}
            style={styles.toolbar}
            subtitle="There be no icon here"
          />
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with navIcon & logo, no title">
          <ToolbarAndroid
            actions={toolbarActions}
            logo={nativeImageSource({
              android: 'launcher_icon',
              width: 132,
              height: 144,
            })}
            navIcon={nativeImageSource({
              android: 'ic_menu_black_24dp',
              width: 48,
              height: 48,
            })}
            style={styles.toolbar}
          />
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with custom title colors">
          <ToolbarAndroid
            navIcon={nativeImageSource({
              android: 'ic_menu_black_24dp',
              width: 48,
              height: 48,
            })}
            onIconClicked={() => this.setState({colorProps: {}})}
            title="Wow, such toolbar"
            style={styles.toolbar}
            subtitle="Much native"
            {...this.state.colorProps}
          />
          <Text>
            Touch the icon to reset the custom colors to the default
            (theme-provided) ones.
          </Text>
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with remote logo & navIcon">
          <ToolbarAndroid
            actions={[
              {title: 'Bunny', icon: require('./bunny.png'), show: 'always'},
            ]}
            logo={require('./hawk.png')}
            navIcon={require('./bunny.png')}
            title="Bunny and Hawk"
            style={styles.toolbar}
          />
        </RNTesterBlock>
        <RNTesterBlock title="Toolbar with custom overflowIcon">
          <ToolbarAndroid
            actions={toolbarActions}
            overflowIcon={require('./bunny.png')}
            style={styles.toolbar}
          />
        </RNTesterBlock>
      </RNTesterPage>
    );
  }

  _onActionSelected = position => {
    this.setState({
      actionText: 'Selected ' + toolbarActions[position].title,
    });
  };
}

const toolbarActions = [
  {
    title: 'Create',
    icon: nativeImageSource({
      android: 'ic_create_black_48dp',
      width: 96,
      height: 96,
    }),
    show: 'always',
  },
  {title: 'Filter'},
  {
    title: 'Settings',
    icon: nativeImageSource({
      android: 'ic_settings_black_48dp',
      width: 96,
      height: 96,
    }),
    show: 'always',
  },
];

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#e9eaed',
    height: 56,
  },
  switchWrapper: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

exports.title = '<ToolbarAndroid>';
exports.description = 'Examples of using the Android toolbar.';
exports.examples = [
  {
    title: 'Basic toolbar',
    render: function(): React.Element<typeof ToolbarAndroidExample> {
      return <ToolbarAndroidExample />;
    },
  },
];
