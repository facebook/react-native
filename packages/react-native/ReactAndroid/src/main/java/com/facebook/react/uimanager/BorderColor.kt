package com.facebook.react.uimanager

import java.util.Arrays

/**
 * Class representing CSS spacing border colors. Modified from Spacing to support long values.
 */
public class BorderColor {

  private val mBorder: LongArray = LongArray(12)
  private var mValueFlags = 0
  private val mDefaultValue: Long
  private var mHasAliasesSet = false

  public constructor() : this(0L)

  public constructor(defaultValue: Long) {
    mDefaultValue = defaultValue
  }

  public constructor(original: BorderColor) {
    mDefaultValue = original.mDefaultValue
    System.arraycopy(original.mBorder, 0, mBorder, 0, original.mBorder.size)
    mValueFlags = original.mValueFlags
    mHasAliasesSet = original.mHasAliasesSet
  }

  /**
   * Set a border value.
   *
   * @param borderType one of [LEFT], [TOP], [RIGHT], [BOTTOM], [VERTICAL], [HORIZONTAL], [ALL]
   * @param value the value for this direction
   * @return `true` if the spacing has changed, or `false` if the same value was already set
   */
  public fun set(borderType: Int, value: Long): Boolean {
    if (mBorder[borderType] != value) {
      mBorder[borderType] = value
      mValueFlags = mValueFlags or sFlagsMap[borderType]
      mHasAliasesSet = mValueFlags and (sFlagsMap[ALL] or sFlagsMap[VERTICAL] or sFlagsMap[HORIZONTAL] or sFlagsMap[BLOCK]) != 0
      return true
    }
    return false
  }

  /**
   * Get the border for a direction. This takes into account any default values that have been set.
   *
   * @param borderType one of [LEFT], [TOP], [RIGHT], [BOTTOM]
   */
  public fun get(borderType: Int): Long {
    val defaultValue = if (borderType in setOf(START, END, BLOCK, BLOCK_END, BLOCK_START)) 0 else mDefaultValue

    if (mValueFlags == 0) return defaultValue

    if (mValueFlags and sFlagsMap[borderType] != 0) return mBorder[borderType]

    if (mHasAliasesSet) {
      val secondType = if (borderType == TOP || borderType == BOTTOM) VERTICAL else HORIZONTAL
      if (mValueFlags and sFlagsMap[secondType] != 0) {
        return mBorder[secondType]
      } else if (mValueFlags and sFlagsMap[ALL] != 0) {
        return mBorder[ALL]
      }
    }

    return defaultValue
  }

  /**
   * Get the raw value (that was set using [set]), without taking into account
   * any default values.
   *
   * @param borderType one of [LEFT], [TOP], [RIGHT], [BOTTOM], [VERTICAL], [HORIZONTAL], [ALL]
   */
  public fun getRaw(borderType: Int): Long = mBorder[borderType]

  /**
   * Resets the border instance to its default state. This method is meant to be used when
   * recycling Border instances.
   */
  public fun reset() {
    Arrays.fill(mBorder, 0)
    mValueFlags = 0
    mHasAliasesSet = false
  }

  private companion object {
    const val LEFT = 0
    const val TOP = 1
    const val RIGHT = 2
    const val BOTTOM = 3
    const val START = 4
    const val END = 5
    const val HORIZONTAL = 6
    const val VERTICAL = 7
    const val ALL = 8
    const val BLOCK = 9
    const val BLOCK_END = 10
    const val BLOCK_START = 11

    private val sFlagsMap = intArrayOf(
      1, // LEFT
      2, // TOP
      4, // RIGHT
      8, // BOTTOM
      16, // START
      32, // END
      64, // HORIZONTAL
      128, // VERTICAL
      256, // ALL
      512, // BLOCK
      1024, // BLOCK_END
      2048 // BLOCK_START
    )
  }
}
