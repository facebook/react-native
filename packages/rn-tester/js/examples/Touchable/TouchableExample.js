/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const React = require('react');

const {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  Platform,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
} = require('react-native');

import {useEffect, useRef, useState} from 'react';

const forceTouchAvailable =
  (Platform.OS === 'ios' && Platform.constants.forceTouchAvailable) || false;

class TouchableHighlightBox extends React.Component<{...}, $FlowFixMeState> {
  state: any | {timesPressed: number} = {
    timesPressed: 0,
  };

  touchableOnPress = () => {
    this.setState({
      timesPressed: this.state.timesPressed + 1,
    });
  };

  render(): React.Node {
    let textLog = '';
    if (this.state.timesPressed > 1) {
      textLog = this.state.timesPressed + 'x TouchableHighlight onPress';
    } else if (this.state.timesPressed > 0) {
      textLog = 'TouchableHighlight onPress';
    }

    return (
      <View>
        <View style={styles.row}>
          <TouchableHighlight
            style={styles.wrapper}
            testID="touchable_highlight_image_button"
            onPress={this.touchableOnPress}>
            <Image source={remoteImage} style={styles.image} />
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.wrapper}
            testID="touchable_highlight_text_button"
            activeOpacity={1}
            underlayColor="rgb(210, 230, 255)"
            onPress={this.touchableOnPress}>
            <View style={styles.wrapperCustom}>
              <Text style={styles.text}>Tap Here For Custom Highlight!</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View style={styles.logBox}>
          <Text testID="touchable_highlight_console">{textLog}</Text>
        </View>
      </View>
    );
  }
}

class TouchableWithoutFeedbackBox extends React.Component<
  {...},
  $FlowFixMeState,
> {
  state: any | {timesPressed: number} = {
    timesPressed: 0,
  };

  textOnPress = () => {
    this.setState({
      timesPressed: this.state.timesPressed + 1,
    });
  };

  render(): React.Node {
    let textLog = '';
    if (this.state.timesPressed > 1) {
      textLog = this.state.timesPressed + 'x TouchableWithoutFeedback onPress';
    } else if (this.state.timesPressed > 0) {
      textLog = 'TouchableWithoutFeedback onPress';
    }

    return (
      <View>
        <TouchableWithoutFeedback
          onPress={this.textOnPress}
          testID="touchable_without_feedback_button">
          <View style={styles.wrapperCustom}>
            <Text style={styles.text}>Tap Here For No Feedback!</Text>
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.logBox}>
          <Text testID="touchable_without_feedback_console">{textLog}</Text>
        </View>
      </View>
    );
  }
}

class TextOnPressBox extends React.Component<{...}, $FlowFixMeState> {
  state: any | {timesPressed: number} = {
    timesPressed: 0,
  };

  textOnPress = () => {
    this.setState({
      timesPressed: this.state.timesPressed + 1,
    });
  };

  render(): React.Node {
    let textLog = '';
    if (this.state.timesPressed > 1) {
      textLog = this.state.timesPressed + 'x text onPress';
    } else if (this.state.timesPressed > 0) {
      textLog = 'text onPress';
    }

    return (
      <View>
        <Text
          style={styles.textBlock}
          testID="tappable_text"
          onPress={this.textOnPress}>
          Text has built-in onPress handling
        </Text>
        <View style={styles.logBox}>
          <Text testID="tappable_text_console">{textLog}</Text>
        </View>
      </View>
    );
  }
}

class TouchableFeedbackEvents extends React.Component<{...}, $FlowFixMeState> {
  state: any | {eventLog: Array<string>} = {
    eventLog: [],
  };

