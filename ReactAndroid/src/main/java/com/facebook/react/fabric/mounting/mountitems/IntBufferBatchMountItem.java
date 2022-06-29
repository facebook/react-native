/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricComponents.getFabricComponentName;
import static com.facebook.react.fabric.FabricUIManager.ENABLE_FABRIC_LOGS;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;

import androidx.annotation.NonNull;
import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
import com.facebook.react.uimanager.StateWrapper;
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
  static final int INSTRUCTION_UPDATE_OVERFLOW_INSET = 1024;
  static final int INSTRUCTION_REMOVE_DELETE_TREE = 2048;

  private final int mSurfaceId;
  private final int mCommitNumber;

  private final @NonNull int[] mIntBuffer;
  private final @NonNull Object[] mObjBuffer;

  private final int mIntBufferLen;
  private final int mObjBufferLen;

  public IntBufferBatchMountItem(int surfaceId, int[] intBuf, Object[] objBuf, int commitNumber) {
    mSurfaceId = surfaceId;
    mCommitNumber = commitNumber;

    mIntBuffer = intBuf;
    mObjBuffer = objBuf;

    mIntBufferLen = mIntBuffer != null ? mIntBuffer.length : 0;
    mObjBufferLen = mObjBuffer != null ? mObjBuffer.length : 0;
  }

  private void beginMarkers(String reason) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManager::" + reason);

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

  private static EventEmitterWrapper castToEventEmitter(Object obj) {
    return obj != null ? (EventEmitterWrapper) obj : null;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    SurfaceMountingManager surfaceMountingManager = mountingManager.getSurfaceManager(mSurfaceId);
    if (surfaceMountingManager == null) {
      FLog.e(
          TAG,
          "Skipping batch of MountItems; no SurfaceMountingManager found for [%d].",
          mSurfaceId);
      return;
    }
    if (surfaceMountingManager.isStopped()) {
      FLog.e(TAG, "Skipping batch of MountItems; was stopped [%d].", mSurfaceId);
      return;
    }
    if (ENABLE_FABRIC_LOGS) {
      FLog.d(TAG, "Executing IntBufferBatchMountItem on surface [%d]", mSurfaceId);
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
          surfaceMountingManager.createView(
              componentName,
              mIntBuffer[i++],
              mObjBuffer[j++],
              castToState(mObjBuffer[j++]),
              castToEventEmitter(mObjBuffer[j++]),
              mIntBuffer[i++] == 1);
        } else if (type == INSTRUCTION_DELETE) {
          surfaceMountingManager.deleteView(mIntBuffer[i++]);
        } else if (type == INSTRUCTION_INSERT) {
          int tag = mIntBuffer[i++];
          int parentTag = mIntBuffer[i++];
          surfaceMountingManager.addViewAt(parentTag, tag, mIntBuffer[i++]);
        } else if (type == INSTRUCTION_REMOVE) {
          surfaceMountingManager.removeViewAt(mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);
        } else if (type == INSTRUCTION_REMOVE_DELETE_TREE) {
          surfaceMountingManager.removeDeleteTreeAt(
              mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_PROPS) {
          surfaceMountingManager.updateProps(mIntBuffer[i++], mObjBuffer[j++]);
        } else if (type == INSTRUCTION_UPDATE_STATE) {
          surfaceMountingManager.updateState(mIntBuffer[i++], castToState(mObjBuffer[j++]));
        } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
          int reactTag = mIntBuffer[i++];
          int x = mIntBuffer[i++];
          int y = mIntBuffer[i++];
          int width = mIntBuffer[i++];
          int height = mIntBuffer[i++];
          int displayType = mIntBuffer[i++];

          surfaceMountingManager.updateLayout(reactTag, x, y, width, height, displayType);

        } else if (type == INSTRUCTION_UPDATE_PADDING) {
          surfaceMountingManager.updatePadding(
              mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_OVERFLOW_INSET) {
          int reactTag = mIntBuffer[i++];
          int overflowInsetLeft = mIntBuffer[i++];
          int overflowInsetTop = mIntBuffer[i++];
          int overflowInsetRight = mIntBuffer[i++];
          int overflowInsetBottom = mIntBuffer[i++];

          surfaceMountingManager.updateOverflowInset(
              reactTag,
              overflowInsetLeft,
              overflowInsetTop,
              overflowInsetRight,
              overflowInsetBottom);
        } else if (type == INSTRUCTION_UPDATE_EVENT_EMITTER) {
          surfaceMountingManager.updateEventEmitter(
              mIntBuffer[i++], castToEventEmitter(mObjBuffer[j++]));
        } else {
          throw new IllegalArgumentException(
              "Invalid type argument to IntBufferBatchMountItem: " + type + " at index: " + i);
        }
      }
    }

    surfaceMountingManager.didUpdateViews();

    endMarkers();
  }

  @Override
  public int getSurfaceId() {
    return mSurfaceId;
  }

  public boolean shouldSchedule() {
    return mIntBufferLen != 0;
  }

  @Override
  public String toString() {
    try {
      StringBuilder s = new StringBuilder();
      s.append(String.format("IntBufferBatchMountItem [surface:%d]:\n", mSurfaceId));
      int i = 0, j = 0;
      while (i < mIntBufferLen) {
        int rawType = mIntBuffer[i++];
        int type = rawType & ~INSTRUCTION_FLAG_MULTIPLE;
        int numInstructions = ((rawType & INSTRUCTION_FLAG_MULTIPLE) != 0 ? mIntBuffer[i++] : 1);
        for (int k = 0; k < numInstructions; k++) {
          if (type == INSTRUCTION_CREATE) {
            String componentName = getFabricComponentName((String) mObjBuffer[j++]);
            j += 3;
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
          } else if (type == INSTRUCTION_REMOVE_DELETE_TREE) {
            s.append(
                String.format(
                    "REMOVE+DELETE TREE [%d]->[%d] @%d\n",
                    mIntBuffer[i++], mIntBuffer[i++], mIntBuffer[i++]));
          } else if (type == INSTRUCTION_UPDATE_PROPS) {
            Object props = mObjBuffer[j++];
            String propsString =
                IS_DEVELOPMENT_ENVIRONMENT
                    ? (props != null ? props.toString() : "<null>")
                    : "<hidden>";
            s.append(String.format("UPDATE PROPS [%d]: %s\n", mIntBuffer[i++], propsString));
          } else if (type == INSTRUCTION_UPDATE_STATE) {
            StateWrapper state = castToState(mObjBuffer[j++]);
            String stateString =
                IS_DEVELOPMENT_ENVIRONMENT
                    ? (state != null ? state.getStateData().toString() : "<null>")
                    : "<hidden>";
            s.append(String.format("UPDATE STATE [%d]: %s\n", mIntBuffer[i++], stateString));
          } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
            s.append(
                String.format(
                    "UPDATE LAYOUT [%d]: x:%d y:%d w:%d h:%d displayType:%d\n",
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
          } else if (type == INSTRUCTION_UPDATE_OVERFLOW_INSET) {
            s.append(
                String.format(
                    "UPDATE OVERFLOWINSET [%d]: left:%d top:%d right:%d bottom:%d\n",
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
