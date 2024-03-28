/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.infer.annotation.Nullsafe;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for Fabric components, this will be removed
 *
 * <p>TODO T97384889: remove this class when the component names are unified between JS - Android -
 * iOS - C++
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
class FabricNameComponentMapping {

  private static @NonNull final Map<String, String> sComponentNames = new HashMap<>();

  static {
    // TODO T97384889: unify component names between JS - Android - iOS - C++
    sComponentNames.put("View", "RCTView");
    sComponentNames.put("Image", "RCTImageView");
    sComponentNames.put("ScrollView", "RCTScrollView");
    sComponentNames.put("ModalHostView", "RCTModalHostView");
    sComponentNames.put("Paragraph", "RCTText");
    sComponentNames.put("Text", "RCText");
    sComponentNames.put("RawText", "RCTRawText");
    sComponentNames.put("ActivityIndicatorView", "AndroidProgressBar");
  }

  /**
   * @return the name of component in the Fabric environment
   */
  static String getFabricComponentName(String componentName) {
    String component = sComponentNames.get(componentName);
    return component != null ? component : componentName;
  }
}
