/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for Fabric components, this will be removed
 *
 * <p>TODO T97384889: remove this class when the component names are unified between JS - Android -
 * iOS - C++
 */
public class FabricComponents {

  private static @NonNull final Map<String, String> sComponentNames = new HashMap<>();

  static {
    // TODO T97384889: unify component names between JS - Android - iOS - C++
    sComponentNames.put("View", "RCTView");
    sComponentNames.put("Image", "RCTImageView");
    sComponentNames.put("ScrollView", "RCTScrollView");
    sComponentNames.put("Slider", "RCTSlider");
    sComponentNames.put("ModalHostView", "RCTModalHostView");
    sComponentNames.put("Paragraph", "RCTText");
    sComponentNames.put("Text", "RCText");
    sComponentNames.put("RawText", "RCTRawText");
    sComponentNames.put("ActivityIndicatorView", "AndroidProgressBar");
    sComponentNames.put("ShimmeringView", "RKShimmeringView");
    sComponentNames.put("TemplateView", "RCTTemplateView");
    sComponentNames.put("AxialGradientView", "RCTAxialGradientView");
    sComponentNames.put("Video", "RCTVideo");
    sComponentNames.put("Map", "RCTMap");
    sComponentNames.put("WebView", "RCTWebView");
    sComponentNames.put("Keyframes", "RCTKeyframes");
    sComponentNames.put("ImpressionTrackingView", "RCTImpressionTrackingView");
  }

  /** @return the name of component in the Fabric environment */
  public static String getFabricComponentName(String componentName) {
    String component = sComponentNames.get(componentName);
    return component != null ? component : componentName;
  }
}
