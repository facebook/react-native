package com.facebook.react.uimanager;

import android.support.annotation.Nullable;
import android.util.SparseArray;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.rebound.BaseSpringSystem;
import com.facebook.rebound.Spring;
import com.facebook.rebound.SpringConfig;
import com.facebook.rebound.SpringLooper;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.atomic.AtomicLong;

/**
 */
public class AnimatedNodesManager {

  private static final int DEFAULT_ANIMATED_NODE_CHILD_COUNT = 1;

  private static class AnimatedNode {
    private @Nullable List<AnimatedNode> mChildren; /* lazy-initialized when child is added */
    private int mActiveIncomingNodes = 0;
    private boolean mEnqueued = false;
    public int mTag = -1;

    double mValue = Double.NaN;

    public void addChild(AnimatedNode child) {
      if (mChildren == null) {
        mChildren = new ArrayList<>(DEFAULT_ANIMATED_NODE_CHILD_COUNT);
      }
      Assertions.assertNotNull(mChildren).add(child);
    }

    public void removeChild(AnimatedNode child) {
      if (mChildren == null) {
        return;
      }
      mChildren.remove(child);
    }

    public void feedDataFromUpdatedParent(AnimatedNode parent) {
    }

    public void runAnimationStep(long frameTimeNanos) {
    }

    public void saveInPropMap(String key, SimpleMap propsMap) {
      propsMap.putDouble(key, mValue);
    }
  }

  private static class StyleAnimatedNode extends AnimatedNode {

    private final AnimatedNodesManager mNodesManager;
    private final Map<String, Integer> mPropMapping;

    StyleAnimatedNode(ReadableMap config, AnimatedNodesManager nodesManager) {
      ReadableMap style = config.getMap("style");
      ReadableMapKeySetIterator iter = style.keySetIterator();
      mPropMapping = new HashMap<>();
      while (iter.hasNextKey()) {
        String propKey = iter.nextKey();
        int nodeIndex = style.getInt(propKey);
        mPropMapping.put(propKey, nodeIndex);
      }
      mNodesManager = nodesManager;
    }

    @Override
    public void saveInPropMap(String key, SimpleMap propsMap) {
      /* ignore key, style names are flattened */
      for (String propKey : mPropMapping.keySet()) {
        // TODO: use entryset = optimize
        int nodeIndex = mPropMapping.get(propKey);
        AnimatedNode node = mNodesManager.mAnimatedNodes.get(nodeIndex);
        if (node != null) {
          node.saveInPropMap(propKey, propsMap);
        } else {
          throw new IllegalArgumentException("Mapped style node does not exists");
        }
      }
    }
  }

  private static class ValueAnimatedNode extends AnimatedNode {

    ValueAnimatedNode(ReadableMap config) {
      mValue = config.getDouble("value");
    }
  }

  private static class PropsAnimatedNode extends AnimatedNode {

    private int mConnectedViewTag = -1;
    private final AnimatedNodesManager mNodesManager;
    private final Map<String, Integer> mPropMapping;

    PropsAnimatedNode(ReadableMap config, AnimatedNodesManager nodesManager) {
      ReadableMap props = config.getMap("props");
      ReadableMapKeySetIterator iter = props.keySetIterator();
      mPropMapping = new HashMap<>();
      while (iter.hasNextKey()) {
        String propKey = iter.nextKey();
        int nodeIndex = props.getInt(propKey);
        mPropMapping.put(propKey, nodeIndex);
      }
      mNodesManager = nodesManager;
    }

    public UpdateViewData createUpdateViewData() {
      SimpleMap propsMap = new SimpleMap();
      for (String propKey : mPropMapping.keySet()) {
        // TODO: use entryset = optimize
        int nodeIndex = mPropMapping.get(propKey);
        AnimatedNode node = mNodesManager.mAnimatedNodes.get(nodeIndex);
        if (node != null) {
          node.saveInPropMap(propKey, propsMap);
        } else {
          throw new IllegalArgumentException("Mapped style node does not exists");
        }
      }
      return new UpdateViewData(mConnectedViewTag, propsMap);
    }
  }

  private static double[] fromDoubleArray(ReadableArray ary) {
    double[] res = new double[ary.size()];
    for (int i = 0; i < res.length; i++) {
      res[i] = ary.getDouble(i);
    }
    return res;
  }

  private static class InterpolationAnimatedNode extends AnimatedNode {

    private final double mInputRange[];
    private final double mOutputRange[];

