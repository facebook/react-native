/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import javax.annotation.Nullable;

import com.facebook.react.bridge.AssertionException;

/**
 * Utility class to make assertions that should not hard-crash the app but instead be handled by the
 * Catalyst app {@link NativeModuleCallExceptionHandler}. See the javadoc on that class for
 * more information about our opinion on when these assertions should be used as opposed to
 * assertions that might throw AssertionError Throwables that will cause the app to hard crash.
 */
public class SoftAssertions {

  /**
   * Throw {@link AssertionException} with a given message. Use this method surrounded with
   * {@code if} block with assert condition in case you plan to do string concatenation to produce
   * the message.
   */
  public static void assertUnreachable(String message) {
    throw new AssertionException(message);
  }

  /**
   * Asserts the given condition, throwing an {@link AssertionException} if the condition doesn't
   * hold.
   */
  public static void assertCondition(boolean condition, String message) {
    if (!condition) {
      throw new AssertionException(message);
    }
  }

  /**
   * Asserts that the given Object isn't null, throwing an {@link AssertionException} if it was.
   */
  public static <T> T assertNotNull(@Nullable T instance) {
    if (instance == null) {
      throw new AssertionException("Expected object to not be null!");
    }
    return instance;
  }
}
