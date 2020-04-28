/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import java.util.List;

/** Interface used to initialize JSI Modules into the JSI Bridge. */
public interface JSIModulePackage {

  /** @return a {@link List< JSIModuleSpec >} that contain the list of JSI Modules. */
  List<JSIModuleSpec> getJSIModules(
      ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext);
}
