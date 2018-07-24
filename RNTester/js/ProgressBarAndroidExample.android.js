/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var ProgressBar = require('ProgressBarAndroid');
var React = require('React');
var createReactClass = require('create-react-class');
var RNTesterBlock = require('RNTesterBlock');
var RNTesterPage = require('RNTesterPage');

var TimerMixin = require('react-timer-mixin');

var MovingBar = createReactClass({
  displayName: 'MovingBar',
  mixins: [TimerMixin],

  getInitialState: function() {
    return {
      progress: 0,
    };
  },

  componentDidMount: function() {
    this.setInterval(() => {
      var progress = (this.state.progress + 0.02) % 1;
      this.setState({progress: progress});
    }, 50);
  },

  render: function() {
    return <ProgressBar progress={this.state.progress} {...this.props} />;
  },
});

class ProgressBarAndroidExample extends React.Component<{}> {
  static title = '<ProgressBarAndroid>';
  static description = 'Horizontal bar to show the progress of some operation.';

  render() {
    return (
      <RNTesterPage title="ProgressBar Examples">
        <RNTesterBlock title="Horizontal Indeterminate ProgressBar">
          <ProgressBar styleAttr="Horizontal" />
        </RNTesterBlock>

        <RNTesterBlock title="Horizontal ProgressBar">
          <MovingBar styleAttr="Horizontal" indeterminate={false} />
        </RNTesterBlock>

        <RNTesterBlock title="Horizontal Black Indeterminate ProgressBar">
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

module.exports = ProgressBarAndroidExample;