    InterpolationAnimatedNode(ReadableMap config) {
      mInputRange = fromDoubleArray(config.getArray("inputRange"));
      mOutputRange = fromDoubleArray(config.getArray("outputRange"));
    }

    @Override
    public void feedDataFromUpdatedParent(AnimatedNode parent) {
      int rangeIndex = findRangeIndex(parent.mValue, mInputRange);
      mValue = interpolate(
        parent.mValue,
        mInputRange[rangeIndex],
        mInputRange[rangeIndex + 1],
        mOutputRange[rangeIndex],
        mOutputRange[rangeIndex + 1]);
    }

    private static double interpolate(
        double value,
        double inputMin,
        double inputMax,
        double outputMin,
        double outputMax) {
      return outputMin + (outputMax - outputMin) *
              (value - inputMin) / (inputMax - inputMin);
    }

    private static int findRangeIndex(double value, double[] ranges) {
      int index;
      for (index = 1; index < ranges.length - 1; index++) {
        if (ranges[index] >= value) {
          break;
        }
      }
      return index - 1;
    }
  }

  private static class AdditionAnimatedNode extends AnimatedNode {

    private final AnimatedNodesManager mNodesManager;
    private final int[] mInputNodes;

    AdditionAnimatedNode(ReadableMap config, AnimatedNodesManager nodesManager) {
      mNodesManager = nodesManager;
      ReadableArray inputNodes = config.getArray("input");
      mInputNodes = new int[inputNodes.size()];
      for (int i = 0; i < mInputNodes.length; i++) {
        mInputNodes[i] = inputNodes.getInt(i);
      }
    }

    @Override
    public void runAnimationStep(long frameTimeNanos) {
      mValue = 0;
      for (int i = 0; i < mInputNodes.length; i++) {
        mValue += mNodesManager.mAnimatedNodes.get(mInputNodes[i]).mValue;
      }
    }
  }

  private static class MultiplicationAnimatedNode extends AnimatedNode {
    private final AnimatedNodesManager mNodesManager;
    private final int[] mInputNodes;

    MultiplicationAnimatedNode(ReadableMap config, AnimatedNodesManager nodesManager) {
      mNodesManager = nodesManager;
      ReadableArray inputNodes = config.getArray("input");
      mInputNodes = new int[inputNodes.size()];
      for (int i = 0; i < mInputNodes.length; i++) {
        mInputNodes[i] = inputNodes.getInt(i);
      }
    }

    @Override
    public void runAnimationStep(long frameTimeNanos) {
      mValue = 1;
      for (int i = 0; i < mInputNodes.length; i++) {
        mValue *= mNodesManager.mAnimatedNodes.get(mInputNodes[i]).mValue;
      }
    }
  }

  private static class TransformAnimatedNode extends AnimatedNode {

    private final AnimatedNodesManager mNodesManager;
    private final Map<String, Integer> mPropMapping;
    private final Map<String, Object> mStaticProps;

    TransformAnimatedNode(ReadableMap config, AnimatedNodesManager nodesManager) {
      ReadableMap transforms = config.getMap("animated");
      ReadableMapKeySetIterator iter = transforms.keySetIterator();
      mPropMapping = new HashMap<>();
      while (iter.hasNextKey()) {
        String propKey = iter.nextKey();
        int nodeIndex = transforms.getInt(propKey);
        mPropMapping.put(propKey, nodeIndex);
      }
      ReadableMap statics = config.getMap("statics");
      iter = statics.keySetIterator();
      mStaticProps = new HashMap<>();
      while (iter.hasNextKey()) {
        String propKey = iter.nextKey();
        ReadableType type = statics.getType(propKey);
        switch (type) {
          case Number:
            mStaticProps.put(propKey, statics.getDouble(propKey));
            break;
          case Array:
            mStaticProps.put(propKey, SimpleArray.copy(statics.getArray(propKey)));
            break;
        }
      }
      mNodesManager = nodesManager;
    }

    @Override
    public void saveInPropMap(String key, SimpleMap propsMap) {
      /* ignore key, style names are flattened */
      SimpleMap transformMap = new SimpleMap();
      for (String propKey : mPropMapping.keySet()) {
        // TODO: use entryset = optimize
        int nodeIndex = mPropMapping.get(propKey);
        AnimatedNode node = mNodesManager.mAnimatedNodes.get(nodeIndex);
        if (node != null) {
          node.saveInPropMap(propKey, transformMap);
        } else {
          throw new IllegalArgumentException("Mapped style node does not exists");
        }
      }
      for (String propKey : mStaticProps.keySet()) {
        // TODO: use entryset = optimize
        Object value = mStaticProps.get(propKey);
        if (value instanceof Double) {
          transformMap.putDouble(propKey, (Double) value);
        } else if (value instanceof WritableArray) {
          transformMap.putArray(propKey, (WritableArray) value);
        }
      }
      propsMap.putMap("decomposedMatrix", transformMap);
    }
  }

