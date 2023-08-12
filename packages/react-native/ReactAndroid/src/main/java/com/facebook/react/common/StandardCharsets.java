/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import java.nio.charset.Charset;

/**
 * Not all versions of Android SDK have this class in nio package. This is the reason to have it
 * around.
 */
public class StandardCharsets {

  /** Eight-bit UCS Transformation Format */
  public static final Charset UTF_8 = Charset.forName("UTF-8");

  /** Sixteen-bit UCS Transformation Format, byte order identified by an optional byte-order mark */
  public static final Charset UTF_16 = Charset.forName("UTF-16");

  /** Sixteen-bit UCS Transformation Format, big-endian byte order */
  public static final Charset UTF_16BE = Charset.forName("UTF-16BE");
  /** Sixteen-bit UCS Transformation Format, little-endian byte order */
  public static final Charset UTF_16LE = Charset.forName("UTF-16LE");
}
