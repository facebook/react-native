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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileDescriptor;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;

import org.junit.Rule;
import org.junit.rules.TemporaryFolder;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class UnpackerTestBase {
  static final String NAME_IN_APK = "nameInApk";
  static final String DESTINATION_NAME = "destination";
  static final byte[] ASSET_DATA = new byte[]{(byte) 1, (byte) 101, (byte) 50};

  @Rule
  public TemporaryFolder folder = new TemporaryFolder();

  File mDestinationPath;
  byte[] mIOBuffer;

  Context mContext;
  AssetManager mAssetManager;

  public void setUp() throws IOException {
    mDestinationPath = new File(folder.getRoot(), DESTINATION_NAME);
    mIOBuffer = new byte[16 * 1024];

    mContext = mock(Context.class);
    mAssetManager = mock(AssetManager.class);

    when(mContext.getAssets()).thenReturn(mAssetManager);
    when(mAssetManager.open(eq(NAME_IN_APK), anyInt()))
      .then(new Answer<FileInputStream>() {
          @Override
          public FileInputStream answer(InvocationOnMock invocation) throws Throwable {
            final ByteArrayInputStream bais = new ByteArrayInputStream(ASSET_DATA);
            final FileInputStream fis = mock(FileInputStream.class);
            when(fis.read())
              .then(new Answer<Integer>() {
                  @Override
                  public Integer answer(InvocationOnMock invocation) throws Throwable {
                    return bais.read();
                  }
                });
            when(fis.read(any(byte[].class)))
              .then(new Answer<Integer>() {
                  @Override
                    public Integer answer(InvocationOnMock invocation) throws Throwable {
                    return bais.read((byte[]) invocation.getArguments()[0]);
                  }
                });
            when(fis.read(any(byte[].class), any(int.class), any(int.class)))
              .then(new Answer<Integer>() {
                  @Override
                    public Integer answer(InvocationOnMock invocation) throws Throwable {
                    return bais.read(
                      (byte[]) invocation.getArguments()[0],
                      (int) invocation.getArguments()[1],
                      (int) invocation.getArguments()[2]);
                  }
                });
            when(fis.available()).then(new Answer<Integer>() {
                @Override
                public Integer answer(InvocationOnMock invocation) throws Throwable {
                  return bais.available();
                }
              });
            return fis;
          }
        });
  }
}
