/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IncrementalPresenter
 * @flow
 */
'use strict';

const IncrementalGroup = require('IncrementalGroup');
const React = require('React');
const PropTypes = require('prop-types');
const View = require('View');

const ViewPropTypes = require('ViewPropTypes');

import type {Context} from 'Incremental';

/**
 * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
 * not be reliably announced.  The whole thing might be deleted, who knows? Use
 * at your own risk.
 *
 * `<IncrementalPresenter>` can be used to group sets of `<Incremental>` renders
 * such that they are initially invisible and removed from layout until all
 * decendents have finished rendering, at which point they are drawn all at once
 * so the UI doesn't jump around during the incremental rendering process.
 *
 * See Incremental.js for more info.
 */
type Props = {
  name: string,
  disabled?: boolean,
  onDone?: () => void,
  onLayout?: (event: Object) => void,
  style?: mixed,
  children?: any,
}
class IncrementalPresenter extends React.Component<Props> {
  context: Context;
  _isDone: boolean;

  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    onDone: PropTypes.func,
    onLayout: PropTypes.func,
    style: ViewPropTypes.style,
  };
  static contextTypes = {
    incrementalGroup: PropTypes.object,
    incrementalGroupEnabled: PropTypes.bool,
  };

  constructor(props: Props, context: Context) {
    super(props, context);
    this._isDone = false;
    (this: any).onDone = this.onDone.bind(this);
  }
  onDone() {
    this._isDone = true;
    if (this.props.disabled !== true &&
        this.context.incrementalGroupEnabled !== false) {
      // Avoid expensive re-renders and use setNativeProps
      this.refs.view.setNativeProps(
        {style: [this.props.style, {opacity: 1, position: 'relative'}]}
      );
    }
    this.props.onDone && this.props.onDone();
  }
  render() {
    if (this.props.disabled !== true &&
        this.context.incrementalGroupEnabled !== false &&
        !this._isDone) {
      var style = [this.props.style, {opacity: 0, position: 'absolute'}];
    } else {
      var style = this.props.style;
    }
    return (
      <IncrementalGroup
        onDone={this.onDone}
        name={this.props.name}
        disabled={this.props.disabled}>
        <View
          children={this.props.children}
          ref="view"
          style={style}
          onLayout={this.props.onLayout}
        />
      </IncrementalGroup>
    );
  }
}

module.exports = IncrementalPresenter;
