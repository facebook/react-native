/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.mapbuffer;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Iterator;

/**
 * TODO T83483191: add documentation.
 *
 * <p>NOTE: {@link ReadableMapBuffer} is NOT thread safe.
 */
public class ReadableMapBuffer implements Iterable<ReadableMapBuffer.MapBufferEntry> {

  static {
    ReadableMapBufferSoLoader.staticInit();
  }

  /**
   * Data types supported by MapBuffer. Keep in sync with definition in `MapBuffer.h`, as enum
   * serialization relies on correct order.
   */
  public enum DataType {
    BOOL,
    INT,
    DOUBLE,
    STRING,
    MAP;
  }

  // Value used to verify if the data is serialized with LittleEndian order.
  private static final int ALIGNMENT = 0xFE;

  // 8 bytes = 2 (alignment) + 2 (count) + 4 (size)
  private static final int HEADER_SIZE = 8;

  // 10 bytes = 2 (key) + 2 (type) + 8 (value)
  private static final int BUCKET_SIZE = 12;

  // 2 bytes = 2 (key)
  private static final int TYPE_OFFSET = 2;

  // 4 bytes = 2 (key) + 2 (type)
  private static final int VALUE_OFFSET = 4;

  private static final int INT_SIZE = 4;

  @Nullable ByteBuffer mBuffer = null;

  // Amount of items serialized on the ByteBuffer
  private int mCount = 0;

  @DoNotStrip
  private ReadableMapBuffer(HybridData hybridData) {
    mHybridData = hybridData;
  }

  private ReadableMapBuffer(ByteBuffer buffer) {
    mBuffer = buffer;
    readHeader();
  }

  private native ByteBuffer importByteBuffer();

  @SuppressWarnings("unused")
  @DoNotStrip
  @Nullable
  private HybridData mHybridData;

  private static int getKeyOffsetForBucketIndex(int bucketIndex) {
    return HEADER_SIZE + BUCKET_SIZE * bucketIndex;
  }

  // returns the relative offset of the first byte of dynamic data
  private int getOffsetForDynamicData() {
    // TODO T83483191: check if there's dynamic data?
    return getKeyOffsetForBucketIndex(mCount);
  }

  /**
   * @param key Key to search for
   * @return the "bucket index" for a key or -1 if not found. It uses a binary search algorithm
   *     (log(n))
   */
  private int getBucketIndexForKey(int key) {
    importByteBufferAndReadHeader();
    int lo = 0;
    int hi = getCount() - 1;
    while (lo <= hi) {
      final int mid = (lo + hi) >>> 1;
      final int midVal = readUnsignedShort(getKeyOffsetForBucketIndex(mid));
      if (midVal < key) {
        lo = mid + 1;
      } else if (midVal > key) {
        hi = mid - 1;
      } else {
        return mid;
      }
    }
    return -1;
  }

  private DataType readDataType(int bucketIndex) {
    int value = readUnsignedShort(getKeyOffsetForBucketIndex(bucketIndex) + TYPE_OFFSET);
    return DataType.values()[value];
  }

  private int getTypedValueOffsetForKey(int key, DataType expected) {
    int bucketIndex = getBucketIndexForKey(key);
    DataType dataType = readDataType(bucketIndex);
    if (bucketIndex == -1) {
      throw new IllegalArgumentException("Key not found: " + key);
    }

    if (dataType != expected) {
      throw new IllegalStateException(
          "Expected "
              + expected
              + " for key: "
              + key
              + " found "
              + dataType.toString()
              + " instead.");
    }

    return getKeyOffsetForBucketIndex(bucketIndex) + VALUE_OFFSET;
  }

  private int readUnsignedShort(int bufferPosition) {
    return mBuffer.getShort(bufferPosition) & 0xFFFF;
  }

  private double readDoubleValue(int bufferPosition) {
    return mBuffer.getDouble(bufferPosition);
  }

  private int readIntValue(int bufferPosition) {
    return mBuffer.getInt(bufferPosition);
  }

  private boolean readBooleanValue(int bufferPosition) {
    return readIntValue(bufferPosition) == 1;
  }

  private String readStringValue(int bufferPosition) {
    int offset = getOffsetForDynamicData() + mBuffer.getInt(bufferPosition);

    int sizeOfString = mBuffer.getInt(offset);
    byte[] result = new byte[sizeOfString];

    int stringOffset = offset + INT_SIZE;

    mBuffer.position(stringOffset);
    mBuffer.get(result, 0, sizeOfString);

    return new String(result);
  }

  private ReadableMapBuffer readMapBufferValue(int position) {
    int offset = getOffsetForDynamicData() + mBuffer.getInt(position);

    int sizeMapBuffer = mBuffer.getInt(offset);
    byte[] buffer = new byte[sizeMapBuffer];

    int bufferOffset = offset + INT_SIZE;

    mBuffer.position(bufferOffset);
    mBuffer.get(buffer, 0, sizeMapBuffer);

    return new ReadableMapBuffer(ByteBuffer.wrap(buffer));
  }

  private void readHeader() {
    // byte order
    short storedAlignment = mBuffer.getShort();
    if (storedAlignment != ALIGNMENT) {
      mBuffer.order(ByteOrder.LITTLE_ENDIAN);
    }
    // count
    mCount = readUnsignedShort(mBuffer.position());
  }

  /**
   * Binary search of the key inside the mapBuffer (log(n)).
   *
   * @param key Key to search for
   * @return true if and only if the Key received as a parameter is stored in the MapBuffer.
   */
  public boolean hasKey(int key) {
    // TODO T83483191: Add tests
    return getBucketIndexForKey(key) != -1;
  }

