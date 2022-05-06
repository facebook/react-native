/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import org.gradle.api.Project
import org.gradle.api.plugins.ExtensionContainer

object GradleUtils {

  @JvmStatic
  fun <T> ExtensionContainer.createOrGet(name: String, type: Class<T>, target: Project): T =
      this.findByType(type) ?: this.create(name, type, target)
}
