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
  AccessibilityInfo,
  Button,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  UIManager,
  findNodeHandle,
  Platform,
} = require('react-native');

const RNTesterBlock = require('../../components/RNTesterBlock');

class AccessibilityExample extends React.Component {
  render() {
    return (
      <View>
        <RNTesterBlock title="TextView without label">
          <Text>
            Text's accessibilityLabel is the raw text itself unless it is set
            explicitly.
          </Text>
        </RNTesterBlock>

        <RNTesterBlock title="TextView with label">
          <Text accessibilityLabel="I have label, so I read it instead of embedded text.">
            This text component's accessibilityLabel is set explicitly.
          </Text>
        </RNTesterBlock>

        <RNTesterBlock title="Nonaccessible view with TextViews">
          <View>
            <Text style={{color: 'green'}}>This is text one.</Text>
            <Text style={{color: 'blue'}}>This is text two.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews wihout label">
          <View accessible={true}>
            <Text style={{color: 'green'}}>This is text one.</Text>
            <Text style={{color: 'blue'}}>This is text two.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view with TextViews with label">
          <View
            accessible={true}
            accessibilityLabel="I have label, so I read it instead of embedded text.">
            <Text style={{color: 'green'}}>This is text one.</Text>
            <Text style={{color: 'blue'}}>This is text two.</Text>
          </View>
        </RNTesterBlock>

        {/* Android screen readers will say the accessibility hint instead of the text
        since the view doesn't have a label. */}
        <RNTesterBlock title="Accessible view with TextViews with hint">
          <View accessibilityHint="Accessibility hint." accessible={true}>
            <Text style={{color: 'green'}}>This is text one.</Text>
            <Text style={{color: 'blue'}}>This is text two.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Accessible view TextViews with label and hint">
          <View
            accessibilityLabel="Accessibility label."
            accessibilityHint="Accessibility hint."
            accessible={true}>
            <Text style={{color: 'green'}}>This is text one.</Text>
            <Text style={{color: 'blue'}}>This is text two.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Text with accessibilityRole = header">
          <Text accessibilityRole="header">This is a title.</Text>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = link">
          <TouchableOpacity
            onPress={() => Alert.alert('Link has been clicked!')}
            accessibilityRole="link">
            <View>
              <Text>Click me</Text>
            </View>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="Touchable with accessibilityRole = button">
          <TouchableOpacity
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button">
            <Text>Click me</Text>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="Disabled Touchable with role">
          <TouchableOpacity
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button"
            accessibilityState={{disabled: true}}
            disabled={true}>
            <View>
              <Text>
                I am disabled. Clicking me will not trigger any action.
              </Text>
            </View>
          </TouchableOpacity>
        </RNTesterBlock>

        <RNTesterBlock title="View with multiple states">
          <View
            accessible={true}
            accessibilityState={{selected: true, disabled: true}}>
            <Text>This view is selected and disabled.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with label, hint, role, and state">
          <View
            accessible={true}
            accessibilityLabel="Accessibility label."
            accessibilityRole="button"
            accessibilityState={{selected: true}}
            accessibilityHint="Accessibility hint.">
            <Text>Accessible view with label, hint, role, and state</Text>
          </View>
        </RNTesterBlock>
      </View>
    );
  }
}

class CheckboxExample extends React.Component {
  state = {
    checkboxState: true,
  };

  _onCheckboxPress = () => {
    let checkboxState = false;
    if (this.state.checkboxState === false) {
      checkboxState = 'mixed';
    } else if (this.state.checkboxState === 'mixed') {
      checkboxState = true;
    } else {
      checkboxState = false;
    }

    this.setState({
      checkboxState: checkboxState,
    });

    if (Platform.OS === 'android') {
      UIManager.sendAccessibilityEvent(
        findNodeHandle(this),
        UIManager.AccessibilityEventTypes.typeViewClicked,
      );
    }
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this._onCheckboxPress}
        accessibilityLabel="element 2"
        accessibilityRole="checkbox"
        accessibilityState={{checked: this.state.checkboxState}}
        accessibilityHint="click me to change state">
        <Text>Checkbox example</Text>
      </TouchableOpacity>
    );
  }
}

class SwitchExample extends React.Component {
  state = {
    switchState: true,
  };

