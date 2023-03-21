/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// Make sure global Event is defined
import EventPolyfill from './EventPolyfill';

type CustomEvent$Options = $ReadOnly<{|
  bubbles?: boolean,
  cancelable?: boolean,
  composed?: boolean,
  detail?: {...},
|}>;

class CustomEvent extends EventPolyfill {
  detail: ?{...};

  constructor(typeArg: string, options: CustomEvent$Options) {
    const {bubbles, cancelable, composed} = options;
    super(typeArg, {bubbles, cancelable, composed});

    this.detail = options.detail; // this would correspond to `NativeEvent` in SyntheticEvent
  }
}

export default CustomEvent;
