/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const IncrementalGroup = require('IncrementalGroup');
const PropTypes = require('prop-types');
const React = require('React');
const View = require('View');

import type {Context} from 'Incremental';
import type {ViewStyleProp} from 'StyleSheet';
import type {LayoutEvent} from 'CoreEventTypes';

/**
 * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
 * not be reliably announced.  The whole thing might be deleted, who knows? Use
 * at your own risk.
 *
 * `<IncrementalPresenter>` can be used to group sets of `<Incremental>` renders
 * such that they are initially invisible and removed from layout until all
 * descendants have finished rendering, at which point they are drawn all at once
 * so the UI doesn't jump around during the incremental rendering process.
 *
 * See Incremental.js for more info.
 */
type Props = $ReadOnly<{|
  name: string,
  disabled?: boolean,
  onDone?: () => mixed,
  onLayout?: (event: LayoutEvent) => mixed,
  style?: ViewStyleProp,
  children?: React.Node,
|}>;

class IncrementalPresenter extends React.Component<Props> {
  context: Context;
  _isDone: boolean;

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
    if (
      this.props.disabled !== true &&
      this.context.incrementalGroupEnabled !== false
    ) {
      // Avoid expensive re-renders and use setNativeProps
      this.refs.view.setNativeProps({
        style: [this.props.style, {opacity: 1, position: 'relative'}],
      });
    }
    this.props.onDone && this.props.onDone();
  }
  render() {
    let style: ViewStyleProp;
    if (
      this.props.disabled !== true &&
      this.context.incrementalGroupEnabled !== false &&
      !this._isDone
    ) {
      style = [this.props.style, {opacity: 0, position: 'absolute'}];
    } else {
      style = this.props.style;
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
