/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.storage;

import javax.annotation.Nullable;

import java.util.HashSet;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteStatement;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedAsyncTask;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.SetBuilder;
import com.facebook.react.modules.common.ModuleDataCleaner;

import static com.facebook.react.modules.storage.CatalystSQLiteOpenHelper.KEY_COLUMN;
import static com.facebook.react.modules.storage.CatalystSQLiteOpenHelper.TABLE_CATALYST;
import static com.facebook.react.modules.storage.CatalystSQLiteOpenHelper.VALUE_COLUMN;

public final class AsyncStorageModule
    extends ReactContextBaseJavaModule implements ModuleDataCleaner.Cleanable {

  private @Nullable SQLiteDatabase mDb;
  private boolean mShuttingDown = false;

  public AsyncStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "AsyncSQLiteDBStorage";
  }

  @Override
  public void initialize() {
    super.initialize();
    mShuttingDown = false;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    mShuttingDown = true;
    if (mDb != null && mDb.isOpen()) {
      mDb.close();
      mDb = null;
    }
  }

  @Override
  public void clearSensitiveData() {
    // Clear local storage. If fails, crash, since the app is potentially in a bad state and could
    // cause a privacy violation. We're still not recovering from this well, but at least the error
    // will be reported to the server.
    clear(
        new Callback() {
          @Override
          public void invoke(Object... args) {
            if (args.length > 0) {
              throw new RuntimeException("Clearing AsyncLocalStorage failed: " + args[0]);
            }
            FLog.d(ReactConstants.TAG, "Cleaned AsyncLocalStorage.");
          }
        });
  }

  /**
   * Given an array of keys, this returns a map of (key, value) pairs for the keys found, and
   * (key, null) for the keys that haven't been found.
   */
  @ReactMethod
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
        HashSet<String> keysRemaining = SetBuilder.newHashSet();
        WritableArray data = Arguments.createArray();
        Cursor cursor = Assertions.assertNotNull(mDb).query(
            TABLE_CATALYST,
            columns,
            AsyncLocalStorageUtil.buildKeySelection(keys.size()),
            AsyncLocalStorageUtil.buildKeySelectionArgs(keys),
            null,
            null,
            null);

        try {
          if (cursor.getCount() != keys.size()) {
            // some keys have not been found - insert them with null into the final array
            for (int keyIndex = 0; keyIndex < keys.size(); keyIndex++) {
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
          FLog.w(ReactConstants.TAG, "Exception in database multiGet ", e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
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
        callback.invoke(null, data);
      }
    }.execute();
  }

  /**
   * Inserts multiple (key, value) pairs. If one or more of the pairs cannot be inserted, this will
   * return AsyncLocalStorageFailure, but all other pairs will have been inserted.
   * The insertion will replace conflicting (key, value) pairs.
   */
  @ReactMethod
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
        SQLiteStatement statement = Assertions.assertNotNull(mDb).compileStatement(sql);
        mDb.beginTransaction();
        try {
          for (int idx=0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidValueError(null));
              return;
            }
            if (keyValueArray.getArray(idx).getString(0) == null) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null));
              return;
            }
            if (keyValueArray.getArray(idx).getString(1) == null) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidValueError(null));
              return;
            }

            statement.clearBindings();
            statement.bindString(1, keyValueArray.getArray(idx).getString(0));
            statement.bindString(2, keyValueArray.getArray(idx).getString(1));
            statement.execute();
          }
          mDb.setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, "Exception in database multiSet ", e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        } finally {
          mDb.endTransaction();
        }
        callback.invoke();
      }
    }.execute();
  }

  /**
   * Removes all rows of the keys given.
   */
  @ReactMethod
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

        try {
          Assertions.assertNotNull(mDb).delete(
              TABLE_CATALYST,
              AsyncLocalStorageUtil.buildKeySelection(keys.size()),
              AsyncLocalStorageUtil.buildKeySelectionArgs(keys));
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, "Exception in database multiRemove ", e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        }
        callback.invoke();
      }
    }.execute();
  }

  /**
   * Given an array of (key, value) pairs, this will merge the given values with the stored values
   * of the given keys, if they exist.
   */
  @ReactMethod
  public void multiMerge(final ReadableArray keyValueArray, final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        Assertions.assertNotNull(mDb).beginTransaction();
        try {
          for (int idx = 0; idx < keyValueArray.size(); idx++) {
            if (keyValueArray.getArray(idx).size() != 2) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidValueError(null));
              return;
            }

            if (keyValueArray.getArray(idx).getString(0) == null) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidKeyError(null));
              return;
            }

            if (keyValueArray.getArray(idx).getString(1) == null) {
              callback.invoke(AsyncStorageErrorUtil.getInvalidValueError(null));
              return;
            }

            if (!AsyncLocalStorageUtil.mergeImpl(
                mDb,
                keyValueArray.getArray(idx).getString(0),
                keyValueArray.getArray(idx).getString(1))) {
              callback.invoke(AsyncStorageErrorUtil.getDBError(null));
              return;
            }
          }
          mDb.setTransactionSuccessful();
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, e.getMessage(), e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        } finally {
          mDb.endTransaction();
        }
        callback.invoke();
      }
    }.execute();
  }

  /**
   * Clears the database.
   */
  @ReactMethod
  public void clear(final Callback callback) {
    new GuardedAsyncTask<Void, Void>(getReactApplicationContext()) {
      @Override
      protected void doInBackgroundGuarded(Void... params) {
        if (!ensureDatabase()) {
          callback.invoke(AsyncStorageErrorUtil.getDBError(null));
          return;
        }
        try {
          Assertions.assertNotNull(mDb).delete(TABLE_CATALYST, null, null);
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, "Exception in database clear ", e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()));
        }
        callback.invoke();
      }
    }.execute();
  }

  /**
   * Returns an array with all keys from the database.
   */
  @ReactMethod
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
        Cursor cursor = Assertions.assertNotNull(mDb)
            .query(TABLE_CATALYST, columns, null, null, null, null, null);
        try {
          if (cursor.moveToFirst()) {
            do {
              data.pushString(cursor.getString(0));
            } while (cursor.moveToNext());
          }
        } catch (Exception e) {
          FLog.w(ReactConstants.TAG, "Exception in database getAllKeys ", e);
          callback.invoke(AsyncStorageErrorUtil.getError(null, e.getMessage()), null);
        } finally {
          cursor.close();
        }
        callback.invoke(null, data);
      }
    }.execute();
  }

  /**
   * Verify the database exists and is open.
   */
  private boolean ensureDatabase() {
    if (mShuttingDown) {
      return false;
    }
    if (mDb != null && mDb.isOpen()) {
      return true;
    }
    mDb = initializeDatabase();
    return true;
  }

  /**
   * Create and/or open the database.
   */
  private SQLiteDatabase initializeDatabase() {
    CatalystSQLiteOpenHelper helperForDb =
        new CatalystSQLiteOpenHelper(getReactApplicationContext());
    return helperForDb.getWritableDatabase();
  }
}
