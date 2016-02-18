/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LayoutPropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('ReactPropTypes');

/**
 * React Native's layout system is based on Flexbox and is powered both
 * on iOS and Android by an open source project called css-layout:
 * https://github.com/facebook/css-layout
 *
 * The implementation in css-layout is slightly different from what the
 * Flexbox spec defines - for example, we chose more sensible default
 * values. Please refer to the css-layout README for details.
 *
 * These properties are a subset of our styles that are consumed by the layout
 * algorithm and affect the positioning and sizing of views.
 */
var LayoutPropTypes = {
  width: ReactPropTypes.number,
  height: ReactPropTypes.number,
  top: ReactPropTypes.number,
  left: ReactPropTypes.number,
  right: ReactPropTypes.number,
  bottom: ReactPropTypes.number,
  margin: ReactPropTypes.number,
  marginVertical: ReactPropTypes.number,
  marginHorizontal: ReactPropTypes.number,
  marginTop: ReactPropTypes.number,
  marginBottom: ReactPropTypes.number,
  marginLeft: ReactPropTypes.number,
  marginRight: ReactPropTypes.number,
  padding: ReactPropTypes.number,
  paddingVertical: ReactPropTypes.number,
  paddingHorizontal: ReactPropTypes.number,
  paddingTop: ReactPropTypes.number,
  paddingBottom: ReactPropTypes.number,
  paddingLeft: ReactPropTypes.number,
  paddingRight: ReactPropTypes.number,
  borderWidth: ReactPropTypes.number,
  borderTopWidth: ReactPropTypes.number,
  borderRightWidth: ReactPropTypes.number,
  borderBottomWidth: ReactPropTypes.number,
  borderLeftWidth: ReactPropTypes.number,

  position: ReactPropTypes.oneOf([
    'absolute',
    'relative'
  ]),

  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction
  flexDirection: ReactPropTypes.oneOf([
    'row',
    'column'
  ]),

  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap
  flexWrap: ReactPropTypes.oneOf([
    'wrap',
    'nowrap'
  ]),

  // How to align children in the main direction
  // https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
  justifyContent: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around'
  ]),

  // How to align children in the cross direction
  // https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
  alignItems: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch'
  ]),

  // How to align the element in the cross direction
  // https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
  alignSelf: ReactPropTypes.oneOf([
    'auto',
    'flex-start',
    'flex-end',
    'center',
    'stretch'
  ]),

  // https://developer.mozilla.org/en-US/docs/Web/CSS/flex
  flex: ReactPropTypes.number,
};

module.exports = LayoutPropTypes;
