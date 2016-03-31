/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

jest.dontMock('TaskQueue');

function expectToBeCalledOnce(fn) {
  expect(fn.mock.calls.length).toBe(1);
}

function clearTaskQueue(taskQueue) {
  do {
    jest.runAllTimers();
    taskQueue.processNext();
    jest.runAllTimers();
  } while (taskQueue.hasTasksToProcess())
}

describe('TaskQueue', () => {
  let taskQueue;
  let onMoreTasks;
  let sequenceId;
  function createSequenceTask(expectedSequenceId) {
    return jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(expectedSequenceId);
    });
  }
  beforeEach(() => {
    jest.resetModuleRegistry();
    onMoreTasks = jest.genMockFunction();
    const TaskQueue = require('TaskQueue');
    taskQueue = new TaskQueue({onMoreTasks});
    sequenceId = 0;
  });


  it('should run a basic task', () => {
    const task1 = createSequenceTask(1);
    taskQueue.enqueue({run: task1, name: 'run1'});
    expect(taskQueue.hasTasksToProcess()).toBe(true);
    taskQueue.processNext();
    expectToBeCalledOnce(task1);
  });

  it('should handle blocking promise task', () => {
    const task1 = jest.genMockFunction().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          expect(++sequenceId).toBe(1);
          resolve();
        }, 1);
      });
    });
    const task2 = createSequenceTask(2);
    taskQueue.enqueue({gen: task1, name: 'gen1'});
    taskQueue.enqueue({run: task2, name: 'run2'});

    taskQueue.processNext();

    expectToBeCalledOnce(task1);
    expect(task2).not.toBeCalled();
    expect(onMoreTasks).not.toBeCalled();
    expect(taskQueue.hasTasksToProcess()).toBe(false);

    clearTaskQueue(taskQueue);

    expectToBeCalledOnce(onMoreTasks);
    expectToBeCalledOnce(task2);
  });

  it('should handle nested simple tasks', () => {
    const task1 = jest.genMockFunction().mockImplementation(() => {
      expect(++sequenceId).toBe(1);
      taskQueue.enqueue({run: task3, name: 'run3'});
    });
    const task2 = createSequenceTask(2);
    const task3 = createSequenceTask(3);
    taskQueue.enqueue({run: task1, name: 'run1'});
    taskQueue.enqueue({run: task2, name: 'run2'}); // not blocked by task 1

    clearTaskQueue(taskQueue);

    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
    expectToBeCalledOnce(task3);
  });

  it('should handle nested promises', () => {
    const task1 = jest.genMockFunction().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          expect(++sequenceId).toBe(1);
          taskQueue.enqueue({gen: task2, name: 'gen2'});
          taskQueue.enqueue({run: resolve, name: 'resolve1'});
        }, 1);
      });
    });
    const task2 = jest.genMockFunction().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          expect(++sequenceId).toBe(2);
          taskQueue.enqueue({run: task3, name: 'run3'});
          taskQueue.enqueue({run: resolve, name: 'resolve2'});
        }, 1);
      });
    });
    const task3 = createSequenceTask(3);
    const task4 = createSequenceTask(4);
    taskQueue.enqueue({gen: task1, name: 'gen1'});
    taskQueue.enqueue({run: task4, name: 'run4'}); // blocked by task 1 promise

    clearTaskQueue(taskQueue);

    expectToBeCalledOnce(task1);
    expectToBeCalledOnce(task2);
    expectToBeCalledOnce(task3);
    expectToBeCalledOnce(task4);
  });
});
