/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal

import javax.inject.Inject
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty

/**
 * A private extension we set on the rootProject to make easier to share values at execution time
 * between app project and library project.
 *
 * Specifically, the [codegenDir], [reactNativeDir] and other properties should be provided by apps
 * (for setups like a monorepo which are app specific) and libraries should honor those values.
 *
 * Users are not supposed to access directly this extension from their build.gradle file.
 */
abstract class PrivateReactExtension @Inject constructor(project: Project) {

  private val objects = project.objects

  val root: DirectoryProperty = objects.directoryProperty()

  val reactNativeDir: DirectoryProperty = objects.directoryProperty()

  val nodeExecutableAndArgs: ListProperty<String> = objects.listProperty(String::class.java)

  val codegenDir: DirectoryProperty = objects.directoryProperty()
}
