<<<<<<< HEAD
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric;

=======
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import androidx.annotation.NonNull;
>>>>>>> fb/0.62-stable
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for Fabric components, this will be removed
 *
 * <p>//TODO T31905686: remove this class when the component names are unified between JS - Android
 * - iOS - C++
 */
public class FabricComponents {

<<<<<<< HEAD
  private static final Map<String, String> sComponentNames = new HashMap<>();
=======
  private static @NonNull final Map<String, String> sComponentNames = new HashMap<>();
>>>>>>> fb/0.62-stable

  static {
    // TODO T31905686: unify component names between JS - Android - iOS - C++
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
<<<<<<< HEAD
=======
    sComponentNames.put("Video", "RCTVideo");
    sComponentNames.put("StickerInputView", "RCTStickerInputView");
    sComponentNames.put("Map", "RCTMap");
>>>>>>> fb/0.62-stable
  }

  /** @return the name of component in the Fabric environment */
  static String getFabricComponentName(String componentName) {
    String component = sComponentNames.get(componentName);
    return component != null ? component : componentName;
  }
}
