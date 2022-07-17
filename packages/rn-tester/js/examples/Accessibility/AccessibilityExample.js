/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes';

const React = require('react');
const {
  AccessibilityInfo,
  TextInput,
  Button,
  Image,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  StyleSheet,
  Slider,
  Platform,
} = require('react-native');
import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

const RNTesterBlock = require('../../components/RNTesterBlock');

const checkImageSource = require('./check.png');
const uncheckImageSource = require('./uncheck.png');
const mixedCheckboxImageSource = require('./mixed.png');
const {createRef} = require('react');

const styles = StyleSheet.create({
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  touchable: {
    backgroundColor: 'blue',
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    borderStyle: 'solid',
  },
  image: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  disabledImage: {
    width: 120,
    height: 120,
  },
  containerAlignCenter: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
});

class AccessibilityExample extends React.Component<{}> {
  render(): React.Node {
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

        <RNTesterBlock title="Disabled TouchableOpacity">
          <TouchableOpacity
            onPress={() => Alert.alert('Disabled Button has been pressed!')}
            accessibilityLabel={'You are pressing Disabled TouchableOpacity'}
            accessibilityState={{disabled: true}}>
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

        <RNTesterBlock title="TextInput with accessibilityLabelledBy attribute">
          <View>
            <Text nativeID="formLabel1">Mail Address</Text>
            <TextInput
              accessibilityLabel="input test1"
              accessibilityLabelledBy="formLabel1"
              style={styles.default}
            />
            <Text nativeID="formLabel2">First Name</Text>
            <TextInput
              accessibilityLabel="input test2"
              accessibilityLabelledBy={['formLabel2', 'formLabel3']}
              style={styles.default}
              value="Foo"
            />
          </View>
        </RNTesterBlock>
      </View>
    );
  }
}

class CheckboxExample extends React.Component<
  {},
  {
    checkboxState: boolean | 'mixed',
  },
