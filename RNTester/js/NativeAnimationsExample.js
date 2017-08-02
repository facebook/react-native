/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule NativeAnimationsExample
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Slider,
} = ReactNative;

var AnimatedSlider = Animated.createAnimatedComponent(Slider);

class Tester extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  state = {
    native: new Animated.Value(0),
    js: new Animated.Value(0),
  };

  current = 0;

  onPress = () => {
    const animConfig = this.current && this.props.reverseConfig
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
          <View style={styles.row}>
            {this.props.children(this.state.js)}
          </View>
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

const RNTesterSettingSwitchRow = require('RNTesterSettingSwitchRow');
class InternalSettings extends React.Component<{}, {busyTime: number | string, filteredStall: number}> {
  _stallInterval: ?number;
  render() {
    return (
      <View>
        <RNTesterSettingSwitchRow
          initialValue={false}
          label="Force JS Stalls"
          onEnable={() => {
            this._stallInterval = setInterval(() => {
              const start = Date.now();
              console.warn('burn CPU');
              while (Date.now() - start < 100) {
              }
            }, 300);
          }}
          onDisable={() => {
            clearInterval(this._stallInterval || 0);
          }}
        />
        <RNTesterSettingSwitchRow
          initialValue={false}
          label="Track JS Stalls"
          onEnable={() => {
            require('JSEventLoopWatchdog').install({thresholdMS: 25});
            this.setState({busyTime: '<none>'});
            require('JSEventLoopWatchdog').addHandler({
              onStall: ({busyTime}) =>
                this.setState(state => ({
                  busyTime,
                  filteredStall: (state.filteredStall || 0) * 0.97 +
                    busyTime * 0.03,
                })),
            });
          }}
          onDisable={() => {
            console.warn('Cannot disable yet....');
          }}
        />
        {this.state &&
          <Text>
            {`JS Stall filtered: ${Math.round(this.state.filteredStall)}, `}
            {`last: ${this.state.busyTime}`}
          </Text>}
      </View>
    );
  }
}

class EventExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    scrollX: new Animated.Value(0),
  };

  render() {
    const opacity = this.state.scrollX.interpolate({
      inputRange: [0, 200],
      outputRange: [1, 0],
    });
    return (
      <View>
        <Animated.View
          style={[
            styles.block,
            {
              opacity,
            },
          ]}
        />
        <Animated.ScrollView
          horizontal
          style={{height: 100, marginTop: 16}}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: this.state.scrollX}}}],
            {useNativeDriver: true},
          )}>
          <View
            style={{
              width: 600,
              backgroundColor: '#eee',
              justifyContent: 'center',
            }}>
            <Text>Scroll me!</Text>
          </View>
        </Animated.ScrollView>
      </View>
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
        <Tester type="spring" config={{stiffness: 1000, damping: 500, mass: 3 }}>
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
    title: 'Drive custom property',
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
    title: 'Internal Settings',
    render: function() {
      return <InternalSettings />;
    },
  },
];