  _onSwitchToggle = () => {
    const switchState = !this.state.switchState;

    this.setState({
      switchState: switchState,
    });

    if (Platform.OS === 'android') {
      UIManager.sendAccessibilityEvent(
        findNodeHandle(this),
        UIManager.AccessibilityEventTypes.typeViewClicked,
      );
    }
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this._onSwitchToggle}
        accessibilityLabel="element 12"
        accessibilityRole="switch"
        accessibilityState={{checked: this.state.switchState}}
        accessible={true}>
        <Text>Switch example</Text>
      </TouchableOpacity>
    );
  }
}

class SelectionExample extends React.Component {
  constructor(props) {
    super(props);
    this.selectableElement = React.createRef();
  }

  state = {
    isSelected: true,
    isEnabled: false,
  };

  render() {
    let accessibilityHint = 'click me to select';
    if (this.state.isSelected) {
      accessibilityHint = 'click me to unselect';
    }
    if (!this.state.isEnabled) {
      accessibilityHint = 'use the button on the right to enable selection';
    }
    let buttonTitle = this.state.isEnabled
      ? 'Disable selection'
      : 'Enable selection';

    return (
      <View style={{flex: 1, flexDirection: 'row'}}>
        <TouchableOpacity
          ref={this.selectableElement}
          accessible={true}
          onPress={() => {
            if (this.state.isEnabled) {
              this.setState({
                isSelected: !this.state.isSelected,
              });
            }

            if (Platform.OS === 'android') {
              UIManager.sendAccessibilityEvent(
                findNodeHandle(this.selectableElement.current),
                UIManager.AccessibilityEventTypes.typeViewClicked,
              );
            }
          }}
          accessibilityLabel="element 19"
          accessibilityState={{
            selected: this.state.isSelected,
            disabled: !this.state.isEnabled,
          }}
          accessibilityHint={accessibilityHint}>
          <Text>Selectable element example</Text>
        </TouchableOpacity>
        <Button
          onPress={() => {
            this.setState({
              isEnabled: !this.state.isEnabled,
            });
          }}
          title={buttonTitle}
        />
      </View>
    );
  }
}

class ExpandableElementExample extends React.Component {
  state = {
    expandState: false,
  };

  _onElementPress = () => {
    const expandState = !this.state.expandState;

    this.setState({
      expandState: expandState,
    });

    if (Platform.OS === 'android') {
      UIManager.sendAccessibilityEvent(
        findNodeHandle(this),
        UIManager.AccessibilityEventTypes.typeViewClicked,
      );
    }
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this._onElementPress}
        accessibilityLabel="element 18"
        accessibilityState={{expanded: this.state.expandState}}
        accessibilityHint="click me to change state">
        <Text>Expandable element example</Text>
      </TouchableOpacity>
    );
  }
}

class AccessibilityRoleAndStateExample extends React.Component<{}> {
  render() {
    return (
      <View>
        <View
          accessibilityLabel="element 1"
          accessibilityRole="alert"
          accessible={true}>
          <Text>Alert example</Text>
        </View>
        <CheckboxExample />
        <View
          accessibilityLabel="element 3"
          accessibilityRole="combobox"
          accessible={true}>
          <Text>Combobox example</Text>
        </View>
        <View
          accessibilityLabel="element 4"
          accessibilityRole="menu"
          accessible={true}>
          <Text>Menu example</Text>
        </View>
        <View
          accessibilityLabel="element 5"
          accessibilityRole="menubar"
          accessible={true}>
          <Text>Menu bar example</Text>
        </View>
        <View
          accessibilityLabel="element 6"
          accessibilityRole="menuitem"
          accessible={true}>
          <Text>Menu item example</Text>
        </View>
        <View
          accessibilityLabel="element 7"
          accessibilityRole="progressbar"
          accessible={true}>
          <Text>Progress bar example</Text>
        </View>
        <View
          accessibilityLabel="element 8"
          accessibilityRole="radio"
          accessible={true}>
          <Text>Radio button example</Text>
        </View>
        <View
          accessibilityLabel="element 9"
          accessibilityRole="radiogroup"
          accessible={true}>
          <Text>Radio group example</Text>
        </View>
        <View
          accessibilityLabel="element 10"
          accessibilityRole="scrollbar"
          accessible={true}>
          <Text>Scrollbar example</Text>
        </View>
        <View
          accessibilityLabel="element 11"
          accessibilityRole="spinbutton"
          accessible={true}>
          <Text>Spin button example</Text>
        </View>
        <SwitchExample />
        <View
          accessibilityLabel="element 13"
          accessibilityRole="tab"
          accessible={true}>
          <Text>Tab example</Text>
        </View>
        <View
          accessibilityLabel="element 14"
          accessibilityRole="tablist"
          accessible={true}>
          <Text>Tab list example</Text>
        </View>
        <View
          accessibilityLabel="element 15"
          accessibilityRole="timer"
          accessible={true}>
          <Text>Timer example</Text>
        </View>
        <View
          accessibilityLabel="element 16"
          accessibilityRole="toolbar"
          accessible={true}>
          <Text>Toolbar example</Text>
        </View>
        <View
          accessibilityLabel="element 17"
          accessibilityState={{busy: true}}
          accessible={true}>
          <Text>State busy example</Text>
        </View>
        <ExpandableElementExample />
        <SelectionExample />
      </View>
    );
  }
}