  @Nullable
  public DataType getType(int key) {
    int bucketIndex = getBucketIndexForKey(key);

    if (bucketIndex == -1) {
      throw new IllegalArgumentException("Key not found: " + key);
    }

    return readDataType(bucketIndex);
  }

  /** @return amount of elements stored into the MapBuffer */
  public int getCount() {
    importByteBufferAndReadHeader();
    return mCount;
  }

  /**
   * @param key {@link int} representing the key
   * @return return the int associated to the Key received as a parameter.
   */
  public int getInt(int key) {
    return readIntValue(getTypedValueOffsetForKey(key, DataType.INT));
  }

  /**
   * @param key {@link int} representing the key
   * @return return the double associated to the Key received as a parameter.
   */
  public double getDouble(int key) {
    return readDoubleValue(getTypedValueOffsetForKey(key, DataType.DOUBLE));
  }

  /**
   * @param key {@link int} representing the key
   * @return return the int associated to the Key received as a parameter.
   */
  public String getString(int key) {
    return readStringValue(getTypedValueOffsetForKey(key, DataType.STRING));
  }

  public boolean getBoolean(int key) {
    return readBooleanValue(getTypedValueOffsetForKey(key, DataType.BOOL));
  }

  /**
   * @param key {@link int} representing the key
   * @return return the int associated to the Key received as a parameter.
   */
  public ReadableMapBuffer getMapBuffer(int key) {
    return readMapBufferValue(getTypedValueOffsetForKey(key, DataType.MAP));
  }

  /**
   * Import ByteBuffer from C++, read the header and move the current cursor at the start of the
   * payload.
   */
  private ByteBuffer importByteBufferAndReadHeader() {
    if (mBuffer != null) {
      return mBuffer;
    }

    //    mBuffer = importByteBufferAllocateDirect();
    mBuffer = importByteBuffer();

    readHeader();
    return mBuffer;
  }

  private void assertKeyExists(int key, int bucketIndex) {
    int storedKey = readUnsignedShort(getKeyOffsetForBucketIndex(bucketIndex));
    if (storedKey != key) {
      throw new IllegalStateException(
          "Stored key doesn't match parameter - expected: " + key + " - found: " + storedKey);
    }
  }

  @Override
  public int hashCode() {
    ByteBuffer byteBuffer = importByteBufferAndReadHeader();
    byteBuffer.rewind();
    return byteBuffer.hashCode();
  }

  @Override
  public boolean equals(@Nullable Object obj) {
    if (!(obj instanceof ReadableMapBuffer)) {
      return false;
    }

    ReadableMapBuffer other = (ReadableMapBuffer) obj;
    ByteBuffer thisByteBuffer = importByteBufferAndReadHeader();
    ByteBuffer otherByteBuffer = other.importByteBufferAndReadHeader();
    if (thisByteBuffer == otherByteBuffer) {
      return true;
    }
    thisByteBuffer.rewind();
    otherByteBuffer.rewind();
    return thisByteBuffer.equals(otherByteBuffer);
  }

  /** @return an {@link Iterator<MapBufferEntry>} for the entries of this MapBuffer. */
  @Override
  public Iterator<MapBufferEntry> iterator() {
    return new Iterator<MapBufferEntry>() {
      int current = 0;
      final int last = getCount() - 1;

      @Override
      public boolean hasNext() {
        return current <= last;
      }

      @Override
      public MapBufferEntry next() {
        return new MapBufferEntry(getKeyOffsetForBucketIndex(current++));
      }
    };
  }

  /** This class represents an Entry of the {@link ReadableMapBuffer} class. */
  public class MapBufferEntry {
    private final int mBucketOffset;

    private MapBufferEntry(int position) {
      mBucketOffset = position;
    }

    private void assertType(DataType expected) {
      DataType dataType = getType();
      if (expected != dataType) {
        throw new IllegalStateException(
            "Expected "
                + expected
                + " for key: "
                + getKey()
                + " found "
                + dataType.toString()
                + " instead.");
      }
    }

    /** @return a {@link short} that represents the key of this {@link MapBufferEntry}. */
    public int getKey() {
      return readUnsignedShort(mBucketOffset);
    }

    public DataType getType() {
      return DataType.values()[readUnsignedShort(mBucketOffset + TYPE_OFFSET)];
    }

    /** @return the double value that is stored in this {@link MapBufferEntry}. */
    public double getDouble() {
      // TODO T83483191 Extend serialization of MapBuffer to return null if there's no value
      // stored in this MapBufferEntry.
      assertType(DataType.DOUBLE);
      return readDoubleValue(mBucketOffset + VALUE_OFFSET);
    }

    /** @return the int value that is stored in this {@link MapBufferEntry}. */
    public int getInt() {
      assertType(DataType.INT);
      return readIntValue(mBucketOffset + VALUE_OFFSET);
    }

    /** @return the boolean value that is stored in this {@link MapBufferEntry}. */
    public boolean getBoolean() {
      assertType(DataType.BOOL);
      return readBooleanValue(mBucketOffset + VALUE_OFFSET);
    }

    /** @return the String value that is stored in this {@link MapBufferEntry}. */
    public @Nullable String getString() {
      assertType(DataType.STRING);
      return readStringValue(mBucketOffset + VALUE_OFFSET);
    }

    /**
     * @return the {@link ReadableMapBuffer} value that is stored in this {@link MapBufferEntry}.
     */
    public @Nullable ReadableMapBuffer getReadableMapBuffer() {
      assertType(DataType.MAP);
      return readMapBufferValue(mBucketOffset + VALUE_OFFSET);
    }
  }
}
