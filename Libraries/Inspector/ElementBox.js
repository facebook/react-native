/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const View = require('../Components/View/View');
const flattenStyle = require('../StyleSheet/flattenStyle');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Dimensions = require('../Utilities/Dimensions');
const BorderBox = require('./BorderBox');
const resolveBoxStyle = require('./resolveBoxStyle');
const React = require('react');

class ElementBox extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    const style = flattenStyle(this.props.style) || {};
    let margin = resolveBoxStyle('margin', style);
    let padding = resolveBoxStyle('padding', style);

    const frameStyle = {...this.props.frame};
    const contentStyle: {width: number, height: number} = {
      width: this.props.frame.width,
      height: this.props.frame.height,
    };

    if (margin != null) {
      margin = resolveRelativeSizes(margin);

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
      padding = resolveRelativeSizes(padding);

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

type Style = {
  top: number,
  right: number,
  bottom: number,
  left: number,
  ...
};

/**
 * Resolves relative sizes (percentages and auto) in a style object.
 *
 * @param style the style to resolve
 * @return a modified copy
 */
function resolveRelativeSizes(style: $ReadOnly<Style>): Style {
  let resolvedStyle = {...style};
  resolveSizeInPlace(resolvedStyle, 'top', 'height');
  resolveSizeInPlace(resolvedStyle, 'right', 'width');
  resolveSizeInPlace(resolvedStyle, 'bottom', 'height');
  resolveSizeInPlace(resolvedStyle, 'left', 'width');
  return resolvedStyle;
}

/**
 * Resolves the given size of a style object in place.
 *
 * @param style the style object to modify
 * @param direction the direction to resolve (e.g. 'top')
 * @param dimension the window dimension that this direction belongs to (e.g. 'height')
 */
function resolveSizeInPlace(
  style: Style,
  direction: string,
  dimension: string,
) {
  if (style[direction] !== null && typeof style[direction] === 'string') {
    if (style[direction].indexOf('%') !== -1) {
      // $FlowFixMe[prop-missing]
      style[direction] =
        (parseFloat(style[direction]) / 100.0) *
        Dimensions.get('window')[dimension];
    }
    if (style[direction] === 'auto') {
      // Ignore auto sizing in frame drawing due to complexity of correctly rendering this
      // $FlowFixMe[prop-missing]
      style[direction] = 0;
    }
  }
}

module.exports = ElementBox;