  render(): React.Node {
    return (
      <View testID="touchable_feedback_events">
        <View style={[styles.row, styles.centered]}>
          <TouchableOpacity
            style={styles.wrapper}
            testID="touchable_feedback_events_button"
            accessibilityLabel="touchable feedback events"
            accessibilityRole="button"
            onPress={() => this._appendEvent('press')}
            onPressIn={() => this._appendEvent('pressIn')}
            onPressOut={() => this._appendEvent('pressOut')}
            onLongPress={() => this._appendEvent('longPress')}>
            <Text style={styles.button}>Press Me</Text>
          </TouchableOpacity>
        </View>
        <View
          testID="touchable_feedback_events_console"
          style={styles.eventLogBox}>
          {this.state.eventLog.map((e, ii) => (
            <Text key={ii}>{e}</Text>
          ))}
        </View>
      </View>
    );
  }

  _appendEvent = (eventName: string) => {
    const limit = 6;
    const eventLog = this.state.eventLog.slice(0, limit - 1);
    eventLog.unshift(eventName);
    this.setState({eventLog});
  };
}

class TouchableDelayEvents extends React.Component<{...}, $FlowFixMeState> {
  state: any | {eventLog: Array<string>} = {
    eventLog: [],
  };

  render(): React.Node {
    return (
      <View testID="touchable_delay_events">
        <View style={[styles.row, styles.centered]}>
          <TouchableOpacity
            style={styles.wrapper}
            testID="touchable_delay_events_button"
            onPress={() => this._appendEvent('press')}
            delayPressIn={400}
            onPressIn={() => this._appendEvent('pressIn - 400ms delay')}
            delayPressOut={1000}
            onPressOut={() => this._appendEvent('pressOut - 1000ms delay')}
            delayLongPress={800}
            onLongPress={() => this._appendEvent('longPress - 800ms delay')}>
            <Text style={styles.button}>Press Me</Text>
          </TouchableOpacity>
        </View>
        <View
          style={styles.eventLogBox}
          testID="touchable_delay_events_console">
          {this.state.eventLog.map((e, ii) => (
            <Text key={ii}>{e}</Text>
          ))}
        </View>
      </View>
    );
  }

  _appendEvent = (eventName: string) => {
    const limit = 6;
    const eventLog = this.state.eventLog.slice(0, limit - 1);
    eventLog.unshift(eventName);
    this.setState({eventLog});
  };
}

class ForceTouchExample extends React.Component<{...}, $FlowFixMeState> {
  state: any | {force: number} = {
    force: 0,
  };

  _renderConsoleText = (): string => {
    return forceTouchAvailable
      ? 'Force: ' + this.state.force.toFixed(3)
      : '3D Touch is not available on this device';
  };

  render(): React.Node {
    return (
      <View testID="touchable_3dtouch_event">
        <View style={styles.forceTouchBox} testID="touchable_3dtouch_output">
          <Text>{this._renderConsoleText()}</Text>
        </View>
        <View style={[styles.row, styles.centered]}>
          <View
            style={styles.wrapper}
            testID="touchable_3dtouch_button"
            onStartShouldSetResponder={() => true}
            onResponderMove={event =>
              this.setState({force: event.nativeEvent.force})
            }
            onResponderRelease={event => this.setState({force: 0})}>
            <Text style={styles.button}>Press Me</Text>
          </View>
        </View>
      </View>
    );
  }
}

class TouchableHitSlop extends React.Component<{...}, $FlowFixMeState> {
  state: any | {timesPressed: number} = {
    timesPressed: 0,
  };

  onPress = () => {
    this.setState({
      timesPressed: this.state.timesPressed + 1,
    });
  };

  render(): React.Node {
    let log = '';
    if (this.state.timesPressed > 1) {
      log = this.state.timesPressed + 'x onPress';
    } else if (this.state.timesPressed > 0) {
      log = 'onPress';
    }

    return (
      <View testID="touchable_hit_slop">
        <View style={[styles.row, styles.centered]}>
          <TouchableOpacity
            onPress={this.onPress}
            style={styles.hitSlopWrapper}
            hitSlop={{top: 30, bottom: 30, left: 60, right: 60}}
            testID="touchable_hit_slop_button">
            <Text style={styles.hitSlopButton}>Press Outside This View</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logBox}>
          <Text>{log}</Text>
        </View>
      </View>
    );
  }
}

function TouchableNativeMethodChecker<
  T: React.AbstractComponent<any, any>,
