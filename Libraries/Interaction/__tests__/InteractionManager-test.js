/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

jest
  .autoMockOff()
  .mock('ErrorUtils')
  .mock('BatchedBridge');

function expectToBeCalledOnce(fn) {
  expect(fn.mock.calls.length).toBe(1);
}

describe('InteractionManager', () => {
  let InteractionManager;
  let interactionStart;
  let interactionComplete;

  beforeEach(() => {
    jest.resetModuleRegistry();
    InteractionManager = require('InteractionManager');

    interactionStart = jest.genMockFunction();
    interactionComplete = jest.genMockFunction();

    InteractionManager.addListener(
      InteractionManager.Events.interactionStart,
      interactionStart
    );
    InteractionManager.addListener(
      InteractionManager.Events.interactionComplete,
      interactionComplete
    );
  });

  it('throws when clearing an undefined handle', () => {
    expect(() => InteractionManager.clearInteractionHandle()).toThrow();
  });

  it('notifies asynchronously when interaction starts', () => {
    InteractionManager.createInteractionHandle();
    expect(interactionStart).not.toBeCalled();

    jest.runAllTimers();
    expect(interactionStart).toBeCalled();
    expect(interactionComplete).not.toBeCalled();
  });

  it('notifies asynchronously when interaction stops', () => {
    var handle = InteractionManager.createInteractionHandle();
    jest.runAllTimers();
    interactionStart.mockClear();
    InteractionManager.clearInteractionHandle(handle);
    expect(interactionComplete).not.toBeCalled();

    jest.runAllTimers();
    expect(interactionStart).not.toBeCalled();
    expect(interactionComplete).toBeCalled();
  });

  it('does not notify when started & stopped in same event loop', () => {
    var handle = InteractionManager.createInteractionHandle();
    InteractionManager.clearInteractionHandle(handle);

    jest.runAllTimers();
    expect(interactionStart).not.toBeCalled();
    expect(interactionComplete).not.toBeCalled();
  });

  it('does not notify when going from two -> one active interactions', () => {
    InteractionManager.createInteractionHandle();
    var handle = InteractionManager.createInteractionHandle();
    jest.runAllTimers();

    interactionStart.mockClear();
    interactionComplete.mockClear();

    InteractionManager.clearInteractionHandle(handle);
    jest.runAllTimers();
    expect(interactionStart).not.toBeCalled();
    expect(interactionComplete).not.toBeCalled();
  });

  it('runs tasks asynchronously when there are interactions', () => {
    var task = jest.genMockFunction();
    InteractionManager.runAfterInteractions(task);
    expect(task).not.toBeCalled();

    jest.runAllTimers();
    expect(task).toBeCalled();
  });

  it('runs tasks when interactions complete', () => {
    var task = jest.genMockFunction();
    var handle = InteractionManager.createInteractionHandle();
    InteractionManager.runAfterInteractions(task);

    jest.runAllTimers();
    InteractionManager.clearInteractionHandle(handle);
    expect(task).not.toBeCalled();

    jest.runAllTimers();
    expect(task).toBeCalled();
  });

  it('does not run tasks twice', () => {
    var task1 = jest.genMockFunction();
    var task2 = jest.genMockFunction();
    InteractionManager.runAfterInteractions(task1);
    jest.runAllTimers();

    InteractionManager.runAfterInteractions(task2);
    jest.runAllTimers();

    expectToBeCalledOnce(task1);
  });

  it('runs tasks added while processing previous tasks', () => {
    var task1 = jest.genMockFunction().mockImplementation(() => {
      InteractionManager.runAfterInteractions(task2);
    });
    var task2 = jest.genMockFunction();

    InteractionManager.runAfterInteractions(task1);
    expect(task2).not.toBeCalled();

    jest.runAllTimers();

    expect(task1).toBeCalled();
    expect(task2).toBeCalled();
  });
});

