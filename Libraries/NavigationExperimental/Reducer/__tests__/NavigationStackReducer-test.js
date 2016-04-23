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
 .dontMock('NavigationStackReducer')
 .dontMock('NavigationStateUtils');

jest.setMock('React', {Component() {}, PropTypes: {}});

const NavigationStackReducer = require('NavigationStackReducer');
const NavigationRootContainer = require('NavigationRootContainer');

describe('NavigationStackReducer', () => {

  it('provides default/initial state', () => {
    const initialState = {
      children: [
        {key: 'a'},
      ],
      index: 0,
      key: 'myStack',
    };
    const reducer = NavigationStackReducer({
      getPushedReducerForAction: (action) => null,
      getReducerForState: (state) => () => state,
      initialState,
    });
    const dummyAction = {type: 'dummyAction'};
    expect(reducer(null, dummyAction)).toBe(initialState);
  });

  it('handles basic reducer pushing', () => {
    const reducer = NavigationStackReducer({
      getPushedReducerForAction: (action) => {
        if (action.type === 'TestPushAction') {
          return (state) => state || {key: action.testValue};
        }
        return null;
      },
      getReducerForState: (state) => () => state,
      initialState: {
        children: [
          {key: 'first'},
        ],
        index: 0,
        key: 'myStack'
      }
    });
    const state1 = reducer(null, {type: 'default'});
    expect(state1.children.length).toBe(1);
    expect(state1.children[0].key).toBe('first');
    expect(state1.index).toBe(0);

    const action = {type: 'TestPushAction', testValue: 'second'};
    const state2 = reducer(state1, action);
    expect(state2.children.length).toBe(2);
    expect(state2.children[0].key).toBe('first');
    expect(state2.children[1].key).toBe('second');
    expect(state2.index).toBe(1);
  });

  it('handles BackAction', () => {
    const reducer = NavigationStackReducer({
      getPushedReducerForAction: (action) => {
        if (action.type === 'TestPushAction') {
          return (state) => state || {key: action.testValue};
        }
        return null;
      },
      getReducerForState: (state) => () => state,
      initialState: {
        children: [
          {key: 'a'},
          {key: 'b'},
        ],
        index: 1,
        key: 'myStack',
      },
    });

    const state1 = reducer(null, {type: 'MyDefaultAction'});
    expect(state1.children[0].key).toBe('a');
    expect(state1.children[1].key).toBe('b');
    expect(state1.children.length).toBe(2);
    expect(state1.index).toBe(1);
    expect(state1.key).toBe('myStack');

    const state2 = reducer(state1, NavigationRootContainer.getBackAction());
    expect(state2.children[0].key).toBe('a');
    expect(state2.children.length).toBe(1);
    expect(state2.index).toBe(0);

    const state3 = reducer(state2, NavigationRootContainer.getBackAction());
    expect(state3).toBe(state2);
  });

  it('allows inner reducers to handle back actions', () => {
    const subReducer = NavigationStackReducer({
      getPushedReducerForAction: () => {},
      initialState: {
        children: [
          {key: 'first'},
          {key: 'second'},
        ],
        index: 1,
        key: 'myInnerStack'
      },
    });

    const reducer = NavigationStackReducer({
      getPushedReducerForAction: (action) => {
        if (action.type === 'TestPushAction') {
          return subReducer;
        }

        return null;
      },
      getReducerForState: (state) => {
        if (state.key === 'myInnerStack') {
          return subReducer;
        }
        return () => state;
      },
      initialState: {
        children: [
          {key: 'a'},
        ],
        index: 0,
        key: 'myStack'
      }
    });

    const state1 = reducer(null, {type: 'MyDefaultAction'});
    const state2 = reducer(state1, {type: 'TestPushAction'});
    expect(state2.children.length).toBe(2);
    expect(state2.children[0].key).toBe('a');
    expect(state2.children[1].key).toBe('myInnerStack');
    expect(state2.children[1].children.length).toBe(2);
    expect(state2.children[1].children[0].key).toBe('first');
    expect(state2.children[1].children[1].key).toBe('second');

    const state3 = reducer(state2, NavigationRootContainer.getBackAction());
    expect(state3.children.length).toBe(2);
    expect(state3.children[0].key).toBe('a');
    expect(state3.children[1].key).toBe('myInnerStack');
    expect(state3.children[1].children.length).toBe(1);
    expect(state3.children[1].children[0].key).toBe('first');
  });
});
