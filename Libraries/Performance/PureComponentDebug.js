/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('React');

opaque type DoNotCommitUsageOfPureComponentDebug = {};

/**
 * Identifies which prop or state changes triggered a re-render of a PureComponent. Usage:
 *
 * Change `extends React.PureComponent` to `extends PureComponentDebug` or inject it
 * everywhere by putting this line in your app setup:
 *
 *    React.PureComponent = require('PureComponentDebug');
 *
 * Should only be used for local testing, and will trigger a flow failure if you try to
 * commit any usages.
 */
class PureComponentDebug<
  P: DoNotCommitUsageOfPureComponentDebug,
  S: ?Object = void,
> extends React.Component<P, S> {
  shouldComponentUpdate(nextProps: P, nextState: S): boolean {
    const tag = this.constructor.name;
    let ret = false;
    const prevPropsKeys = Object.keys(this.props);
    const nextPropsKeys = Object.keys(nextProps);
    if (prevPropsKeys.length !== nextPropsKeys.length) {
      ret = true;
      console.warn(
        'PureComponentDebug: different prop keys',
        tag,
        prevPropsKeys.filter(key => !nextPropsKeys.includes(key)),
        nextPropsKeys.filter(key => !prevPropsKeys.includes(key)),
      );
    }
    const prevStateKeys = Object.keys(this.state || {});
    const nextStateKeys = Object.keys(nextState || {});
    if (prevStateKeys.length !== nextStateKeys.length) {
      ret = true;
      console.warn(
        'PureComponentDebug: different state keys',
        tag,
        prevStateKeys.filter(key => !nextStateKeys.includes(key)),
        nextStateKeys.filter(key => !prevStateKeys.includes(key)),
      );
    }
    for (const key in this.props) {
      if (this.props[key] !== nextProps[key]) {
        ret = true;
        console.warn('PureComponentDebug: different prop values', tag, key);
      }
    }
    for (const key in this.state) {
      if (this.state[key] !== (nextState || {})[key]) {
        ret = true;
        console.warn('PureComponentDebug: different state values', tag, key);
      }
    }
    return ret;
  }
}

module.exports = PureComponentDebug;