> {
  state = {
    checkboxState: true,
  };

  _onCheckboxPress = () => {
    let checkboxState: boolean | $TEMPORARY$string<'mixed'> = false;
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

class SwitchExample extends React.Component<
  {},
  {
    switchState: boolean,
  },
> {
  state = {
    switchState: true,
  };

  _onSwitchToggle = () => {
    const switchState = !this.state.switchState;

    this.setState({
      switchState: switchState,
    });
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

class SelectionExample extends React.Component<
  {},
  {
    isSelected: boolean,
    isEnabled: boolean,
  },
> {
  constructor(props: {}) {
    super(props);
    this.selectableElement = createRef();
  }
  selectableElement: {
    current: React.ElementRef<typeof TouchableOpacity> | null,
  };

  state = {
    isSelected: true,
    isEnabled: false,
  };

  render(): React.Node {
    const {isSelected, isEnabled} = this.state;
    let accessibilityHint = 'click me to select';
    if (isSelected) {
      accessibilityHint = 'click me to unselect';
    }
    if (!isEnabled) {
      accessibilityHint = 'use the button on the right to enable selection';
    }
    let buttonTitle = isEnabled ? 'Disable selection' : 'Enable selection';
    const touchableHint = ` (touching the TouchableOpacity will ${
      isSelected ? 'disable' : 'enable'
    } accessibilityState.selected)`;
    return (
      <View style={styles.containerAlignCenter}>
        <TouchableOpacity
          ref={this.selectableElement}
          accessible={true}
          onPress={() => {
            if (isEnabled) {
              this.setState({
                isSelected: !isSelected,
              });
            } else {
              console.warn('selection is disabled, please enable selection.');
            }
          }}
          accessibilityLabel="element 19"
          accessibilityState={{
            selected: isSelected,
            disabled: !isEnabled,
          }}
          style={styles.touchable}
          accessibilityHint={accessibilityHint}>
          <Text style={{color: 'white'}}>
            {`Selectable TouchableOpacity Example ${touchableHint}`}
          </Text>
        </TouchableOpacity>
        <TextInput
          accessibilityLabel="element 20"
          accessibilityState={{
            selected: isSelected,
          }}
          multiline={true}
          placeholder={`TextInput Example - ${
            isSelected ? 'enabled' : 'disabled'
          } selection`}
        />
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

class ExpandableElementExample extends React.Component<
  {},
  {
    expandState: boolean,
  },
> {
  state = {
    expandState: false,
  };

  _onElementPress = () => {
    const expandState = !this.state.expandState;

    this.setState({
      expandState: expandState,
    });
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

class NestedCheckBox extends React.Component<
  {},
  {
    checkbox1: boolean | 'mixed',
    checkbox2: boolean | 'mixed',
    checkbox3: boolean | 'mixed',
  },
> {
  state = {
    checkbox1: false,
    checkbox2: false,
    checkbox3: false,
  };

  _onPress1 = () => {
    let checkbox1 = false;
    if (this.state.checkbox1 === false) {
      checkbox1 = true;
    } else if (this.state.checkbox1 === 'mixed') {
      checkbox1 = false;
    } else {
      checkbox1 = false;
    }
    setTimeout(() => {
      this.setState({
        checkbox1: checkbox1,
        checkbox2: checkbox1,
        checkbox3: checkbox1,
      });
    }, 2000);
  };

  _onPress2 = () => {
    const checkbox2 = !this.state.checkbox2;

    this.setState({
      checkbox2: checkbox2,
      checkbox1:
        checkbox2 && this.state.checkbox3
          ? true
          : checkbox2 || this.state.checkbox3
          ? 'mixed'
          : false,
    });
  };

  _onPress3 = () => {
    const checkbox3 = !this.state.checkbox3;

    this.setState({
      checkbox3: checkbox3,
      checkbox1:
        this.state.checkbox2 && checkbox3
          ? true
          : this.state.checkbox2 || checkbox3
          ? 'mixed'
          : false,
    });
  };

  render() {
    return (
      <View>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress1}
          accessibilityLabel="Meat"
          accessibilityHint="State changes in 2 seconds after clicking."
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox1}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox1 === 'mixed'
                ? mixedCheckboxImageSource
                : this.state.checkbox1
                ? checkImageSource
                : uncheckImageSource
            }
          />
          <Text>Meat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress2}
          accessibilityLabel="Beef"
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox2}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox2 ? checkImageSource : uncheckImageSource
            }
          />
          <Text>Beef</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row'}}
          onPress={this._onPress3}
          accessibilityLabel="Bacon"
          accessibilityRole="checkbox"
          accessibilityState={{checked: this.state.checkbox3}}>
          <Image
            style={styles.image}
            source={
              this.state.checkbox3 ? checkImageSource : uncheckImageSource
            }
          />
          <Text>Bacon</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

class AccessibilityRoleAndStateExample extends React.Component<{}> {
  render(): React.Node {
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
        <RNTesterBlock title="Nested checkbox with delayed state change">
          <NestedCheckBox />
        </RNTesterBlock>
      </View>
    );
  }
}

class AccessibilityActionsExample extends React.Component<{}> {
  render(): React.Node {
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

        <RNTesterBlock title="TouchableWithoutFeedback with custom accessibility actions">
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

        <RNTesterBlock title="Button with accessibility actions">
          <Button
            accessible={true}
            accessibilityActions={[
              {name: 'activate', label: 'activate label'},
              {name: 'copy', label: 'copy label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'Activate accessiblity action');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
              }
            }}
            onPress={() => Alert.alert('Button has been pressed!')}
            title="Button with accessiblity action"
          />
        </RNTesterBlock>

        <RNTesterBlock title="Text with custom accessibility actions">
          <Text
            accessible={true}
            accessibilityActions={[
              {name: 'activate', label: 'activate label'},
              {name: 'copy', label: 'copy label'},
            ]}
            onAccessibilityAction={event => {
              switch (event.nativeEvent.actionName) {
                case 'activate':
                  Alert.alert('Alert', 'Activate accessiblity action');
                  break;
                case 'copy':
                  Alert.alert('Alert', 'copy action success');
                  break;
              }
            }}>
            Text
          </Text>
        </RNTesterBlock>
      </View>
    );
  }
}

function SliderAccessibilityExample(): React.Node {
  return (
    <View>
      <RNTesterBlock
        title="Disabled Slider via disabled"
        description="Verify with TalkBack/VoiceOver announces Slider as disabled">
        <Slider value={25} maximumValue={100} minimumValue={0} disabled />
      </RNTesterBlock>
      <RNTesterBlock
        title="Disabled Slider via accessibiltyState"
        description="Verify with TalkBack/VoiceOver announces Slider as disabled">
        <Slider
          value={75}
          maximumValue={100}
          minimumValue={0}
          accessibilityState={{disabled: true}}
        />
      </RNTesterBlock>
      <RNTesterBlock
        title="Selected Slider"
        description="Verify with TalkBack/VoiceOver announces Slider as selected">
        <Slider
          value={75}
          maximumValue={100}
          minimumValue={0}
          accessibilityState={{selected: true}}
        />
      </RNTesterBlock>
    </View>
  );
}

type FakeSliderExampleState = {
  current: number,
  textualValue: 'center' | 'left' | 'right',
};
class FakeSliderExample extends React.Component<{}, FakeSliderExampleState> {
  state: FakeSliderExampleState = {
    current: 50,
    textualValue: 'center',
  };

  increment: () => void = () => {
    let newValue = this.state.current + 2;
    if (newValue > 100) {
      newValue = 100;
    }
    this.setState({
      current: newValue,
    });
  };

  decrement: () => void = () => {
    let newValue = this.state.current - 2;
    if (newValue < 0) {
      newValue = 0;
    }
    this.setState({
      current: newValue,
    });
  };

  render(): React.Node {
    return (
      <View>
        <View
          accessible={true}
          accessibilityLabel="Fake Slider"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                this.increment();
                break;
              case 'decrement':
                this.decrement();
                break;
            }
          }}
          accessibilityValue={{
            min: 0,
            now: this.state.current,
            max: 100,
          }}>
          <Text>Fake Slider</Text>
        </View>
        <TouchableWithoutFeedback
          accessible={true}
          accessibilityLabel="Equalizer"
          accessibilityRole="adjustable"
          accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
          onAccessibilityAction={event => {
            switch (event.nativeEvent.actionName) {
              case 'increment':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'right'});
                } else if (this.state.textualValue === 'left') {
                  this.setState({textualValue: 'center'});
                }
                break;
              case 'decrement':
                if (this.state.textualValue === 'center') {
                  this.setState({textualValue: 'left'});
                } else if (this.state.textualValue === 'right') {
                  this.setState({textualValue: 'center'});
                }
                break;
            }
          }}
          accessibilityValue={{text: this.state.textualValue}}>
          <View>
            <Text>Equalizer</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

class AnnounceForAccessibility extends React.Component<{}> {
  _handleOnPress = () =>
    setTimeout(
      () => AccessibilityInfo.announceForAccessibility('Announcement Test'),
      1000,
    );

  _handleOnPressQueued = () =>
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Queued Announcement Test',
          {queue: true},
        ),
      1000,
    );

  _handleOnPressQueueMultiple = () => {
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'First Queued Announcement Test',
          {queue: true},
        ),
      1000,
    );
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Second Queued Announcement Test',
          {queue: true},
        ),
      1100,
    );
    setTimeout(
      () =>
        AccessibilityInfo.announceForAccessibilityWithOptions(
          'Third Queued Announcement Test',
          {queue: true},
        ),
      1200,
    );
  };

  render(): React.Node {
    return Platform.OS === 'ios' ? (
      <View>
        <Button
          onPress={this._handleOnPress}
          title="Announce for Accessibility Immediately"
        />
        <Button
          onPress={this._handleOnPressQueued}
          title="Announce for Accessibility Queued"
        />
        <Button
          onPress={this._handleOnPressQueueMultiple}
          title="Announce for Accessibility Queue Multiple"
        />
      </View>
    ) : (
      <View>
        <Button
          onPress={this._handleOnPress}
          title="Announce for Accessibility"
        />
      </View>
    );
  }
}

