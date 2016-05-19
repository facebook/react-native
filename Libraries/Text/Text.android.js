/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Text
 * @flow
 */
'use strict';

const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const TextBaseMixin = require('./TextBaseMixin.js');

const createReactNativeComponentClass =
  require('createReactNativeComponentClass');
 const merge = require('merge');

const Text = React.createClass({
  mixins: [TextBaseMixin],
  render(): ReactElement {
    const newProps = this.getNewProps();
    if (this.context.isInAParentText) {
      return <RCTVirtualText {...newProps} />;
    } else {
      return <RCTText {...newProps} />;
    }
  },
});

const RCTText = createReactNativeComponentClass(TextBaseMixin.viewConfig);
const RCTVirtualText = createReactNativeComponentClass({
  validAttributes: merge(ReactNativeViewAttributes.UIView, {
    isHighlighted: true,
  }),
  uiViewClassName: 'RCTVirtualText',
});

module.exports = Text;
