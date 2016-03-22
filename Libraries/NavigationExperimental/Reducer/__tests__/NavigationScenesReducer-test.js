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

jest.dontMock('NavigationScenesReducer');

const NavigationScenesReducer = require('NavigationScenesReducer');

/**
 * Simulate scenes transtion with changes of navigation states.
 */
function testTransition(states) {
  const navigationStates = states.map(keys => {
    return {
      children: keys.map(key => {
        return { key };
      }),
    };
  });

  let scenes = [];
  let prevState = null;
  navigationStates.forEach((nextState) => {
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
        'navigationState': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'navigationState': {
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
        'navigationState': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'navigationState': {
          'key': '2'
        },
      },
      {
        'index': 2,
        'isStale': false,
        'key': 'scene_3',
        'navigationState': {
          'key': '3'
        },
      },
    ]);
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
        'navigationState': {
          'key': '1'
        },
      },
      {
        'index': 1,
        'isStale': false,
        'key': 'scene_2',
        'navigationState': {
          'key': '2'
        },
      },
      {
        'index': 2,
        'isStale': true,
        'key': 'scene_3',
        'navigationState': {
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
        'navigationState': {
          'key': '1'
        },
      },
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_3',
        'navigationState': {
          'key': '3'
        },
      },
      {
        'index': 1,
        'isStale': true,
        'key': 'scene_2',
        'navigationState': {
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
        'navigationState': {
          'key': '1'
        },
      },
      {
        'index': 0,
        'isStale': false,
        'key': 'scene_2',
        'navigationState': {
          'key': '2'
        },
      },
      {
        'index': 0,
        'isStale': true,
        'key': 'scene_3',
        'navigationState': {
          'key': '3'
        },
      },
    ]);
  });
});
