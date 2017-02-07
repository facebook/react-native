/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
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

const React = require('react');
const ReactNative = require('react-native');
const {
  Image,
  Platform,
  TouchableHighlight,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} = ReactNative;

type Item = {title: string, text: string, key: number, pressed: boolean};

function genItemData(count: number): Array<Item> {
  const dataBlob = [];
  for (let ii = 0; ii < count; ii++) {
    const itemHash = Math.abs(hashCode('Item ' + ii));
    dataBlob.push({
      title: 'Item ' + ii,
      text: LOREM_IPSUM.substr(0, itemHash % 301 + 20),
      key: ii,
      pressed: false,
    });
  }
  return dataBlob;
}

const HORIZ_WIDTH = 200;

class ItemComponent extends React.PureComponent {
  props: {
    fixedHeight?: ?boolean,
    horizontal?: ?boolean,
    item: Item,
    onPress: (key: number) => void,
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
        style={horizontal ? styles.horizItem : styles.item}>
        <View style={[
          styles.row, horizontal && {width: HORIZ_WIDTH}]}>
          <Image style={styles.thumb} source={imgSource} />
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

class FooterComponent extends React.PureComponent {
  render() {
    return (
      <View>
        <SeparatorComponent />
        <View style={styles.headerFooter}>
          <Text>FOOTER</Text>
        </View>
      </View>
    );
  }
}

class HeaderComponent extends React.PureComponent {
  render() {
    return (
      <View>
        <View style={styles.headerFooter}>
          <Text>HEADER</Text>
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

const HEADER = {height: 30, width: 80};
const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;

function getItemLayout(data: any, index: number, horizontal?: boolean) {
  const [length, separator, header] = horizontal ?
    [HORIZ_WIDTH, 0, HEADER.width] : [84, SEPARATOR_HEIGHT, HEADER.height];
  return {length, offset: (length + separator) * index + header, index};
}

function pressItem(context: Object, key: number) {
  const pressed = !context.state.data[key].pressed;
  context.setState((state) => {
    const newData = [...state.data];
    newData[key] = {
      ...state.data[key],
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

function PlainInput({placeholder, value, onChangeText}: Object) {
  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="always"
      onChangeText={onChangeText}
      placeholder={placeholder}
      underlineColorAndroid="transparent"
      style={styles.searchTextInput}
      value={value}
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
  horizItem: {
    alignSelf: 'flex-start', // Necessary for touch highlight
  },
  item: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    padding: 8,
    paddingRight: 0,
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#F6F6F6',
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
  },
  separator: {
    height: SEPARATOR_HEIGHT,
    backgroundColor: 'gray',
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
  thumb: {
    width: 64,
    height: 64,
  },
  text: {
    flex: 1,
  },
});

module.exports = {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  genItemData,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
};
