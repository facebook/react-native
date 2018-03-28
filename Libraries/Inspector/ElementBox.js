/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ElementBox
 * @flow
 */
'use strict';

var React = require('React');
var View = require('View');
var StyleSheet = require('StyleSheet');
var BorderBox = require('BorderBox');
var resolveBoxStyle = require('resolveBoxStyle');

var flattenStyle = require('flattenStyle');

class ElementBox extends React.Component<$FlowFixMeProps> {
  render() {
    var style = flattenStyle(this.props.style) || {};
    var margin = resolveBoxStyle('margin', style);
    var padding = resolveBoxStyle('padding', style);
    var frameStyle = this.props.frame;
    if (margin) {
      frameStyle = {
        top: frameStyle.top - margin.top,
        left: frameStyle.left - margin.left,
        height: frameStyle.height + margin.top + margin.bottom,
        width: frameStyle.width + margin.left + margin.right,
      };
    }
    var contentStyle = {
      width: this.props.frame.width,
      height: this.props.frame.height,
    };
    if (padding) {
      contentStyle = {
        width: contentStyle.width - padding.left - padding.right,
        height: contentStyle.height - padding.top - padding.bottom,
      };
    }
    return (
      <View style={[styles.frame, frameStyle]} pointerEvents="none">
        <BorderBox box={margin} style={styles.margin}>
          <BorderBox box={padding} style={styles.padding}>
            <View style={[styles.content, contentStyle]} />
          </BorderBox>
        </BorderBox>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  frame: {
    position: 'absolute',
  },
  content: {
    backgroundColor: 'rgba(200, 230, 255, 0.8)',
  },
  padding: {
    borderColor: 'rgba(77, 255, 0, 0.3)',
  },
  margin: {
    borderColor: 'rgba(255, 132, 0, 0.3)',
  },
});

module.exports = ElementBox;

