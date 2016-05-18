/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

var ProgressBar = require('ProgressBarWindows');
var React = require('React');
var UIExplorerBlock = require('UIExplorerBlock');
var UIExplorerPage = require('UIExplorerPage');

var TimerMixin = require('react-timer-mixin');

var MovingBar = React.createClass({
  mixins: [TimerMixin],

  getInitialState: function() {
    return {
      progress: 0
    };
  },

  componentDidMount: function() {
    this.setInterval(
      () => {
        var progress = (this.state.progress + 0.1) % 100;
        this.setState({progress: progress});
      }, 10
    );
  },

  render: function() {
    return <ProgressBar progress={this.state.progress} {...this.props} />;
  },
});

var ProgressBarWindowsExample = React.createClass({

  statics: {
    title: '<ProgressBarWindows>',
    description: 'Visual indicator of progress of some operation. ' +
        'Shows a horizontal bar with either percent indeterminate progress.',
  },

  render: function() {
    return (
      <UIExplorerPage title="ProgressBar Examples">
        <UIExplorerBlock title="Indeterminate ProgressBar">
          <ProgressBar />
        </UIExplorerBlock>

        <UIExplorerBlock title="Determinate ProgressBar">
          <MovingBar indeterminate={false} />
        </UIExplorerBlock>

        <UIExplorerBlock title="Red Indeterminate ProgressBar">
          <ProgressBar color="red" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Blue Determinate ProgressBar">
          <MovingBar color="blue" indeterminate={false} />
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
});

module.exports = ProgressBarWindowsExample;
