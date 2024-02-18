/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.StableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer.Companion.KEY_RANGE
import java.lang.StringBuilder
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.annotation.concurrent.NotThreadSafe

/**
 * Read-only implementation of the [MapBuffer], imported from C++ environment. Use
 * `<react/common/mapbuffer/JReadableMapBuffer.h> to create it.
 *
 * See [MapBuffer] documentation for more details
 */
@StableReactNativeAPI
@NotThreadSafe
@DoNotStrip
public class ReadableMapBuffer : MapBuffer {

  // Hybrid data must be kept in the `mHybridData` field for fbjni to work
  @field:DoNotStrip private val mHybridData: HybridData?

  // Byte data of the mapBuffer
  private val buffer: ByteBuffer
  // Amount of items serialized on the ByteBuffer
  override var count: Int = 0
    private set

  @DoNotStrip
  private constructor(hybridData: HybridData) {
    mHybridData = hybridData
    buffer = importByteBuffer()
    readHeader()
  }

  private constructor(buffer: ByteBuffer) {
    mHybridData = null
    this.buffer = buffer
    readHeader()
  }

  private external fun importByteBuffer(): ByteBuffer

  private fun readHeader() {
    // byte order
    val storedAlignment = buffer.short
    if (storedAlignment.toInt() != ALIGNMENT) {
      buffer.order(ByteOrder.LITTLE_ENDIAN)
    }
    // count
    count = readUnsignedShort(buffer.position()).toInt()
  }

  // returns the relative offset of the first byte of dynamic data
  private val offsetForDynamicData: Int
    get() = getKeyOffsetForBucketIndex(count)

  /**
   * @param key Key to search for
   * @return the "bucket index" for a key or -1 if not found. It uses a binary search algorithm
   *   (log(n))
   */
  private fun getBucketIndexForKey(intKey: Int): Int {
    if (intKey !in KEY_RANGE) {
      return -1
    }
    val key = intKey.toUShort()

    var lo = 0
    var hi = count - 1
    while (lo <= hi) {
      val mid = lo + hi ushr 1
      val midVal = readUnsignedShort(getKeyOffsetForBucketIndex(mid))
      when {
        midVal < key -> lo = mid + 1
        midVal > key -> hi = mid - 1
        else -> return mid
      }
    }
    return -1
  }

  private fun readDataType(bucketIndex: Int): MapBuffer.DataType {
    val value = readUnsignedShort(getKeyOffsetForBucketIndex(bucketIndex) + TYPE_OFFSET).toInt()
    return MapBuffer.DataType.values()[value]
  }

  private fun getTypedValueOffsetForKey(key: Int, expected: MapBuffer.DataType): Int {
    val bucketIndex = getBucketIndexForKey(key)
    require(bucketIndex != -1) { "Key not found: $key" }
    val dataType = readDataType(bucketIndex)
    check(!(dataType !== expected)) { "Expected $expected for key: $key, found $dataType instead." }
    return getKeyOffsetForBucketIndex(bucketIndex) + VALUE_OFFSET
  }

  private fun readUnsignedShort(bufferPosition: Int): UShort {
    return buffer.getShort(bufferPosition).toUShort()
  }

  private fun readDoubleValue(bufferPosition: Int): Double {
    return buffer.getDouble(bufferPosition)
  }

  private fun readIntValue(bufferPosition: Int): Int {
    return buffer.getInt(bufferPosition)
  }

  private fun readBooleanValue(bufferPosition: Int): Boolean {
    return readIntValue(bufferPosition) == 1
  }

  private fun readStringValue(bufferPosition: Int): String {
    val offset = offsetForDynamicData + buffer.getInt(bufferPosition)
    val sizeOfString = buffer.getInt(offset)
    val result = ByteArray(sizeOfString)
    val stringOffset = offset + Int.SIZE_BYTES
    buffer.position(stringOffset)
    buffer[result, 0, sizeOfString]
    return String(result)
  }

  private fun readMapBufferValue(position: Int): ReadableMapBuffer {
    val offset = offsetForDynamicData + buffer.getInt(position)
    val sizeMapBuffer = buffer.getInt(offset)
    val newBuffer = ByteArray(sizeMapBuffer)
    val bufferOffset = offset + Int.SIZE_BYTES
    buffer.position(bufferOffset)
    buffer[newBuffer, 0, sizeMapBuffer]
    return ReadableMapBuffer(ByteBuffer.wrap(newBuffer))
  }

  private fun readMapBufferListValue(position: Int): List<ReadableMapBuffer> {
    val readMapBufferList = arrayListOf<ReadableMapBuffer>()
    var offset = offsetForDynamicData + buffer.getInt(position)
    val sizeMapBufferList = buffer.getInt(offset)
    offset += Int.SIZE_BYTES
    var curLen = 0
    while (curLen < sizeMapBufferList) {
      val sizeMapBuffer = buffer.getInt(offset + curLen)
      val newMapBuffer = ByteArray(sizeMapBuffer)
      curLen = curLen + Int.SIZE_BYTES
      buffer.position(offset + curLen)
      buffer[newMapBuffer, 0, sizeMapBuffer]
      readMapBufferList.add(ReadableMapBuffer(ByteBuffer.wrap(newMapBuffer)))
      curLen = curLen + sizeMapBuffer
    }
    return readMapBufferList
  }

