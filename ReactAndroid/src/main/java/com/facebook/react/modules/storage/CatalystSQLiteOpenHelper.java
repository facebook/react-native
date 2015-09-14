/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.storage;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

// VisibleForTesting
public class CatalystSQLiteOpenHelper extends SQLiteOpenHelper {

  // VisibleForTesting
  public static final String DATABASE_NAME = "RKStorage";
  static final int DATABASE_VERSION = 1;

  static final String TABLE_CATALYST = "catalystLocalStorage";
  static final String KEY_COLUMN = "key";
  static final String VALUE_COLUMN = "value";

  static final String VERSION_TABLE_CREATE =
      "CREATE TABLE " + TABLE_CATALYST + " (" +
          KEY_COLUMN + " TEXT PRIMARY KEY, " +
          VALUE_COLUMN + " TEXT NOT NULL" +
          ")";

  private Context mContext;

  public CatalystSQLiteOpenHelper(Context context) {
    super(context, DATABASE_NAME, null, DATABASE_VERSION);
    mContext = context;
  }

  @Override
  public void onCreate(SQLiteDatabase db) {
    db.execSQL(VERSION_TABLE_CREATE);
  }

  @Override
  public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
    // TODO: t5494781 implement data migration
    if (oldVersion != newVersion) {
      mContext.deleteDatabase(DATABASE_NAME);
      onCreate(db);
    }
  }
}
