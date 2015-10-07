/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;
import java.io.FileOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.channels.FileLock;
import java.io.Closeable;

public final class FileLocker implements Closeable {

  private final FileOutputStream mLockFileOutputStream;
  private final FileLock mLock;

  public static FileLocker lock(File lockFile) throws IOException {
    return new FileLocker(lockFile);
  }

  private FileLocker(File lockFile) throws IOException {
    mLockFileOutputStream = new FileOutputStream(lockFile);
    FileLock lock = null;
    try {
      lock = mLockFileOutputStream.getChannel().lock();
    } finally {
      if (lock == null) {
        mLockFileOutputStream.close();
      }
    }

    mLock = lock;
  }

  @Override
  public void close() throws IOException {
    try {
      mLock.release();
    } finally {
      mLockFileOutputStream.close();
    }
  }
}
