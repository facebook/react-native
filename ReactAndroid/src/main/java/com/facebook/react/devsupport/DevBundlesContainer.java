/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import org.json.JSONException;
import org.json.JSONObject;

public class DevBundlesContainer {

  private String SOURCE_URL_KEY = "sourceURL";
  private String FILE_URL_KEY = "fileURL";
  private String INITIAL_SOURCE_URL_KEY = "initialSourceURL";
  private String BUNDLES_NAME_MAPPING_KEY = "bundleNameMapping";

  private String initialSourceURL;
  private Map<String, BundleURLs> bundleNameMapping = new HashMap<>();

  private class BundleURLs {
    BundleURLs(String sourceURL, String fileURL) {
      this.fileURL = fileURL;
      this.sourceURL = sourceURL;
    }

    BundleURLs(JSONObject json) {
      try {
        this.sourceURL = json.getString(SOURCE_URL_KEY);
        this.fileURL = json.getString(FILE_URL_KEY);
      } catch (Throwable e) {
        FLog.e(ReactConstants.TAG, "BundleURLs is unable to create from JSON");
      }
    }

    String sourceURL;
    String fileURL;

    JSONObject toJSON() {
      JSONObject json = new JSONObject();
      try {
        json.put(FILE_URL_KEY, fileURL);
        json.put(SOURCE_URL_KEY, sourceURL);
      } catch (JSONException e) {
        FLog.e(ReactConstants.TAG, "BundleURLs is unable to be parsed to JSON");
      }
      return json;
    }
  }

  public DevBundlesContainer(String initialSourceURL) {
    this.initialSourceURL = initialSourceURL;
  }

  public String getInitialSourceURL() {
    return this.initialSourceURL;
  }

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

  public JSONObject toJSON() {
    JSONObject jsonContainer = new JSONObject();
    JSONObject jsonNameMapping = new JSONObject();
    try {
      jsonContainer.put(INITIAL_SOURCE_URL_KEY, initialSourceURL);
      for (String key : bundleNameMapping.keySet()) {
        jsonNameMapping.put(key, Objects.requireNonNull(bundleNameMapping.get(key)).toJSON());
      }
      jsonContainer.put(BUNDLES_NAME_MAPPING_KEY, jsonNameMapping);
    } catch (JSONException e) {
      FLog.e(ReactConstants.TAG, "DevBundlesContainer is unable to be parsed to JSON");
    }
    return jsonContainer;
  }

  public DevBundlesContainer(JSONObject json) {
    try {
      this.initialSourceURL = json.getString(INITIAL_SOURCE_URL_KEY);
      JSONObject bundles = json.getJSONObject(BUNDLES_NAME_MAPPING_KEY);
      for(int i = 0; i<bundles.names().length(); i++){
        String key = bundles.names().getString(i);
        bundleNameMapping.put(key, new BundleURLs(bundles.getJSONObject(key)));
      }
    } catch (Throwable e) {
      FLog.e(ReactConstants.TAG, "DevBundlesContainer is unable to create from JSON");
    }
  }
}