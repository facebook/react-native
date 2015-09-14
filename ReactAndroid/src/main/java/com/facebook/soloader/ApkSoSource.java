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

import android.util.Log;

/**
 * {@link SoSource} that extracts libraries from an APK to the filesystem.
 */
public class ApkSoSource extends DirectorySoSource {

  private static final String TAG = SoLoader.TAG;
  private static final boolean DEBUG = SoLoader.DEBUG;

  /**
   * Make a new ApkSoSource that extracts DSOs from our APK instead of relying on the system to do
   * the extraction for us.
   *
   * @param context Application context
   */
  public ApkSoSource(Context context) throws IOException {
    //
    // Initialize a normal DirectorySoSource that will load from our extraction directory.  At this
    // point, the directory may be empty or contain obsolete libraries, but that's okay.
    //

    super(SysUtil.createLibsDirectory(context), DirectorySoSource.RESOLVE_DEPENDENCIES);

    //
    // Synchronize the contents of that directory with the library payload in our APK, deleting and
    // extracting as needed.
    //

    try (JarFile apk = new JarFile(context.getApplicationInfo().publicSourceDir)) {
      File libsDir = super.soDirectory;

      if (DEBUG) {
        Log.v(TAG, "synchronizing log directory: " + libsDir);
      }

      Map<String, SoInfo> providedLibraries = findProvidedLibraries(apk);
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
          SoInfo so = providedLibraries.get(name);
          boolean shouldDelete =
              (so == null ||
                  so.entry.getSize() != extantFile.length() ||
                  so.entry.getTime() != extantFile.lastModified());
          boolean upToDate = (so != null && !shouldDelete);

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
        for (SoInfo so : providedLibraries.values()) {
          JarEntry entry = so.entry;
          try (InputStream is = apk.getInputStream(entry)) {
            if (DEBUG) {
              Log.v(TAG, "extracting library: " + so.soName);
            }
            SysUtil.reliablyCopyExecutable(
                is,
                new File(libsDir, so.soName),
                entry.getSize(),
                entry.getTime());
          }

          SysUtil.freeCopyBuffer();
        }
      }
    }
  }

  /**
   * Find the shared libraries provided in this APK and supported on this system.  Each returend
   * SoInfo points to the most preferred version of that library bundled with the given APK: for
   * example, if we're on an armv7-a system and we have both arm and armv7-a versions of libfoo, the
   * returned entry for libfoo points to the armv7-a version of libfoo.
   *
   * The caller owns the returned value and may mutate it.
   *
   * @param apk Opened application APK file
   * @return Map of sonames to SoInfo instances
   */
  private static Map<String, SoInfo> findProvidedLibraries(JarFile apk) {
    // Subgroup 1: ABI. Subgroup 2: soname.
    Pattern libPattern = Pattern.compile("^lib/([^/]+)/([^/]+\\.so)$");
    HashMap<String, SoInfo> providedLibraries = new HashMap<>();
    String[] supportedAbis = SysUtil.getSupportedAbis();
    Enumeration<JarEntry> entries = apk.entries();
    while (entries.hasMoreElements()) {
      JarEntry entry = entries.nextElement();
      Matcher m = libPattern.matcher(entry.getName());
      if (m.matches()) {
        String libraryAbi = m.group(1);
        String soName = m.group(2);
        int abiScore = SysUtil.findAbiScore(supportedAbis, libraryAbi);
        if (abiScore >= 0) {
          SoInfo so = providedLibraries.get(soName);
          if (so == null || abiScore < so.abiScore) {
            providedLibraries.put(soName, new SoInfo(soName, entry, abiScore));
          }
        }
      }
    }

    return providedLibraries;
  }

  private static final class SoInfo {
    public final String soName;
    public final JarEntry entry;
    public final int abiScore;

    SoInfo(String soName, JarEntry entry, int abiScore) {
      this.soName = soName;
      this.entry = entry;
      this.abiScore = abiScore;
    }
  }
}
