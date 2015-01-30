/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOS
 */

"use strict";

var ReactComponent = require('ReactComponent');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactContext = require('ReactContext');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');
var ReactElementValidator = require('ReactElementValidator');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactIOSDefaultInjection = require('ReactIOSDefaultInjection');
var ReactIOSMount = require('ReactIOSMount');
var ReactLegacyElement = require('ReactLegacyElement');
var ReactPropTypes = require('ReactPropTypes');

var deprecated = require('deprecated');
var invariant = require('invariant');

ReactIOSDefaultInjection.inject();

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;

if (__DEV__) {
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
}

// TODO: Drop legacy elements once classes no longer export these factories
createElement = ReactLegacyElement.wrapCreateElement(
  createElement
);
createFactory = ReactLegacyElement.wrapCreateFactory(
  createFactory
);

var resolveDefaultProps = function(element) {
  // Could be optimized, but not currently in heavy use.
  var defaultProps = element.type.defaultProps;
  var props = element.props;
  for (var propName in defaultProps) {
    if (props[propName] === undefined) {
      props[propName] = defaultProps[propName];
    }
  }
};

// Experimental optimized element creation
var augmentElement = function(element) {
  if (__DEV__) {
    invariant(
      false,
      'This optimized path should never be used in DEV mode because ' +
      'it does not provide validation. Check your JSX transform.'
    );
  }
  element._owner = ReactCurrentOwner.current;
  element._context = ReactContext.current;
  if (element.type.defaultProps) {
    resolveDefaultProps(element);
  }
  return element;
};

var render = function(component, mountInto) {
  ReactIOSMount.renderComponent(component, mountInto);
};

var ReactIOS = {
  hasReactIOSInitialized: false,
  PropTypes: ReactPropTypes,
  createClass: ReactCompositeComponent.createClass,
  createElement: createElement,
  createFactory: createFactory,
  _augmentElement: augmentElement,
  render: render,
  unmountComponentAtNode: ReactIOSMount.unmountComponentAtNode,
  /**
   * Used by the debugger.
   */
  __internals: {
    Component: ReactComponent,
    CurrentOwner: ReactCurrentOwner,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactIOSMount,
  },

 // Hook for JSX spread, don't use this for anything else.
  __spread: Object.assign,

  unmountComponentAtNodeAndRemoveContainer: ReactIOSMount.unmountComponentAtNodeAndRemoveContainer,
  isValidClass: ReactElement.isValidFactory,
  isValidElement: ReactElement.isValidElement,

  // Deprecations (remove for 0.13)
  renderComponent: deprecated(
    'React',
    'renderComponent',
    'render',
    this,
    render
  ),
  isValidComponent: deprecated(
    'React',
    'isValidComponent',
    'isValidElement',
    this,
    ReactElement.isValidElement
  )
};

module.exports = ReactIOS;
