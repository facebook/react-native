/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import java.io.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.testfixtures.ProjectBuilder

internal fun createProject(): Project {
  with(ProjectBuilder.builder().build()) {
    plugins.apply("com.android.library")
    plugins.apply("com.facebook.react")
    return this
  }
}

internal inline fun <reified T : Task> createTestTask(
    project: Project = createProject(),
    taskName: String = T::class.java.simpleName,
    crossinline block: (T) -> Unit = {}
): T = project.tasks.register(taskName, T::class.java) { block(it) }.get()

/** A util function to zip a list of files from [contents] inside the zipfile at [destination]. */
internal fun zipFiles(destination: File, contents: List<File>) {
  ZipOutputStream(BufferedOutputStream(FileOutputStream(destination.absolutePath))).use { out ->
    for (file in contents) {
      FileInputStream(file).use { fi ->
        BufferedInputStream(fi).use { origin ->
          val entry = ZipEntry(file.name)
          out.putNextEntry(entry)
          origin.copyTo(out, 1024)
        }
      }
    }
  }
}
