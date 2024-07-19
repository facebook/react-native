/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Utility class to make assertions that should not hard-crash the app but instead be handled by the
 * Catalyst app [JSExceptionHandler]. See the javadoc on that class for more information about our
 * opinion on when these assertions should be used as opposed to assertions that might throw
 * AssertionError Throwables that will cause the app to hard crash.
 */
public object SoftAssertions {

  /**
   * Throw [AssertionException] with a given message. Use this method surrounded with `if` block
   * with assert condition in case you plan to do string concatenation to produce the message. This
   * logs an assertion with ReactSoftExceptionLogger, which decides whether or not to actually
   * throw.
   */
  @JvmStatic
  public fun assertUnreachable(message: String): Unit {
    ReactSoftExceptionLogger.logSoftException("SoftAssertions", AssertionException(message))
  }

  /**
   * Asserts the given condition, throwing an [AssertionException] if the condition doesn't hold.
   * This logs an assertion with ReactSoftExceptionLogger, which decides whether or not to actually
   * throw.
   */
  @JvmStatic
  public fun assertCondition(condition: Boolean, message: String): Unit {
    if (!condition) {
      ReactSoftExceptionLogger.logSoftException("SoftAssertions", AssertionException(message))
    }
  }

  /**
   * Asserts that the given object isn't null, throwing an [AssertionException] if it was. This logs
   * an assertion with ReactSoftExceptionLogger, which decides whether or not to actually throw.
   */
  @JvmStatic
  public fun <T> assertNotNull(instance: T?): T? {
    if (instance == null) {
      ReactSoftExceptionLogger.logSoftException(
          "SoftAssertions", AssertionException("Expected object to not be null!"))
    }
    return instance
  }
}
