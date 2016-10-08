/**
 * Copyright (c) 2015-present; Facebook; Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.quicklog.identifiers;

/**
 * Stub implementation of Action Identifiers.
 * Use your own implementation with you own implementation of QuickPerformanceLogger
 */
public class ActionId {

  /**  Don't use this action identifier */
  public static short UNDEFINED = 0;

  /** This starts all markers */
  public static short START = 0;

  /** Successful termination of the marker */
  public static short SUCCESS = 0;

  /** Termination of marker due to some failure */
  public static short FAIL = 0;

  /** Termination of marker due to a cancellation */
  public static short CANCEL = 0;

  /** Some (general) drawing action has completed */
  public static short DRAW_COMPLETE = 0;

  /** General pause poshort */
  public static short PAUSE = 0;

  /** General resume poshort */
  public static short RESUME = 0;

  /** Insertion into a queue */
  public static short QUEUED = 0;

  /** Some error occurred */
  public static short ERROR = 0;

  /** Denoting a finally situation */
  public static short FINALLY = 0;
}

