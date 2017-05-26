/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SwipeableQuickActions
 * @flow
 */
'use strict';

const React = require('../../react-native/React');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../../Components/View/View');

const ViewPropTypes = require('../../Components/View/ViewPropTypes');

/**
 * A thin wrapper around standard quick action buttons that can, if the user
 * chooses, be used with SwipeableListView. Sample usage is as follows, in the
 * renderQuickActions callback:
 *
 * <SwipeableQuickActions>
 *   <SwipeableQuickActionButton {..props} />
 *   <SwipeableQuickActionButton {..props} />
 * </SwipeableQuickActions>
 */
class SwipeableQuickActions extends React.Component {
  props: {style?: $FlowFixMe};

  static propTypes = {
    style: ViewPropTypes.style,
  };

  render(): React.Element<any> {
    // $FlowFixMe found when converting React.createClass to ES6
    const children = this.props.children;
    let buttons = [];

    // Multiple children
    if (children instanceof Array) {
      for (let i = 0; i < children.length; i++) {
        buttons.push(children[i]);

        // $FlowFixMe found when converting React.createClass to ES6
        if (i < this.props.children.length - 1) { // Not last button
          buttons.push(<View key={i} style={styles.divider} />);
        }
      }
    } else { // 1 child
      buttons = children;
    }

    return (
      <View style={[styles.background, this.props.style]}>
        {buttons}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  divider: {
    width: 4,
  },
});

module.exports = SwipeableQuickActions;
