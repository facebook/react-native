/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const SceneTracker = require('../SceneTracker');

describe('setActiveScene', function() {
  it('can handle multiple listeners and unsubscribe', function() {
    const listeners = [jest.fn(), jest.fn(), jest.fn()];
    const subscriptions = listeners.map(listener =>
      SceneTracker.addActiveSceneChangedListener(listener),
    );
    subscriptions[1].remove();
    const newScene = {name: 'scene1'};
    SceneTracker.setActiveScene(newScene);
    expect(listeners[0]).toBeCalledWith(newScene);
    expect(listeners[1]).not.toBeCalled();
    expect(listeners[2]).toBeCalledWith(newScene);
  });
});
