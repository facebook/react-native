/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.soloader;

import java.io.BufferedOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.HashSet;
import java.util.ArrayList;
import java.io.FileNotFoundException;

import java.util.Set;

import javax.annotation.Nullable;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
import android.os.StatFs;
import android.util.Log;

import android.content.pm.ApplicationInfo;

/**
 * Note that {@link com.facebook.base.app.DelegatingApplication} will automatically register itself
 * with SoLoader before running application-specific code; most applications do not need to call
 * {@link #init} explicitly.
 */
@SuppressLint({
    "BadMethodUse-android.util.Log.v",
    "BadMethodUse-android.util.Log.d",
    "BadMethodUse-android.util.Log.i",
    "BadMethodUse-android.util.Log.w",
    "BadMethodUse-android.util.Log.e",
})
public class SoLoader {

  /* package */ static final String TAG = "SoLoader";
  /* package */ static final boolean DEBUG = false;

  /**
   * Ordered list of sources to consult when trying to load a shared library or one of its
   * dependencies.  {@code null} indicates that SoLoader is uninitialized.
   */
  @Nullable private static SoSource[] sSoSources = null;

  /**
   * Records the sonames (e.g., "libdistract.so") of shared libraries we've loaded.
   */
  private static final Set<String> sLoadedLibraries = new HashSet<>();

  /**
   * Initializes native code loading for this app; this class's other static facilities cannot be
   * used until this {@link #init} is called.  This method is idempotent: calls after the first are
   * ignored.
   *
   * @param context - application context.
   * @param isNativeExopackageEnabled - whether native exopackage feature is enabled in the build.
   */
  public static synchronized void init(@Nullable Context context, boolean isNativeExopackageEnabled) {
    if (sSoSources == null) {
      ArrayList<SoSource> soSources = new ArrayList<>();

      //
      // Add SoSource objects for each of the system library directories.
      //

      String LD_LIBRARY_PATH = System.getenv("LD_LIBRARY_PATH");
      if (LD_LIBRARY_PATH == null) {
        LD_LIBRARY_PATH = "/vendor/lib:/system/lib";
      }

      String[] systemLibraryDirectories = LD_LIBRARY_PATH.split(":");
      for (int i = 0; i < systemLibraryDirectories.length; ++i) {
        // Don't pass DirectorySoSource.RESOLVE_DEPENDENCIES for directories we find on
        // LD_LIBRARY_PATH: Bionic's dynamic linker is capable of correctly resolving dependencies
        // these libraries have on each other, so doing that ourselves would be a waste.
        File systemSoDirectory = new File(systemLibraryDirectories[i]);
        soSources.add(
            new DirectorySoSource(
                systemSoDirectory,
                DirectorySoSource.ON_LD_LIBRARY_PATH));
      }

      //
      // We can only proceed forward if we have a Context. The prominent case
      // where we don't have a Context is barebones dalvikvm instantiations. In
      // that case, the caller is responsible for providing a correct LD_LIBRARY_PATH.
      //

      if (context != null) {
        //
        // Prepend our own SoSource for our own DSOs.
        //

        ApplicationInfo applicationInfo = context.getApplicationInfo();
        boolean isSystemApplication =
            (applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0 &&
            (applicationInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) == 0;

        try {
          if (isNativeExopackageEnabled) {
            soSources.add(0, new ExoSoSource(context));
          } else if (isSystemApplication) {
            soSources.add(0, new ApkSoSource(context));
          } else {
            // Delete the old libs directory if we don't need it.
            SysUtil.dumbDeleteRecrusive(SysUtil.getLibsDirectory(context));

            int ourSoSourceFlags = 0;

            // On old versions of Android, Bionic doesn't add our library directory to its internal
            // search path, and the system doesn't resolve dependencies between modules we ship.  On
            // these systems, we resolve dependencies ourselves.  On other systems, Bionic's built-in
            // resolver suffices.

            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.JELLY_BEAN_MR1) {
              ourSoSourceFlags |= DirectorySoSource.RESOLVE_DEPENDENCIES;
            }

            SoSource ourSoSource = new DirectorySoSource(
                new File(applicationInfo.nativeLibraryDir),
                ourSoSourceFlags);

            soSources.add(0, ourSoSource);
          }
        } catch (IOException ex) {
          throw new RuntimeException(ex);
        }
      }

      sSoSources = soSources.toArray(new SoSource[soSources.size()]);
    }
  }

  /**
   * Turn shared-library loading into a no-op.  Useful in special circumstances.
   */
  public static void setInTestMode() {
    sSoSources = new SoSource[]{new NoopSoSource()};
  }

  /**
   * Load a shared library, initializing any JNI binding it contains.
   *
   * @param shortName Name of library to find, without "lib" prefix or ".so" suffix
   */
  public static synchronized void loadLibrary(String shortName)
      throws UnsatisfiedLinkError
  {
    if (sSoSources == null) {
      // This should never happen during normal operation,
      // but if we're running in a non-Android environment,
      // fall back to System.loadLibrary.
      if ("http://www.android.com/".equals(System.getProperty("java.vendor.url"))) {
        // This will throw.
        assertInitialized();
      } else {
        // Not on an Android system.  Ask the JVM to load for us.
        System.loadLibrary(shortName);
        return;
      }
    }

    try {
      loadLibraryBySoName(System.mapLibraryName(shortName), 0);
    } catch (IOException ex) {
      throw new RuntimeException(ex);
    }
  }

  /**
   * Unpack library and its dependencies, returning the location of the unpacked library file.  All
   * non-system dependencies of the given library will either be on LD_LIBRARY_PATH or will be in
   * the same directory as the returned File.
   *
   * @param shortName Name of library to find, without "lib" prefix or ".so" suffix
   * @return Unpacked DSO location
   */
  public static File unpackLibraryAndDependencies(String shortName)
      throws UnsatisfiedLinkError
  {
    assertInitialized();
    try {
      return unpackLibraryBySoName(System.mapLibraryName(shortName));
    } catch (IOException ex) {
      throw new RuntimeException(ex);
    }
  }

  /* package */ static void loadLibraryBySoName(String soName, int loadFlags) throws IOException {
    int result = sLoadedLibraries.contains(soName)
        ? SoSource.LOAD_RESULT_LOADED
        : SoSource.LOAD_RESULT_NOT_FOUND;

    for (int i = 0; result == SoSource.LOAD_RESULT_NOT_FOUND && i < sSoSources.length; ++i) {
      result = sSoSources[i].loadLibrary(soName, loadFlags);
    }

    if (result == SoSource.LOAD_RESULT_NOT_FOUND) {
      throw new UnsatisfiedLinkError("could find DSO to load: " + soName);
    }

    if (result == SoSource.LOAD_RESULT_LOADED) {
      sLoadedLibraries.add(soName);
    }
  }

  /* package */ static File unpackLibraryBySoName(String soName) throws IOException {
    for (int i = 0; i < sSoSources.length; ++i) {
      File unpacked = sSoSources[i].unpackLibrary(soName);
      if (unpacked != null) {
        return unpacked;
      }
    }

    throw new FileNotFoundException(soName);
  }

  private static void assertInitialized() {
    if (sSoSources == null) {
      throw new RuntimeException("SoLoader.init() not yet called");
    }
  }
}
