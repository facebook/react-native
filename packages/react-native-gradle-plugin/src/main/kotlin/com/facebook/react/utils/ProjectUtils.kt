/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import org.gradle.api.Project

internal object ProjectUtils {
  internal val Project.isNewArchEnabled: Boolean
    get() =
        project.hasProperty("newArchEnabled") &&
            project.property("newArchEnabled").toString().toBoolean()
}
