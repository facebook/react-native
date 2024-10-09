/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;
import com.facebook.yoga.YogaMeasureMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;

/**
 * Class responsible for knowing how to create and update catalyst Views of a given type. It is also
 * responsible for creating and updating CSSNodeDEPRECATED subclasses used for calculating position
 * and size for the corresponding native view.
 */
@ReactPropertyHolder
public abstract class ViewManager<T extends View, C extends ReactShadowNode>
    extends BaseJavaModule {

  private static final String NAME = ViewManager.class.getSimpleName();

  /**
   * For View recycling: we store a Stack of unused, dead Views. This is null by default, and when
   * null signals that View Recycling is disabled. `enableViewRecycling` must be explicitly called
   * in a concrete constructor to enable View Recycling per ViewManager.
   */
  @Nullable private HashMap<Integer, Stack<T>> mRecyclableViews = null;

  public ViewManager() {
    super(null);
  }

  public ViewManager(@Nullable ReactApplicationContext reactContext) {
    super(reactContext);
  }

  /** Call in constructor of concrete ViewManager class to enable. */
  protected void setupViewRecycling() {
    if (ReactFeatureFlags.enableViewRecycling) {
      mRecyclableViews = new HashMap<>();
    }
  }

  private @Nullable Stack<T> getRecyclableViewStack(int surfaceId) {
    if (mRecyclableViews == null) {
      return null;
    }
    if (!mRecyclableViews.containsKey(surfaceId)) {
      mRecyclableViews.put(surfaceId, new Stack<T>());
    }
    return mRecyclableViews.get(surfaceId);
  }

  /**
   * For the vast majority of ViewManagers, you will not need to override this. Only override this
   * if you really know what you're doing and have a very unique use-case.
   *
   * @param viewToUpdate {@link T} View instance that will be updated with the props received by
   *     parameter.
   * @param props {@link ReactStylesDiffMap} props to update the view with
   */
  public void updateProperties(@NonNull T viewToUpdate, ReactStylesDiffMap props) {
    final ViewManagerDelegate<T> delegate = getDelegate();
    if (delegate != null) {
      ViewManagerPropertyUpdater.updateProps(delegate, viewToUpdate, props);
    } else {
      ViewManagerPropertyUpdater.updateProps(this, viewToUpdate, props);
    }
    onAfterUpdateTransaction(viewToUpdate);
  }

  /**
   * Override this method and return an instance of {@link ViewManagerDelegate} if the props of the
   * view managed by this view manager should be set via this delegate. The provided instance will
   * then get calls to {@link ViewManagerDelegate#setProperty(View, String, Object)} for every prop
   * that must be updated and it's the delegate's responsibility to apply these values to the view.
   *
   * <p>By default this method returns {@code null}, which means that the view manager doesn't have
   * a delegate and the view props should be set internally by the view manager itself.
   *
   * @return an instance of {@link ViewManagerDelegate} if the props of the view managed by this
   *     view manager should be set via this delegate
   */
  @Nullable
  protected ViewManagerDelegate<T> getDelegate() {
    return null;
  }

  /** Creates a view with knowledge of props and state. */
  public @NonNull T createView(
      int reactTag,
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap props,
      @Nullable StateWrapper stateWrapper,
      JSResponderHandler jsResponderHandler) {
    T view = createViewInstance(reactTag, reactContext, props, stateWrapper);
    if (view instanceof ReactInterceptingViewGroup) {
      ((ReactInterceptingViewGroup) view).setOnInterceptTouchEventListener(jsResponderHandler);
    }
    return view;
  }

  /**
   * @return the name of this view manager. This will be the name used to reference this view
   *     manager from JavaScript in createReactNativeComponentClass.
   */
  public abstract @NonNull String getName();

  /**
   * This method should return a subclass of {@link ReactShadowNode} which will be then used for
   * measuring position and size of the view. In most of the cases this should just return an
   * instance of {@link ReactShadowNode}
   */
  public C createShadowNodeInstance() {
    throw new RuntimeException("ViewManager subclasses must implement createShadowNodeInstance()");
  }

  public @NonNull C createShadowNodeInstance(@NonNull ReactApplicationContext context) {
    return createShadowNodeInstance();
  }

  /**
   * This method should return {@link Class} instance that represent type of shadow node that this
   * manager will return from {@link #createShadowNodeInstance}.
   *
   * <p>This method will be used in the bridge initialization phase to collect properties exposed
   * using {@link ReactProp} (or {@link ReactPropGroup}) annotation from the {@link ReactShadowNode}
   * subclass specific for native view this manager provides.
   *
   * @return {@link Class} object that represents type of shadow node used by this view manager.
   */
  public abstract Class<? extends C> getShadowNodeClass();

  /**
   * Subclasses should return a new View instance of the proper type.
   *
   * @param reactContext
   */
  protected abstract @NonNull T createViewInstance(@NonNull ThemedReactContext reactContext);

  /**
   * Subclasses should return a new View instance of the proper type. This is an optional method
   * that will call createViewInstance for you. Override it if you need props upon creation of the
   * view, or state.
   *
   * <p>If you override this method, you *must* guarantee that you you're handling updateProperties,
   * view.setId, addEventEmitters, and updateState/updateExtraData properly!
   *
   * @param reactTag reactTag that should be set as ID of the view instance
   * @param reactContext ReactContext used to initialize view instance
   * @param initialProps initial props for the view instance
   * @param stateWrapper initial state for the view instance
   */
  protected @NonNull T createViewInstance(
      int reactTag,
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap initialProps,
      @Nullable StateWrapper stateWrapper) {
    T view = null;
    @Nullable Stack<T> recyclableViews = getRecyclableViewStack(reactContext.getSurfaceId());
    if (recyclableViews != null && !recyclableViews.empty()) {
      view = recycleView(reactContext, recyclableViews.pop());
    } else {
      view = createViewInstance(reactContext);
    }
    view.setId(reactTag);
    addEventEmitters(reactContext, view);
    if (initialProps != null) {
      updateProperties(view, initialProps);
    }
    // Only present in Fabric; but always present in Fabric.
    if (stateWrapper != null) {
      Object extraData = updateState(view, initialProps, stateWrapper);
      if (extraData != null) {
        updateExtraData(view, extraData);
      }
    }
    return view;
  }

  /**
   * Called when view is detached from view hierarchy and allows for some additional cleanup by the
   * {@link ViewManager} subclass.
   */
  public void onDropViewInstance(@NonNull T view) {
    // Some legacy components will return an Activity here instead of a ThemedReactContext
    Context viewContext = view.getContext();
    if (viewContext == null) {
      // Who knows! Anything is possible. Checking instanceof on null is an NPE,
      // So this is not redundant.
      FLog.e(NAME, "onDropViewInstance: view [" + view.getId() + "] has a null context");
      return;
    }
    if (!(viewContext instanceof ThemedReactContext)) {
      FLog.e(
          NAME,
          "onDropViewInstance: view ["
              + view.getId()
              + "] has a context that is not a ThemedReactContext: "
              + viewContext);
      return;
    }

    // View recycling
    ThemedReactContext themedReactContext = (ThemedReactContext) viewContext;
    int surfaceId = themedReactContext.getSurfaceId();
    @Nullable Stack<T> recyclableViews = getRecyclableViewStack(surfaceId);
    if (recyclableViews != null) {
      recyclableViews.push(prepareToRecycleView(themedReactContext, view));
    }
  }

  /**
   * Called when a View is removed from the hierarchy. This should be used to reset any properties.
   */
  protected T prepareToRecycleView(@NonNull ThemedReactContext reactContext, @NonNull T view) {
    return view;
  }

  /** Called when a View is going to be reused. */
  protected T recycleView(@NonNull ThemedReactContext reactContext, @NonNull T view) {
    return view;
  }

  /**
   * Subclasses can override this method to install custom event emitters on the given View. You
   * might want to override this method if your view needs to emit events besides basic touch events
   * to JS (e.g. scroll events).
   */
  protected void addEventEmitters(@NonNull ThemedReactContext reactContext, @NonNull T view) {}

  /**
   * Callback that will be triggered after all properties are updated in current update transaction
   * (all @ReactProp handlers for properties updated in current transaction have been called). If
   * you want to override this method you should call super.onAfterUpdateTransaction from it as the
   * parent class of the ViewManager may rely on callback being executed.
   */
  protected void onAfterUpdateTransaction(@NonNull T view) {}

  /**
   * Subclasses can implement this method to receive an optional extra data enqueued from the
   * corresponding instance of {@link ReactShadowNode} in {@link
   * ReactShadowNode#onCollectExtraUpdates}.
   *
   * <p>Since css layout step and ui updates can be executed in separate thread apart of setting
   * x/y/width/height this is the recommended and thread-safe way of passing extra data from css
   * node to the native view counterpart.
   *
   * <p>TODO T7247021: Replace updateExtraData with generic update props mechanism after D2086999
   */
  public abstract void updateExtraData(@NonNull T root, Object extraData);

  /**
   * Subclasses may use this method to receive events/commands directly from JS through the {@link
   * UIManager}. Good example of such a command would be {@code scrollTo} request with coordinates
   * for a {@link ScrollView} instance.
   *
   * <p>This method is deprecated use {@link #receiveCommand(View, String, ReadableArray)} instead.
   *
   * @param root View instance that should receive the command
   * @param commandId code of the command
   * @param args optional arguments for the command
   */
  @Deprecated
  public void receiveCommand(@NonNull T root, int commandId, @Nullable ReadableArray args) {}

  /**
   * Subclasses may use this method to receive events/commands directly from JS through the {@link
   * UIManager}. Good example of such a command would be {@code scrollTo} request with coordinates
   * for a {@link ReactScrollView} instance.
   *
   * @param root View instance that should receive the command
   * @param commandId code of the command
   * @param args optional arguments for the command
   */
  public void receiveCommand(@NonNull T root, String commandId, @Nullable ReadableArray args) {
    final ViewManagerDelegate<T> delegate = getDelegate();
    if (delegate != null) {
      delegate.receiveCommand(root, commandId, args);
    }
  }

  /**
   * Subclasses of {@link ViewManager} that expect to receive commands through {@link
   * UIManagerModule#dispatchViewManagerCommand} should override this method returning the map
   * between names of the commands and IDs that are then used in {@link #receiveCommand} method
   * whenever the command is dispatched for this particular {@link ViewManager}.
   *
   * @return map of string to int mapping of the expected commands
   */
  public @Nullable Map<String, Integer> getCommandsMap() {
    return null;
  }

  /**
   * Returns a map of config data passed to JS that defines eligible events that can be placed on
   * native views. This should return bubbling directly-dispatched event types and specify what
   * names should be used to subscribe to either form (bubbling/capturing).
   *
   * <p>Returned map should be of the form:
   *
   * <pre>
   * {
   *   "onTwirl": {
   *     "phasedRegistrationNames": {
   *       "bubbled": "onTwirl",
   *       "captured": "onTwirlCaptured"
   *     }
   *   }
   * }
   * </pre>
   */
  public @Nullable Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    return null;
  }

  /**
   * Returns a map of config data passed to JS that defines eligible events that can be placed on
   * native views. This should return non-bubbling directly-dispatched event types.
   *
   * <p>Returned map should be of the form:
   *
   * <pre>
   * {
   *   "onTwirl": {
   *     "registrationName": "onTwirl"
   *   }
   * }
   * </pre>
   */
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return null;
  }

  /**
   * Returns a map of view-specific constants that are injected to JavaScript. These constants are
   * made accessible via UIManager.<ViewName>.Constants.
   */
  public @Nullable Map<String, Object> getExportedViewConstants() {
    return null;
  }

  /**
   * Returns a {@link Map<String, String>} representing the native props of the view manager. The
   * Map contains the names (key) and types (value) of the ViewManager's props.
   */
  public Map<String, String> getNativeProps() {
    return ViewManagerPropertyUpdater.getNativeProps(getClass(), getShadowNodeClass());
  }

  /**
   * Subclasses can implement this method to receive state updates shared between all instances of
   * this component type.
   */
  public @Nullable Object updateState(
      @NonNull T view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    return null;
  }

  /**
   * Subclasses can override this method to implement custom measure functions for the ViewManager
   *
   * @param context {@link com.facebook.react.bridge.ReactContext} used for the view.
   * @param localData {@link ReadableMap} containing "local data" defined in C++
   * @param props {@link ReadableMap} containing JS props
   * @param state {@link ReadableMap} containing state defined in C++
   * @param width width of the view (usually zero)
   * @param widthMode widthMode used during calculation of layout
   * @param height height of the view (usually zero)
   * @param heightMode widthMode used during calculation of layout
   * @param attachmentsPositions {@link int[]} array containing 2x times the amount of attachments
   *     of the view. An attachment represents the position of an inline view that needs to be
   *     rendered inside a component and it requires the content of the parent view in order to be
   *     positioned. This array is meant to be used by the platform to RETURN the position of each
   *     attachment, as a result of the calculation of layout. (e.g. this array is used to measure
   *     inlineViews that are rendered inside Text components). On most of the components this array
   *     will be contain a null value.
   *     <p>Even values will represent the TOP of each attachment, Odd values represent the LEFT of
   *     each attachment.
   * @return result of calculation of layout for the arguments received as a parameter.
   */
  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    return 0;
  }

  /**
   * THIS MEASURE METHOD IS EXPERIMENTAL, MOST LIKELY YOU ARE LOOKING TO USE THE OTHER OVERLOAD
   * INSTEAD: {@link #measure(Context, ReadableMap, ReadableMap, ReadableMap, float,
   * YogaMeasureMode, float, YogaMeasureMode, float[])}
   *
   * <p>Subclasses can override this method to implement custom measure functions for the
   * ViewManager
   *
   * @param context {@link com.facebook.react.bridge.ReactContext} used for the view.
   * @param localData {@link MapBuffer} containing "local data" defined in C++
   * @param props {@link MapBuffer} containing JS props
   * @param state {@link MapBuffer} containing state defined in C++
   * @param width width of the view (usually zero)
   * @param widthMode widthMode used during calculation of layout
   * @param height height of the view (usually zero)
   * @param heightMode widthMode used during calculation of layout
   * @param attachmentsPositions {@link int[]} array containing 2x times the amount of attachments
   *     of the view. An attachment represents the position of an inline view that needs to be
   *     rendered inside a component and it requires the content of the parent view in order to be
   *     positioned. This array is meant to be used by the platform to RETURN the position of each
   *     attachment, as a result of the calculation of layout. (e.g. this array is used to measure
   *     inlineViews that are rendered inside Text components). On most of the components this array
   *     will be contain a null value.
   *     <p>Even values will represent the TOP of each attachment, Odd values represent the LEFT of
   *     each attachment.
   * @return result of calculation of layout for the arguments received as a parameter.
   */
  public long measure(
      Context context,
      MapBuffer localData,
      MapBuffer props,
      // TODO(T114731225): review whether state parameter is needed
      @Nullable MapBuffer state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    return 0;
  }

  /**
   * Subclasses can override this method to set padding for the given View in Fabric. Since not all
   * components support setting padding, the default implementation of this method does nothing.
   */
  public void setPadding(T view, int left, int top, int right, int bottom) {}

  /**
   * Lifecycle method: called when a surface is stopped. Currently only used for View Recycling
   * cleanup. There is no corresponding startSurface lifecycle event for ViewManagers because we
   * currently only need this for recycling cleanup. Only called in Fabric.
   */
  public void onSurfaceStopped(int surfaceId) {
    if (mRecyclableViews != null) {
      mRecyclableViews.remove(surfaceId);
    }
  }

  /** With even slight memory pressure, we immediately evict all recyclable Views. */
  /* package */ void trimMemory() {
    // Wipe out all existing recyclable Views, but do not disable View Recycling entirely.
    // We only take any action if View Recycling is already enabled.
    if (mRecyclableViews != null) {
      mRecyclableViews = new HashMap<>();
    }
  }
}
