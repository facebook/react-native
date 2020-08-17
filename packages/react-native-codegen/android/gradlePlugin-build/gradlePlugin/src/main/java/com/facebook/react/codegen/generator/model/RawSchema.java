/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

import java.util.List;
import java.util.Map;

/** Represents the parsed JSON schema without any type resolution. */
public final class RawSchema {

  public final Map<String, List<NativeModuleType>> modules;

  public RawSchema(final Map<String, List<NativeModuleType>> modules) {
    this.modules = modules;
  }

  @Override
  public String toString() {
    return modules.toString();
  }
}
