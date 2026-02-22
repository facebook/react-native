/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

/**
 * Represents a list of grid tracks for use with grid-template-rows/columns.
 */
public class YogaGridTrackList {
  private val tracks: MutableList<YogaGridTrackValue> = mutableListOf()

  public fun addTrack(track: YogaGridTrackValue) {
    tracks.add(track)
  }

  public fun getTracks(): List<YogaGridTrackValue> = tracks.toList()

  public fun size(): Int = tracks.size

  public operator fun get(index: Int): YogaGridTrackValue = tracks[index]
}