  private static abstract class AnimationDriver {
    boolean mHasFinished = false;
    ValueAnimatedNode mAnimatedValue;
    Callback mEndCallback;
    public abstract boolean runAnimationStep(long frameTimeNanos);
  }

  private static class MySpringLooper extends SpringLooper {
    @Override
    public void start() {
    }

    @Override
    public void stop() {
    }
  }

  private static class MySpringSystem extends BaseSpringSystem {
    public MySpringSystem() {
      super(new MySpringLooper());
    }
  }

  private static class SpringAnimation extends AnimationDriver {

    private final BaseSpringSystem mSpringSystem;
    private final Spring mSpring;
    private long mLastTime;
    private boolean mSpringStarted;

    SpringAnimation(ReadableMap config) {
      boolean overshootClamping = config.getBoolean("overshootClamping");
      double restDisplacementThreshold = config.getDouble("restDisplacementThreshold");
      double restSpeedThreshold = config.getDouble("restSpeedThreshold");
      double tension = config.getDouble("tension");
      double friction = config.getDouble("friction");
//      double initialVelocity = config.getDouble("initialVelocity");
      double toValue = config.getDouble("toValue");

      mSpringSystem = new MySpringSystem();
      mSpring = mSpringSystem.createSpring()
              .setSpringConfig(new SpringConfig(tension, friction))
              .setEndValue(toValue)
//              .setVelocity(initialVelocity)
              .setOvershootClampingEnabled(overshootClamping)
              .setRestDisplacementThreshold(restDisplacementThreshold)
              .setRestSpeedThreshold(restSpeedThreshold);
    }

    @Override
    public boolean runAnimationStep(long frameTimeNanos) {
      long frameTimeMillis = frameTimeNanos / 1000000;
      if (!mSpringStarted) {
        mLastTime = frameTimeMillis;
        mSpring.setCurrentValue(mAnimatedValue.mValue, false);
        mSpringStarted = true;
      }
      long ts = frameTimeMillis - mLastTime;
//      Log.e("CAT", "Value " + mAnimatedValue.mValue + ", " + ts + ", " + frameTimeMillis);
      mSpringSystem.loop(frameTimeMillis - mLastTime);
      mLastTime = frameTimeMillis;
      mAnimatedValue.mValue = mSpring.getCurrentValue();
      mHasFinished = mSpring.isAtRest();
//      Log.e("CAT", "RUN SPRING " + ts + " cur " + mSpring.getCurrentValue() + ", " + mSpring.isAtRest() + ", " + mSpring.getEndValue());
      return true;
    }
  }

  private static class FrameBasedAnimation extends AnimationDriver {

    private long mStartFrameTimeNanos = -1;
    private final double[] mFrames;
    private final double mToValue;
    private double mFromValue;
    private boolean mHasToValue;

    FrameBasedAnimation(ReadableMap config) {
      ReadableArray frames = config.getArray("frames");
      int numberOfFrames = frames.size();
      mFrames = new double[numberOfFrames];
      for (int i = 0; i < numberOfFrames; i++) {
        mFrames[i] = frames.getDouble(i);
      }
      if (config.hasKey("toValue")) {
        mHasToValue = true;
        mToValue = config.getDouble("toValue");
      } else {
        mHasToValue = false;
        mToValue = Double.NaN;
      }
    }

    public boolean runAnimationStep(long frameTimeNanos) {
      if (mStartFrameTimeNanos < 0) {
        // start!
        mStartFrameTimeNanos = frameTimeNanos;
        mFromValue = mAnimatedValue.mValue;
      }
      long timeFromStartNanos = (frameTimeNanos - mStartFrameTimeNanos);
      int frameIndex = (int) (timeFromStartNanos / 1000000L / 16L);
      if (frameIndex < 0) {
        // weird, next time nanos is smaller than start time
        return false;
      } else if (!mHasFinished) {
        final double nextValue;
        if (frameIndex >= mFrames.length - 1) {
          // animation has ended!
          mHasFinished = true;
          if (mHasToValue) {
            nextValue = mToValue;
          } else {
            nextValue = mFromValue + mFrames[mFrames.length - 1];
          }
        } else if (mHasToValue) {
          nextValue = mFromValue + mFrames[frameIndex] * (mToValue - mFromValue);
        } else {
          nextValue = mFromValue + mFrames[frameIndex];
        }
        boolean updated = mAnimatedValue.mValue != nextValue;
        mAnimatedValue.mValue = nextValue;
        return updated;
      }
      return false;
    }
  }

