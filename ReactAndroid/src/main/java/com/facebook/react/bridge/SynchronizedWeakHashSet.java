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

  public void doIfContains(T item, Runnable runnable) {
    synchronized (mMap) {
      if (mIterating) {
        mPendingOperations.add(new Pair<>(item, Command.newDoIfContains(runnable)));
      } else {
        if (mMap.containsKey(item)) {
          runnable.run();
        }
      }
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
        Command command = pair.second;
        switch (command.getType()) {
          case ADD:
            mMap.put(pair.first, null);
            break;
          case REMOVE:
            mMap.remove(pair.first);
            break;
          case DO_IF_CONTAINS:
            if (mMap.containsKey(pair.first)) {
              command.execute();
            }
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

  private enum CommandType {
    ADD,
    REMOVE,
    DO_IF_CONTAINS
  }

  private static class Command {
    public static final Command ADD = new Command(CommandType.ADD);
    public static final Command REMOVE = new Command(CommandType.REMOVE);

    private CommandType mType;
    private Runnable mRunnable;

    public static Command newDoIfContains(Runnable runnable) {
      return new Command(CommandType.DO_IF_CONTAINS, runnable);
    }

    private Command(CommandType type) {
      this(type, null);
    }

    private Command(CommandType type, Runnable runnable) {
      mType = type;
      mRunnable = runnable;
    }

    public CommandType getType() {
      return mType;
    }

    public void execute() {
      if (mRunnable != null) {
        mRunnable.run();
      }
    }
  }
}
