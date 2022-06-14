/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;

/**
 * Utility class to make assertions that should not hard-crash the app but instead be handled by the
 * Catalyst app {@link NativeModuleCallExceptionHandler}. See the javadoc on that class for more
 * information about our opinion on when these assertions should be used as opposed to assertions
 * that might throw AssertionError Throwables that will cause the app to hard crash.
 */
public class SoftAssertions {

  /**
   * Throw {@link AssertionException} with a given message. Use this method surrounded with {@code
   * if} block with assert condition in case you plan to do string concatenation to produce the
   * message. This logs an assertion with ReactSoftExceptionLogger, which decides whether or not to
   * actually throw.
   */
  public static void assertUnreachable(String message) {
    ReactSoftExceptionLogger.logSoftException("SoftAssertions", new AssertionException(message));
  }

  /**
   * Asserts the given condition, throwing an {@link AssertionException} if the condition doesn't
   * hold. This logs an assertion with ReactSoftExceptionLogger, which decides whether or not to
   * actually throw.
   */
  public static void assertCondition(boolean condition, String message) {
    if (!condition) {
      ReactSoftExceptionLogger.logSoftException("SoftAssertions", new AssertionException(message));
    }
  }

  /**
   * Asserts that the given Object isn't null, throwing an {@link AssertionException} if it was.
   * This logs an assertion with ReactSoftExceptionLogger, which decides whether or not to actually
   * throw.
   */
  public static <T> T assertNotNull(@Nullable T instance) {
    if (instance == null) {
      ReactSoftExceptionLogger.logSoftException(
          "SoftAssertions", new AssertionException("Expected object to not be null!"));
    }
    return instance;
  }
}
