/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react;

import androidx.annotation.NonNull;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ModuleHolder;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.ReactConstants;
import java.util.Iterator;
import java.util.List;

public class ReactPackageHelper {
  /**
   * A helper method to iterate over a list of Native Modules and convert them to an iterable.
   *
   * @param reactPackage
   * @param reactApplicationContext
   * @param reactInstanceManager
   * @return
   */
  public static Iterable<ModuleHolder> getNativeModuleIterator(
      ReactPackage reactPackage,
      ReactApplicationContext reactApplicationContext,
      ReactInstanceManager reactInstanceManager) {
    FLog.d(
        ReactConstants.TAG,
        reactPackage.getClass().getSimpleName()
            + " is not a LazyReactPackage, falling back to old version.");
    final List<NativeModule> nativeModules;
    if (reactPackage instanceof ReactInstancePackage) {
      ReactInstancePackage reactInstancePackage = (ReactInstancePackage) reactPackage;
      nativeModules =
          reactInstancePackage.createNativeModules(reactApplicationContext, reactInstanceManager);
    } else {
      nativeModules = reactPackage.createNativeModules(reactApplicationContext);
    }
    return new Iterable<ModuleHolder>() {
      @NonNull
      @Override
      public Iterator<ModuleHolder> iterator() {
        return new Iterator<ModuleHolder>() {
          int position = 0;

          @Override
          public ModuleHolder next() {
            return new ModuleHolder(nativeModules.get(position++));
          }

          @Override
          public boolean hasNext() {
            return position < nativeModules.size();
          }

          @Override
          public void remove() {
            throw new UnsupportedOperationException("Cannot remove methods ");
          }
        };
      }
    };
  }
}
