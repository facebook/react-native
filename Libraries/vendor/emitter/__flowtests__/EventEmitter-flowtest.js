/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 */

import EventEmitter from '../EventEmitter';

type MyEvents = {
  noArgsEvent: [],
  stringEvent: [string],
  numberEvent: [number],
  anotherNumberEvent: [number],
  objectAndBooleanEvent: [{prop: string}, boolean],
};

export function testBaseEventEmitterInstance() {
  const emitter = new EventEmitter<MyEvents>();

  emitter.addListener('noArgsEvent', expectedUndefined => {
    (expectedUndefined: void);
  });

  emitter.addListener('stringEvent', expectedString => {
    (expectedString: string);
  });

  emitter.addListener('numberEvent', expectedNumber => {
    (expectedNumber: number);
  });

  emitter.addListener('anotherNumberEvent', expectedNumber => {
    (expectedNumber: number);
  });

  emitter.addListener(
    'objectAndBooleanEvent',
    (expectedObject, expectedBoolean, unexpectedArg) => {
      (expectedObject: {prop: string});
      (expectedBoolean: boolean);
      (unexpectedArg: void);
    },
  );

  // $FlowExpectedError[prop-missing]
  emitter.addListener('unexpectedEvent', () => {});

  // $FlowExpectedError[incompatible-call]
  emitter.addListener('noArgsEvent', (value: number) => {});

  // $FlowExpectedError[incompatible-call]
  emitter.addListener('numberEvent', (value: string) => {});

  emitter.emit('noArgsEvent');
  emitter.emit('stringEvent', 'value');
  emitter.emit('numberEvent', 4);
  emitter.emit('anotherNumberEvent', 4);
  emitter.emit('objectAndBooleanEvent', {prop: 'value'}, true);
}

export function testSubclass() {
  // $FlowExpectedError[incompatible-type-arg]
  class EmitterWithUndefinedDefinition extends EventEmitter<void> {}

  // $FlowExpectedError[incompatible-type-arg]
  class EmitterWithNumberDefinition extends EventEmitter<number> {}

  class EmitterWithInvalidDefinitions extends EventEmitter<{
    foo: number,
  }> {}

  const emitter = new EmitterWithInvalidDefinitions();
  // $FlowExpectedError[not-an-array]
  // $FlowExpectedError[incompatible-call]
  emitter.emit('foo');

  class EmitterWithValidDefinitions extends EventEmitter<MyEvents> {}
}

export function testSubclassInstance() {
  class MyEmitter extends EventEmitter<MyEvents> {}

  const emitter = new MyEmitter();

  emitter.addListener('noArgsEvent', expectedUndefined => {
    (expectedUndefined: void);
  });

  emitter.addListener('stringEvent', expectedString => {
    (expectedString: string);
  });

  emitter.addListener('numberEvent', expectedNumber => {
    (expectedNumber: number);
  });

  emitter.addListener('anotherNumberEvent', expectedNumber => {
    (expectedNumber: number);
  });

  emitter.addListener(
    'objectAndBooleanEvent',
    (expectedObject, expectedBoolean, unexpectedArg) => {
      (expectedObject: {prop: string});
      (expectedBoolean: boolean);
      (unexpectedArg: void);
    },
  );

  // $FlowExpectedError[prop-missing]
  emitter.addListener('unexpectedEvent', () => {});

  // $FlowExpectedError[incompatible-call]
  emitter.addListener('noArgsEvent', (value: number) => {});

  // $FlowExpectedError[incompatible-call]
  emitter.addListener('numberEvent', (value: string) => {});

  emitter.emit('noArgsEvent');
  emitter.emit('stringEvent', 'value');
  emitter.emit('numberEvent', 4);
  emitter.emit('anotherNumberEvent', 4);
  emitter.emit('objectAndBooleanEvent', {prop: 'value'}, true);
}
