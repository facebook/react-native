/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.util.*
import org.gradle.api.Project

internal object BackwardCompatUtils {

  fun configureBackwardCompatibilityReactMap(project: Project) {
    if (project.extensions.extraProperties.has("react")) {
      @Suppress("UNCHECKED_CAST")
      val reactMap =
          project.extensions.extraProperties.get("react") as? Map<String, Any?> ?: mapOf()
      if (reactMap.isNotEmpty()) {
        project.logger.error(
            """
          ********************************************************************************
 
          ERROR: Using old project.ext.react configuration.
          We identified that your project is using a old configuration block as:
          
          project.ext.react = [
              // ...
          ]
          
          You should migrate to the new configuration:
          
          react {
              // ...
          }
          You can find documentation inside `android/app/build.gradle` on how to use it.
        
          ********************************************************************************
          """
                .trimIndent())
      }
    }

    // We set an empty react[] map so if a library is reading it, they will find empty values.
    project.extensions.extraProperties.set("react", mapOf<String, String>())
  }
}
