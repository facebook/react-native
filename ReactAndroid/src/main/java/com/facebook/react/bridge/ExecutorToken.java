package com.facebook.react.bridge;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Class corresponding to a JS VM that can call into native modules. In Java, this should
 * just be treated as a black box to be used to help the framework route native->JS calls back to
 * the proper JS VM. See {@link ReactContext#getJSModule(ExecutorToken, Class)} and
 * {@link BaseJavaModule#supportsWebWorkers()}.
 *
 * Note: If your application doesn't use web workers, it will only have a single ExecutorToken
 * per instance of React Native.
 */
@DoNotStrip
public class ExecutorToken {

  private final HybridData mHybridData;

  @DoNotStrip
  private ExecutorToken(HybridData hybridData) {
    mHybridData = hybridData;
  }
}
