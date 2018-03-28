/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule SwipeableQuickActions
 * @flow
 */
'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const ViewPropTypes = require('ViewPropTypes');

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
class SwipeableQuickActions extends React.Component<{style?: $FlowFixMe}> {
  static propTypes = {
    style: ViewPropTypes.style,
  };

  render(): React.Node {
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
