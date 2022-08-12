/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {expectError, expectType} from 'tsd';

import EventEmitter from './EventEmitter';

const emitter = new EventEmitter<{
  void: [],
  string: [string],
  strings: [string, string],
  error: [Error],
}>();

const subscription = emitter.addListener('void', () => {
  // Takes no arguments.
});
subscription.remove();

emitter.addListener('string', foo => {
  expectType<string>(foo);
});
emitter.addListener('strings', (foo, bar) => {
  expectType<string>(foo);
  expectType<string>(bar);
});
emitter.addListener('error', error => {
  expectType<Error>(error);
});

emitter.emit('void');
emitter.emit('string', 'foo');
emitter.emit('strings', 'foo', 'bar');
emitter.emit('error', new Error());

emitter.removeAllListeners('void');
emitter.removeAllListeners('string');
emitter.removeAllListeners('strings');
emitter.removeAllListeners('error');
emitter.removeAllListeners();

emitter.listenerCount('void');
emitter.listenerCount('string');
emitter.listenerCount('strings');
emitter.listenerCount('error');

expectError(() => {
  emitter.addListener('does-not-exist', () => {
    // ...
  });
});

expectError(() => {
  subscription.context;
});
expectError(() => {
  subscription.listener;
});
expectError(() => {
  subscription.once;
});

expectError(() => {
  emitter.emit('void', undefined);
});
expectError(() => {
  emitter.emit('string', 123);
});
expectError(() => {
  emitter.emit('strings', 'foo');
});
expectError(() => {
  emitter.emit('strings', 'foo', 'bar', 'baz');
});
expectError(() => {
  emitter.emit('error');
});
expectError(() => {
  emitter.emit('does-not-exist');
});

expectError(() => {
  emitter.removeAllListeners('does-not-exist');
});

expectError(() => {
  emitter.listenerCount('does-not-exist');
});
