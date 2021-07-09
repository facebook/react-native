/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces;

import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.react.devsupport.ReactInstanceDevHelper;
import com.facebook.react.devsupport.RedBoxHandler;
import com.facebook.react.packagerconnection.RequestHandler;
import java.util.Map;

public interface DevSupportManagerFactory {
  DevSupportManager create(
      Context applicationContext,
      ReactInstanceDevHelper reactInstanceManagerHelper,
      @Nullable String packagerPathForJSBundleName,
      boolean enableOnCreate,
      @Nullable RedBoxHandler redBoxHandler,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers);
}
