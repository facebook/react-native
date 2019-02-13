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
const ReactNative = require('react-native');
const {
  Image,
  LayoutAnimation,
  ListView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

const NativeModules = require('NativeModules');
const {UIManager} = NativeModules;

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
const NUM_SECTIONS = 100;
const NUM_ROWS_PER_SECTION = 10;

class Thumb extends React.Component<{}, $FlowFixMeState> {
  UNSAFE_componentWillMount() {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  _getThumbIdx = () => {
    return Math.floor(Math.random() * THUMB_URLS.length);
  };

  _onPressThumb = () => {
    const config =
      layoutAnimationConfigs[
        this.state.thumbIndex % layoutAnimationConfigs.length
      ];
    LayoutAnimation.configureNext(config);
    this.setState({
      thumbIndex: this._getThumbIdx(),
      dir: this.state.dir === 'row' ? 'column' : 'row',
    });
  };

  state = {thumbIndex: this._getThumbIdx(), dir: 'row'};

  render() {
    return (
      <TouchableOpacity
        onPress={this._onPressThumb}
        style={[styles.buttonContents, {flexDirection: this.state.dir}]}>
        <Image style={styles.img} source={THUMB_URLS[this.state.thumbIndex]} />
        <Image style={styles.img} source={THUMB_URLS[this.state.thumbIndex]} />
        <Image style={styles.img} source={THUMB_URLS[this.state.thumbIndex]} />
        {this.state.dir === 'column' ? (
          <Text>
            Oooo, look at this new text! So awesome it may just be crazy. Let me
            keep typing here so it wraps at least one line.
          </Text>
        ) : (
          <Text />
        )}
      </TouchableOpacity>
    );
  }
}

class ListViewPagingExample extends React.Component<$FlowFixMeProps, *> {
  constructor(props) {
    super(props);
    const getSectionData = (dataBlob, sectionID) => {
      return dataBlob[sectionID];
    };
    const getRowData = (dataBlob, sectionID, rowID) => {
      return dataBlob[rowID];
    };

    const dataSource = new ListView.DataSource({
      getRowData: getRowData,
      getSectionHeaderData: getSectionData,
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });

    const dataBlob = {};
    const sectionIDs = [];
    const rowIDs = [];
    for (let ii = 0; ii < NUM_SECTIONS; ii++) {
      const sectionName = 'Section ' + ii;
      sectionIDs.push(sectionName);
      dataBlob[sectionName] = sectionName;
      rowIDs[ii] = [];

      for (let jj = 0; jj < NUM_ROWS_PER_SECTION; jj++) {
        const rowName = 'S' + ii + ', R' + jj;
        rowIDs[ii].push(rowName);
        dataBlob[rowName] = rowName;
      }
    }

    this.state = {
      dataSource: dataSource.cloneWithRowsAndSections(
        dataBlob,
        sectionIDs,
        rowIDs,
      ),
      headerPressCount: 0,
    };
  }

  renderRow = (
    rowData: string,
    sectionID: string,
    rowID: string,
  ): React.Element<any> => {
    return <Thumb text={rowData} />;
  };

  renderSectionHeader = (sectionData: string, sectionID: string) => {
    return (
      <View style={styles.section}>
        <Text style={styles.text}>{sectionData}</Text>
      </View>
    );
  };

  renderHeader = () => {
    const headerLikeText =
      this.state.headerPressCount % 2 ? (
        <View>
          <Text style={styles.text}>1 Like</Text>
        </View>
      ) : null;
    return (
      <TouchableOpacity onPress={this._onPressHeader} style={styles.header}>
        {headerLikeText}
        <View>
          <Text style={styles.text}>Table Header (click me)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  renderFooter = () => {
    return (
      <View style={styles.header}>
        <Text onPress={() => console.log('Footer!')} style={styles.text}>
          Table Footer
        </Text>
      </View>
    );
  };

  render() {
    return (
      <ListView
        style={styles.listview}
        dataSource={this.state.dataSource}
        onChangeVisibleRows={(visibleRows, changedRows) =>
          console.log({visibleRows, changedRows})
        }
        renderHeader={this.renderHeader}
        renderFooter={this.renderFooter}
        renderSectionHeader={this.renderSectionHeader}
        renderRow={this.renderRow}
        initialListSize={10}
        pageSize={4}
        scrollRenderAheadDistance={500}
        stickySectionHeadersEnabled
      />
    );
  }

  _onPressHeader = () => {
    const config =
      layoutAnimationConfigs[
        Math.floor(this.state.headerPressCount / 2) %
          layoutAnimationConfigs.length
      ];
    LayoutAnimation.configureNext(config);
    this.setState({headerPressCount: this.state.headerPressCount + 1});
  };
}

const styles = StyleSheet.create({
  listview: {
    backgroundColor: '#B0C4DE',
  },
  header: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B5998',
    flexDirection: 'row',
  },
  text: {
    color: 'white',
    paddingHorizontal: 8,
  },
  buttonContents: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    marginVertical: 3,
    padding: 5,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    paddingVertical: 10,
  },
  img: {
    width: 64,
    height: 64,
    marginHorizontal: 10,
    backgroundColor: 'transparent',
  },
  section: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 6,
    backgroundColor: '#5890ff',
  },
});

const animations = {
  layout: {
    spring: {
      duration: 750,
      create: {
        duration: 300,
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.4,
      },
    },
    easeInEaseOut: {
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
      update: {
        delay: 100,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    },
  },
};

const layoutAnimationConfigs = [
  animations.layout.spring,
  animations.layout.easeInEaseOut,
];

exports.title = '<ListView> - Paging';
exports.description = 'Floating headers & layout animations.';
exports.examples = [
  {
    title: 'Simple list view with pagination',
    render: function(): React.Element<typeof ListViewPagingExample> {
      return <ListViewPagingExample />;
    },
  },
];