function SetAccessibilityFocusExample(props: {}): React.Node {
  const myRef = React.useRef<?React.ElementRef<typeof Text>>(null);

  const onPress = () => {
    if (myRef && myRef.current) {
      AccessibilityInfo.sendAccessibilityEvent_unstable(myRef.current, 'focus');
    }
  };

  return (
    <View>
      <Text ref={myRef}>
        SetAccessibilityFocus on native element. This should get focus after
        clicking the button!
      </Text>
      <Button title={'Click'} onPress={onPress} />
    </View>
  );
}

class EnabledExamples extends React.Component<{}> {
  render(): React.Node {
    return (
      <View>
        {Platform.OS === 'ios' ? (
          <>
            <RNTesterBlock title="isBoldTextEnabled()">
              <EnabledExample
                test="bold text"
                eventListener="boldTextChanged"
              />
            </RNTesterBlock>
            <RNTesterBlock title="isGrayScaleEnabled()">
              <EnabledExample
                test="gray scale"
                eventListener="grayscaleChanged"
              />
            </RNTesterBlock>
            <RNTesterBlock title="isInvertColorsEnabled()">
              <EnabledExample
                test="invert colors"
                eventListener="invertColorsChanged"
              />
            </RNTesterBlock>
            <RNTesterBlock title="isReduceTransparencyEnabled()">
              <EnabledExample
                test="reduce transparency"
                eventListener="reduceTransparencyChanged"
              />
            </RNTesterBlock>
          </>
        ) : null}

        {Platform.OS === 'android' ? (
          <RNTesterBlock
            title="isAccessibilityServiceEnabled()"
            description={
              'Event emitted whenever an accessibility service is enabled. This includes TalkBack as well as assistive technologies such as "Select to Speak".'
            }>
            <EnabledExample
              test="any accessibility service"
              eventListener="accessibilityServiceChanged"
            />
          </RNTesterBlock>
        ) : null}

        <RNTesterBlock title="isReduceMotionEnabled()">
          <EnabledExample
            test="reduce motion"
            eventListener="reduceMotionChanged"
          />
        </RNTesterBlock>

        <RNTesterBlock title="isScreenReaderEnabled()">
          <EnabledExample
            test="screen reader"
            eventListener="screenReaderChanged"
          />
        </RNTesterBlock>
      </View>
    );
  }
}

