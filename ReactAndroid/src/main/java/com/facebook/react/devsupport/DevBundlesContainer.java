/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import java.util.HashMap;
import java.util.Map;

public class DevBundlesContainer {
  private class BundleURLs {
    public BundleURLs(String sourceURL, String fileURL) {
      this.fileURL = fileURL;
      this.sourceURL = sourceURL;
    }
    public String sourceURL;
    public String fileURL;
  }

  private Map<String, BundleURLs> bundleNameMapping = new HashMap<>();

  public void pushBundle(String name, String sourceURL, String fileURL) {
    bundleNameMapping.put(name, new BundleURLs(sourceURL, fileURL));
  }

  public String getSourceURLByName(String name) {
    BundleURLs meta = bundleNameMapping.get(name);
    return meta.sourceURL;
  }

  public String getFileURLByName(String name) {
    BundleURLs meta = bundleNameMapping.get(name);
    return meta.fileURL;
  }

  public String getNameBySourceURL(String sourceURL) {
    for (String key : bundleNameMapping.keySet()) {
       BundleURLs tmp = bundleNameMapping.get(key);
       if(tmp.sourceURL.equals(sourceURL)) {
         return key;
       }
    }
    return "";
  }

  public String getNameByFileURL(String fileURL) {
    for (String key : bundleNameMapping.keySet()) {
       BundleURLs tmp = bundleNameMapping.get(key);
       if(tmp.fileURL.equals(fileURL)) {
         return key;
       }
    }
    return "";
  }

  public String getFileURLBySourceURL(String sourceURL) {
    for (String key : bundleNameMapping.keySet()) {
       BundleURLs tmp = bundleNameMapping.get(key);
       if(tmp.sourceURL.equals(sourceURL)) {
         return tmp.fileURL;
       }
    }
    return "";
  }
}