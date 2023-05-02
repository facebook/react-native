/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.common.logging.FLog;
import java.util.ArrayList;
import java.util.List;
import java.util.ListIterator;
import java.util.Stack;

/**
 * FallbackJSBundleLoader
 *
 * <p>An implementation of {@link JSBundleLoader} that will try to load from multiple sources,
 * falling back from one source to the next at load time when an exception is thrown for a
 * recoverable error.
 */
public final class FallbackJSBundleLoader extends JSBundleLoader {

  /* package */ static final String RECOVERABLE = "facebook::react::Recoverable";
  /* package */ static final String TAG = "FallbackJSBundleLoader";

  // Loaders to delegate to, with the preferred one at the top.
  private final Stack<JSBundleLoader> mLoaders;

  // Reasons why we fell-back on previous loaders, in order of occurrence.
  private final ArrayList<Exception> mRecoveredErrors = new ArrayList<>();

  /** @param loaders Loaders for the sources to try, in descending order of preference. */
  public FallbackJSBundleLoader(List<JSBundleLoader> loaders) {
    mLoaders = new Stack<>();
    ListIterator<JSBundleLoader> it = loaders.listIterator(loaders.size());
    while (it.hasPrevious()) {
      mLoaders.push(it.previous());
    }
  }

  /**
   * This loader delegates to (and so behaves like) the currently preferred loader. If that loader
   * fails in a recoverable way and we fall back from it, it is replaced by the next most preferred
   * loader.
   */
  @Override
  public String loadScript(JSBundleLoaderDelegate delegate) {
    while (true) {
      try {
        return getDelegateLoader().loadScript(delegate);
      } catch (Exception e) {
        if (e.getMessage() == null || !e.getMessage().startsWith(RECOVERABLE)) {
          throw e;
        }

        mLoaders.pop();
        mRecoveredErrors.add(e);
        FLog.wtf(TAG, "Falling back from recoverable error", e);
      }
    }
  }

  private JSBundleLoader getDelegateLoader() {
    if (!mLoaders.empty()) {
      return mLoaders.peek();
    }

    RuntimeException fallbackException = new RuntimeException("No fallback options available");

    // Invariant: tail.getCause() == null
    Throwable tail = fallbackException;
    for (Exception e : mRecoveredErrors) {
      tail.initCause(e);
      while (tail.getCause() != null) {
        tail = tail.getCause();
      }
    }

    throw fallbackException;
  }
}