describe('promise tasks', () => {
  let InteractionManager;
  let BatchedBridge;
  let sequenceId;
  function createSequenceTask(expectedSequenceId) {
    return jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(expectedSequenceId);
    });
  }
  beforeEach(() => {
    jest.resetModuleRegistry();
    InteractionManager = require('InteractionManager');
    BatchedBridge = require('BatchedBridge');
    sequenceId = 0;
  });


  it('should run a basic promise task', () => {
    const task1 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(1);
      return new Promise(resolve => resolve());
    });
    InteractionManager.runAfterInteractions({gen: task1, name: 'gen1'});
    jest.runAllTimers();
    expectToBeCalledOnce(task1);
  });

  it('should handle nested promises', () => {
    const task1 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(1);
      return new Promise(resolve => {
        InteractionManager.runAfterInteractions({gen: task2, name: 'gen2'})
          .then(resolve);
      });
    });
    const task2 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(2);
      return new Promise(resolve => resolve());
    });
    InteractionManager.runAfterInteractions({gen: task1, name: 'gen1'});
    jest.runAllTimers();
    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
  });

  it('should pause promise tasks during interactions then resume', () => {
    const task1 = createSequenceTask(1);
    const task2 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(2);
      return new Promise(resolve => {
        setTimeout(() => {
          InteractionManager.runAfterInteractions(task3).then(resolve);
        }, 1);
      });
    });
    const task3 = createSequenceTask(3);
    InteractionManager.runAfterInteractions(task1);
    InteractionManager.runAfterInteractions({gen: task2, name: 'gen2'});
    jest.runOnlyPendingTimers();
    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
    const handle = InteractionManager.createInteractionHandle();
    jest.runAllTimers();
    jest.runAllTimers(); // Just to be sure...
    expect(task3).not.toBeCalled();
    InteractionManager.clearInteractionHandle(handle);
    jest.runAllTimers();
    expectToBeCalledOnce(task3);
  });

  it('should execute tasks in loop within deadline', () => {
    InteractionManager.setDeadline(100);
    BatchedBridge.getEventLoopRunningTime.mockReturnValue(10);
    const task1 = createSequenceTask(1);
    const task2 = createSequenceTask(2);
    InteractionManager.runAfterInteractions(task1);
    InteractionManager.runAfterInteractions(task2);

    jest.runOnlyPendingTimers();

    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
  });

  it('should execute tasks one at a time if deadline exceeded', () => {
    InteractionManager.setDeadline(100);
    BatchedBridge.getEventLoopRunningTime.mockReturnValue(200);
    const task1 = createSequenceTask(1);
    const task2 = createSequenceTask(2);
    InteractionManager.runAfterInteractions(task1);
    InteractionManager.runAfterInteractions(task2);

    jest.runOnlyPendingTimers();

    expectToBeCalledOnce(task1);
    expect(task2).not.toBeCalled();

    jest.runOnlyPendingTimers(); // resolve1
    jest.runOnlyPendingTimers(); // task2

    expectToBeCalledOnce(task2);
  });

  const bigAsyncTest = () => {
    const task1 = createSequenceTask(1);
    const task2 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(2);
      return new Promise(resolve => {
        InteractionManager.runAfterInteractions(task3);
        setTimeout(() => {
          InteractionManager.runAfterInteractions({gen: task4, name: 'gen4'})
            .then(resolve);
        }, 1);
      });
    });
    const task3 = createSequenceTask(3);
    const task4 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(4);
      return new Promise(resolve => {
        InteractionManager.runAfterInteractions(task5).then(resolve);
      });
    });
    const task5 = createSequenceTask(5);
    const task6 = createSequenceTask(6);

    InteractionManager.runAfterInteractions(task1);
    InteractionManager.runAfterInteractions({gen: task2, name: 'gen2'});
    InteractionManager.runAfterInteractions(task6);

    jest.runAllTimers();
    // runAllTimers doesn't actually run all timers with nested timer functions
    // inside Promises, so we have to call it extra times.
    jest.runAllTimers();
    jest.runAllTimers();

    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
    expectToBeCalledOnce(task3);
    expectToBeCalledOnce(task4);
    expectToBeCalledOnce(task5);
    expectToBeCalledOnce(task6);
  };

  it('resolves async tasks recusively before other queued tasks', () => {
    bigAsyncTest();
  });

  it('should also work with a deadline', () => {
    InteractionManager.setDeadline(100);
    BatchedBridge.getEventLoopRunningTime.mockReturnValue(200);
    bigAsyncTest();
  });
});
