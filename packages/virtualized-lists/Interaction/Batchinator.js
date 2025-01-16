/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {InteractionManager} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

/**
 * A simple class for batching up invocations of a low-pri callback. A timeout is set to run the
 * callback once after a delay, no matter how many times it's scheduled. Once the delay is reached,
 * InteractionManager.runAfterInteractions is used to invoke the callback after any hi-pri
 * interactions are done running.
 *
 * Make sure to cleanup with dispose().  Example:
 *
 *   class Widget extends React.Component {
 *     _batchedSave: new Batchinator(() => this._saveState, 1000);
 *     _saveSate() {
 *       // save this.state to disk
 *     }
 *     componentDidUpdate() {
 *       this._batchedSave.schedule();
 *     }
 *     componentWillUnmount() {
 *       this._batchedSave.dispose();
 *     }
 *     ...
 *   }
 */
class Batchinator {
  _callback: () => void;
  _delay: number;
  _taskHandle: ?{cancel: () => void, ...};

  constructor(callback: () => void, delay: number) {
    this._delay = delay;
    this._callback = callback;
  }

  /*
   * Cleanup any pending tasks.
   *
   * By default, if there is a pending task the callback is run immediately. Set the option abort to
   * true to not call the callback if it was pending.
   */
  dispose(): void {
    if (this._taskHandle) {
      this._taskHandle.cancel();
      this._taskHandle = null;
    }
  }

  schedule(): void {
    if (this._taskHandle) {
      return;
    }
    const invokeCallback = () => {
      // Note that we clear the handle before invoking the callback so that if the callback calls
      // schedule again, it will actually schedule another task.
      this._taskHandle = null;
      this._callback();
    };

    const timeoutHandle = setTimeout(
      // NOTE: When shipping this, delete `Batchinator` instead of only these
      // lines of code. Without `InteractionManager`, it's just a `setTimeout`.
      ReactNativeFeatureFlags.disableInteractionManagerInBatchinator()
        ? invokeCallback
        : () => {
            this._taskHandle =
              InteractionManager.runAfterInteractions(invokeCallback);
          },
      this._delay,
    );
    this._taskHandle = {cancel: () => clearTimeout(timeoutHandle)};
  }
}

module.exports = Batchinator;
