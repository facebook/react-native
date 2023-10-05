/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/**
 * @deprecated since this would be deprecated later as part of Stable APIs with bridge removal and
 *     not encouraged usage.
 */
@Deprecated
public interface UIManagerProvider {

  UIManager createUIManager(ReactApplicationContext context);
}
