/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Alert,
  Animated,
  I18nManager,
  Image,
  PanResponder,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Switch,
  View,
  Button,
} = ReactNative;
const Platform = require('Platform');

const RNTesterPage = require('./RNTesterPage');
const RNTesterBlock = require('./RNTesterBlock');

type State = {
  toggleStatus: any,
  pan: Object,
  linear: Object,
  isRTL: boolean,
};

const SCALE = PixelRatio.get();
const IMAGE_DIMENSION = 100 * SCALE;
const IMAGE_SIZE = [IMAGE_DIMENSION, IMAGE_DIMENSION];

const IS_RTL = I18nManager.isRTL;

function ListItem(props) {
  return (
    <View style={styles.row}>
      <View style={styles.column1}>
        <Image source={props.imageSource} style={styles.icon} />
      </View>
      <View style={styles.column2}>
        <View style={styles.textBox}>
          <Text>Text Text Text</Text>
        </View>
      </View>
      <View style={styles.column3}>
        <View style={styles.smallButton}>
          <Text style={styles.fontSizeSmall}>Button</Text>
        </View>
      </View>
    </View>
  );
}

const TextAlignmentExample = withRTLState(({isRTL, setRTL, ...props}) => {
  return (
    <RNTesterBlock title={props.title} description={props.description}>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <Text style={props.style}>
          Left-to-Right language without text alignment.
        </Text>
        <Text style={props.style}>
          {'\u0645\u0646 \u0627\u0644\u064A\u0645\u064A\u0646 ' +
            '\u0625\u0644\u0649 \u0627\u0644\u064A\u0633\u0627\u0631 ' +
            '\u0627\u0644\u0644\u063A\u0629 \u062F\u0648\u0646 ' +
            '\u0645\u062D\u0627\u0630\u0627\u0629 \u0627\u0644\u0646\u0635'}
        </Text>
        <Text style={props.style}>
          {'\u05DE\u05D9\u05DE\u05D9\u05DF \u05DC\u05E9\u05DE\u05D0\u05DC ' +
            '\u05D4\u05E9\u05E4\u05D4 \u05D1\u05DC\u05D9 ' +
            '\u05D9\u05D9\u05E9\u05D5\u05E8 \u05D8\u05E7\u05E1\u05D8'}
        </Text>
      </View>
    </RNTesterBlock>
  );
});

const IconsExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Working With Icons'}>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      <View
        style={[styles.flexDirectionRow, {direction: isRTL ? 'rtl' : 'ltr'}]}>
        <View>
          <Image
            source={require('./Thumbnails/like.png')}
            style={styles.image}
          />
          <Text style={styles.fontSizeExtraSmall}>
            Without directional meaning
          </Text>
        </View>
        <View style={styles.rightAlignStyle}>
          <Image
            source={require('./Thumbnails/poke.png')}
            style={[styles.image, styles.withRTLStyle]}
          />
          <Text style={styles.fontSizeExtraSmall}>
            With directional meaning
          </Text>
        </View>
      </View>
    </RNTesterBlock>
  );
});

function AnimationBlock(props) {
  return (
    <View style={styles.block}>
      <TouchableWithoutFeedback onPress={props.onPress}>
        <Animated.Image
          style={[styles.img, props.imgStyle]}
          source={require('./Thumbnails/poke.png')}
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

type RTLSwitcherComponentState = {|
  isRTL: boolean,
|};

function withRTLState(Component) {
  return class extends React.Component<*, RTLSwitcherComponentState> {
    constructor(...args) {
      super(...args);
      this.state = {
        isRTL: IS_RTL,
      };
    }

    render() {
      const setRTL = isRTL => this.setState({isRTL: isRTL});
      return (
        <Component isRTL={this.state.isRTL} setRTL={setRTL} {...this.props} />
      );
    }
  };
}

const RTLToggler = ({isRTL, setRTL}) => {
  if (Platform.OS === 'android') {
    return <Text style={styles.rtlToggler}>{isRTL ? 'RTL' : 'LTR'}</Text>;
  }

  const toggleRTL = () => setRTL(!isRTL);
  return (
    <Button
      onPress={toggleRTL}
      title={isRTL ? 'RTL' : 'LTR'}
      color="gray"
      accessibilityLabel="Change layout direction"
    />
  );
};

const SimpleListItemExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'A Simple List Item Layout'}>
      <RTLToggler setRTL={setRTL} isRTL={isRTL} />
      <View style={[styles.list, {direction: isRTL ? 'rtl' : 'ltr'}]}>
        <ListItem imageSource={require('./Thumbnails/like.png')} />
        <ListItem imageSource={require('./Thumbnails/poke.png')} />
      </View>
    </RNTesterBlock>
  );
});

