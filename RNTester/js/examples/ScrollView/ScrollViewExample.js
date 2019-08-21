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

const {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = require('react-native');

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';

exports.displayName = 'ScrollViewExample';
exports.title = '<ScrollView>';
exports.description =
  'Component that enables scrolling through child components';
exports.examples = [
  {
    title: '<ScrollView>\n',
    description:
      'To make content scrollable, wrap it within a <ScrollView> component',
    render: function(): React.Node {
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
            {ITEMS.map(createItemRow)}
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
    render: function(): React.Node {
      function renderScrollView(
        title: string,
        additionalStyles: ViewStyleProp,
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
              {ITEMS.map(createItemRow)}
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
          {renderScrollView('LTR layout', {direction: 'ltr'})}
          {renderScrollView('RTL layout', {direction: 'rtl'})}
        </View>
      );
    },
  },
  {
    title: '<ScrollView> enable & disable\n',
    description: 'ScrollView scrolling behaviour can be disabled and enabled',
    render: function(): React.Node {
      class EnableDisableList extends React.Component<{}, *> {
        state = {
          scrollEnabled: true,
        };
        render() {
          return (
            <View>
              <ScrollView
                automaticallyAdjustContentInsets={false}
                style={styles.scrollView}
                scrollEnabled={this.state.scrollEnabled}>
                {ITEMS.map(createItemRow)}
              </ScrollView>
              <Text>
                {'Scrolling enabled = ' + this.state.scrollEnabled.toString()}
              </Text>
              <Button
                label="Disable Scrolling"
                onPress={() => {
                  this.setState({scrollEnabled: false});
                }}
              />
              <Button
                label="Enable Scrolling"
                onPress={() => {
                  this.setState({scrollEnabled: true});
                }}
              />
            </View>
          );
        }
      }
      return <EnableDisableList />;
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
          /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses
           * an error found when Flow v0.85 was deployed. To see the error,
           * delete this comment and run Flow. */
          items: [...Array(itemCount)].map((_, ii) => (
            <Item msg={`Item ${ii}`} />
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
                          <Item
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
                        <Item msg={`Item ${itemCount++}`} />,
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

class Item extends React.PureComponent<{|
  msg?: string,
  style?: ViewStyleProp,
|}> {
  render() {
    return (
      <View style={[styles.item, this.props.style]}>
        <Text>{this.props.msg}</Text>
      </View>
    );
  }
}

let ITEMS = [...Array(12)].map((_, i) => `Item ${i}`);

const createItemRow = (msg, index) => <Item key={index} msg={msg} />;

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
  item: {
    margin: 5,
    padding: 5,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
  },
});
