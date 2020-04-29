<<<<<<< HEAD
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.hermes.reactexecutor;

import com.facebook.hermes.instrumentation.HermesMemoryDumper;
import javax.annotation.Nullable;
=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor;
>>>>>>> fb/0.62-stable

/** Holds runtime configuration for a Hermes VM instance (master or snapshot). */
public final class RuntimeConfig {
  public long heapSizeMB;
  public boolean enableSampledStats;
  public boolean es6Symbol;
  public int bytecodeWarmupPercent;
<<<<<<< HEAD
  public boolean tripWireEnabled;
  @Nullable public HermesMemoryDumper heapDumper;
  public long tripWireCooldownMS;
  public long tripWireLimitBytes;
=======
>>>>>>> fb/0.62-stable
}
