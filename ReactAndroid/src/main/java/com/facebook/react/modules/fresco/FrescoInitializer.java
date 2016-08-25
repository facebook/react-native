/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.fresco;

import android.content.Context;
import android.support.annotation.Nullable;

import com.facebook.common.logging.FLog;
import com.facebook.common.soloader.SoLoaderShim;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.soloader.SoLoader;

public class FrescoInitializer {
	private static boolean initialized = false;
	private static Exception firstInitializationTrace;

	public static synchronized boolean isInitialized() {
		return initialized;
	}

	public static synchronized void initialize(Context context, @Nullable ImagePipelineConfig config) {
		if (!initialized){
			firstInitializationTrace = new Exception();
			// Make sure the SoLoaderShim is configured to use our loader for native libraries.
			// This code can be removed if using Fresco from Maven rather than from source
			SoLoaderShim.setHandler(new FrescoHandler());
			Fresco.initialize(context, config);
			initialized = true;
		} else {
			FLog.e(FrescoInitializer.class, "Fresco has been already initialized at", firstInitializationTrace);
			throw new IllegalStateException("Double initialization of Fresco");
		}
	}

	private static class FrescoHandler implements SoLoaderShim.Handler {
		@Override
		public void loadLibrary(String libraryName) {
			SoLoader.loadLibrary(libraryName);
		}
	}
}
