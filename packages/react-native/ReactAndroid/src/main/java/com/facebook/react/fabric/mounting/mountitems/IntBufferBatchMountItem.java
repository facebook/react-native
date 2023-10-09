/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.ENABLE_FABRIC_LOGS;
import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;
import static com.facebook.react.fabric.mounting.mountitems.FabricNameComponentMapping.getFabricComponentName;

import androidx.annotation.NonNull;
import com.facebook.common.logging.FLog;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.fabric.mounting.SurfaceMountingManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.systrace.Systrace;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

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
final class IntBufferBatchMountItem implements BatchMountItem {
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

  IntBufferBatchMountItem(int surfaceId, int[] intBuf, Object[] objBuf, int commitNumber) {
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

    ArrayList<HashMap<String, Object>> mutationsArray = new ArrayList<>();

    // we put views in the map also for basic operations since tags are only mapped to ViewState
    // which are internal.
    // In most cases we will need the view to perform an action in the listener
    int i = 0, j = 0;
    while (i < mIntBufferLen) {
      int rawType = mIntBuffer[i++];
      int type = rawType & ~INSTRUCTION_FLAG_MULTIPLE;
      int numInstructions = ((rawType & INSTRUCTION_FLAG_MULTIPLE) != 0 ? mIntBuffer[i++] : 1);
      for (int k = 0; k < numInstructions; k++) {
        HashMap<String, Object> map = new HashMap<>();
        if (type == INSTRUCTION_CREATE) {
          map.put("type", "CREATE");
          map.put("componentName", getFabricComponentName((String) mObjBuffer[j++]));
          int reactTag = mIntBuffer[i++];
          map.put("reactTag", reactTag);
          View view = surfaceMountingManager.getView(reactTag);
          map.put("view", view);
          map.put("props", mObjBuffer[j++]);
          map.put("stateWrapper", castToState(mObjBuffer[j++]));
          map.put("eventEmitterWrapper", castToEventEmitter(mObjBuffer[j++]));
          map.put("isLayoutable", mIntBuffer[i++] == 1);
        } else if (type == INSTRUCTION_DELETE) {
          map.put("type", "DELETE");
          int reactTag = mIntBuffer[i++];
          map.put("reactTag", reactTag);
          View view = surfaceMountingManager.getView(reactTag);
          map.put("view", view);
        } else if (type == INSTRUCTION_INSERT) {
          map.put("type", "INSERT");
          int tag = mIntBuffer[i++];
          map.put("tag", tag);
          View view = surfaceMountingManager.getView(tag);
          map.put("view", view);
          map.put("parentTag", mIntBuffer[i++]);
          map.put("index", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_REMOVE) {
          map.put("type", "REMOVE");
          int tag = mIntBuffer[i++];
          map.put("tag", tag);
          View view = surfaceMountingManager.getView(tag);
          map.put("view", view);
          map.put("parentTag", mIntBuffer[i++]);
          map.put("index", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_REMOVE_DELETE_TREE) {
          map.put("type", "REMOVE_DELETE_TREE");
          int tag = mIntBuffer[i++];
          map.put("tag", tag);
          View view = surfaceMountingManager.getView(tag);
          map.put("view", view);
          map.put("parentTag", mIntBuffer[i++]);
          map.put("index", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_PROPS) {
          map.put("type", "UPDATE_PROPS");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("props", mObjBuffer[j++]);
        } else if (type == INSTRUCTION_UPDATE_STATE) {
          map.put("type", "UPDATE_STATE");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("stateWrapper", castToState(mObjBuffer[j++]));
        } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
          map.put("type", "UPDATE_LAYOUT");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("parentTag", mIntBuffer[i++]);
          map.put("x", mIntBuffer[i++]);
          map.put("y", mIntBuffer[i++]);
          map.put("width", mIntBuffer[i++]);
          map.put("height", mIntBuffer[i++]);
          map.put("displayType", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_PADDING) {
          map.put("type", "UPDATE_PADDING");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("left", mIntBuffer[i++]);
          map.put("top", mIntBuffer[i++]);
          map.put("right", mIntBuffer[i++]);
          map.put("bottom", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_OVERFLOW_INSET) {
          map.put("type", "UPDATE_OVERFLOW_INSET");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("overflowInsetLeft", mIntBuffer[i++]);
          map.put("overflowInsetTop", mIntBuffer[i++]);
          map.put("overflowInsetRight", mIntBuffer[i++]);
          map.put("overflowInsetBottom", mIntBuffer[i++]);
        } else if (type == INSTRUCTION_UPDATE_EVENT_EMITTER) {
          map.put("type", "UPDATE_EVENT_EMITTER");
          map.put("reactTag", mIntBuffer[i++]);
          map.put("eventEmitter", castToEventEmitter(mObjBuffer[j++]));
        } else {
          throw new IllegalArgumentException(
                  "Invalid type argument to IntBufferBatchMountItem: " + type + " at index: " + i);
        }
        mutationsArray.add(map);
      }
    }

    surfaceMountingManager.getContext().getNativeModule(UIManagerModule.class).viewMutationsWillMount(mutationsArray);

    for (HashMap<String, Object> elem: mutationsArray) {
      if ("CREATE".equals(elem.get("type"))) {
        surfaceMountingManager.createView(
                (String)elem.get("componentName"),
                (int)elem.get("reactTag"),
                elem.get("props"),
                (StateWrapper)elem.get("stateWrapper"),
                (EventEmitterWrapper)elem.get("eventEmitterWrapper"),
                (boolean)elem.get("isLayoutable"));
      } else if ("DELETE".equals(elem.get("type"))) {
        surfaceMountingManager.deleteView((int)elem.get("reactTag"));
      } else if ("INSERT".equals(elem.get("type"))) {
        surfaceMountingManager.addViewAt((int)elem.get("parentTag"), (int)elem.get("tag"), (int)elem.get("index"));
      } else if ("REMOVE".equals(elem.get("type"))) {
        surfaceMountingManager.removeViewAt((int)elem.get("tag"), (int)elem.get("parentTag"), (int)elem.get("index"));
      } else if ("REMOVE_DELETE_TREE".equals(elem.get("type"))) {
        surfaceMountingManager.removeDeleteTreeAt(
                (int)elem.get("tag"), (int)elem.get("parentTag"), (int)elem.get("index"));
      } else if ("UPDATE_PROPS".equals(elem.get("type"))) {
        surfaceMountingManager.updateProps((int)elem.get("reactTag"), elem.get("props"));
      } else if ("UPDATE_STATE".equals(elem.get("type"))) {
        surfaceMountingManager.updateState((int)elem.get("reactTag"), (StateWrapper) elem.get("stateWrapper"));
      } else if ("UPDATE_LAYOUT".equals(elem.get("type"))) {
        surfaceMountingManager.updateLayout(
                (int)elem.get("reactTag"), (int)elem.get("parentTag"),
                (int)elem.get("x"), (int)elem.get("y"), (int)elem.get("width"),
                (int)elem.get("height"), (int)elem.get("displayType"));

      } else if ("UPDATE_PADDING".equals(elem.get("type"))) {
        surfaceMountingManager.updatePadding(
                (int)elem.get("reactTag"), (int)elem.get("left"), (int)elem.get("top"), (int)elem.get("right"), (int)elem.get("bottom"));
      } else if ("UPDATE_OVERFLOW_INSET".equals(elem.get("type"))) {
        surfaceMountingManager.updateOverflowInset(
                (int)elem.get("reactTag"), (int)elem.get("overflowInsetLeft"), (int)elem.get("overflowInsetTop")
                , (int)elem.get("overflowInsetRight"), (int)elem.get("overflowInsetBottom"));
      } else if ("UPDATE_EVENT_EMITTER".equals(elem.get("type"))) {
        surfaceMountingManager.updateEventEmitter(
                (int)elem.get("reactTag"), (EventEmitterWrapper) elem.get("eventEmitter"));
      } else {
        throw new IllegalArgumentException(
                "Invalid type argument to IntBufferBatchMountItem: " + elem.get("type"));
      }
    }

    endMarkers();
  }

  @Override
  public int getSurfaceId() {
    return mSurfaceId;
  }

  @Override
  public boolean isBatchEmpty() {
    return mIntBufferLen == 0;
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
                    ? (state != null ? state.toString() : "<null>")
                    : "<hidden>";
            s.append(String.format("UPDATE STATE [%d]: %s\n", mIntBuffer[i++], stateString));
          } else if (type == INSTRUCTION_UPDATE_LAYOUT) {
            int reactTag = mIntBuffer[i++];
            int parentTag = mIntBuffer[i++];
            s.append(
                String.format(
                    "UPDATE LAYOUT [%d]->[%d]: x:%d y:%d w:%d h:%d displayType:%d\n",
                    parentTag,
                    reactTag,
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
