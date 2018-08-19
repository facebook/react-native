/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @providesModule WKWebView
 */

const React = require('react');

const requireNativeComponent = require('requireNativeComponent');

const RCTWKWebView = requireNativeComponent('RCTWKWebView');

type RCTWKWebViewProps = {
  allowsInlineMediaPlayback?: boolean,
  mediaPlaybackRequiresUserAction?: boolean,
  dataDetectorTypes?: boolean,
};

class WKWebView extends React.Component<RCTWKWebViewProps> {
  componentWillReceiveProps(nextProps: RCTWKWebViewProps) {
    this.showRedboxOnPropChanges(nextProps, 'allowsInlineMediaPlayback');
    this.showRedboxOnPropChanges(nextProps, 'mediaPlaybackRequiresUserAction');
    this.showRedboxOnPropChanges(nextProps, 'dataDetectorTypes');
  }

  showRedboxOnPropChanges(nextProps: RCTWKWebViewProps, propName: string) {
    if (this.props[propName] !== nextProps[propName]) {
      console.error(`Changes to property ${propName} do nothing after the initial render.`);
    }
  }

  render() {
    return <RCTWKWebView {...this.props}/>;
  }
}

module.exports = WKWebView;
