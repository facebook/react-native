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

        <UIExplorerBlock title="Large Red ProgressBar">
          <ProgressBar styleAttr="Large" color="red" />
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
});

module.exports = ProgressBarAndroidExample;
