// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import javax.annotation.concurrent.GuardedBy;

/**
 * Wrapper for JavaScriptContext native pointer. CatalystInstanceImpl creates this on demand, and
 * will call clear() before destroying the VM. People who need the raw JavaScriptContext pointer
 * can synchronize on this wrapper object to guarantee that it will not be destroyed.
 */
public class JavaScriptContextHolder {
  @GuardedBy("this")
  private long mContext;

  public JavaScriptContextHolder(long context) {
    mContext = context;
  }

  @GuardedBy("this")
  public long get() {
    return mContext;
  }

  public synchronized void clear() {
    mContext = 0;
  }

}
