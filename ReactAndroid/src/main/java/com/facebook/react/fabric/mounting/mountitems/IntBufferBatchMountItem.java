/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricComponents.getFabricComponentName;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.systrace.Systrace;

/**
 * This class represents a batch of {@link MountItem}s, represented directly as int buffers to
 * remove the need for actual MountItem instances.
 *
 * <p>An IntBufferBatchMountItem batch contains an array of ints, indicating the mount actions that
 * should be taken, and a size; as well as an array of Objects, and a corresponding array size, for
 * any data that cannot be passed as a raw int.
 *
 * <p>The purpose of encapsulating the array of MountItems this way, is to reduce the amount of
 * allocations in C++ and JNI round-trips.
 */
@DoNotStrip
public class IntBufferBatchMountItem implements MountItem {
  static final String TAG = IntBufferBatchMountItem.class.getSimpleName();

  static final int INSTRUCTION_FLAG_MULTIPLE = 1;

  static final int INSTRUCTION_CREATE = 2;
  static final int INSTRUCTION_DELETE = 4;
  static final int INSTRUCTION_INSERT = 8;
  static final int INSTRUCTION_REMOVE = 16;
  static final int INSTRUCTION_UPDATE_PROPS = 32;
  static final int INSTRUCTION_UPDATE_STATE = 64;
  static final int INSTRUCTION_UPDATE_LAYOUT = 128;
  static final int INSTRUCTION_UPDATE_EVENT_EMITTER = 256;
  static final int INSTRUCTION_UPDATE_PADDING = 512;

  private final int mRootTag;
  private final int mCommitNumber;

  @NonNull private final ThemedReactContext mContext;

  @NonNull private final int[] mIntBuffer;
  @NonNull private final Object[] mObjBuffer;

  private final int mIntBufferLen;
  private final int mObjBufferLen;

  public IntBufferBatchMountItem(
      int rootTag,
      @Nullable ThemedReactContext context,
      int[] intBuf,
      Object[] objBuf,
      int commitNumber) {
    mRootTag = rootTag;
    mCommitNumber = commitNumber;
    mContext = context;

    mIntBuffer = intBuf;
    mObjBuffer = objBuf;

    mIntBufferLen = mIntBuffer != null ? mIntBuffer.length : 0;
    mObjBufferLen = mObjBuffer != null ? mObjBuffer.length : 0;
  }

