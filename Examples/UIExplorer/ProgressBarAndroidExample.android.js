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

var ProgressBar = require('ProgressBarAndroid');
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
        var progress = (this.state.progress + 0.02) % 1;
        this.setState({progress: progress});
      }, 50
    );
  },

  render: function() {
    return <ProgressBar progress={this.state.progress} {...this.props} />;
  },
});

var ProgressBarAndroidExample = React.createClass({

  statics: {
    title: '<ProgressBarAndroid>',
    description: 'Visual indicator of progress of some operation. ' +
        'Shows either a cyclic animation or a horizontal bar.',
  },

  render: function() {
    return (
      <UIExplorerPage title="ProgressBar Examples">
        <UIExplorerBlock title="Default ProgressBar">
          <ProgressBar />
        </UIExplorerBlock>

        <UIExplorerBlock title="Normal ProgressBar">
          <ProgressBar styleAttr="Normal" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Small ProgressBar">
          <ProgressBar styleAttr="Small" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Large ProgressBar">
          <ProgressBar styleAttr="Large" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Inverse ProgressBar">
          <ProgressBar styleAttr="Inverse" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Small Inverse ProgressBar">
          <ProgressBar styleAttr="SmallInverse" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Large Inverse ProgressBar">
          <ProgressBar styleAttr="LargeInverse" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Horizontal Indeterminate ProgressBar">
          <ProgressBar styleAttr="Horizontal" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Horizontal ProgressBar">
          <MovingBar styleAttr="Horizontal" indeterminate={false} />
        </UIExplorerBlock>

        <UIExplorerBlock title="Large Red ProgressBar">
          <ProgressBar styleAttr="Large" color="red" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Horizontal Black Indeterminate ProgressBar">
          <ProgressBar styleAttr="Horizontal" color="black" />
        </UIExplorerBlock>

        <UIExplorerBlock title="Horizontal Blue ProgressBar">
          <MovingBar styleAttr="Horizontal" indeterminate={false} color="blue" />
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
});

module.exports = ProgressBarAndroidExample;
