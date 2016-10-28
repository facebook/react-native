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

import com.facebook.soloader.SoLoader;

import java.io.File;
import java.io.IOException;

import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.junit.Test;
import org.robolectric.RobolectricTestRunner;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Matchers.same;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

@RunWith(RobolectricTestRunner.class)
public class UnpackingJSBundleLoaderTest {
  static {
    SoLoader.setInTestMode();
  }

  private static final String URL = "http://this.is.an.url";
  private static final int MOCK_UNPACKERS_NUM = 2;
  private static final int UNPACKER_TEST_FLAGS = 129;

  @Rule
  public TemporaryFolder folder = new TemporaryFolder();

  private File mDestinationPath;
  private File mFilesPath;

  private UnpackingJSBundleLoader.Builder mBuilder;
  private Context mContext;
  private CatalystInstanceImpl mCatalystInstanceImpl;
  private UnpackingJSBundleLoader.Unpacker[] mMockUnpackers;

  private Runnable mCallback;

  @Before
  public void setUp() throws IOException {
    mDestinationPath = folder.newFolder("destination");
    mFilesPath = folder.newFolder("files");

    mContext = mock(Context.class);
    when(mContext.getFilesDir()).thenReturn(mFilesPath);

    mCatalystInstanceImpl = mock(CatalystInstanceImpl.class);

    mBuilder = UnpackingJSBundleLoader.newBuilder()
      .setDestinationPath(mDestinationPath)
      .setSourceURL(URL)
      .setContext(mContext);

    mMockUnpackers = new UnpackingJSBundleLoader.Unpacker[MOCK_UNPACKERS_NUM];
    for (int i = 0; i < mMockUnpackers.length; ++i) {
      mMockUnpackers[i] = mock(UnpackingJSBundleLoader.Unpacker.class);
    }

    mCallback = mock(Runnable.class);
  }

  private void addUnpackers() {
    for (UnpackingJSBundleLoader.Unpacker unpacker : mMockUnpackers) {
      mBuilder.addUnpacker(unpacker);
    }
  }

  @Test
  public void testGetSourceUrl() {
    assertEquals(URL, mBuilder.build().getSourceUrl());
  }

  @Test
  public void testCreatesDotUnpackedFile() throws IOException {
    mBuilder.build().prepare();
    assertTrue(new File(mDestinationPath, UnpackingJSBundleLoader.DOT_UNPACKED_FILE).exists());
  }

  @Test
  public void testCreatesLockFile() throws IOException {
    mBuilder.build().prepare();
    assertTrue(new File(mFilesPath, UnpackingJSBundleLoader.LOCK_FILE).exists());
  }

  @Test
  public void testCallsAppropriateInstanceMethod() throws IOException {
    mBuilder.build().loadScript(mCatalystInstanceImpl);
    verify(mCatalystInstanceImpl).loadScriptFromOptimizedBundle(
      eq(mDestinationPath.getPath()),
      eq(URL),
      eq(0));
    verifyNoMoreInteractions(mCatalystInstanceImpl);
  }

  @Test
  public void testSetLoadFlags() throws IOException {
    mBuilder.setLoadFlags(UNPACKER_TEST_FLAGS)
      .build()
      .loadScript(mCatalystInstanceImpl);
    verify(mCatalystInstanceImpl).loadScriptFromOptimizedBundle(
      eq(mDestinationPath.getPath()),
      eq(URL),
      eq(UNPACKER_TEST_FLAGS));
  }

  @Test
  public void testLoadScriptUnpacks() {
    mBuilder.build().loadScript(mCatalystInstanceImpl);
    assertTrue(new File(mDestinationPath, UnpackingJSBundleLoader.DOT_UNPACKED_FILE).exists());
  }

  @Test
  public void testPrepareCallDoesNotRecreateDirIfNotNecessary() throws IOException {
    mBuilder.build().prepare();

    addUnpackers();
    mBuilder.build().prepare();
    for (UnpackingJSBundleLoader.Unpacker unpacker : mMockUnpackers) {
      verify(unpacker).setDestinationDirectory(mDestinationPath);
      verify(unpacker).shouldReconstructDir(
        same(mContext),
        any(byte[].class));
      verifyNoMoreInteractions(unpacker);
    }
  }

  @Test
  public void testShouldReconstructDirForcesRecreation() throws IOException {
    mBuilder.build().prepare();

    addUnpackers();
    when(mMockUnpackers[0].shouldReconstructDir(
           same(mContext),
           any(byte[].class)))
      .thenReturn(true);
    mBuilder.build().prepare();

    verify(mMockUnpackers[0]).shouldReconstructDir(
      same(mContext),
      any(byte[].class));
    for (UnpackingJSBundleLoader.Unpacker unpacker : mMockUnpackers) {
      verify(unpacker).setDestinationDirectory(mDestinationPath);
      verify(unpacker).unpack(
        same(mContext),
        any(byte[].class));
      verifyNoMoreInteractions(unpacker);
    }
  }

  @Test
  public void testDirectoryReconstructionRemovesDir() throws IOException {
    mBuilder.build().prepare();
    final File aFile = new File(mDestinationPath, "a_file");
    aFile.createNewFile();

    when(mMockUnpackers[0].shouldReconstructDir(
           same(mContext),
           any(byte[].class)))
      .thenReturn(true);
    addUnpackers();
    mBuilder.build().prepare();

    assertFalse(aFile.exists());
  }

  @Test(expected = RuntimeException.class)
  public void testDropsDirectoryOnException() throws IOException {
    doThrow(new IOException("An expected IOException"))
      .when(mMockUnpackers[0]).unpack(
        same(mContext),
        any(byte[].class));
    try {
      mBuilder.addUnpacker(mMockUnpackers[0]).build().prepare();
    } finally {
      assertFalse(mDestinationPath.exists());
    }
  }

  @Test
  public void testCallbackIsCalledAfterUnpack() {
    mBuilder.setOnUnpackedCallback(mCallback).build().prepare();
    verify(mCallback).run();
  }

  @Test
  public void testCallbackIsNotCalledIfNothingIsUnpacked() {
    mBuilder.build().prepare();
    mBuilder.setOnUnpackedCallback(mCallback).build().prepare();
    verifyNoMoreInteractions(mCallback);
  }
}
