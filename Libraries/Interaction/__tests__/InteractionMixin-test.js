/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 */
'use strict';

jest.enableAutomock().unmock('InteractionMixin');

describe('InteractionMixin', () => {
  var InteractionManager;
  var InteractionMixin;
  var component;

  beforeEach(() => {
    jest.resetModules();
    InteractionManager = require('InteractionManager');
    InteractionMixin = require('InteractionMixin');

    component = Object.create(InteractionMixin);
  });

  it('should start interactions', () => {
    component.createInteractionHandle();
    expect(InteractionManager.createInteractionHandle).toBeCalled();
  });

  it('should end interactions', () => {
    var handle = {};
    component.clearInteractionHandle(handle);
    expect(InteractionManager.clearInteractionHandle).toBeCalledWith(handle);
  });

  it('should schedule tasks', () => {
    var task = jest.fn();
    component.runAfterInteractions(task);
    expect(InteractionManager.runAfterInteractions).toBeCalledWith(task);
  });

  it('should end unfinished interactions in componentWillUnmount', () => {
    var handle = component.createInteractionHandle();
    component.componentWillUnmount();
    expect(InteractionManager.clearInteractionHandle).toBeCalledWith(handle);
  });
});
