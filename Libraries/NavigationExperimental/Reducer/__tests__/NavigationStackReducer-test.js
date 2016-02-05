/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow-broken
 */
'use strict';

jest
 .autoMockOff()
 .mock('ErrorUtils');

const NavigationStackReducer = require('NavigationStackReducer');

const {
  JumpToAction,
  JumpToIndexAction,
  PopAction,
  PushAction,
  ResetAction,
} = NavigationStackReducer;

describe('NavigationStackReducer', () => {

  it('handles PushAction', () => {
    const initialStates = [
      {key: 'route0'},
      {key: 'route1'},
    ];
    let reducer = NavigationStackReducer({
      initialStates,
      matchAction: () => true,
      actionStateMap: (action) => action,
    });

    let state = reducer();
    expect(state.children).toBe(initialStates);
    expect(state.index).toBe(1);
    expect(state.key).toBe('NAV_STACK_DEFAULT_KEY');

    state = reducer(state, PushAction({key: 'route2'}));
    expect(state.children[0].key).toBe('route0');
    expect(state.children[1].key).toBe('route1');
    expect(state.children[2].key).toBe('route2');
    expect(state.index).toBe(2);
  });

  it('handles PopAction', () => {
    let reducer = NavigationStackReducer({
      initialStates: [
        {key: 'a'},
        {key: 'b'},
      ],
      initialIndex: 1,
      key: 'myStack',
      matchAction: () => true,
      actionStateMap: (action) => action,
    });

    let state = reducer();
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children.length).toBe(2);
    expect(state.index).toBe(1);
    expect(state.key).toBe('myStack');

    state = reducer(state, PopAction());
    expect(state.children[0].key).toBe('a');
    expect(state.children.length).toBe(1);
    expect(state.index).toBe(0);
    expect(state.key).toBe('myStack');

    // make sure Pop on an single-route state is a no-op
    state = reducer(state, PopAction());
    expect(state.children[0].key).toBe('a');
    expect(state.children.length).toBe(1);
    expect(state.index).toBe(0);
    expect(state.key).toBe('myStack');
  });

  it('handles JumpToAction', () => {
    let reducer = NavigationStackReducer({
      initialStates: [
        {key: 'a'},
        {key: 'b'},
        {key: 'c'},
      ],
      initialIndex: 0,
      key: 'myStack',
      matchAction: () => true,
      actionStateMap: (action) => action,
    });

    let state = reducer();
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children[2].key).toBe('c');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(0);

    state = reducer(state, JumpToAction('b'));
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children[2].key).toBe('c');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(1);

    state = reducer(state, JumpToAction('c'));
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children[2].key).toBe('c');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(2);

    state = reducer(state, JumpToAction('c'));
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children[2].key).toBe('c');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(2);
    expect(state.key).toBe('myStack');
  });

  it('handles JumpToIndexAction', () => {
    let reducer = NavigationStackReducer({
      initialStates: [
        {key: 'a'},
        {key: 'b'},
        {key: 'c'},
      ],
      initialIndex: 2,
      key: 'myStack',
      matchAction: () => true,
      actionStateMap: (action) => action,
    });

    let state = reducer();
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(2);

    state = reducer(state, JumpToIndexAction(0));
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(0);

    state = reducer(state, JumpToIndexAction(1));
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children[2].key).toBe('c');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(1);
    expect(state.key).toBe('myStack');
  });

  it('handles ResetAction', () => {
    let reducer = NavigationStackReducer({
      initialStates: [
        {key: 'a'},
        {key: 'b'},
      ],
      initialIndex: 1,
      key: 'myStack',
      matchAction: () => true,
      actionStateMap: (action) => action,
    });

    let state = reducer();
    expect(state.children[0].key).toBe('a');
    expect(state.children[1].key).toBe('b');
    expect(state.children.length).toBe(2);
    expect(state.index).toBe(1);

    state = reducer(state, ResetAction([{key: 'c'}, {key: 'd'}], 0));
    expect(state.children[0].key).toBe('c');
    expect(state.children[1].key).toBe('d');
    expect(state.children.length).toBe(2);
    expect(state.index).toBe(0);

    const newStates = [
      {key: 'e'},
      {key: 'f'},
      {key: 'g'},
    ];

    state = reducer(state, ResetAction(newStates, 1));
    expect(state.children[0].key).toBe('e');
    expect(state.children[1].key).toBe('f');
    expect(state.children[2].key).toBe('g');
    expect(state.children.length).toBe(3);
    expect(state.index).toBe(1);
    expect(state.key).toBe('myStack');
  });

});
