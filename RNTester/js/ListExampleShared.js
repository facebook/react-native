/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule ListExampleShared
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Animated,
  Image,
  Platform,
  TouchableHighlight,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} = ReactNative;

type Item = {title: string, text: string, key: string, pressed: boolean, noImage?: ?boolean};

function genItemData(count: number, start: number = 0): Array<Item> {
  const dataBlob = [];
  for (let ii = start; ii < count + start; ii++) {
    const itemHash = Math.abs(hashCode('Item ' + ii));
    dataBlob.push({
      title: 'Item ' + ii,
      text: LOREM_IPSUM.substr(0, itemHash % 301 + 20),
      key: String(ii),
      pressed: false,
    });
  }
  return dataBlob;
}

const HORIZ_WIDTH = 200;
const ITEM_HEIGHT = 72;

class ItemComponent extends React.PureComponent {
  props: {
    fixedHeight?: ?boolean,
    horizontal?: ?boolean,
    item: Item,
    onPress: (key: string) => void,
    onShowUnderlay?: () => void,
    onHideUnderlay?: () => void,
  };
  _onPress = () => {
    this.props.onPress(this.props.item.key);
  };
  render() {
    const {fixedHeight, horizontal, item} = this.props;
    const itemHash = Math.abs(hashCode(item.title));
    const imgSource = THUMB_URLS[itemHash % THUMB_URLS.length];
    return (
      <TouchableHighlight
        onPress={this._onPress}
        onShowUnderlay={this.props.onShowUnderlay}
        onHideUnderlay={this.props.onHideUnderlay}
        style={horizontal ? styles.horizItem : styles.item}>
        <View style={[
          styles.row, horizontal && {width: HORIZ_WIDTH}, fixedHeight && {height: ITEM_HEIGHT}]}>
          {!item.noImage && <Image style={styles.thumb} source={imgSource} />}
          <Text
            style={styles.text}
            numberOfLines={(horizontal || fixedHeight) ? 3 : undefined}>
            {item.title} - {item.text}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const renderStackedItem = ({item}: {item: Item}) => {
  const itemHash = Math.abs(hashCode(item.title));
  const imgSource = THUMB_URLS[itemHash % THUMB_URLS.length];
  return (
    <View style={styles.stacked}>
      <Text style={styles.stackedText}>{item.title} - {item.text}</Text>
      <Image style={styles.thumb} source={imgSource} />
    </View>
  );
};

class FooterComponent extends React.PureComponent {
  render() {
    return (
      <View style={styles.headerFooterContainer}>
        <SeparatorComponent />
        <View style={styles.headerFooter}>
          <Text>LIST FOOTER</Text>
        </View>
      </View>
    );
  }
}

class HeaderComponent extends React.PureComponent {
  render() {
    return (
      <View style={styles.headerFooterContainer}>
        <View style={styles.headerFooter}>
          <Text>LIST HEADER</Text>
        </View>
        <SeparatorComponent />
      </View>
    );
  }
}

class SeparatorComponent extends React.PureComponent {
  render() {
    return <View style={styles.separator} />;
  }
}

class ItemSeparatorComponent extends React.PureComponent {
  render() {
    const style = this.props.highlighted
      ? [styles.itemSeparator, {marginLeft: 0, backgroundColor: 'rgb(217, 217, 217)'}]
      : styles.itemSeparator;
    return <View style={style} />;
  }
}

class Spindicator extends React.PureComponent {
  render() {
    return (
      <Animated.View style={[styles.spindicator, {
        transform: [
          {rotate: this.props.value.interpolate({
            inputRange: [0, 5000],
            outputRange: ['0deg', '360deg'],
            extrapolate: 'extend',
          })}
        ]
      }]} />
    );
  }
}

const THUMB_URLS = [
  require('./Thumbnails/like.png'),
  require('./Thumbnails/dislike.png'),
  require('./Thumbnails/call.png'),
  require('./Thumbnails/fist.png'),
  require('./Thumbnails/bandaged.png'),
  require('./Thumbnails/flowers.png'),
  require('./Thumbnails/heart.png'),
  require('./Thumbnails/liking.png'),
  require('./Thumbnails/party.png'),
  require('./Thumbnails/poke.png'),
  require('./Thumbnails/superlike.png'),
  require('./Thumbnails/victory.png'),
];

const LOREM_IPSUM = 'Lorem ipsum dolor sit amet, ius ad pertinax oportere accommodare, an vix \
civibus corrumpit referrentur. Te nam case ludus inciderint, te mea facilisi adipiscing. Sea id \
integre luptatum. In tota sale consequuntur nec. Erat ocurreret mei ei. Eu paulo sapientem \
vulputate est, vel an accusam intellegam interesset. Nam eu stet pericula reprimique, ea vim illud \
modus, putant invidunt reprehendunt ne qui.';

/* eslint no-bitwise: 0 */
function hashCode(str: string): number {
  let hash = 15;
  for (let ii = str.length - 1; ii >= 0; ii--) {
    hash = ((hash << 5) - hash) + str.charCodeAt(ii);
  }
  return hash;
}

const HEADER = {height: 30, width: 100};
const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;

function getItemLayout(data: any, index: number, horizontal?: boolean) {
  const [length, separator, header] = horizontal ?
    [HORIZ_WIDTH, 0, HEADER.width] : [ITEM_HEIGHT, SEPARATOR_HEIGHT, HEADER.height];
  return {length, offset: (length + separator) * index + header, index};
}

function pressItem(context: Object, key: string) {
  const index = Number(key);
  const pressed = !context.state.data[index].pressed;
  context.setState((state) => {
    const newData = [...state.data];
    newData[index] = {
      ...state.data[index],
      pressed,
      title: 'Item ' + key + (pressed ? ' (pressed)' : ''),
    };
    return {data: newData};
  });
}

function renderSmallSwitchOption(context: Object, key: string) {
  return (
    <View style={styles.option}>
      <Text>{key}:</Text>
      <Switch
        style={styles.smallSwitch}
        value={context.state[key]}
        onValueChange={(value) => context.setState({[key]: value})}
      />
    </View>
  );
}

function PlainInput(props: Object) {
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="always"
      underlineColorAndroid="transparent"
      style={styles.searchTextInput}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  headerFooter: {
    ...HEADER,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFooterContainer: {
    backgroundColor: 'rgb(239, 239, 244)',
  },
  horizItem: {
    alignSelf: 'flex-start', // Necessary for touch highlight
  },
  item: {
    flex: 1,
  },
  itemSeparator: {
    height: SEPARATOR_HEIGHT,
    backgroundColor: 'rgb(200, 199, 204)',
    marginLeft: 60,
  },
  option: {
    flexDirection: 'row',
    padding: 8,
    paddingRight: 0,
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 26,
    fontSize: 14,
    flexGrow: 1,
  },
  separator: {
    height: SEPARATOR_HEIGHT,
    backgroundColor: 'rgb(200, 199, 204)',
  },
  smallSwitch: Platform.select({
    android: {
      top: 1,
      margin: -6,
      transform: [{scale: 0.7}],
    },
    ios: {
      top: 4,
      margin: -10,
      transform: [{scale: 0.5}],
    },
  }),
  stacked: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
  },
  thumb: {
    width: 50,
    height: 50,
    left: -5,
  },
  spindicator: {
    marginLeft: 'auto',
    marginTop: 8,
    width: 2,
    height: 16,
    backgroundColor: 'darkgray',
  },
  stackedText: {
    padding: 4,
    fontSize: 18,
  },
  text: {
    flex: 1,
  },
});

module.exports = {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  ItemSeparatorComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genItemData,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
  renderStackedItem,
};
