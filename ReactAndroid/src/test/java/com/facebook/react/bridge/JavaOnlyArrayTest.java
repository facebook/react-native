/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.Test;

/** Tests for {@link JavaOnlyArray} */
public class JavaOnlyArrayTest {

  @Test
  public void testGetType() throws Exception {
    JavaOnlyArray values =
        JavaOnlyArray.of(1, 2f, 3., "4", false, JavaOnlyArray.of(), JavaOnlyMap.of(), null);
    ReadableType[] expectedTypes =
        new ReadableType[] {
          ReadableType.Number,
          ReadableType.Number,
          ReadableType.Number,
          ReadableType.String,
          ReadableType.Boolean,
          ReadableType.Array,
          ReadableType.Map,
          ReadableType.Null
        };

    for (int i = 0; i < values.size(); i++) {
      assertThat(values.getType(i)).isEqualTo(expectedTypes[i]);
    }
  }
}
