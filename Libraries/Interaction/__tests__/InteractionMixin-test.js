/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