  private fun getKeyOffsetForBucketIndex(bucketIndex: Int): Int {
    return HEADER_SIZE + BUCKET_SIZE * bucketIndex
  }

  override fun contains(key: Int): Boolean {
    // TODO T83483191: Add tests
    return getBucketIndexForKey(key) != -1
  }

  override fun getKeyOffset(key: Int): Int = getBucketIndexForKey(key)

  override fun entryAt(offset: Int): MapBuffer.Entry =
      MapBufferEntry(getKeyOffsetForBucketIndex(offset))

  override fun getType(key: Int): MapBuffer.DataType {
    val bucketIndex = getBucketIndexForKey(key)
    require(bucketIndex != -1) { "Key not found: $key" }
    return readDataType(bucketIndex)
  }

  override fun getInt(key: Int): Int =
      readIntValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.INT))

  override fun getDouble(key: Int): Double =
      readDoubleValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.DOUBLE))

  override fun getString(key: Int): String =
      readStringValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.STRING))

  override fun getBoolean(key: Int): Boolean =
      readBooleanValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.BOOL))

  override fun getMapBuffer(key: Int): ReadableMapBuffer =
      readMapBufferValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.MAP))

  override fun getMapBufferList(key: Int): List<ReadableMapBuffer> =
      readMapBufferListValue(getTypedValueOffsetForKey(key, MapBuffer.DataType.MAP))

  override fun hashCode(): Int {
    buffer.rewind()
    return buffer.hashCode()
  }

  override fun equals(other: Any?): Boolean {
    if (other !is ReadableMapBuffer) {
      return false
    }
    val thisByteBuffer = buffer
    val otherByteBuffer = other.buffer
    if (thisByteBuffer === otherByteBuffer) {
      return true
    }
    thisByteBuffer.rewind()
    otherByteBuffer.rewind()
    return thisByteBuffer == otherByteBuffer
  }

  override fun toString(): String {
    val builder = StringBuilder("{")
    for (entry in this) {
      val key = entry.key
      builder.append(key)
      builder.append('=')
      when (entry.type) {
        MapBuffer.DataType.BOOL -> builder.append(entry.booleanValue)
        MapBuffer.DataType.INT -> builder.append(entry.intValue)
        MapBuffer.DataType.DOUBLE -> builder.append(entry.doubleValue)
        MapBuffer.DataType.STRING -> builder.append(entry.stringValue)
        MapBuffer.DataType.MAP -> builder.append(entry.mapBufferValue.toString())
      }
      builder.append(',')
    }
    builder.append('}')
    return builder.toString()
  }

  override fun iterator(): Iterator<MapBuffer.Entry> {
    return object : Iterator<MapBuffer.Entry> {
      var current = 0
      val last = count - 1

      override fun hasNext(): Boolean {
        return current <= last
      }

      override fun next(): MapBuffer.Entry {
        return MapBufferEntry(getKeyOffsetForBucketIndex(current++))
      }
    }
  }

  private inner class MapBufferEntry(private val bucketOffset: Int) : MapBuffer.Entry {
    private fun assertType(expected: MapBuffer.DataType) {
      val dataType = type
      check(!(expected !== dataType)) {
        ("Expected " +
            expected +
            " for key: " +
            key +
            " found " +
            dataType.toString() +
            " instead.")
      }
    }

    override val key: Int
      get() = readUnsignedShort(bucketOffset).toInt()

    override val type: MapBuffer.DataType
      get() = MapBuffer.DataType.values()[readUnsignedShort(bucketOffset + TYPE_OFFSET).toInt()]

    override val doubleValue: Double
      get() {
        assertType(MapBuffer.DataType.DOUBLE)
        return readDoubleValue(bucketOffset + VALUE_OFFSET)
      }

    override val intValue: Int
      get() {
        assertType(MapBuffer.DataType.INT)
        return readIntValue(bucketOffset + VALUE_OFFSET)
      }

    override val booleanValue: Boolean
      get() {
        assertType(MapBuffer.DataType.BOOL)
        return readBooleanValue(bucketOffset + VALUE_OFFSET)
      }

    override val stringValue: String
      get() {
        assertType(MapBuffer.DataType.STRING)
        return readStringValue(bucketOffset + VALUE_OFFSET)
      }

    override val mapBufferValue: MapBuffer
      get() {
        assertType(MapBuffer.DataType.MAP)
        return readMapBufferValue(bucketOffset + VALUE_OFFSET)
      }
  }

  public companion object {
    // Value used to verify if the data is serialized with LittleEndian order.
    private const val ALIGNMENT = 0xFE

    // 8 bytes = 2 (alignment) + 2 (count) + 4 (size)
    private const val HEADER_SIZE = 8

    // 10 bytes = 2 (key) + 2 (type) + 8 (value)
    private const val BUCKET_SIZE = 12

    // 2 bytes = 2 (key)
    private const val TYPE_OFFSET = 2

    // 4 bytes = 2 (key) + 2 (type)
    private const val VALUE_OFFSET = 4

    init {
      MapBufferSoLoader.staticInit()
    }
  }
}
