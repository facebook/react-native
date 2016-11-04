// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import java.util.Arrays;
import java.util.List;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class Inspector {
  static {
    ReactBridge.staticInit();
  }

  private final HybridData mHybridData;

  public static List<Page> getPages() {
    return Arrays.asList(instance().getPagesNative());
  }

  public static LocalConnection connect(int pageId, RemoteConnection remote) {
    return instance().connectNative(pageId, remote);
  }

  private static native Inspector instance();

  private native Page[] getPagesNative();

  private native LocalConnection connectNative(int pageId, RemoteConnection remote);

  private Inspector(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @DoNotStrip
  public static class Page {
    private final int mId;
    private final String mTitle;

    public int getId() {
      return mId;
    }

    public String getTitle() {
      return mTitle;
    }

    @Override
    public String toString() {
      return "Page{" +
          "mId=" + mId +
          ", mTitle='" + mTitle + '\'' +
          '}';
    }

    private Page(int id, String title) {
      mId = id;
      mTitle = title;
    }
  }

  @DoNotStrip
  public interface RemoteConnection {
    void onMessage(String message);
    void onDisconnect();
  }

  @DoNotStrip
  public static class LocalConnection {
    private final HybridData mHybridData;

    public native void sendMessage(String message);
    public native void disconnect();

    private LocalConnection(HybridData hybridData) {
      mHybridData = hybridData;
    }
  }
}
