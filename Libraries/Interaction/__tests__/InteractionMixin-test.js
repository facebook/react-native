/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

jest.enableAutomock().unmock('InteractionMixin');

describe('InteractionMixin', () => {
  let InteractionManager;
  let InteractionMixin;
  let component;

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
    const handle = {};
    component.clearInteractionHandle(handle);
    expect(InteractionManager.clearInteractionHandle).toBeCalledWith(handle);
  });

  it('should schedule tasks', () => {
    const task = jest.fn();
    component.runAfterInteractions(task);
    expect(InteractionManager.runAfterInteractions).toBeCalledWith(task);
  });

  it('should end unfinished interactions in componentWillUnmount', () => {
    const handle = component.createInteractionHandle();
    component.componentWillUnmount();
    expect(InteractionManager.clearInteractionHandle).toBeCalledWith(handle);
  });
});
