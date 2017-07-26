/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.quicklog;

/**
 * Stub implementation of QPL
 */
public class QuickPerformanceLogger {

  public void markerStart(
      int markerId) {
  }

  public void markerStart(
      int markerId,
      int instnaceKey) {
  }

  public void markerStart(
      int markerId,
      int instnaceKey,
      long timestamp) {
  }

  public void markerEnd(
      int markerId,
      short actionId) {
  }

  public void markerEnd(
      int markerId,
      int instanceKey,
      short actionId) {
  }

  public void markerEnd(
      int markerId,
      int instanceKey,
      short actionId,
      long timestamp) {
  }

  public void markerNote(
      int markerId,
      short actionId) {
  }

  public void markerNote(
      int markerId,
      int instanceKey,
      short actionId) {
  }

  public void markerNote(
      int markerId,
      int instanceKey,
      short actionId,
      long timestamp) {
  }

  public void markerCancel(
      int markerId) {
  }

  public void markerCancel(
      int markerId,
      int instanceKey) {
  }

  public void markerTag(
      int markerId,
      String tag) {
  }

  public void markerTag(
      int markerId,
      int instanceKey,
      String tag) {
  }

  public void markerAnnotate(
    int markerId,
    String annotationKey,
    String annotationValue) {
  }

  public void markerAnnotate(
    int markerId,
    int instanceKey,
    String annotationKey,
    String annotationValue) {
  }

  public long currentMonotonicTimestamp() {
    return 0L;
  }

}
