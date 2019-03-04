// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
package com.facebook.react.bridge;

import android.util.Pair;

import java.util.ArrayDeque;
import java.util.Queue;
import java.util.WeakHashMap;

/**
 * Thread-safe Set based on the WeakHashMap.
 *
 * Doesn't implement the `iterator` method because it's tricky to support modifications
 * to the collection while somebody is using an `Iterator` to iterate over it.
 *
 * Instead, it provides an `iterate` method for traversing the collection. Any add/remove operations
 * that occur during iteration are postponed until the iteration has completed.
 */
public class SynchronizedWeakHashSet<T> {
  private WeakHashMap<T, Void> mMap = new WeakHashMap<>();
  private Queue<Pair<T, Command>> mPendingOperations = new ArrayDeque<>();
  private boolean mIterating;

  public boolean contains(T item) {
    synchronized (mMap) {
      return mMap.containsKey(item);
    }
  }

  public void add(T item) {
    synchronized (mMap) {
      if (mIterating) {
       mPendingOperations.add(new Pair<>(item, Command.ADD));
      } else {
        mMap.put(item, null);
      }
    }
  }

  public void remove(T item) {
    synchronized (mMap) {
      if (mIterating) {
        mPendingOperations.add(new Pair<>(item, Command.REMOVE));
      } else {
        mMap.remove(item);
      }
    }
  }

  public void iterate(Iteration<T> iterated) {
    synchronized (mMap) {
      // Protection from modification during iteration on the same thread
      mIterating = true;
      for (T listener: mMap.keySet()) {
        iterated.iterate(listener);
      }
      mIterating = false;

      while (!mPendingOperations.isEmpty()) {
        Pair<T, Command> pair = mPendingOperations.poll();
        switch (pair.second) {
          case ADD:
            mMap.put(pair.first, null);
            break;
          case REMOVE:
            mMap.remove(pair.first);
            break;
            default:
              throw new AssertionException("Unsupported command" + pair.second);
        }
      }
    }
  }

  public interface Iteration<T> {
    void iterate(T item);
  }

  private enum Command {
    ADD,
    REMOVE
  }
}