  private static class UpdateViewData {
    int mViewTag;
    ReadableMap mProps;

    public UpdateViewData(int tag, ReadableMap props) {
      mViewTag = tag;
      mProps = props;
    }
  }

  private final SparseArray<AnimatedNode> mAnimatedNodes = new SparseArray<>();
  private final ArrayList<AnimationDriver> mActiveAnimations = new ArrayList<>();
  private final ArrayList<EventTracker> mActiveEventTrackers = new ArrayList<>();
  private final ArrayList<UpdateViewData> mEnqueuedUpdates = new ArrayList<>();
  private final ArrayList<AnimatedNode> mUpdatedNodes = new ArrayList<>();
  private final AnimatedFrameCallback mAnimatedFrameCallback;

  public AnimatedNodesManager(ReactContext reactContext) {
    mAnimatedFrameCallback = new AnimatedFrameCallback(reactContext);
  }

  public void createAnimatedNode(int tag, ReadableMap config) {
    if (mAnimatedNodes.get(tag) != null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + tag +
              " already exists");
    }
    String type = config.getString("type");
    final AnimatedNode node;
    if ("style".equals(type)) {
      node = new StyleAnimatedNode(config, this);
    } else if ("value".equals(type)) {
      node = new ValueAnimatedNode(config);
      mUpdatedNodes.add(node);
    } else if ("transform".equals(type)) {
      node = new TransformAnimatedNode(config, this);
    } else if ("interpolation".equals(type)) {
      node = new InterpolationAnimatedNode(config);
    } else if ("props".equals(type)) {
      node = new PropsAnimatedNode(config, this);
    } else if ("addition".equals(type)) {
      node = new AdditionAnimatedNode(config, this);
    } else if ("multiplication".equals(type)) {
      node = new MultiplicationAnimatedNode(config, this);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported node type: " + type);
    }
    node.mTag = tag;
    mAnimatedNodes.put(tag, node);
  }

  public void dropAnimatedNode(int tag) {
    mAnimatedNodes.remove(tag);
  }

  public void setAnimatedNodeValue(int tag, double value) {
    AnimatedNode node = mAnimatedNodes.get(tag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + tag +
        " does not exists");
    }
    node.mValue = value;
    mUpdatedNodes.add(node);
  }

  public void startAnimatingNode(
      int animatedNodeTag,
      ReadableMap animationConfig,
      Callback endCallback) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
              " does not exists");
    }
    if (!(node instanceof ValueAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node should be of type " +
              ValueAnimatedNode.class.getName());
    }
    String type = animationConfig.getString("type");
    final AnimationDriver animation;
    if ("frames".equals(type)) {
      animation = new FrameBasedAnimation(animationConfig);
    } else if ("spring".equals(type)) {
      animation = new SpringAnimation(animationConfig);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported animation type: " + type);
    }
    animation.mEndCallback = endCallback;
    animation.mAnimatedValue = (ValueAnimatedNode) node;
    mActiveAnimations.add(animation);
  }

  public void connectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + parentNodeTag +
              " does not exists");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + childNodeTag +
              " does not exists");
    }
    parentNode.addChild(childNode);
  }

  public void disconnectAnimatedNodes(int parentNodeTag, int childNodeTag) {
    AnimatedNode parentNode = mAnimatedNodes.get(parentNodeTag);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + parentNodeTag +
        " does not exists");
    }
    AnimatedNode childNode = mAnimatedNodes.get(childNodeTag);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + childNodeTag +
        " does not exists");
    }
    parentNode.removeChild(childNode);
  }

  public void connectAnimatedNodeToView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
              " does not exists");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
              "of type " + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    if (propsAnimatedNode.mConnectedViewTag != -1) {
      throw new JSApplicationIllegalArgumentException("ANimated node " + animatedNodeTag + " is " +
        "already attached to a view");
    }
    propsAnimatedNode.mConnectedViewTag = viewTag;
  }

  public void disconnectAnimatedNodeFromView(int animatedNodeTag, int viewTag) {
    AnimatedNode node = mAnimatedNodes.get(animatedNodeTag);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with tag " + animatedNodeTag +
        " does not exists");
    }
    if (!(node instanceof PropsAnimatedNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
        "of type " + PropsAnimatedNode.class.getName());
    }
    PropsAnimatedNode propsAnimatedNode = (PropsAnimatedNode) node;
    if (propsAnimatedNode.mConnectedViewTag == viewTag) {
      propsAnimatedNode.mConnectedViewTag = -1;
    }
  }

  private static class EventTracker {

    private final String mEventName;
    private final int mEventTargetViewTag;
    private final List<String> mPropsPath;
    private final AnimatedNodesManager mNodesManager;
    private final int mTargetAnimatedNode;

    EventTracker(
        AnimatedNodesManager nodesManager,
        String eventName,
        int eventTargetViewTag,
        int animatedNodeTag,
        List<String> propsPath) {
      mNodesManager = nodesManager;
      mEventName = eventName;
      mEventTargetViewTag = eventTargetViewTag;
      mPropsPath = propsPath;
      mTargetAnimatedNode = animatedNodeTag;
    }

    private void doTheMapping(ReadableMap from) {
      ReadableMap current = from;
      for (int i = 0; i < mPropsPath.size() - 1; i++) {
        String propName = mPropsPath.get(i);
        current = current.getMap(propName);
      }
      double value = current.getDouble(mPropsPath.get(mPropsPath.size() - 1));
      mNodesManager.setAnimatedNodeValue(mTargetAnimatedNode, value);
    }

    public void dispatchEvent(Event event) {
      event.dispatch(new RCTEventEmitter() {
        @Override
        public void receiveEvent(int targetTag, String eventName, WritableMap event) {
          if (event != null) {
            doTheMapping(event);
          }
        }

        @Override
        public void receiveTouches(
            String eventName,
            WritableArray touches,
            WritableArray changedIndices) {
          if (touches != null) {
            doTheMapping(touches.getMap(0));
          }
        }
      });

    }
  }

  public void connectEventToAnimatedNode(
    String eventName,
    int eventTargetViewTag,
    int animatedNodeTag,
    ReadableArray propsPath) {
    // FROM MAIN THREAD!!!!!
    List<String> props = new ArrayList<>(propsPath.size());
    for (int i = 0, size = propsPath.size(); i < size; i++) {
      props.add(propsPath.getString(i));
    }
    mActiveEventTrackers.add(
      new EventTracker(this, eventName, eventTargetViewTag, animatedNodeTag, props));
  }

  public void dispatchEvent(Event event) {
    // FROM UI THREAD!!!!
    for (int i = 0; i < mActiveEventTrackers.size(); i++) {
      EventTracker tracker = mActiveEventTrackers.get(i);
      if (tracker.mEventTargetViewTag == event.getViewTag()
        && tracker.mEventName.equals(event.getEventName())) {
        tracker.dispatchEvent(event);
      }
    }
  }

  public void runAnimationStep(long frameTimeNanos) {
    /* prepare */
    for (int i = 0; i < mAnimatedNodes.size(); i++) {
      AnimatedNode node = mAnimatedNodes.valueAt(i);
      node.mEnqueued = false;
      node.mActiveIncomingNodes = 0;
    }

    Queue<AnimatedNode> nodesQueue = new ArrayDeque<>();
    for (int i = 0; i < mUpdatedNodes.size(); i++) {
      AnimatedNode node = mUpdatedNodes.get(i);
      if (!node.mEnqueued) {
        node.mEnqueued = true;
        nodesQueue.add(node);
      }
    }

    List<AnimationDriver> finishedAnimations = null; /* lazy allocate this */
    for (int i = 0; i < mActiveAnimations.size(); i++) {
      AnimationDriver animation = mActiveAnimations.get(i);
      animation.runAnimationStep(frameTimeNanos);
      AnimatedNode valueNode = animation.mAnimatedValue;
      if (!valueNode.mEnqueued) {
        valueNode.mEnqueued = true;
        nodesQueue.add(valueNode);
      }
      if (animation.mHasFinished) {
        if (finishedAnimations == null) {
          finishedAnimations = new ArrayList<>();
        }
        finishedAnimations.add(animation);
      }
    }

    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      if (nextNode.mChildren != null) {
        for (int i = 0; i < nextNode.mChildren.size(); i++) {
          AnimatedNode child = nextNode.mChildren.get(i);
          child.mActiveIncomingNodes++;
          if (!child.mEnqueued) {
            child.mEnqueued = true;
            nodesQueue.add(child);
          }
        }
      }
    }

    nodesQueue.clear();
    for (int i = 0; i < mAnimatedNodes.size(); i++) {
      AnimatedNode node = mAnimatedNodes.valueAt(i);
      if (node.mEnqueued && node.mActiveIncomingNodes == 0) {
        node.mEnqueued = true;
        nodesQueue.add(node);
      } else {
        node.mEnqueued = false;
      }
    }
    /* run animations steps on animated nodes graph starting with active animations */

    ArrayList<PropsAnimatedNode> updatedPropNodes = new ArrayList<>();
    while (!nodesQueue.isEmpty()) {
      AnimatedNode nextNode = nodesQueue.poll();
      nextNode.runAnimationStep(frameTimeNanos);
      if (nextNode instanceof PropsAnimatedNode) {
        updatedPropNodes.add((PropsAnimatedNode) nextNode);
      }
      if (nextNode.mChildren != null) {
        for (int i = 0; i < nextNode.mChildren.size(); i++) {
          AnimatedNode child = nextNode.mChildren.get(i);
          child.feedDataFromUpdatedParent(nextNode);
          child.mActiveIncomingNodes--;
          if (!child.mEnqueued && child.mActiveIncomingNodes == 0) {
            child.mEnqueued = true;
            nodesQueue.add(child);
          }
        }
      }
    }

    /* collect updates */
    mEnqueuedUpdates.clear();
    for (int i = 0; i < updatedPropNodes.size(); i++) {
      PropsAnimatedNode propNode = updatedPropNodes.get(i);
      UpdateViewData data = propNode.createUpdateViewData();
      if (data.mViewTag > 0) {
        mEnqueuedUpdates.add(propNode.createUpdateViewData());
      }
    }

    /* cleanup finished animations */
    if (finishedAnimations != null && !finishedAnimations.isEmpty()) {
      for (int i = 0; i < finishedAnimations.size(); i++) {
        // TODO: do in O(1);
        AnimationDriver finishedAnimation = finishedAnimations.get(i);
        mActiveAnimations.remove(finishedAnimation);
        WritableMap endCallbackResponse = Arguments.createMap();
        endCallbackResponse.putBoolean("finished", true);
        finishedAnimation.mEndCallback.invoke(endCallbackResponse);
      }
    }
  }

  public void runUpdates(UIImplementation uiImplementation) {
    // Assert on native thread
    runAnimationStep(mLastFrameTimeNanos.get());
    for (int i = 0; i < mEnqueuedUpdates.size(); i++) {
      UpdateViewData data = mEnqueuedUpdates.get(i);
//      Log.e("CAT", "Update View " + data.mViewTag + ", " + data.mProps);
      uiImplementation.updateView(data.mViewTag, null, data.mProps);
    }
  }

  public void resumeFrameCallback() {
    ReactChoreographer.getInstance().postFrameCallback(
            ReactChoreographer.CallbackType.ANIMATIONS,
            mAnimatedFrameCallback);
  }

  public void pauseFrameCallback() {
    ReactChoreographer.getInstance().removeFrameCallback(
            ReactChoreographer.CallbackType.ANIMATIONS,
            mAnimatedFrameCallback);
  }

  private AtomicLong mLastFrameTimeNanos = new AtomicLong(0);

  private class AnimatedFrameCallback extends GuardedChoreographerFrameCallback {

    private final ReactContext mReactContext;

    protected AnimatedFrameCallback(ReactContext reactContext) {
      super(reactContext);
      mReactContext = reactContext;
    }

    @Override
    protected void doFrameGuarded(final long frameTimeNanos) {
      // It's too late for enqueueing UI updates for this frame
      mLastFrameTimeNanos.set(frameTimeNanos);
      // Enqueue runAnimationStep, this should ideally run on a separate thread
      mReactContext.runOnNativeModulesQueueThread(new Runnable() {
        @Override
        public void run() {
          mReactContext.getNativeModule(UIManagerModule.class).dispatchViewUpdatesIfNotInJSBatch();
        }
      });
      ReactChoreographer.getInstance().postFrameCallback(
              ReactChoreographer.CallbackType.ANIMATIONS,
              this);
    }
  }
}
