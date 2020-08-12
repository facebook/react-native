/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.plugin;

import com.facebook.react.codegen.generator.JavaGenerator;
import java.io.IOException;
import org.gradle.api.Plugin;
import org.gradle.api.Project;

/** A Gradle plugin to enable code generation from JavaScript in Gradle environment. */
public class CodegenPlugin implements Plugin<Project> {
  public void apply(final Project project) {
    // Register a task
    project
        .getTasks()
        .register(
            "generateJava",
            task -> {
              task.doLast(
                  s -> {
                    if (System.getenv("USE_CODEGEN").isEmpty()) {
                      return;
                    }
                    try {
                      JavaGenerator generator = new JavaGenerator("", "");
                      generator.build();
                    } catch (IOException e) {
                    }
                  });
            });
  }
}
