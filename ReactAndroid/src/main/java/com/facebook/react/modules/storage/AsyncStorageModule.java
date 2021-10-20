/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.storage;

import static com.facebook.react.modules.storage.ReactDatabaseSupplier.KEY_COLUMN;
import static com.facebook.react.modules.storage.ReactDatabaseSupplier.TABLE_CATALYST;
import static com.facebook.react.modules.storage.ReactDatabaseSupplier.VALUE_COLUMN;

import android.database.Cursor;
import android.database.sqlite.SQLiteStatement;
import android.os.AsyncTask;
import com.facebook.common.logging.FLog;
import com.facebook.fbreact.specs.NativeAsyncSQLiteDBStorageSpec;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.common.ModuleDataCleaner;
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.concurrent.Executor;

@ReactModule(name = AsyncStorageModule.NAME)
public final class AsyncStorageModule extends NativeAsyncSQLiteDBStorageSpec
    implements ModuleDataCleaner.Cleanable {

  public static final String NAME = "AsyncSQLiteDBStorage";

  // SQL variable number limit, defined by SQLITE_LIMIT_VARIABLE_NUMBER:
  // https://raw.githubusercontent.com/android/platform_external_sqlite/master/dist/sqlite3.c
  private static final int MAX_SQL_KEYS = 999;

  private ReactDatabaseSupplier mReactDatabaseSupplier;
  private boolean mShuttingDown = false;

  // Adapted from
  // https://android.googlesource.com/platform/frameworks/base.git/+/1488a3a19d4681a41fb45570c15e14d99db1cb66/core/java/android/os/AsyncTask.java#237
  private class SerialExecutor implements Executor {
    private final ArrayDeque<Runnable> mTasks = new ArrayDeque<Runnable>();
    private Runnable mActive;
    private final Executor executor;

    SerialExecutor(Executor executor) {
      this.executor = executor;
    }

    public synchronized void execute(final Runnable r) {
      mTasks.offer(
          new Runnable() {
            public void run() {
              try {
                r.run();
              } finally {
                scheduleNext();
              }
            }
          });
      if (mActive == null) {
        scheduleNext();
      }
    }

    synchronized void scheduleNext() {
      if ((mActive = mTasks.poll()) != null) {
        executor.execute(mActive);
      }
    }
  }

  private final SerialExecutor executor;

  public AsyncStorageModule(ReactApplicationContext reactContext) {
    this(reactContext, AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @VisibleForTesting
  AsyncStorageModule(ReactApplicationContext reactContext, Executor executor) {
    super(reactContext);
    this.executor = new SerialExecutor(executor);
    mReactDatabaseSupplier = ReactDatabaseSupplier.getInstance(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void initialize() {
    super.initialize();
    mShuttingDown = false;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
  }

  @Override
  public void clearSensitiveData() {
    // Clear local storage. If fails, crash, since the app is potentially in a bad state and could
    // cause a privacy violation. We're still not recovering from this well, but at least the error
    // will be reported to the server.
    mReactDatabaseSupplier.clearAndCloseDatabase();
  }

  /**
   * Given an array of keys, this returns a map of (key, value) pairs for the keys found, and (key,
   * null) for the keys that haven't been found.
   */
  @Override
  public void multiGet(final ReadableArray keys, final Callback callback) {
    if (keys == null) {
      callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null), null);
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null), null);
          return;
        }

        String[] columns = {KEY_COLUMN, VALUE_COLUMN};
        HashSet<String> keysRemaining = new HashSet<>();
        WritableArray data = Arguments.createArray();
        for (int keyStart = 0; keyStart < keys.size(); keyStart += MAX_SQL_KEYS) {
          int keyCount = Math.min(keys.size() - keyStart, MAX_SQL_KEYS);
          Cursor cursor =
              mReactDatabaseSupplier
                  .get()
                  .query(
                      TABLE_CATALYST,
                      columns,
                      AsyncLocalStorageUtil.buildKeySelection(keyCount),
                      AsyncLocalStorageUtil.buildKeySelectionArgs(keys, keyStart, keyCount),
                      null,
                      null,
                      null);
          keysRemaining.clear();
          try {
            if (cursor.getCount() != keys.size()) {
              // some keys have not been found - insert them with null into the final array
              for (int keyIndex = keyStart; keyIndex < keyStart + keyCount; keyIndex++) {
                keysRemaining.add(keys.getString(keyIndex));
              }
            }

            if (cursor.moveToFirst()) {
              do {
                WritableArray row = Arguments.createArray();
                row.pushString(cursor.getString(0));
                row.pushString(cursor.getString(1));
                data.pushArray(row);
                keysRemaining.remove(cursor.getString(0));
              } while (cursor.moveToNext());
            }
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
            return;
          } finally {
            cursor.close();
          }

          for (String key : keysRemaining) {
            WritableArray row = Arguments.createArray();
            row.pushString(key);
            row.pushNull();
            data.pushArray(row);
          }
          keysRemaining.clear();
        }

        callback.invoke(null, data);
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Inserts multiple (key, value) pairs. If one or more of the pairs cannot be inserted, this will
   * return AsyncLocalStorageFailure, but all other pairs will have been inserted. The insertion
   * will replace conflicting (key, value) pairs.
   */
  @Override
  public void multiSet(final ReadableArray keyValueArray, final Callback callback) {
    if (keyValueArray.size() == 0) {
      callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null));
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }

        String sql = "INSERT OR REPLACE INTO " + TABLE_CATALYST + " VALUES (?, ?);";
        SQLiteStatement statement = mReactDatabaseSupplier.get().compileStatement(sql);
        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int idx = 0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }
            if (keyValueArray.getArray(idx).getString(0) == null) {
              error = AsyncStorageErrorUtil.getInvalidKeyError(null);
              return;
            }
            if (keyValueArray.getArray(idx).getString(1) == null) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            statement.clearBindings();
            statement.bindString(1, keyValueArray.getArray(idx).getString(0));
            statement.bindString(2, keyValueArray.getArray(idx).getString(1));
            statement.execute();
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
            mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /** Removes all rows of the keys given. */
  @Override
  public void multiRemove(final ReadableArray keys, final Callback callback) {
    if (keys.size() == 0) {
      callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null));
      return;
    }

    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }

        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int keyStart = 0; keyStart < keys.size(); keyStart += MAX_SQL_KEYS) {
            int keyCount = Math.min(keys.size() - keyStart, MAX_SQL_KEYS);
            mReactDatabaseSupplier
                .get()
                .delete(
                    TABLE_CATALYST,
                    AsyncLocalStorageUtil.buildKeySelection(keyCount),
                    AsyncLocalStorageUtil.buildKeySelectionArgs(keys, keyStart, keyCount));
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
            mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /**
   * Given an array of (key, value) pairs, this will merge the given values with the stored values
   * of the given keys, if they exist.
   */
  @Override
  public void multiMerge(final ReadableArray keyValueArray, final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        WritableMap error = null;
        try {
          mReactDatabaseSupplier.get().beginTransaction();
          for (int idx = 0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            if (keyValueArray.getArray(idx).getString(0) == null) {
              error = AsyncStorageErrorUtil.getInvalidKeyError(null);
              return;
            }

            if (keyValueArray.getArray(idx).getString(1) == null) {
              error = AsyncStorageErrorUtil.getInvalidValueError(null);
              return;
            }

            if (!AsyncLocalStorageUtil.mergeImpl(
                mReactDatabaseSupplier.get(),
                keyValueArray.getArray(idx).getString(0),
                keyValueArray.getArray(idx).getString(1))) {
              error = AsyncStorageErrorUtil.getDBError(null);
              return;
            }
          }
          mReactDatabaseSupplier.get().setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          error = AsyncStorageErrorUtil.getError(null, e.getMessage());
        } finally {
          try {
            mReactDatabaseSupplier.get().endTransaction();
          } catch (Exception e) {
            FLog.w(ReactConstants.TAG, e.getMessage(), e);
            if (error == null) {
              error = AsyncStorageErrorUtil.getError(null, e.getMessage());
            }
          }
        }
        if (error != null) {
          callback.invoke(error);
        } else {
          callback.invoke();
        }
      }
    }.executeOnExecutor(executor);
  }

  /** Clears the database. */
  @Override
  public void clear(final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!mReactDatabaseSupplier.ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        try {
          mReactDatabaseSupplier.clear();
          callback.invoke();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        }
      }
    }.executeOnExecutor(executor);
  }

  /** Returns an array with all keys from the database. */
  @Override
  public void getAllKeys(final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null), null);
          return;
        }
        WritableArray data = Arguments.createArray();
        String[] columns = {KEY_COLUMN};
        Cursor cursor =
            mReactDatabaseSupplier
                .get()
                .query(TABLE_CATALYST, columns, null, null, null, null, null);
        try {
          if (cursor.moveToFirst()) {
            do {
              data.pushString(cursor.getString(0));
            } while (cursor.moveToNext());
          }
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
          return;
        } finally {
          cursor.close();
        }
        callback.invoke(null, data);
      }
    }.executeOnExecutor(executor);
  }

  /** Verify the database is open for reads and writes. */
  private boolean ensureDatabase() {
    return !mShuttingDown && mReactDatabaseSupplier.ensureDatabase();
  }
}