class EnabledExample extends React.Component<
  {
    eventListener:
      | 'reduceMotionChanged'
      | 'boldTextChanged'
      | 'grayscaleChanged'
      | 'invertColorsChanged'
      | 'reduceTransparencyChanged'
      | 'reduceMotionChanged'
      | 'screenReaderChanged'
      | 'accessibilityServiceChanged',
    test: string,
  },
  {
    isEnabled: boolean,
  },
> {
  state = {
    isEnabled: false,
  };
  _subscription: EventSubscription;
  componentDidMount() {
    this._subscription = AccessibilityInfo.addEventListener(
      this.props.eventListener,
      this._handleToggled,
    );

    switch (this.props.eventListener) {
      case 'reduceMotionChanged':
        return AccessibilityInfo.isReduceMotionEnabled().then(state => {
          this.setState({isEnabled: state});
        });
      case 'accessibilityServiceChanged':
        return AccessibilityInfo.isAccessibilityServiceEnabled().then(state => {
          this.setState({isEnabled: state});
        });
      default:
        return null;
    }
  }

  componentWillUnmount() {
    this._subscription?.remove();
  }

  _handleToggled = (isEnabled: void | PressEvent | boolean) => {
    if (!this.state.isEnabled) {
      this.setState({isEnabled: true});
    } else {
      this.setState({isEnabled: false});
    }
  };

  render(): React.Node {
    return (
      <View>
        <Text>
          The {this.props.test} is{' '}
          {this.state.isEnabled ? 'enabled' : 'disabled'}
        </Text>
        <Button
          title={this.state.isEnabled ? 'disable' : 'enable'}
          onPress={this._handleToggled}
        />
      </View>
    );
  }
}

