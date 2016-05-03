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
import java.io.FileInputStream;
import java.io.BufferedReader;
import java.io.FileReader;

import android.util.Log;

/**
 * {@link SoSource} that retrieves libraries from an exopackage repository.
 */
public class ExoSoSource extends DirectorySoSource {

  private static final String TAG = SoLoader.TAG;
  private static final boolean DEBUG = SoLoader.DEBUG;

  /**
   * @param context Application context
   */
  public ExoSoSource(Context context) throws IOException {
    //
    // Initialize a normal DirectorySoSource that will load from our extraction directory.  At this
    // point, the directory may be empty or contain obsolete libraries, but that's okay.
    //

    super(SysUtil.createLibsDirectory(context), DirectorySoSource.RESOLVE_DEPENDENCIES);

    //
    // Synchronize the contents of that directory with the library payload in our APK, deleting and
    // extracting as needed.
    //

    File libsDir = super.soDirectory;

    if (DEBUG) {
      Log.v(TAG, "synchronizing log directory: " + libsDir);
    }

    Map<String, File> providedLibraries = findProvidedLibraries(context);
    try (FileLocker lock = SysUtil.lockLibsDirectory(context)) {
      // Delete files in libsDir that we don't provide or that are out of date.  Forget about any
      // libraries that are up-to-date already so we don't unpack them below.
      File extantFiles[] = libsDir.listFiles();
      for (int i = 0; i < extantFiles.length; ++i) {
        File extantFile = extantFiles[i];

        if (DEBUG) {
          Log.v(TAG, "considering libdir file: " + extantFile);
        }

        String name = extantFile.getName();
        File sourceFile = providedLibraries.get(name);
        boolean shouldDelete =
            (sourceFile == null ||
                sourceFile.length() != extantFile.length() ||
                sourceFile.lastModified() != extantFile.lastModified());
        boolean upToDate = (sourceFile != null && !shouldDelete);

        if (shouldDelete) {
          if (DEBUG) {
            Log.v(TAG, "deleting obsolete or unexpected file: " + extantFile);
          }
          SysUtil.deleteOrThrow(extantFile);
        }

        if (upToDate) {
          if (DEBUG) {
            Log.v(TAG, "found up-to-date library: " + extantFile);
          }
          providedLibraries.remove(name);
        }
      }

      // Now extract any libraries left in providedLibraries; we removed all the up-to-date ones.
      for (String soName : providedLibraries.keySet()) {
        File sourceFile = providedLibraries.get(soName);
        try (InputStream is = new FileInputStream(sourceFile)) {
          if (DEBUG) {
            Log.v(TAG, "extracting library: " + soName);
          }
          SysUtil.reliablyCopyExecutable(
              is,
              new File(libsDir, soName),
              sourceFile.length(),
              sourceFile.lastModified());
        }

        SysUtil.freeCopyBuffer();
      }
    }
  }

  /**
   * Find the shared libraries provided through the exopackage directory and supported on this
   * system.  Each returend SoInfo points to the most preferred version of that library included in
   * our exopackage directory: for example, if we're on an armv7-a system and we have both arm and
   * armv7-a versions of libfoo, the returned entry for libfoo points to the armv7-a version of
   * libfoo.
   *
   * The caller owns the returned value and may mutate it.
   *
   * @param context Application context
   * @return Map of sonames to providing files
   */
  private static Map<String, File> findProvidedLibraries(Context context) throws IOException {
    File exoDir = new File(
        "/data/local/tmp/exopackage/"
        + context.getPackageName()
        + "/native-libs/");

    HashMap<String, File> providedLibraries = new HashMap<>();
    for (String abi : SysUtil.getSupportedAbis()) {
      File abiDir = new File(exoDir, abi);
      if (!abiDir.isDirectory()) {
        continue;
      }

      File metadata = new File(abiDir, "metadata.txt");
      if (!metadata.isFile()) {
        continue;
      }

      try (FileReader fr = new FileReader(metadata);
          BufferedReader br = new BufferedReader(fr)) {
        String line;
        while ((line = br.readLine()) != null) {
          if (line.length() == 0) {
            continue;
          }

          int sep = line.indexOf(' ');
          if (sep == -1) {
            throw new RuntimeException("illegal line in exopackage metadata: [" + line + "]");
          }

          String soName = line.substring(0, sep) + ".so";
          String backingFile = line.substring(sep + 1);

          if (!providedLibraries.containsKey(soName)) {
            providedLibraries.put(soName, new File(abiDir, backingFile));
          }
        }
      }
    }

    return providedLibraries;
  }
}
