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
 .unmock('NavigationTabsReducer')
 .unmock('NavigationFindReducer')
 .unmock('NavigationStateUtils');

const NavigationTabsReducer = require('NavigationTabsReducer');

const {
  JumpToAction,
} = NavigationTabsReducer;

describe('NavigationTabsReducer', () => {

  it('handles JumpTo with index', () => {
    let reducer = NavigationTabsReducer({
      tabReducers: [
        (tabState, action) => tabState || 'a',
        (tabState, action) => tabState || 'b',
        (tabState, action) => tabState || 'c',
      ],
      initialIndex: 1,
    });

    let navState = reducer();

    expect(navState.routes[0]).toBe('a');
    expect(navState.routes[1]).toBe('b');
    expect(navState.routes[2]).toBe('c');
    expect(navState.routes.length).toBe(3);
    expect(navState.index).toBe(1);

    navState = reducer(
      navState,
      JumpToAction(2)
    );

    expect(navState.routes[0]).toEqual('a');
    expect(navState.routes[1]).toEqual('b');
    expect(navState.routes[2]).toEqual('c');
    expect(navState.routes.length).toBe(3);
    expect(navState.index).toBe(2);
  });

});
