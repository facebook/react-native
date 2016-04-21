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

export type UIExplorerExample = {
  key: string;
  module: React.Component;
};

var ComponentExamples: Array<UIExplorerExample> = [
  {
    key: 'FlipViewWindowsExample',
    module: require('./FlipViewWindowsExample'),
  },
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('./ScrollViewSimpleExample'),
  },
  {
    key: 'StatusBarExample',
    module: require('./StatusBarExample'),
  },
  {
    key: 'TextInputExample',
    module: require('./TextInputExample'),
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
  },
];

const APIExamples = [
  {
    key: 'VibrationExample',
    module: require('./VibrationExample'),
  },
  {
    key: 'AlertExample',
    module: require('./AlertExample').AlertExample,
  },
  {
    key: 'AppStateExample',
    module: require('./AppStateExample'),
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
  },
  {
    key: 'ClipboardExample',
    module: require('./ClipboardExample'),
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
  },
  {
    key: 'NavigationExperimentalExample',
    module: require('./NavigationExperimental/NavigationExperimentalExample'),
  },
  {
    key: 'PointerEventsExample',
    module: require('./PointerEventsExample'),
  },
];

const Modules = {};

APIExamples.concat(ComponentExamples).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const UIExplorerList = {
  APIExamples,
  ComponentExamples,
  Modules,
};

module.exports = UIExplorerList;
