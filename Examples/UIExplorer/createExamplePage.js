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
var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var invariant = require('invariant');

class Example extends React.Component {
  title: string;
  description: string;
}

type ExampleModule = {
  title: string;
  description: string;
  examples: Array<Example>;
};

var createExamplePage = function(title: ?string, exampleModule: ExampleModule)
  : ReactClass<any, any, any> {
  invariant(!!exampleModule.examples, 'The module must have examples');

  var ExamplePage = React.createClass({
    statics: {
      title: exampleModule.title,
      description: exampleModule.description,
    },

    getBlock: function(example, i) {
      // Hack warning: This is a hack because the www UI explorer requires
      // renderComponent to be called.
      var originalRenderComponent = React.renderComponent;
      var originalRender = React.render;
      var renderedComponent;
      // TODO remove typecasts when Flow bug #6560135 is fixed
      // and workaround is removed from react-native.js
      (React: Object).render = (React: Object).renderComponent = function(element, container) {
        renderedComponent = element;
      };
      var result = example.render(null);
      if (result) {
        renderedComponent = result;
      }
      (React: Object).renderComponent = originalRenderComponent;
      (React: Object).render = originalRender;
      return (
        <UIExplorerBlock
          key={i}
          title={example.title}
          description={example.description}>
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