const AnimationContainer = withRTLState(({isRTL, setRTL}) => {
  return <AnimationExample isRTL={isRTL} setRTL={setRTL} />;
});

class AnimationExample extends React.Component<any, State> {
  constructor(props: Object) {
    super(props);

    this.state = {
      toggleStatus: {},
      linear: new Animated.Value(0),
      windowWidth: 0,
    };
  }

  render() {
    return (
      <RNTesterBlock
        title={'Controlling Animation'}
        description={'Animation direction according to layout'}>
        <RTLToggler setRTL={this.props.setRTL} isRTL={this.props.isRTL} />
        <View style={styles.view} onLayout={this._onLayout}>
          <AnimationBlock
            onPress={this._linearTap}
            imgStyle={{
              transform: [
                {translateX: this.state.linear},
                {scaleX: this.props.isRTL ? -1 : 1},
              ],
            }}
          />
        </View>
      </RNTesterBlock>
    );
  }

  _onLayout = (e: Object) => {
    this.setState({
      windowWidth: e.nativeEvent.layout.width,
    });
  };

  _linearTap = (e: Object) => {
    this.setState({
      toggleStatus: {
        ...this.state.toggleStatus,
        [e]: !this.state.toggleStatus[e],
      },
    });
    const offset = IMAGE_SIZE[0] / SCALE / 2 + 10;
    const toMaxDistance =
      (this.props.isRTL ? -1 : 1) * (this.state.windowWidth / 2 - offset);
    Animated.timing(this.state.linear, {
      toValue: this.state.toggleStatus[e] ? toMaxDistance : 0,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  };
}

const PaddingExample = withRTLState(({isRTL, setRTL}) => {
  const color = 'teal';

  return (
    <RNTesterBlock title={'Padding Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>paddingStart: 50,</Text>
      <Text>paddingEnd: 10</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <Text>The {color} is padding.</Text>
      <View
        style={{
          backgroundColor: color,
          paddingStart: 50,
          paddingEnd: 10,
          borderWidth: 1,
          borderColor: color,
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            paddingTop: 5,
            paddingBottom: 5,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </RNTesterBlock>
  );
});

const MarginExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Margin Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>marginStart: 50,</Text>
      <Text>marginEnd: 10</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <Text>The green is margin.</Text>
      <View
        style={{
          backgroundColor: 'green',
          borderWidth: 1,
          borderColor: 'green',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            paddingTop: 5,
            paddingBottom: 5,
            marginStart: 50,
            marginEnd: 10,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </RNTesterBlock>
  );
});

const PositionExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Position Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>start: 50</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <Text>The orange is position.</Text>
      <View
        style={{
          backgroundColor: 'orange',
          borderWidth: 1,
          borderColor: 'orange',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            start: 50,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
      <Text />
      <Text style={styles.bold}>Styles</Text>
      <Text>end: 50</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <Text>The orange is position.</Text>
      <View
        style={{
          backgroundColor: 'orange',
          borderWidth: 1,
          borderColor: 'orange',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            end: 50,
            borderColor: 'gray',
          }}>
          <RTLToggler setRTL={setRTL} isRTL={isRTL} />
        </View>
      </View>
    </RNTesterBlock>
  );
});

const BorderWidthExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Border Width Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>borderStartWidth: 10,</Text>
      <Text>borderEndWidth: 50</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <View
          style={{
            borderStartWidth: 10,
            borderEndWidth: 50,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </RNTesterBlock>
  );
});

const BorderColorExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Border Color Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>borderStartColor: 'red',</Text>
      <Text>borderEndColor: 'green',</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <View
          style={{
            borderStartColor: 'red',
            borderEndColor: 'green',
            borderLeftWidth: 20,
            borderRightWidth: 20,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </RNTesterBlock>
  );
});

const BorderRadiiExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Border Radii Start/End'}>
      <Text style={styles.bold}>Styles</Text>
      <Text>borderTopStartRadius: 10,</Text>
      <Text>borderTopEndRadius: 20,</Text>
      <Text>borderBottomStartRadius: 30,</Text>
      <Text>borderBottomEndRadius: 40</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <View
          style={{
            borderWidth: 10,
            borderTopStartRadius: 10,
            borderTopEndRadius: 20,
            borderBottomStartRadius: 30,
            borderBottomEndRadius: 40,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </RNTesterBlock>
  );
});

