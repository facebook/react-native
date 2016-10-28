/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.cxxbridge;

import android.content.Context;
import android.content.res.AssetManager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.soloader.FileLocker;
import com.facebook.soloader.SysUtil;
import com.facebook.systrace.Systrace;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.ArrayList;
import java.util.Arrays;

import javax.annotation.Nullable;

import static com.facebook.systrace.Systrace.TRACE_TAG_REACT_JAVA_BRIDGE;

/**
 * JSBundleLoader capable of unpacking specified files necessary for executing
 * JS bundle stored in optimized format.
 */
public class UnpackingJSBundleLoader extends JSBundleLoader {

  /**
   * Name of the lock files. Multiple processes can be spawned off the same app
   * and we need to guarantee that at most one unpacks files at any time. To
   * make that work any process is required to hold file system lock on
   * LOCK_FILE when checking whether files should be unpacked and unpacking
   * them.
   */
  static final String LOCK_FILE = "unpacking-bundle-loader.lock";

  /**
   * Existence of this file indicates that the last unpacking operation finished
   * before the app was killed or crashed. File with this name is created in the
   * destination directory as the last one. If it is present it means that
   * all the files that needed to be fsynced were fsynced and their content is
   * what it should be.
   */
  static final String DOT_UNPACKED_FILE = ".unpacked";

  private static final int IO_BUFFER_SIZE = 16 * 1024;

  /**
   * Where all the files should go to.
   */
  private final File mDirectoryPath;

  private final String mSourceURL;
  private final Context mContext;
  private final int mLoadFlags;
  private final @Nullable Runnable mOnUnpackedCallback;

  /**
   * Description of what needs to be unpacked.
   */
  private final Unpacker[] mUnpackers;

  /* package */ UnpackingJSBundleLoader(Builder builder) {
    mContext = Assertions.assertNotNull(builder.context);
    mDirectoryPath = Assertions.assertNotNull(builder.destinationPath);
    mSourceURL = Assertions.assertNotNull(builder.sourceURL);
    mUnpackers = builder.unpackers.toArray(new Unpacker[builder.unpackers.size()]);
    mLoadFlags = builder.loadFlags;
    mOnUnpackedCallback = builder.callback;
  }

  /**
   * Checks if any file needs to be extracted again, and if so, clears the destination
   * directory and unpacks everything again.
   */
  /* package */ void prepare() {
    boolean unpacked = false;

    final File lockFilePath = new File(mContext.getFilesDir(), LOCK_FILE);
    Systrace.beginSection(TRACE_TAG_REACT_JAVA_BRIDGE, "UnpackingJSBundleLoader.prepare");

    // Make sure we don't release the lock by letting other thread close the lock file
    synchronized(UnpackingJSBundleLoader.class) {
      try (FileLocker lock = FileLocker.lock(lockFilePath)) {
        unpacked = prepareLocked();
      } catch (IOException ioe) {
        throw new RuntimeException(ioe);
      } finally {
        Systrace.endSection(TRACE_TAG_REACT_JAVA_BRIDGE);
      }
    }

    if (unpacked && mOnUnpackedCallback != null) {
      mOnUnpackedCallback.run();
    }
  }

  private boolean prepareLocked() throws IOException {
    final File dotFinishedFilePath = new File(mDirectoryPath, DOT_UNPACKED_FILE);
    boolean shouldReconstruct = !mDirectoryPath.exists() || !dotFinishedFilePath.exists();

    byte[] buffer = new byte[IO_BUFFER_SIZE];
    for (int i = 0; i < mUnpackers.length && !shouldReconstruct; ++i) {
      shouldReconstruct = mUnpackers[i].shouldReconstructDir(mContext, buffer);
    }

    if (!shouldReconstruct) {
      return false;
    }

    boolean succeeded = false;
    try {
      SysUtil.dumbDeleteRecursive(mDirectoryPath);
      if (!mDirectoryPath.mkdirs()) {
        throw new IOException("Coult not create the destination directory");
      }

      for (Unpacker unpacker : mUnpackers) {
        unpacker.unpack(mContext, buffer);
      }

      if (!dotFinishedFilePath.createNewFile()) {
        throw new IOException("Could not create .unpacked file");
      }

      // It would be nice to fsync a few directories and files here. The thing is, if we crash and
      // lose some data then it should be noticed on the next prepare invocation and the directory
      // will be reconstructed. It is only crucial to fsync those files whose content is not
      // verified on each start. Everything else is a tradeoff between perf with no crashes
      // situation and perf when user experiences crashes. Fortunately Unpackers corresponding
      // to files whose content is not checked handle fsyncs themselves.

      succeeded = true;
    } finally {
      // In case of failure do yourself a favor and remove partially initialized state.
      if (!succeeded) {
        SysUtil.dumbDeleteRecursive(mDirectoryPath);
      }
    }

    return true;
  }

  @Override
  public void loadScript(CatalystInstanceImpl instance) {
    prepare();
    instance.loadScriptFromOptimizedBundle(
      mDirectoryPath.getPath(),
      mSourceURL,
      mLoadFlags);
  }

  @Override
  public String getSourceUrl() {
    return mSourceURL;
  }

  static void fsync(File path) throws IOException {
    try (RandomAccessFile file = new RandomAccessFile(path, "r")) {
      file.getFD().sync();
    }
  }

