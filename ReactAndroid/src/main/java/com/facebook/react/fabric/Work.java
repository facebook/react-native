/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

/**
 * Interface that represents a task or piece of code that will be executed by {@link Scheduler}
 * This follows React API naming for consistency.
 */
public interface Work {

  void run();

}