const BorderExample = withRTLState(({isRTL, setRTL}) => {
  return (
    <RNTesterBlock title={'Border '}>
      <Text style={styles.bold}>Styles</Text>
      <Text>borderStartColor: 'red',</Text>
      <Text>borderEndColor: 'green',</Text>
      <Text>borderStartWidth: 10,</Text>
      <Text>borderEndWidth: 50,</Text>
      <Text>borderTopStartRadius: 10,</Text>
      <Text>borderTopEndRadius: 20,</Text>
      <Text>borderBottomStartRadius: 30,</Text>
      <Text>borderBottomEndRadius: 40</Text>
      <Text />
      <Text style={styles.bold}>Demo: </Text>
      <View style={{direction: isRTL ? 'rtl' : 'ltr'}}>
        <View
          style={{
            borderStartColor: 'red',
            borderEndColor: 'green',
            borderStartWidth: 10,
            borderEndWidth: 50,
            borderTopStartRadius: 10,
            borderTopEndRadius: 20,
            borderBottomStartRadius: 30,
            borderBottomEndRadius: 40,
            padding: 10,
          }}>
          <View>
            <RTLToggler setRTL={setRTL} isRTL={isRTL} />
          </View>
        </View>
      </View>
    </RNTesterBlock>
  );
});

class RTLExample extends React.Component<any, State> {
  render() {
    return (
      <ScrollView style={styles.container}>
        <RNTesterPage title={'Right-to-Left (RTL) UI Layout'}>
          <SimpleListItemExample />
          <TextAlignmentExample
            title={'Default Text Alignment'}
            description={
              'In iOS, it depends on active language. ' +
              'In Android, it depends on the text content.'
            }
            style={styles.fontSizeSmall}
          />
          <TextAlignmentExample
            title={"Using textAlign: 'left'"}
            description={
              'In iOS/Android, text alignment flips regardless of ' +
              'languages or text content.'
            }
            style={[styles.fontSizeSmall, styles.textAlignLeft]}
          />
          <TextAlignmentExample
            title={"Using textAlign: 'right'"}
            description={
              'In iOS/Android, text alignment flips regardless of ' +
              'languages or text content.'
            }
            style={[styles.fontSizeSmall, styles.textAlignRight]}
          />
          <IconsExample />
          <AnimationContainer />
          <PaddingExample />
          <MarginExample />
          <PositionExample />
          <BorderWidthExample />
          <BorderColorExample />
          <BorderRadiiExample />
          <BorderExample />
        </RNTesterPage>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9eaed',
    paddingTop: 15,
  },
  directionBox: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 0.5,
    borderColor: 'black',
  },
  directionText: {
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  switchRowTextView: {
    flex: 1,
    marginBottom: 5,
    marginTop: 5,
    textAlign: 'center',
  },
  switchRowSwitchView: {
    flex: 3,
  },
  rightAlignStyle: {
    right: 10,
    position: 'absolute',
  },
  list: {
    height: 120,
    marginBottom: 5,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  row: {
    height: 60,
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  column1: {
    width: 60,
  },
  column2: {
    flex: 2.5,
    padding: 6,
  },
  column3: {
    flex: 1.5,
  },
  icon: {
    width: 48,
    height: 48,
    margin: 6,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  withRTLStyle: {
    transform: [{scaleX: IS_RTL ? -1 : 1}],
  },
  image: {
    left: 30,
    width: 48,
    height: 48,
  },
  img: {
    width: IMAGE_SIZE[0] / SCALE,
    height: IMAGE_SIZE[1] / SCALE,
  },
  view: {
    flex: 1,
  },
  block: {
    padding: 10,
    alignItems: 'center',
  },
  smallButton: {
    top: 18,
    borderRadius: 5,
    height: 24,
    width: 64,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeSmall: {
    fontSize: 10,
  },
  fontSizeExtraSmall: {
    fontSize: 8,
  },
  textAlignLeft: {
    textAlign: 'left',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  textBox: {
    width: 28,
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  bold: {
    fontWeight: 'bold',
  },
  rtlToggler: {
    color: 'gray',
    padding: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});

exports.title = 'RTLExample';
exports.description = 'Examples to show how to apply components to RTL layout.';
exports.examples = [
  {
    title: 'Simple RTL',
    render: function(): React.Element<typeof RTLExample> {
      return <RTLExample />;
    },
  },
];
