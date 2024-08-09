/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.NonNull;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.internal.turbomodule.core.TurboModuleManagerDelegate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Deprecated(
    since =
        "CompositeReactPackageTurboModuleManagerDelegate is deprecated and will be deleted in the future. Please use ReactPackage interface or BaseReactPackage instead.")
@DoNotStrip
public class CompositeReactPackageTurboModuleManagerDelegate
    extends ReactPackageTurboModuleManagerDelegate {

  protected native HybridData initHybrid();

  private CompositeReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext context,
      List<ReactPackage> packages,
      List<TurboModuleManagerDelegate> delegates) {
    super(context, packages);
    for (TurboModuleManagerDelegate delegate : delegates) {
      addTurboModuleManagerDelegate(delegate);
    }
  }

  private native void addTurboModuleManagerDelegate(TurboModuleManagerDelegate delegates);

  public static class Builder extends ReactPackageTurboModuleManagerDelegate.Builder {
    private final List<ReactPackageTurboModuleManagerDelegate.Builder> mDelegatesBuilder;

    public Builder(@NonNull List<ReactPackageTurboModuleManagerDelegate.Builder> delegatesBuilder) {
      mDelegatesBuilder = delegatesBuilder;
    }

    protected ReactPackageTurboModuleManagerDelegate build(
        ReactApplicationContext context, List<ReactPackage> packages) {
      List<TurboModuleManagerDelegate> delegates = new ArrayList<>();
      for (ReactPackageTurboModuleManagerDelegate.Builder delegatesBuilder : mDelegatesBuilder) {
        delegates.add(delegatesBuilder.build(context, Collections.<ReactPackage>emptyList()));
      }
      return new CompositeReactPackageTurboModuleManagerDelegate(context, packages, delegates);
    }
  }
}