>(props: {|Component: T, name: string|}): React.Node {
  const [status, setStatus] = useState<?boolean>(null);
  const ref = useRef<?React.ElementRef<T>>(null);

  useEffect(() => {
    setStatus(ref.current != null && typeof ref.current.measure === 'function');
  }, []);

  return (
    <View style={[styles.row, styles.block]}>
      <props.Component ref={ref}>
        <View />
      </props.Component>
      <Text>
        {props.name + ': '}
        {status == null
          ? 'Missing Ref!'
          : status === true
          ? 'Native Methods Exist'
          : 'Native Methods Missing!'}
      </Text>
    </View>
  );
}

function TouchableNativeMethods() {
  return (
    <View>
      <TouchableNativeMethodChecker
        Component={TouchableHighlight}
        name="TouchableHighlight"
      />
      <TouchableNativeMethodChecker
        Component={TouchableOpacity}
        name="TouchableOpacity"
      />
    </View>
  );
}

class TouchableDisabled extends React.Component<{...}> {
  render(): React.Node {
    return (
      <View>
        <TouchableOpacity disabled={true} style={[styles.row, styles.block]}>
          <Text style={styles.disabledButton}>Disabled TouchableOpacity</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={false} style={[styles.row, styles.block]}>
          <Text style={styles.button}>Enabled TouchableOpacity</Text>
        </TouchableOpacity>

        <TouchableHighlight
          activeOpacity={1}
          disabled={true}
          underlayColor="rgb(210, 230, 255)"
          style={[styles.row, styles.block]}
          onPress={() => console.log('custom THW text - highlight')}>
          <Text style={styles.disabledButton}>Disabled TouchableHighlight</Text>
        </TouchableHighlight>

        <TouchableHighlight
          activeOpacity={1}
          underlayColor="rgb(210, 230, 255)"
          style={[styles.row, styles.block]}
          onPress={() => console.log('custom THW text - highlight')}>
          <Text style={styles.button}>Enabled TouchableHighlight</Text>
        </TouchableHighlight>

        <TouchableWithoutFeedback
          onPress={() => console.log('TWOF has been clicked')}
          disabled={true}>
          <View style={styles.wrapperCustom}>
            <Text
              style={[
                styles.button,
                styles.nativeFeedbackButton,
                styles.disabledButton,
              ]}>
              Disabled TouchableWithoutFeedback
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPress={() => console.log('TWOF has been clicked')}
          disabled={false}>
          <View style={styles.wrapperCustom}>
            <Text style={[styles.button, styles.nativeFeedbackButton]}>
              Enabled TouchableWithoutFeedback
            </Text>
          </View>
        </TouchableWithoutFeedback>

        {Platform.OS === 'android' && (
          <>
            <TouchableNativeFeedback
              onPress={() => console.log('custom TNF has been clicked')}
              background={TouchableNativeFeedback.SelectableBackground()}>
              <View style={[styles.row, styles.block]}>
                <Text style={[styles.button, styles.nativeFeedbackButton]}>
                  Enabled TouchableNativeFeedback
                </Text>
              </View>
            </TouchableNativeFeedback>

            <TouchableNativeFeedback
              disabled={true}
              onPress={() => console.log('custom TNF has been clicked')}
              background={TouchableNativeFeedback.SelectableBackground()}>
              <View style={[styles.row, styles.block]}>
                <Text
                  style={[styles.disabledButton, styles.nativeFeedbackButton]}>
                  Disabled TouchableNativeFeedback
                </Text>
              </View>
            </TouchableNativeFeedback>
          </>
        )}
      </View>
    );
  }
}

