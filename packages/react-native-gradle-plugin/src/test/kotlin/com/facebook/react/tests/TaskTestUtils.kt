/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.testfixtures.ProjectBuilder

internal fun createProject(): Project {
  with(ProjectBuilder.builder().build()) {
    plugins.apply("com.facebook.react")
    return this
  }
}

internal inline fun <reified T : Task> createTestTask(
    project: Project = createProject(),
    taskName: String = T::class.java.simpleName,
    crossinline block: (T) -> Unit = {}
): T = project.tasks.register(taskName, T::class.java) { block(it) }.get()
