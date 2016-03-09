/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigationAbstractPanResponder
 * @flow
 */
'use strict';

const PanResponder = require('PanResponder');

const invariant = require('fbjs/lib/invariant');

const EmptyPanHandlers = {
  onMoveShouldSetPanResponder: null,
  onPanResponderGrant: null,
  onPanResponderMove: null,
  onPanResponderRelease: null,
  onPanResponderTerminate: null,
};

/**
 * Abstract class that defines the common interface of PanResponder that handles
 * the gesture actions.
 */
class NavigationAbstractPanResponder {

  panHandlers: Object;

  constructor() {
    const config = {};
    Object.keys(EmptyPanHandlers).forEach(name => {
      const fn: any = (this: any)[name];

      invariant(
        typeof fn === 'function',
        'subclass of `NavigationAbstractPanResponder` must implement method %s',
        name
      );

      config[name] = fn.bind(this);
    }, this);

    this.panHandlers = PanResponder.create(config).panHandlers;
  }
}

module.exports = NavigationAbstractPanResponder;
