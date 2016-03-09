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
 * @providesModule createExamplePage
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  Platform,
} = React;
var ReactNative = require('ReactNative');
var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var invariant = require('fbjs/lib/invariant');

import type { Example, ExampleModule } from 'ExampleTypes';

var createExamplePage = function(title: ?string, exampleModule: ExampleModule)
  : ReactClass<any> {
  invariant(!!exampleModule.examples, 'The module must have examples');

  var ExamplePage = React.createClass({
    statics: {
      title: exampleModule.title,
      description: exampleModule.description,
    },

    getBlock: function(example: Example, i) {
      // Filter platform-specific examples
      var {title, description, platform} = example;
      if (platform) {
        if (Platform.OS !== platform) {
          return null;
        }
        title += ' (' + platform + ' only)';
      }
      // Hack warning: This is a hack because the www UI explorer requires
      // renderComponent to be called.
      var originalRender = React.render;
      // $FlowFixMe React.renderComponent was deprecated in 0.12, should this be React.render?
      var originalRenderComponent = React.renderComponent;
      var originalIOSRender = ReactNative.render;
      var originalIOSRenderComponent = ReactNative.renderComponent;
      var renderedComponent;
      // TODO remove typecasts when Flow bug #6560135 is fixed
      // and workaround is removed from react-native.js
      (React: Object).render =
      (React: Object).renderComponent =
      (ReactNative: Object).render =
      (ReactNative: Object).renderComponent =
        function(element, container) {
          renderedComponent = element;
        };
      var result = example.render(null);
      if (result) {
        renderedComponent = React.cloneElement(result, {
          navigator: this.props.navigator,
        });
      }
      (React: Object).render = originalRender;
      (React: Object).renderComponent = originalRenderComponent;
      (ReactNative: Object).render = originalIOSRender;
      (ReactNative: Object).renderComponent = originalIOSRenderComponent;
      return (
        <UIExplorerBlock
          key={i}
          title={title}
          description={description}>
          {renderedComponent}
        </UIExplorerBlock>
      );
    },

    render: function() {
      return (
        <UIExplorerPage title={title}>
          {exampleModule.examples.map(this.getBlock)}
        </UIExplorerPage>
      );
    }
  });

  return ExamplePage;
};

module.exports = createExamplePage;
