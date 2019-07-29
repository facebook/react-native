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
const {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Slider,
} = require('react-native');

const AnimatedSlider = Animated.createAnimatedComponent(Slider);

class Tester extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  state = {
    native: new Animated.Value(0),
    js: new Animated.Value(0),
  };

  current = 0;

  onPress = () => {
    const animConfig =
      this.current && this.props.reverseConfig
        ? this.props.reverseConfig
        : this.props.config;
    this.current = this.current ? 0 : 1;
    const config: Object = {
      ...animConfig,
      toValue: this.current,
    };

    Animated[this.props.type](this.state.native, {
      ...config,
      useNativeDriver: true,
    }).start();
    Animated[this.props.type](this.state.js, {
      ...config,
      useNativeDriver: false,
    }).start();
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>
          <View>
            <Text>Native:</Text>
          </View>
          <View style={styles.row}>
            {this.props.children(this.state.native)}
          </View>
          <View>
            <Text>JavaScript:</Text>
          </View>
          <View style={styles.row}>{this.props.children(this.state.js)}</View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class ValueListenerExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    anim: new Animated.Value(0),
    progress: 0,
  };
  _current = 0;

  componentDidMount() {
    this.state.anim.addListener(e => this.setState({progress: e.value}));
  }

  componentWillUnmount() {
    this.state.anim.removeAllListeners();
  }

  _onPress = () => {
    this._current = this._current ? 0 : 1;
    const config = {
      duration: 1000,
      toValue: this._current,
    };

    Animated.timing(this.state.anim, {
      ...config,
      useNativeDriver: true,
    }).start();
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View>
          <View style={styles.row}>
            <Animated.View
              style={[
                styles.block,
                {
                  opacity: this.state.anim,
                },
              ]}
            />
          </View>
          <Text>Value: {this.state.progress}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class LoopExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    value: new Animated.Value(0),
  };

  componentDidMount() {
    Animated.loop(
      Animated.timing(this.state.value, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }),
    ).start();
  }

  render() {
    return (
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.block,
            {
              opacity: this.state.value.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
            },
          ]}
        />
      </View>
    );
  }
}

const RNTesterSettingSwitchRow = require('../../components/RNTesterSettingSwitchRow');
class InternalSettings extends React.Component<
  {},
  {busyTime: number | string, filteredStall: number},
> {
  _stallInterval: ?number;
  render() {
    return (
      <View>
        <RNTesterSettingSwitchRow
          initialValue={false}
          label="Force JS Stalls"
          onEnable={() => {
            /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment
             * suppresses an error found when Flow v0.63 was deployed. To see
             * the error delete this comment and run Flow. */
            this._stallInterval = setInterval(() => {
              const start = Date.now();
              console.warn('burn CPU');
              while (Date.now() - start < 100) {}
            }, 300);
          }}
          onDisable={() => {
            /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment
             * suppresses an error found when Flow v0.63 was deployed. To see
             * the error delete this comment and run Flow. */
            clearInterval(this._stallInterval || 0);
          }}
        />
        <RNTesterSettingSwitchRow
          initialValue={false}
          label="Track JS Stalls"
          onEnable={() => {
            require('../../../../Libraries/Interaction/JSEventLoopWatchdog').install(
              {
                thresholdMS: 25,
              },
            );
            this.setState({busyTime: '<none>'});
            require('../../../../Libraries/Interaction/JSEventLoopWatchdog').addHandler(
              {
                onStall: ({busyTime}) =>
                  this.setState(state => ({
                    busyTime,
                    filteredStall:
                      (state.filteredStall || 0) * 0.97 + busyTime * 0.03,
                  })),
              },
            );
          }}
          onDisable={() => {
            console.warn('Cannot disable yet....');
          }}
        />
        {this.state && (
          <Text>
            {`JS Stall filtered: ${Math.round(this.state.filteredStall)}, `}
            {`last: ${this.state.busyTime}`}
          </Text>
        )}
      </View>
    );
  }
}

class EventExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    anim: new Animated.Value(0),
  };

  render() {
    return (
      <View>
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                {
                  rotate: this.state.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '1deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.ScrollView
          horizontal
          style={{height: 100, marginTop: 16}}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this.state.anim}}}],
            {useNativeDriver: true},
          )}>
          <View
            style={{
              width: 600,
              backgroundColor: '#eee',
              justifyContent: 'center',
              paddingLeft: 100,
            }}>
            <Text>Scroll me sideways!</Text>
          </View>
        </Animated.ScrollView>
        <AnimatedSlider
          maximumValue={200}
          onValueChange={Animated.event(
            [{nativeEvent: {value: this.state.anim}}],
            {useNativeDriver: true},
          )}
        />
      </View>
    );
  }
}

class TrackingExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  state = {
    native: new Animated.Value(0),
    toNative: new Animated.Value(0),
    js: new Animated.Value(0),
    toJS: new Animated.Value(0),
  };

  componentDidMount() {
    // we configure spring to take a bit of time to settle so that the user
    // have time to click many times and see "toValue" getting updated and
    const longSettlingSpring = {
      tension: 20,
      friction: 0.5,
    };
    Animated.spring(this.state.native, {
      ...longSettlingSpring,
      toValue: this.state.toNative,
      useNativeDriver: true,
    }).start();
    Animated.spring(this.state.js, {
      ...longSettlingSpring,
      toValue: this.state.toJS,
      useNativeDriver: false,
    }).start();
  }

  onPress = () => {
    // select next value to be tracked by random
    const nextValue = Math.random() * 200;
    this.state.toNative.setValue(nextValue);
    this.state.toJS.setValue(nextValue);
  };

  /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.85 was deployed. To see the error, delete this comment
   * and run Flow. */
  renderBlock = (anim, dest) => [
    <Animated.View
      key="line"
      style={[styles.line, {transform: [{translateX: dest}]}]}
    />,
    <Animated.View
      key="block"
      style={[styles.block, {transform: [{translateX: anim}]}]}
    />,
  ];

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>
          <View>
            <Text>Native:</Text>
          </View>
          <View style={styles.row}>
            {this.renderBlock(this.state.native, this.state.toNative)}
          </View>
          <View>
            <Text>JavaScript:</Text>
          </View>
          <View style={styles.row}>
            {this.renderBlock(this.state.js, this.state.toJS)}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    padding: 10,
    zIndex: 1,
  },
  block: {
    width: 50,
    height: 50,
    backgroundColor: 'blue',
  },
  line: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'red',
  },
});

exports.framework = 'React';
exports.title = 'Native Animated Example';
exports.description = 'Test out Native Animations';

exports.examples = [
  {
    title: 'Multistage With Multiply and rotation',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['0deg', '90deg', '0deg'],
                      }),
                    },
                  ],
                  opacity: Animated.multiply(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.25, 1],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Multistage With Multiply',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                  ],
                  opacity: Animated.multiply(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.25, 1],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Multistage With Subtract',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 50, 0],
                      }),
                    },
                  ],
                  opacity: Animated.subtract(
                    anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1],
                    }),
                    anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.5, 0],
                    }),
                  ),
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Scale interpolation with clamping',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 0.5],
                        outputRange: [1, 1.4],
                        extrapolateRight: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Opacity with delay',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000, delay: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  opacity: anim,
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Rotate interpolation',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.spring (bounciness/speed)',
    render: function() {
      return (
        <Tester type="spring" config={{bounciness: 0}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.spring (stiffness/damping/mass)',
    render: function() {
      return (
        <Tester type="spring" config={{stiffness: 1000, damping: 500, mass: 3}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'translateX => Animated.decay',
    render: function() {
      return (
        <Tester
          type="decay"
          config={{velocity: 0.5}}
          reverseConfig={{velocity: -0.5}}>
          {anim => (
            <Animated.View
              style={[
                styles.block,
                {
                  transform: [
                    {
                      translateX: anim,
                    },
                  ],
                },
              ]}
            />
          )}
        </Tester>
      );
    },
  },
  {
    title: 'Drive custom property (tap to animate)',
    render: function() {
      return (
        <Tester type="timing" config={{duration: 1000}}>
          {anim => <AnimatedSlider style={{}} value={anim} />}
        </Tester>
      );
    },
  },
  {
    title: 'Animated value listener',
    render: function() {
      return <ValueListenerExample />;
    },
  },
  {
    title: 'Animated loop',
    render: function() {
      return <LoopExample />;
    },
  },
  {
    title: 'Animated events',
    render: function() {
      return <EventExample />;
    },
  },
  {
    title: 'Animated Tracking - tap me many times',
    render: function() {
      return <TrackingExample />;
    },
  },
  {
    title: 'Internal Settings',
    render: function() {
      return <InternalSettings />;
    },
  },
];
