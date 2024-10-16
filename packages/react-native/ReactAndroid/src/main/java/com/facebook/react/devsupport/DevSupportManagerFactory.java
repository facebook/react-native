/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import java.util.Map;

public interface DevSupportManagerFactory {
  /**
   * Factory used by the Old Architecture flow to create a {@link DevSupportManager} and a {@link
   * com.facebook.react.runtime.BridgeDevSupportManager}
   */
  DevSupportManager create(
      Context applicationContext,
      ReactInstanceDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers,
      @Nullable SurfaceDelegateFactory surfaceDelegateFactory,
      @Nullable DevLoadingViewManager devLoadingViewManager,
      @Nullable PausedInDebuggerOverlayManager pausedInDebuggerOverlayManager);

  /**
   * Factory used by the New Architecture/Bridgeless flow to create a {@link DevSupportManager} and
   * a {@link BridgelessDevSupportManager}
   */
  DevSupportManager create(
      Context applicationContext,
      ReactInstanceDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers,
      @Nullable SurfaceDelegateFactory surfaceDelegateFactory,
      @Nullable DevLoadingViewManager devLoadingViewManager,
      @Nullable PausedInDebuggerOverlayManager pausedInDebuggerOverlayManager,
      boolean useDevSupport);
}