  private void beginMarkers(String reason) {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE,
        "FabricUIManager::"
            + reason
            + " - "
            + mIntBufferLen
            + " intBufSize "
            + " - "
            + mObjBufferLen
            + " objBufSize");

    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START, null, mCommitNumber);
    }
  }

  private void endMarkers() {
    if (mCommitNumber > 0) {
      ReactMarker.logFabricMarker(
          ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END, null, mCommitNumber);
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  private static StateWrapper castToState(Object obj) {
    return obj != null ? (StateWrapper) obj : null;
  }

  private static ReadableMap castToProps(Object obj) {
    return obj != null ? (ReadableMap) obj : null;
  }

  private static EventEmitterWrapper castToEventEmitter(Object obj) {
    return obj != null ? (EventEmitterWrapper) obj : null;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    if (mContext == null) {
      FLog.e(
          TAG,
          "Cannot execute batch of %s MountItems; no context. Hopefully this is because StopSurface was called.",
          TAG);
      return;
    }

    beginMarkers("mountViews");

    int i = 0, j = 0;
    while (i < mIntBufferLen) {
      int rawType = mIntBuffer[i++];
      int type = rawType & ~INSTRUCTION_FLAG_MULTIPLE;
      int numInstructions = ((rawType & INSTRUCTION_FLAG_MULTIPLE) != 0 ? mIntBuffer[i++] : 1);
      for (int k = 0; k < numInstructions; k++) {
        if (type == INSTRUCTION_CREATE) {
          String componentName = getFabricComponentName((String) mObjBuffer[j++]);
          mountingManager.createView(
              mContext,
              componentName,
              mIntBuffer[i++],
              castToProps(mObjBuffer[j++]),
              castToState(mObjBuffer[j++]),
              mIntBuffer[i++] == 1);
        } else if (type == INSTRUCTION_DELETE) {
          mountingManager.deleteView(mIntBuffer[i++]);
        } else if (type == INSTRUCTION_INSERT) {
          int tag = mIntBuffer[i++];
          int parentTag = mIntBuffer[i++];
          mountingManager.addViewAt(parentTag, tag, mIntBuffer[i++]);
        } else if (type == INSTRUCTION_REMOVE) {
          mountingManager.removeViewAt(mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_PROPS) {
          mountingManager.updateProps(mIntBuffer[i++], castToProps(mObjBuffer[j++]));
        } else if (type == INSTRUCTION_UPDATE_STATE) {
          mountingManager.updateState(mIntBuffer[i++], castToState(mObjBuffer[j++]));
        } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
          mountingManager.updateLayout(
              mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);

          // The final buffer, layoutDirection, seems unused?
          i++;
        } else if (type == INSTRUCTION_UPDATE_PADDING) {
          mountingManager.updatePadding(
              mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_EVENT_EMITTER) {
          mountingManager.updateEventEmitter(mIntBuffer[i++], castToEventEmitter(mObjBuffer[j++]));
        } else {
          throw new IllegalArgumentException(
              "Invalid type argument to IntBufferBatchMountItem: " + type + " at index: " + i);
        }
      }
    }

    endMarkers();
  }

  public int getRootTag() {
    return mRootTag;
  }

  public boolean shouldSchedule() {
    return mIntBufferLen != 0;
  }

  @Override
  public String toString() {
    try {
      StringBuilder s = new StringBuilder();
      s.append("IntBufferBatchMountItem:");
      int i = 0, j = 0;
      while (i < mIntBufferLen) {
        int rawType = mIntBuffer[i++];
        int type = rawType & ~INSTRUCTION_FLAG_MULTIPLE;
        int numInstructions = ((rawType & INSTRUCTION_FLAG_MULTIPLE) != 0 ? mIntBuffer[i++] : 1);
        for (int k = 0; k < numInstructions; k++) {
          if (type == INSTRUCTION_CREATE) {
            String componentName = getFabricComponentName((String) mObjBuffer[j++]);
            j += 2;
            s.append(
                String.format(
                    "CREATE [%d] - layoutable:%d - %s\n",
                    mIntBuffer[i++], mIntBuffer[i++], componentName));
          } else if (type == INSTRUCTION_DELETE) {
            s.append(String.format("DELETE [%d]\n", mIntBuffer[i++]));
          } else if (type == INSTRUCTION_INSERT) {
            s.append(
                String.format(
                    "INSERT [%d]->[%d] @%d\n", mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]));
          } else if (type == INSTRUCTION_REMOVE) {
            s.append(
                String.format(
                    "REMOVE [%d]->[%d] @%d\n", mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]));
          } else if (type == INSTRUCTION_UPDATE_PROPS) {
            ReadableMap props = castToProps(mObjBuffer[j++]);
            String propsString =
                IS_DEVELOPMENT_ENVIRONMENT
                    ? (props != null ? props.toHashMap().toString() : "<null>")
                    : "<hidden>";
            s.append(String.format("UPDATE PROPS [%d]: %s\n", mIntBuffer[i++], propsString));
          } else if (type == INSTRUCTION_UPDATE_STATE) {
            j += 1;
            s.append(String.format("UPDATE STATE [%d]\n", mIntBuffer[i++]));
          } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
            s.append(
                String.format(
                    "UPDATE LAYOUT [%d]: x:%d y:%d w:%d h:%d layoutDirection:%d\n",
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++]));
          } else if (type == INSTRUCTION_UPDATE_PADDING) {
            s.append(
                String.format(
                    "UPDATE PADDING [%d]: top:%d right:%d bottom:%d left:%d\n",
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++],
                    mIntBuffer[i++]));
          } else if (type == INSTRUCTION_UPDATE_EVENT_EMITTER) {
            j += 1;
            s.append(String.format("UPDATE EVENTEMITTER [%d]\n", mIntBuffer[i++]));
          } else {
            FLog.e(TAG, "String so far: " + s.toString());
            throw new IllegalArgumentException(
                "Invalid type argument to IntBufferBatchMountItem: " + type + " at index: " + i);
          }
        }
      }
      return s.toString();
    } catch (Exception e) {
      // Generally, this only happens during development when a malformed buffer is sent through.
      // In these cases, we print the buffers to assist in debugging.
      // This should never happen in production, but if it does... it'd still be helpful to know.
      FLog.e(TAG, "Caught exception trying to print", e);

      StringBuilder ss = new StringBuilder();
      for (int ii = 0; ii < mIntBufferLen; ii++) {
        ss.append(mIntBuffer[ii]);
        ss.append(", ");
      }
      FLog.e(TAG, ss.toString());

      for (int jj = 0; jj < mObjBufferLen; jj++) {
        FLog.e(TAG, mObjBuffer[jj] != null ? mObjBuffer[jj].toString() : "null");
      }

      return "";
    }
  }
}
