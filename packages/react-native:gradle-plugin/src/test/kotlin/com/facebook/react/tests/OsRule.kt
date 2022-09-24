/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement

/**
 * A JUnit [TestRule] to override values of [System.getProperties] with the support of the
 * [WithSystemProperty] annotation.
 */
class OsRule : TestRule {

  private var retain: String? = null

  override fun apply(statement: Statement, description: Description): Statement {
    return object : Statement() {
      override fun evaluate() {
        val annotation = description.annotations.filterIsInstance<WithOs>().firstOrNull()

        annotation?.os?.propertyName?.let {
          retain = System.getProperty(OS_NAME_KEY)
          System.setProperty(OS_NAME_KEY, it)
        }
        try {
          statement.evaluate()
        } finally {
          retain?.let { System.setProperty(OS_NAME_KEY, it) }
        }
      }
    }
  }

  companion object {
    const val OS_NAME_KEY = "os.name"
  }
}
