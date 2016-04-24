/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest.unmock('InteractionMixin');

describe('InteractionMixin', () => {
  var InteractionManager;
  var InteractionMixin;
  var component;

  beforeEach(() => {
    jest.resetModuleRegistry();
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
    var task = jest.genMockFunction();
    component.runAfterInteractions(task);
    expect(InteractionManager.runAfterInteractions).toBeCalledWith(task);
  });

  it('should end unfinished interactions in componentWillUnmount', () => {
    var handle = component.createInteractionHandle();
    component.componentWillUnmount();
    expect(InteractionManager.clearInteractionHandle).toBeCalledWith(handle);
  });
});
