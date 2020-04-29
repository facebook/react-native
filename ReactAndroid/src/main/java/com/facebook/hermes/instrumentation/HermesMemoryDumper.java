<<<<<<< HEAD
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

>>>>>>> fb/0.62-stable
package com.facebook.hermes.instrumentation;

public interface HermesMemoryDumper {
  boolean shouldSaveSnapshot();

  String getInternalStorage();

  String getId();

  void setMetaData(String crashId);
}
