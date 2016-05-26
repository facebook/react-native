package com.facebook.react.uimanager;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * This interface describes a View that responds to the zIndex prop.
 */

public interface ReactZIndexView {
  void setZIndex(float targetZIndex);

  float getZIndex();
}
