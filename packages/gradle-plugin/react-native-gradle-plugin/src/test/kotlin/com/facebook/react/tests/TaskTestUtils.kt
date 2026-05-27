/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import java.io.*
import java.net.URI
import java.nio.file.FileSystems
import java.nio.file.Files
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.testfixtures.ProjectBuilder

internal fun createProject(projectDir: File? = null): Project {
  val project =
      ProjectBuilder.builder()
          .apply {
            if (projectDir != null) {
              withProjectDir(projectDir)
            }
          }
          .build()

  project.plugins.apply("com.android.library")
  project.plugins.apply("com.facebook.react")
  return project
}

internal inline fun <reified T : Task> createTestTask(
    project: Project = createProject(),
    taskName: String = T::class.java.simpleName,
    crossinline block: (T) -> Unit = {},
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

/** A util function to create a zip given a list of dummy files path. */
internal fun createZip(dest: File, paths: List<String>) {
  val env = mapOf("create" to "true")
  val uri = URI.create("jar:file:$dest")

  FileSystems.newFileSystem(uri, env).use { zipfs ->
    paths.forEach { path ->
      val zipEntryPath = zipfs.getPath(path)
      val zipEntryFolder = zipEntryPath.subpath(0, zipEntryPath.nameCount - 1)
      Files.createDirectories(zipEntryFolder)
      Files.createFile(zipEntryPath)
    }
  }
}
