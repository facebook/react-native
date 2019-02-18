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
  Image,
  SwipeableListView,
  TouchableHighlight,
  StyleSheet,
  Text,
  View,
  Alert,
} = require('react-native');

const RNTesterPage = require('./RNTesterPage');

import type {RNTesterProps} from 'RNTesterTypes';
import type {SwipeableListViewDataSource} from 'SwipeableListViewDataSource';

type State = {|
  dataSource: SwipeableListViewDataSource,
|};

class SwipeableListViewExample extends React.Component<RNTesterProps, State> {
  state = {
    dataSource: SwipeableListView.getNewDataSource().cloneWithRowsAndSections(
      ...this._genDataSource({}),
    ),
  };

  _pressData: {[key: number]: boolean} = {};

  render(): React.Node {
    return (
      <RNTesterPage
        title={this.props.navigator ? null : '<SwipeableListView>'}
        noSpacer={true}
        noScroll={true}>
        <SwipeableListView
          dataSource={this.state.dataSource}
          maxSwipeDistance={100}
          renderQuickActions={(
            rowData: Object,
            sectionID: string,
            rowID: string,
          ) => {
            return (
              <View style={styles.actionsContainer}>
                <TouchableHighlight
                  onPress={() => {
                    Alert.alert(
                      'Tips',
                      'You could do something with this row: ' + rowData.text,
                    );
                  }}>
                  <Text>Remove</Text>
                </TouchableHighlight>
              </View>
            );
          }}
          renderRow={this._renderRow}
          renderSeparator={this._renderSeperator}
        />
      </RNTesterPage>
    );
  }

  _renderRow(rowData: Object, sectionID: string, rowID: string) {
    const rowHash = Math.abs(hashCode(rowData.id));
    const imgSource = THUMB_URLS[rowHash % THUMB_URLS.length];
    return (
      <TouchableHighlight onPress={() => {}}>
        <View>
          <View style={styles.row}>
            <Image style={styles.thumb} source={imgSource} />
            <Text style={styles.text}>
              {rowData.id + ' - ' + LOREM_IPSUM.substr(0, (rowHash % 301) + 10)}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  _genDataSource(pressData: {[key: number]: boolean}) {
    const dataBlob = {};
    const sectionIDs = ['Section 0'];
    const rowIDs = [[]];
    /**
     * dataBlob example below:
     *   {
     *     'Section 0': {
     *       'Row 0': {
     *         id: '0',
     *         text: 'row 0 text'
     *       },
     *       'Row 1': {
     *         id: '1',
     *         text: 'row 1 text'
     *       }
     *     }
     *   }
     */

    // Only one section in this example
    dataBlob['Section 0'] = {};
    for (let ii = 0; ii < 100; ii++) {
      const pressedText = pressData[ii] ? ' (pressed)' : '';
      dataBlob[sectionIDs[0]]['Row ' + ii] = {
        id: 'Row ' + ii,
        text: 'Row ' + ii + pressedText,
      };
      rowIDs[0].push('Row ' + ii);
    }
    return [dataBlob, sectionIDs, rowIDs];
  }

  _renderSeperator(
    sectionID: string,
    rowID: string,
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

const LOREM_IPSUM = [
  'Lorem ipsum dolor sit amet, ius ad pertinax oportere accommodare, an vix ',
  'civibus corrumpit referrentur. Te nam case ludus inciderint, te mea facilisi ',
  'adipiscing. Sea id integre luptatum. In tota sale consequuntur nec. Erat ',
  'ocurreret mei ei. Eu paulo sapientem vulputate est, vel an accusam ',
  'intellegam interesset. Nam eu stet pericula reprimique, ea vim illud modus, ',
  'putant invidunt reprehendunt ne qui.',
].join('');

/* eslint-disable no-bitwise */
const hashCode = str => {
  let hash = 15;
  for (let ii = str.length - 1; ii >= 0; ii--) {
    hash = (hash << 5) - hash + str.charCodeAt(ii);
  }
  return hash;
};
/* eslint-enable no-bitwise */

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
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

exports.title = '<SwipeableListView>';
exports.description = 'Performant, scrollable, swipeable list of data.';
exports.examples = [
  {
    title: 'Simple swipable list',
    render: function(): React.Element<typeof SwipeableListViewExample> {
      return <SwipeableListViewExample />;
    },
  },
];