class DisplayOptionsStatusExample extends React.Component<{}> {
  render(): React.Node {
    const isAndroid = Platform.OS === 'android';
    return (
      <View>
        <DisplayOptionStatusExample
          optionName={'Reduce Motion'}
          optionChecker={AccessibilityInfo.isReduceMotionEnabled}
          notification={'reduceMotionChanged'}
        />
        <DisplayOptionStatusExample
          optionName={'Screen Reader'}
          optionChecker={AccessibilityInfo.isScreenReaderEnabled}
          notification={'screenReaderChanged'}
        />
        {isAndroid ? null : (
          <>
            <DisplayOptionStatusExample
              optionName={'Bold Text'}
              optionChecker={AccessibilityInfo.isBoldTextEnabled}
              notification={'boldTextChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Grayscale'}
              optionChecker={AccessibilityInfo.isGrayscaleEnabled}
              notification={'grayscaleChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Invert Colors'}
              optionChecker={AccessibilityInfo.isInvertColorsEnabled}
              notification={'invertColorsChanged'}
            />
            <DisplayOptionStatusExample
              optionName={'Reduce Transparency'}
              optionChecker={AccessibilityInfo.isReduceTransparencyEnabled}
              notification={'reduceTransparencyChanged'}
            />
          </>
        )}
      </View>
    );
  }
}

function DisplayOptionStatusExample({
  optionName,
  optionChecker,
  notification,
}: {
  notification: string,
  optionChecker: () => Promise<boolean>,
  optionName: string,
}) {
  const [statusEnabled, setStatusEnabled] = React.useState(false);
  React.useEffect(() => {
    const listener = AccessibilityInfo.addEventListener(
      // $FlowFixMe[prop-missing]
      notification,
      setStatusEnabled,
    );
    optionChecker().then(isEnabled => {
      setStatusEnabled(isEnabled);
    });
    return function cleanup() {
      listener.remove();
    };
  }, [optionChecker, notification]);
  return (
    <View>
      <Text>
        {optionName}
        {' is '}
        {statusEnabled ? 'enabled' : 'disabled'}.
      </Text>
    </View>
  );
}

exports.title = 'Accessibility';
exports.documentationURL = 'https://reactnative.dev/docs/accessibilityinfo';
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
    render(): React.Element<typeof AccessibilityRoleAndStateExample> {
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
    title: 'Slider Accessibility Examples',
    render(): React.Element<typeof SliderAccessibilityExample> {
      return <SliderAccessibilityExample />;
    },
  },
  {
    title: 'Fake Slider Example',
    render(): React.Element<typeof FakeSliderExample> {
      return <FakeSliderExample />;
    },
  },
  {
    title: 'Check if the display options are enabled',
    render(): React.Element<typeof DisplayOptionsStatusExample> {
      return <DisplayOptionsStatusExample />;
    },
  },
  {
    title: 'Check if the screen reader announces',
    render(): React.Element<typeof AnnounceForAccessibility> {
      return <AnnounceForAccessibility />;
    },
  },
  {
    title: 'Check if accessibility is focused',
    render(): React.Element<typeof SetAccessibilityFocusExample> {
      return <SetAccessibilityFocusExample />;
    },
  },
  {
    title: 'Check if these properties are enabled',
    render(): React.Element<typeof EnabledExamples> {
      return <EnabledExamples />;
    },
  },
  {
    title:
      'Check if accessibilityState disabled is announced when the screenreader focus moves on the image',
    render(): React.Element<typeof Image> {
      return (
        <Image
          accessible={true}
          accessibilityLabel="plain local image"
          accessibilityState={{disabled: true}}
          source={require('../../assets/like.png')}
          style={styles.disabledImage}
        />
      );
    },
  },
];
