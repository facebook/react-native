/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
