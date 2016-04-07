/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationContainer
 * @flow
 */
'use strict';

var React = require('React');
var NavigationRootContainer = require('NavigationRootContainer');

function createNavigationContainer(
  Component: ReactClass<any>,
): ReactClass {
  class NavigationComponent extends React.Component {
    render() {
      return (
        <Component
          onNavigate={this.getNavigationHandler()}
          {...this.props}
        />
      );
    }
    getNavigationHandler() {
      return this.props.onNavigate || this.context.onNavigate;
    }
    getChildContext() {
      return {
        onNavigate: this.getNavigationHandler(),
      };
    }
  }
  NavigationComponent.contextTypes = {
    onNavigate: React.PropTypes.func,
  };
  NavigationComponent.childContextTypes = {
    onNavigate: React.PropTypes.func,
  };
  return NavigationComponent;
}

var NavigationContainer = {
  create: createNavigationContainer,
  RootContainer: NavigationRootContainer,
};


module.exports = NavigationContainer;
