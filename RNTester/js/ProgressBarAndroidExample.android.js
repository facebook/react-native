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

const React = require('react');
const {ProgressBarAndroid: ProgressBar} = require('react-native');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterPage = require('./RNTesterPage');

import type {ProgressBarAndroidProps} from '../../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';

type MovingBarProps = $ReadOnly<{|
  ...$Diff<
    ProgressBarAndroidProps,
    {
      progress: ?number,
    },
  >,
  indeterminate: false,
|}>;

type MovingBarState = {
  progress: number,
};

class MovingBar extends React.Component<MovingBarProps, MovingBarState> {
  _intervalID: ?IntervalID = null;

  state = {
    progress: 0,
  };

  componentDidMount() {
    this._intervalID = setInterval(() => {
      const progress = (this.state.progress + 0.02) % 1;
      this.setState({progress});
    }, 50);
  }

  componentWillUnmount() {
    if (this._intervalID != null) {
      clearInterval(this._intervalID);
    }
  }

  render() {
    return <ProgressBar progress={this.state.progress} {...this.props} />;
  }
}

class ProgressBarAndroidExample extends React.Component<{}> {
  render() {
    return (
      <RNTesterPage title="ProgressBar Examples">
        <RNTesterBlock title="Horizontal Indeterminate ProgressBar">
          {/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */}
          <ProgressBar styleAttr="Horizontal" />
        </RNTesterBlock>

        <RNTesterBlock title="Horizontal ProgressBar">
          <MovingBar styleAttr="Horizontal" indeterminate={false} />
        </RNTesterBlock>

        <RNTesterBlock title="Horizontal Black Indeterminate ProgressBar">
          {/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
           * found when making Flow check .android.js files. */}
          <ProgressBar styleAttr="Horizontal" color="black" />
        </RNTesterBlock>

        <RNTesterBlock title="Horizontal Blue ProgressBar">
          <MovingBar
            styleAttr="Horizontal"
            indeterminate={false}
            color="blue"
          />
        </RNTesterBlock>
      </RNTesterPage>
    );
  }
}

exports.title = '<ProgressBarAndroid>';
exports.description = 'Horizontal bar to show the progress of some operation.';
exports.examples = [
  {
    title: 'Simple progress bar',
    render: function(): React.Element<typeof ProgressBarAndroidExample> {
      return <ProgressBarAndroidExample />;
    },
  },
];
