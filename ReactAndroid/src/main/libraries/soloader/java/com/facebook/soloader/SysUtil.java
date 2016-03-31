/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;

import java.io.File;
import java.io.IOException;
import android.content.Context;

import java.util.jar.JarFile;
import java.util.jar.JarEntry;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

import android.os.Build;
import android.system.Os;
import android.system.ErrnoException;

import java.util.HashMap;
import java.util.Map;
import java.util.Enumeration;

import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.FileDescriptor;

/*package*/ final class SysUtil {

  private static byte[] cachedBuffer = null;

  /**
   * Copy from an inputstream to a named filesystem file.  Take care to ensure that we can detect
   * incomplete copies and that the copied bytes make it to stable storage before returning.
   * The destination file will be marked executable.
   *
   * This routine caches an internal buffer between invocations; after making a sequence of calls
   * {@link #reliablyCopyExecutable} calls, call {@link #freeCopyBuffer} to release this buffer.
   *
   * @param is Stream from which to copy
   * @param destination File to which to write
   * @param expectedSize Number of bytes we expect to write; -1 if unknown
   * @param time Modification time to which to set file on success; must be in the past
   */
  public static void reliablyCopyExecutable(
      InputStream is,
      File destination,
      long expectedSize,
      long time) throws IOException {
    destination.delete();
    try (FileOutputStream os = new FileOutputStream(destination)) {
      byte buffer[];
      if (cachedBuffer == null) {
        cachedBuffer = buffer = new byte[16384];
      }  else {
        buffer = cachedBuffer;
      }

      int nrBytes;
      if (expectedSize > 0) {
        fallocateIfSupported(os.getFD(), expectedSize);
      }

      while ((nrBytes = is.read(buffer, 0, buffer.length)) >= 0) {
        os.write(buffer, 0, nrBytes);
      }

      os.getFD().sync();
      destination.setExecutable(true);
      destination.setLastModified(time);
      os.getFD().sync();
    }
  }

  /**
   * Free the internal buffer cache for {@link #reliablyCopyExecutable}.
   */
  public static void freeCopyBuffer() {
    cachedBuffer = null;
  }

  /**
   * Determine how preferred a given ABI is on this system.
   *
   * @param supportedAbis ABIs on this system
   * @param abi ABI of a shared library we might want to unpack
   * @return -1 if not supported or an integer, smaller being more preferred
   */
  public static int findAbiScore(String[] supportedAbis, String abi) {
    for (int i = 0; i < supportedAbis.length; ++i) {
      if (supportedAbis[i] != null && abi.equals(supportedAbis[i])) {
        return i;
      }
    }

    return -1;
  }

  public static void deleteOrThrow(File file) throws IOException {
    if (!file.delete()) {
      throw new IOException("could not delete file " + file);
    }
  }

  /**
   * Return an list of ABIs we supported on this device ordered according to preference.  Use a
   * separate inner class to isolate the version-dependent call where it won't cause the whole
   * class to fail preverification.
   *
   * @return Ordered array of supported ABIs
   */
  public static String[] getSupportedAbis() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return new String[]{Build.CPU_ABI, Build.CPU_ABI2};
    } else {
      return LollipopSysdeps.getSupportedAbis();
    }
  }

  /**
   * Pre-allocate disk space for a file if we can do that
   * on this version of the OS.
   *
   * @param fd File descriptor for file
   * @param length Number of bytes to allocate.
   */
  public static void fallocateIfSupported(FileDescriptor fd, long length) throws IOException {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      LollipopSysdeps.fallocate(fd, length);
    }
  }

  public static FileLocker lockLibsDirectory(Context context) throws IOException {
    File lockFile = new File(context.getApplicationInfo().dataDir, "libs-dir-lock");
    return FileLocker.lock(lockFile);
  }

  /**
   * Return the directory into which we put our self-extracted native libraries.
   *
   * @param context Application context
   * @return File pointing to an existing directory
   */
  /* package */ static File getLibsDirectory(Context context) {
    return new File(context.getApplicationInfo().dataDir, "app_libs");
  }

  /**
   * Return the directory into which we put our self-extracted native libraries and make sure it
   * exists.
   */
  /* package */ static File createLibsDirectory(Context context) {
    File libsDirectory = getLibsDirectory(context);
    if (!libsDirectory.isDirectory() && !libsDirectory.mkdirs()) {
      throw new RuntimeException("could not create libs directory");
    }

    return libsDirectory;
  }

  /**
   * Delete a directory and its contents.
   *
   * WARNING: Java APIs do not let us distinguish directories from symbolic links to directories.
   * Consequently, if the directory contains symbolic links to directories, we will attempt to
   * delete the contents of pointed-to directories.
   *
   * @param file File or directory to delete
   */
  /* package */ static void dumbDeleteRecrusive(File file) throws IOException {
    if (file.isDirectory()) {
      for (File entry : file.listFiles()) {
        dumbDeleteRecrusive(entry);
      }
    }

    if (!file.delete() && file.exists()) {
      throw new IOException("could not delete: " + file);
    }
  }

  /**
   * Encapsulate Lollipop-specific calls into an independent class so we don't fail preverification
   * downlevel.
   */
  private static final class LollipopSysdeps {
    public static String[] getSupportedAbis() {
      return Build.SUPPORTED_32_BIT_ABIS; // We ain't doing no newfangled 64-bit
    }

    public static void fallocate(FileDescriptor fd, long length) throws IOException {
      try {
        Os.posix_fallocate(fd, 0, length);
      } catch (ErrnoException ex) {
        throw new IOException(ex.toString(), ex);
      }
    }
  }
}