class AccessibilityActionsExample extends React.Component {
  render() {
    return (
      <View>
        <RNTesterBlock title="Non-touchable with activate action">
          <View
            accessible={true}
            accessibilityActions={[{name: 'activate'}]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'View is clicked');
                  break;
              }
            }}>
            <Text>Click me</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="View with multiple actions">
          <View
            accessible={true}
            accessibilityActions={[
              {name: 'cut', label: 'cut label'},
              {name: 'copy', label: 'copy label'},
              {name: 'paste', label: 'paste label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'cut':
                  Alert.alert('Alert', 'cut action success');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
                case 'paste':
                  Alert.alert('Alert', 'paste action success');
                  break;
              }
            }}>
            <Text>This view supports many actions.</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Adjustable with increment/decrement actions">
          <View
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'increment':
                  Alert.alert('Alert', 'increment action success');
                  break;
                case 'decrement':
                  Alert.alert('Alert', 'decrement action success');
                  break;
              }
            }}>
            <Text>Slider</Text>
          </View>
        </RNTesterBlock>

        <RNTesterBlock title="Button with custom accessibility actions">
          <TouchableWithoutFeedback
            accessible={true}
            accessibilityActions={[
              {name: 'cut', label: 'cut label'},
              {name: 'copy', label: 'copy label'},
              {name: 'paste', label: 'paste label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'cut':
                  Alert.alert('Alert', 'cut action success');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
                case 'paste':
                  Alert.alert('Alert', 'paste action success');
                  break;
              }
            }}
            onPress={() => Alert.alert('Button has been pressed!')}
            accessibilityRole="button">
            <View>
              <Text>Click me</Text>
            </View>
          </TouchableWithoutFeedback>
        </RNTesterBlock>
      </View>
    );
  }
}
class ScreenReaderStatusExample extends React.Component<{}> {
  state = {
    screenReaderEnabled: false,
  };

  componentDidMount() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleScreenReaderToggled,
    );
    AccessibilityInfo.fetch().done(isEnabled => {
      this.setState({
        screenReaderEnabled: isEnabled,
      });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleScreenReaderToggled,
    );
  }

  _handleScreenReaderToggled = isEnabled => {
    this.setState({
      screenReaderEnabled: isEnabled,
    });
  };

  render() {
    return (
      <View>
        <Text>
          The screen reader is{' '}
          {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
        </Text>
      </View>
    );
  }
}

class AnnounceForAccessibility extends React.Component<{}> {
  _handleOnPress = () =>
    AccessibilityInfo.announceForAccessibility('Announcement Test');

  render() {
    return (
      <View>
        <Button
          onPress={this._handleOnPress}
          title="Announce for Accessibility"
        />
      </View>
    );
  }
}

exports.title = 'Accessibility';
exports.description = 'Examples of using Accessibility APIs.';
exports.examples = [
  {
    title: 'Accessibility elements',
    render(): React.Element<typeof AccessibilityExample> {
      return <AccessibilityExample />;
    },
  },
  {
    title: 'New accessibility roles and states',
    render(): React.Element<typeof AccessibilityRoleAndStateExamples> {
      return <AccessibilityRoleAndStateExample />;
    },
  },
  {
    title: 'Accessibility action examples',
    render(): React.Element<typeof AccessibilityActionsExample> {
      return <AccessibilityActionsExample />;
    },
  },
  {
    title: 'Check if the screen reader is enabled',
    render(): React.Element<typeof ScreenReaderStatusExample> {
      return <ScreenReaderStatusExample />;
    },
  },
  {
    title: 'Check if the screen reader announces',
    render(): React.Element<typeof AnnounceForAccessibility> {
      return <AnnounceForAccessibility />;
    },
  },
];
