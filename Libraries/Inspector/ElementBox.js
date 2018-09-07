/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const BorderBox = require('BorderBox');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const flattenStyle = require('flattenStyle');
const resolveBoxStyle = require('resolveBoxStyle');

class ElementBox extends React.Component<$FlowFixMeProps> {
  render() {
    const style = flattenStyle(this.props.style) || {};
    const margin = resolveBoxStyle('margin', style);
    const padding = resolveBoxStyle('padding', style);

    const frameStyle = {...this.props.frame};
    const contentStyle = {
      width: this.props.frame.width,
      height: this.props.frame.height,
    };

    if (margin != null) {
      frameStyle.top -= margin.top;
      frameStyle.left -= margin.left;
      frameStyle.height += margin.top + margin.bottom;
      frameStyle.width += margin.left + margin.right;

      if (margin.top < 0) {
        contentStyle.height += margin.top;
      }
      if (margin.bottom < 0) {
        contentStyle.height += margin.bottom;
      }
      if (margin.left < 0) {
        contentStyle.width += margin.left;
      }
      if (margin.right < 0) {
        contentStyle.width += margin.right;
      }
    }

    if (padding != null) {
      contentStyle.width -= padding.left + padding.right;
      contentStyle.height -= padding.top + padding.bottom;
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

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
  },
  content: {
    backgroundColor: 'rgba(200, 230, 255, 0.8)', // blue
  },
  padding: {
    borderColor: 'rgba(77, 255, 0, 0.3)', // green
  },
  margin: {
    borderColor: 'rgba(255, 132, 0, 0.3)', // orange
  },
});

module.exports = ElementBox;