function CustomRippleRadius() {
  if (Platform.OS !== 'android') {
    return null;
  }
  return (
    <View
      style={[
        styles.row,
        {justifyContent: 'space-around', alignItems: 'center'},
      ]}>
      <TouchableNativeFeedback
        onPress={() => console.log('custom TNF has been clicked')}
        background={TouchableNativeFeedback.Ripple('orange', true, 30)}>
        <View>
          <Text style={[styles.button, styles.nativeFeedbackButton]}>
            radius 30
          </Text>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={() => console.log('custom TNF has been clicked')}
        background={TouchableNativeFeedback.SelectableBackgroundBorderless(
          150,
        )}>
        <View>
          <Text style={[styles.button, styles.nativeFeedbackButton]}>
            radius 150
          </Text>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback
        onPress={() => console.log('custom TNF has been clicked')}
        background={TouchableNativeFeedback.SelectableBackground(70)}>
        <View style={styles.block}>
          <Text style={[styles.button, styles.nativeFeedbackButton]}>
            radius 70, with border
          </Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

const remoteImage = {
  uri: 'https://www.facebook.com/favicon.ico',
};

const TouchableHighlightUnderlayMethods = () => {
  const [underlayVisible, setUnderlayVisible] = useState(
    'Underlay not visible',
  );

  const hiddenUnderlay = () => {
    setUnderlayVisible('Press to make underlay visible');
  };

  const shownUnderlay = () => {
    setUnderlayVisible('Underlay visible');
  };
  return (
    <TouchableHighlight
      style={styles.logBox}
      underlayColor={'#eee'}
      onShowUnderlay={shownUnderlay}
      onHideUnderlay={hiddenUnderlay}
      onPress={() => {
        console.log('TouchableHighlight underlay shown!');
      }}>
      <Text style={styles.textBlock}>{underlayVisible}</Text>
    </TouchableHighlight>
  );
};

const TouchableTouchSoundDisabled = () => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const toggleTouchableSound = () => {
    soundEnabled ? setSoundEnabled(false) : setSoundEnabled(true);
  };
  return (
    <>
      {Platform.OS === 'android' ? (
        <>
          <TouchableWithoutFeedback
            touchSoundDisabled={soundEnabled}
            onPress={() => console.log('touchSoundDisabled pressed!')}>
            <Text
              style={{
                padding: 10,
              }}>
              Touchables make a sound on Android, which can be turned off.
            </Text>
          </TouchableWithoutFeedback>
          <TouchableOpacity
            style={{
              padding: 10,
            }}
            onPress={toggleTouchableSound}
            touchSoundDisabled={soundEnabled}>
            <Text style={styles.button}>
              {soundEnabled
                ? 'Disable Touchable Sound'
                : 'Enable Touchable Sound'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </>
  );
};

// $FlowFixMe[missing-local-annot]
function TouchableOnFocus<T: React.AbstractComponent<any, any>>() {
  const ref = useRef<?React.ElementRef<T> | {focus: Function}>(null);
  const [isFocused, setIsFocused] = useState<string | boolean>(false);
  const [focusStatus, setFocusStatus] = useState(
    'This touchable is not focused.',
  );
  const [isBlurred, setIsBlurred] = useState(
    'This item still has focus, onBlur is not called',
  );

  const toggleFocus = () => {
    isFocused
      ? setFocusStatus('This touchable is focused')
      : setIsFocused('This touchable is not focused') &&
        setIsBlurred('This item has lost focus, onBlur called');
  };
  const focusTouchable = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  return (
    <TouchableHighlight
      ref={ref}
      onFocus={toggleFocus}
      onPress={focusTouchable}>
      <Text>
        {focusStatus}
        {'\n'}
        {isBlurred}
      </Text>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  centered: {
    justifyContent: 'center',
  },
  image: {
    width: 50,
    height: 50,
  },
  text: {
    fontSize: 16,
  },
  block: {
    padding: 10,
  },
  button: {
    color: '#007AFF',
  },
  disabledButton: {
    color: '#007AFF',
    opacity: 0.5,
  },
  nativeFeedbackButton: {
    textAlign: 'center',
    margin: 10,
  },
  hitSlopButton: {
    color: 'white',
  },
  wrapper: {
    borderRadius: 8,
  },
  wrapperCustom: {
    borderRadius: 8,
    padding: 6,
  },
  hitSlopWrapper: {
    backgroundColor: 'red',
    marginVertical: 30,
  },
  logBox: {
    padding: 20,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  eventLogBox: {
    padding: 10,
    margin: 10,
    height: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  forceTouchBox: {
    padding: 10,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  textBlock: {
    fontWeight: '500',
    color: 'blue',
  },
});

exports.displayName = (undefined: ?string);
exports.description = 'Touchable and onPress examples.';
exports.title = 'Touchable* and onPress';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/touchablehighlight';
exports.examples = [
  {
    title: '<TouchableHighlight>',
    description: ('TouchableHighlight works by adding an extra view with a ' +
      'black background under the single child view.  This works best when the ' +
      'child view is fully opaque, although it can be made to work as a simple ' +
      'background color change as well with the activeOpacity and ' +
      'underlayColor props.': string),
    render: function (): React.Node {
      return <TouchableHighlightBox />;
    },
  },
  {
    title: '<TouchableWithoutFeedback>',
    render: function (): React.Node {
      return <TouchableWithoutFeedbackBox />;
    },
  },
  {
    title: 'TouchableNativeFeedback with Animated child',
    description: ('TouchableNativeFeedback can have an AnimatedComponent as a' +
      'direct child.': string),
    platform: 'android',
    render: function (): React.Node {
      const mScale = new Animated.Value(1);
      Animated.timing(mScale, {
        toValue: 0.3,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      const style = {
        backgroundColor: 'rgb(180, 64, 119)',
        width: 200,
        height: 100,
        transform: [{scale: mScale}],
      };
      return (
        <View>
          <View style={styles.row}>
            <TouchableNativeFeedback>
              <Animated.View style={style} />
            </TouchableNativeFeedback>
          </View>
        </View>
      );
    },
  },
  {
    title: 'TouchableHighlight Underlay Visibility',
    render: function (): React.Node {
      return <TouchableHighlightUnderlayMethods />;
    },
  },
  {
    title: 'Touchable Touch Sound',
    render: function (): React.Node {
      return <TouchableTouchSoundDisabled />;
    },
  },
  {
    title: 'Touchable onFocus',
    render: function (): React.Node {
      return <TouchableOnFocus />;
    },
  },
  {
    title: '<Text onPress={fn}> with highlight',
    render: function (): React.Element<any> {
      return <TextOnPressBox />;
    },
  },
  {
    title: 'Touchable feedback events',
    description: ('<Touchable*> components accept onPress, onPressIn, ' +
      'onPressOut, and onLongPress as props.': string),
    render: function (): React.Element<any> {
      return <TouchableFeedbackEvents />;
    },
  },
  {
    title: 'Touchable delay for events',
    description: ('<Touchable*> components also accept delayPressIn, ' +
      'delayPressOut, and delayLongPress as props. These props impact the ' +
      'timing of feedback events.': string),
    render: function (): React.Element<any> {
      return <TouchableDelayEvents />;
    },
  },
  {
    title: '3D Touch / Force Touch',
    description:
      'iPhone 8 and 8 plus support 3D touch, which adds a force property to touches',
    render: function (): React.Element<any> {
      return <ForceTouchExample />;
    },
    platform: 'ios',
  },
  {
    title: 'Touchable Hit Slop',
    description:
      ('<Touchable*> components accept hitSlop prop which extends the touch area ' +
        'without changing the view bounds.': string),
    render: function (): React.Element<any> {
      return <TouchableHitSlop />;
    },
  },
  {
    title: 'Touchable Native Methods',
    description:
      ('Some <Touchable*> components expose native methods like `measure`.': string),
    render: function (): React.Element<any> {
      return <TouchableNativeMethods />;
    },
  },
  {
    title: 'Custom Ripple Radius (Android-only)',
    description:
      ('Ripple radius on TouchableNativeFeedback can be controlled': string),
    render: function (): React.Element<any> {
      return <CustomRippleRadius />;
    },
  },
  {
    title: 'Disabled Touchable*',
    description:
      ('<Touchable*> components accept disabled prop which prevents ' +
        'any interaction with component': string),
    render: function (): React.Element<any> {
      return <TouchableDisabled />;
    },
  },
];