  /**
   * Reads all the bytes (but no more that maxSize) from given input stream through ioBuffer
   * and returns byte array containing all the read bytes.
   */
  static byte[] readBytes(InputStream is, byte[] ioBuffer, int maxSize) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    copyBytes(baos, is, ioBuffer, maxSize);
    return baos.toByteArray();
  }

  /**
   * Pumps all the bytes (but no more that maxSize) from given input stream through ioBuffer
   * to given output stream and returns number of moved bytes.
   */
  static int copyBytes(
      OutputStream os,
      InputStream is,
      byte[] ioBuffer,
      int maxSize) throws IOException {
    int totalSize = 0;
    while (totalSize < maxSize) {
      int rc = is.read(ioBuffer, 0, Math.min(maxSize - totalSize, ioBuffer.length));
      if (rc == -1) {
        break;
      }
      os.write(ioBuffer, 0, rc);
      totalSize += rc;
    }
    return totalSize;
  }

  public static Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private @Nullable Context context;
    private @Nullable File destinationPath;
    private @Nullable String sourceURL;
    private final ArrayList<Unpacker> unpackers;
    private int loadFlags;
    private @Nullable Runnable callback;

    public Builder() {
      this.unpackers = new ArrayList<Unpacker>();
      context = null;
      destinationPath = null;
      sourceURL = null;
      loadFlags = 0;
      callback = null;
    }

    public Builder setContext(Context context) {
      this.context = context;
      return this;
    }

    public Builder setDestinationPath(File destinationPath) {
      this.destinationPath = destinationPath;
      return this;
    }

    public Builder setSourceURL(String sourceURL) {
      this.sourceURL = sourceURL;
      return this;
    }

    public Builder setLoadFlags(int loadFlags) {
      this.loadFlags = loadFlags;
      return this;
    }

    /**
     * Adds a file for unpacking. Content of extracted file is not checked on each
     * start against content of the file bundled in apk.
     */
    public Builder unpackFile(String nameInApk, String destFileName) {
      unpackers.add(new ExistenceCheckingUnpacker(nameInApk, destFileName));
      return this;
    }

    /**
     * Adds a file for unpacking. Content of extracted file is compared on each
     * start with content of the same file bundled in apk. It is usefull for
     * detecting bundle/app changes.
     */
    public Builder checkAndUnpackFile(String nameInApk, String destFileName) {
      unpackers.add(new ContentCheckingUnpacker(nameInApk, destFileName));
      return this;
    }

    /**
     * Adds arbitrary unpacker. Usefull for injecting mocks.
     */
    Builder addUnpacker(Unpacker u) {
      unpackers.add(u);
      return this;
    }

    public Builder setOnUnpackedCallback(Runnable callback) {
      this.callback = callback;
      return this;
    }

    public UnpackingJSBundleLoader build() {
      Assertions.assertNotNull(destinationPath);
      for (int i = 0; i < unpackers.size(); ++i) {
        unpackers.get(i).setDestinationDirectory(destinationPath);
      }
      return new UnpackingJSBundleLoader(this);
    }
  }

  /**
   * Abstraction for dealing with unpacking single file from apk.
   */
  static abstract class Unpacker {
    protected final String mNameInApk;
    private final String mFileName;
    protected @Nullable File mDestinationFilePath;

    public Unpacker(String nameInApk, String fileName) {
      mNameInApk = nameInApk;
      mFileName = fileName;
    }

    public void setDestinationDirectory(File destinationDirectoryPath) {
      mDestinationFilePath = new File(destinationDirectoryPath, mFileName);
    }

    public abstract boolean shouldReconstructDir(Context context, byte[] ioBuffer)
      throws IOException;

    public void unpack(Context context, byte[] ioBuffer) throws IOException {
      AssetManager am = context.getAssets();
      try (InputStream is = am.open(mNameInApk, AssetManager.ACCESS_STREAMING)) {
        try (FileOutputStream fileOutputStream = new FileOutputStream(
               Assertions.assertNotNull(mDestinationFilePath))) {
          copyBytes(fileOutputStream, is, ioBuffer, Integer.MAX_VALUE);
        }
      }
    }
  }

  /**
   * Deals with unpacking files whose content is not checked on each start and
   * need to be fsynced after unpacking.
   */
  static class ExistenceCheckingUnpacker extends Unpacker {
    public ExistenceCheckingUnpacker(String nameInApk, String fileName) {
      super(nameInApk, fileName);
    }

    @Override
    public boolean shouldReconstructDir(Context context, byte[] ioBuffer) {
      return !Assertions.assertNotNull(mDestinationFilePath).exists();
    }

    @Override
    public void unpack(Context context, byte[] ioBuffer) throws IOException {
      super.unpack(context, ioBuffer);
      fsync(Assertions.assertNotNull(mDestinationFilePath));
    }
  }

  /**
   * Deals with unpacking files whose content is checked on each start and thus
   * do not require fsync.
   */
  static class ContentCheckingUnpacker extends Unpacker {
    public ContentCheckingUnpacker(String nameInApk, String fileName) {
      super(nameInApk, fileName);
    }

    @Override
    public boolean shouldReconstructDir(Context context, byte[] ioBuffer) throws IOException {
      if (!Assertions.assertNotNull(mDestinationFilePath).exists()) {
        return true;
      }

      AssetManager am = context.getAssets();
      final byte[] assetContent;
      try (InputStream assetStream = am.open(mNameInApk, AssetManager.ACCESS_STREAMING)) {
        assetContent = readBytes(assetStream, ioBuffer, Integer.MAX_VALUE);
      }

      final byte[] fileContent;
      try (InputStream fileStream = new FileInputStream(
             Assertions.assertNotNull(mDestinationFilePath))) {
        fileContent = readBytes(fileStream, ioBuffer, assetContent.length + 1);
      }

      return !Arrays.equals(assetContent, fileContent);
    }
  }
}
