/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

import type {DangerouslyImpreciseStyleProp} from 'StyleSheet';

const ActivityIndicator = require('ActivityIndicator');
const Platform = require('Platform');
const React = require('react');
const ReactNative = require('react-native');
const {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} = ReactNative;

exports.displayName = 'ScrollViewExample';
exports.title = '<ScrollView>';
exports.description =
  'Component that enables scrolling through child components';
exports.examples = [
  {
    title: '<ScrollView>\n',
    description:
      'To make content scrollable, wrap it within a <ScrollView> component',
    render: function() {
      let _scrollView: ScrollView;
      return (
        <View>
          <ScrollView
            ref={scrollView => {
              // $FlowFixMe Invalid prop usage
              _scrollView = scrollView;
            }}
            automaticallyAdjustContentInsets={false}
            onScroll={() => {
              console.log('onScroll!');
            }}
            scrollEventThrottle={200}
            style={styles.scrollView}>
            {THUMB_URLS.map(createThumbRow)}
          </ScrollView>
          <Button
            label="Scroll to top"
            onPress={() => {
              _scrollView.scrollTo({y: 0});
            }}
          />
          <Button
            label="Scroll to bottom"
            onPress={() => {
              _scrollView.scrollToEnd({animated: true});
            }}
          />
          <Button
            label="Flash scroll indicators"
            onPress={() => {
              _scrollView.flashScrollIndicators();
            }}
          />
        </View>
      );
    },
  },
  {
    title: '<ScrollView> (horizontal = true)\n',
    description:
      "You can display <ScrollView>'s child components horizontally rather than vertically",
    render: function() {
      function renderScrollView(
        title: string,
        additionalStyles: typeof StyleSheet,
      ) {
        let _scrollView: ?ScrollView;
        return (
          <View style={additionalStyles}>
            <Text style={styles.text}>{title}</Text>
            <ScrollView
              ref={scrollView => {
                _scrollView = scrollView;
              }}
              automaticallyAdjustContentInsets={false}
              horizontal={true}
              style={[styles.scrollView, styles.horizontalScrollView]}>
              {THUMB_URLS.map(createThumbRow)}
            </ScrollView>
            <Button
              label="Scroll to start"
              onPress={() => {
                // $FlowFixMe Invalid prop usage
                _scrollView.scrollTo({x: 0});
              }}
            />
            <Button
              label="Scroll to end"
              onPress={() => {
                // $FlowFixMe Invalid prop usage
                _scrollView.scrollToEnd({animated: true});
              }}
            />
            <Button
              label="Flash scroll indicators"
              onPress={() => {
                // $FlowFixMe Invalid prop usage
                _scrollView.flashScrollIndicators();
              }}
            />
          </View>
        );
      }

      return (
        <View>
          {/* $FlowFixMe(>=0.70.0 site=react_native_fb) This comment
             * suppresses an error found when Flow v0.70 was deployed. To see
             * the error delete this comment and run Flow. */
          renderScrollView('LTR layout', {direction: 'ltr'})}
          {/* $FlowFixMe(>=0.70.0 site=react_native_fb) This comment
             * suppresses an error found when Flow v0.70 was deployed. To see
             * the error delete this comment and run Flow. */
          renderScrollView('RTL layout', {direction: 'rtl'})}
        </View>
      );
    },
  },
];
if (Platform.OS === 'ios') {
  exports.examples.push({
    title: '<ScrollView> smooth bi-directional content loading\n',
    description:
      'The `maintainVisibleContentPosition` prop allows insertions to either end of the content ' +
      'without causing the visible content to jump. Re-ordering is not supported.',
    render: function() {
      let itemCount = 6;
      class AppendingList extends React.Component<{}, *> {
        state = {
          items: [...Array(itemCount)].map((_, ii) => (
            <Thumb msg={`Item ${ii}`} />
          )),
        };
        render() {
          return (
            <View>
              <ScrollView
                automaticallyAdjustContentInsets={false}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 1,
                  autoscrollToTopThreshold: 10,
                }}
                style={styles.scrollView}>
                <ActivityIndicator style={{height: 40}} />
                {this.state.items.map(item =>
                  React.cloneElement(item, {key: item.props.msg}),
                )}
              </ScrollView>
              <ScrollView
                horizontal={true}
                automaticallyAdjustContentInsets={false}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 1,
                  autoscrollToTopThreshold: 10,
                }}
                style={[styles.scrollView, styles.horizontalScrollView]}>
                <ActivityIndicator style={{width: 40}} />
                {this.state.items.map(item =>
                  React.cloneElement(item, {key: item.props.msg, style: null}),
                )}
              </ScrollView>
              <View style={styles.row}>
                <Button
                  label="Add to top"
                  onPress={() => {
                    this.setState(state => {
                      const idx = itemCount++;
                      return {
                        items: [
                          <Thumb
                            style={{paddingTop: idx * 5}}
                            msg={`Item ${idx}`}
                          />,
                        ].concat(state.items),
                      };
                    });
                  }}
                />
                <Button
                  label="Remove top"
                  onPress={() => {
                    this.setState(state => ({
                      items: state.items.slice(1),
                    }));
                  }}
                />
                <Button
                  label="Change height top"
                  onPress={() => {
                    this.setState(state => ({
                      items: [
                        React.cloneElement(state.items[0], {
                          style: {paddingBottom: Math.random() * 40},
                        }),
                      ].concat(state.items.slice(1)),
                    }));
                  }}
                />
              </View>
              <View style={styles.row}>
                <Button
                  label="Add to end"
                  onPress={() => {
                    this.setState(state => ({
                      items: state.items.concat(
                        <Thumb msg={`Item ${itemCount++}`} />,
                      ),
                    }));
                  }}
                />
                <Button
                  label="Remove end"
                  onPress={() => {
                    this.setState(state => ({
                      items: state.items.slice(0, -1),
                    }));
                  }}
                />
                <Button
                  label="Change height end"
                  onPress={() => {
                    this.setState(state => ({
                      items: state.items.slice(0, -1).concat(
                        React.cloneElement(
                          state.items[state.items.length - 1],
                          {
                            style: {paddingBottom: Math.random() * 40},
                          },
                        ),
                      ),
                    }));
                  }}
                />
              </View>
            </View>
          );
        }
      }
      return <AppendingList />;
    },
  });
}

class Thumb extends React.PureComponent<{|
  source?: string | number,
  msg?: string,
  style?: DangerouslyImpreciseStyleProp,
|}> {
  render() {
    const {source} = this.props;
    return (
      <View style={[styles.thumb, this.props.style]}>
        <Image
          style={styles.img}
          source={source == null ? THUMB_URLS[6] : source}
        />
        <Text>{this.props.msg}</Text>
      </View>
    );
  }
}

let THUMB_URLS = [
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

THUMB_URLS = THUMB_URLS.concat(THUMB_URLS); // double length of THUMB_URLS

const createThumbRow = (uri, i) => <Thumb key={i} source={uri} />;

const Button = ({label, onPress}) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
  },
  horizontalScrollView: {
    height: 106,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 5,
  },
  button: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  thumb: {
    margin: 5,
    padding: 5,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
  },
  img: {
    width: 64,
    height: 64,
  },
});
