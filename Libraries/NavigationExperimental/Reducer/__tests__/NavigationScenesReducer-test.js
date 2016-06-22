/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.unmock('NavigationScenesReducer');

const NavigationScenesReducer = require('NavigationScenesReducer');

/**
 * Simulate scenes transtion with changes of navigation states.
 */
function testTransition(states) {
  const routes = states.map(keys => {
    return {
      routes: keys.map(key => {
        return { key };
      }),
    };
  });

  let scenes = [];
  let prevState = null;
  routes.forEach((nextState) => {
    scenes = NavigationScenesReducer(scenes, nextState, prevState);
    prevState = nextState;
  });

  return scenes;
}

describe('NavigationScenesReducer', () => {

  it('gets initial scenes', () => {
    const scenes = testTransition([
      ['1', '2'],
    ]);

    expect(scenes).toEqual([
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_1',
        'route': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'route': {
          'key': '2'
        },
      },
    ]);
  });

  it('pushes new scenes', () => {
    // Transition from ['1', '2'] to ['1', '2', '3'].
    const scenes = testTransition([
      ['1', '2'],
      ['1', '2', '3'],
    ]);

    expect(scenes).toEqual([
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_1',
        'route': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'route': {
          'key': '2'
        },
      },
      {
        'index': 2,
        'isStale': false,
        'key': 'scene_3',
        'route': {
          'key': '3'
        },
      },
    ]);
  });

  it('gets same scenes', () => {
    const state1 = {
      index: 0,
      routes: [{key: '1'}, {key: '2'}],
    };

    const state2 = {
      index: 0,
      routes: [{key: '1'}, {key: '2'}],
    };

    const scenes1 = NavigationScenesReducer([], state1, null);
    const scenes2 = NavigationScenesReducer(scenes1, state2, state1);
    expect(scenes1).toBe(scenes2);
  });

  it('gets different scenes when keys are different', () => {
    const state1 = {
      index: 0,
      routes: [{key: '1'}, {key: '2'}],
    };

    const state2 = {
      index: 0,
      routes: [{key: '2'}, {key: '1'}],
    };

    const scenes1 = NavigationScenesReducer([], state1, null);
    const scenes2 = NavigationScenesReducer(scenes1, state2, state1);
    expect(scenes1).not.toBe(scenes2);
  });

  it('gets different scenes when routes are different', () => {
    const state1 = {
      index: 0,
      routes: [{key: '1', x: 1}, {key: '2', x: 2}],
    };

    const state2 = {
      index: 0,
      routes: [{key: '1', x: 3}, {key: '2', x: 4}],
    };

    const scenes1 = NavigationScenesReducer([], state1, null);
    const scenes2 = NavigationScenesReducer(scenes1, state2, state1);
    expect(scenes1).not.toBe(scenes2);
  });


  it('pops scenes', () => {
    // Transition from ['1', '2', '3'] to ['1', '2'].
    const scenes = testTransition([
      ['1', '2', '3'],
      ['1', '2'],
    ]);

    expect(scenes).toEqual([
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_1',
        'route': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'route': {
          'key': '2'
        },
      },
      {
        'index': 2,
        'isStale': true,
        'key': 'scene_3',
        'route': {
          'key': '3'
        },
      },
    ]);
  });

  it('replaces scenes', () => {
    const scenes = testTransition([
      ['1', '2'],
      ['3'],
    ]);

    expect(scenes).toEqual([
      {
        'index': 0,
        'isStale': true,
        'key': 'scene_1',
        'route': {
          'key': '1'
        },
      },
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_3',
        'route': {
          'key': '3'
        },
      },
      {
        'index': 1,
        'isStale': true,
        'key': 'scene_2',
        'route': {
          'key': '2'
        },
      },
    ]);
  });

  it('revives scenes', () => {
    const scenes = testTransition([
      ['1', '2'],
      ['3'],
      ['2'],
    ]);

    expect(scenes).toEqual([
      {
        'index': 0,
        'isStale': true,
        'key': 'scene_1',
        'route': {
          'key': '1'
        },
      },
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_2',
        'route': {
          'key': '2'
        },
      },
      {
        'index': 0,
        'isStale': true,
        'key': 'scene_3',
        'route': {
          'key': '3'
        },
      },
    ]);
  });
});
