/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Image,
  ListView,
  TouchableHighlight,
  StyleSheet,
  Text,
  View,
} = ReactNative;
const ListViewDataSource = require('ListViewDataSource');
const RNTesterPage = require('./RNTesterPage');

import type {RNTesterProps} from 'RNTesterTypes';

type State = {|
  dataSource: ListViewDataSource,
|};

class ListViewExample extends React.Component<RNTesterProps, State> {
  state = {
    dataSource: this.getInitialDataSource(),
  };

  _pressData: {[key: number]: boolean} = {};

  getInitialDataSource() {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return ds.cloneWithRows(this._genRows({}));
  }

  UNSAFE_componentWillMount() {
    this._pressData = {};
  }

  render() {
    return (
      <RNTesterPage
        title={this.props.navigator ? null : '<ListView>'}
        noSpacer={true}
        noScroll={true}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderSeparator={this._renderSeparator}
        />
      </RNTesterPage>
    );
  }

  _renderRow = (
    rowData: string,
    sectionID: number,
    rowID: number,
    highlightRow: (sectionID: number, rowID: number) => void,
  ) => {
    const rowHash = Math.abs(hashCode(rowData));
    const imgSource = THUMB_URLS[rowHash % THUMB_URLS.length];
    return (
      <TouchableHighlight
        onPress={() => {
          this._pressRow(rowID);
          highlightRow(sectionID, rowID);
        }}>
        <View>
          <View style={styles.row}>
            <Image style={styles.thumb} source={imgSource} />
            <Text style={styles.text}>
              {rowData + ' - ' + LOREM_IPSUM.substr(0, (rowHash % 301) + 10)}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  };

  _genRows(pressData: {[key: number]: boolean}): Array<string> {
    const dataBlob = [];
    for (let ii = 0; ii < 100; ii++) {
      const pressedText = pressData[ii] ? ' (pressed)' : '';
      dataBlob.push('Row ' + ii + pressedText);
    }
    return dataBlob;
  }

  _pressRow = (rowID: number) => {
    this._pressData[rowID] = !this._pressData[rowID];
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(
        this._genRows(this._pressData),
      ),
    });
  };

  _renderSeparator(
    sectionID: number,
    rowID: number,
    adjacentRowHighlighted: boolean,
  ) {
    return (
      <View
        key={`${sectionID}-${rowID}`}
        style={{
          height: adjacentRowHighlighted ? 4 : 1,
          backgroundColor: adjacentRowHighlighted ? '#3B5998' : '#CCCCCC',
        }}
      />
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
const LOREM_IPSUM =
  'Lorem ipsum dolor sit amet, ius ad pertinax oportere accommodare, an vix civibus corrumpit referrentur. Te nam case ludus inciderint, te mea facilisi adipiscing. Sea id integre luptatum. In tota sale consequuntur nec. Erat ocurreret mei ei. Eu paulo sapientem vulputate est, vel an accusam intellegam interesset. Nam eu stet pericula reprimique, ea vim illud modus, putant invidunt reprehendunt ne qui.';

/* eslint no-bitwise: 0 */
const hashCode = function(str) {
  let hash = 15;
  for (let ii = str.length - 1; ii >= 0; ii--) {
    hash = (hash << 5) - hash + str.charCodeAt(ii);
  }
  return hash;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F6F6F6',
  },
  thumb: {
    width: 64,
    height: 64,
  },
  text: {
    flex: 1,
  },
});

exports.title = '<ListView>';
exports.description = 'Performant, scrollable list of data.';
exports.examples = [
  {
    title: 'Simple list of items',
    render: function(): React.Element<typeof ListViewExample> {
      return <ListViewExample />;
    },
  },
];
