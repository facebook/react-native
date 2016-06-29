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
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  *
 *
 * @providesModule SwipeableQuickActions
 * @flow
 */
'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const MAX_QUICK_ACTIONS = 2;

const SwipeableQuickActions = React.createClass({
  propTypes: {
    style: View.propTypes.style,
  },

  render(): ReactElement<any> {
    const children = this.props.children;
    let buttons = [];

    // Multiple children
    if (children instanceof Array) {
      for (let i = 0; i < children.length && i < MAX_QUICK_ACTIONS; i++) {
        buttons.push(children[i]);

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
  },
});

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
