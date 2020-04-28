/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Exception thrown when a caller attempts to modify or use a {@link WritableNativeArray} or {@link
 * WritableNativeMap} after it has already been added to a parent array or map. This is unsafe since
 * we reuse the native memory so the underlying array/map is no longer valid.
 */
@DoNotStrip
public class ObjectAlreadyConsumedException extends RuntimeException {

  @DoNotStrip
  public ObjectAlreadyConsumedException(String detailMessage) {
    super(detailMessage);
  }
}
