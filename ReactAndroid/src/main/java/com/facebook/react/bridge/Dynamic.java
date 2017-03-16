/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Type representing a piece of data with unkown runtime type. Useful for allowing javascript to
 * pass one of multiple types down to the native layer.
 */
public interface Dynamic {
  boolean isNull();
  boolean asBoolean();
  double asDouble();
  int asInt();
  String asString();
  ReadableArray asArray();
  ReadableMap asMap();
  ReadableType getType();
  void recycle();
}
