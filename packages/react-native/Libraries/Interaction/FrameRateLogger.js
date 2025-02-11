/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import NativeFrameRateLogger from './NativeFrameRateLogger';

const invariant = require('invariant');

/**
 * Flow API for native FrameRateLogger module. If the native module is not installed, function calls
 * are just no-ops.
 *
 * Typical behavior is that `setContext` is called when a new screen is loaded (e.g. via a
 * navigation integration), and then `beginScroll` is called by `ScrollResponder` at which point the
 * native module then begins tracking frame drops. When `ScrollResponder` calls `endScroll`, the
 * native module gathers up all it's frame drop data and reports it via an analytics pipeline for
 * analysis.
 *
 * Note that `beginScroll` may be called multiple times by `ScrollResponder` - unclear if that's a
 * bug, but the native module should be robust to that.
 *
 * In the future we may add support for tracking frame drops in other types of interactions beyond
 * scrolling.
 */
const FrameRateLogger = {
  /**
   * Enable `debug` to see local logs of what's going on.
   */
  setGlobalOptions: function (options: {debug?: boolean, ...}) {
    if (options.debug !== undefined) {
      invariant(
        NativeFrameRateLogger,
        'Trying to debug FrameRateLogger without the native module!',
      );
    }
    NativeFrameRateLogger?.setGlobalOptions({
      debug: !!options.debug,
    });
  },

  /**
   * Must call `setContext` before any events can be properly tracked, which is done automatically
   * in `AppRegistry`, but navigation is also a common place to hook in.
   */
  setContext: function (context: string) {
    NativeFrameRateLogger?.setContext(context);
  },

  /**
   * Called in `ScrollResponder` so any component that uses that module will handle this
   * automatically.
   */
  beginScroll() {
    NativeFrameRateLogger?.beginScroll();
  },

  /**
   * Called in `ScrollResponder` so any component that uses that module will handle this
   * automatically.
   */
  endScroll() {
    NativeFrameRateLogger?.endScroll();
  },
};

export default FrameRateLogger;
