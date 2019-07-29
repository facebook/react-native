/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.uimanager;

import android.content.Context;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;
import com.facebook.yoga.YogaMeasureMode;
import java.util.Map;

/**
 * Class responsible for knowing how to create and update catalyst Views of a given type. It is also
 * responsible for creating and updating CSSNodeDEPRECATED subclasses used for calculating position
 * and size for the corresponding native view.
 */
@ReactPropertyHolder
public abstract class ViewManager<T extends View, C extends ReactShadowNode>
    extends BaseJavaModule {

  /**
   * For the vast majority of ViewManagers, you will not need to override this. Only override this
   * if you really know what you're doing and have a very unique use-case.
   *
   * @param viewToUpdate
   * @param props
   * @param stateWrapper
   */
  public void updateProperties(@NonNull T viewToUpdate, ReactStylesDiffMap props) {
    ViewManagerPropertyUpdater.updateProps(this, viewToUpdate, props);
    onAfterUpdateTransaction(viewToUpdate);
  }

  /** Creates a view and installs event emitters on it. */
  private final @NonNull T createView(
      @NonNull ThemedReactContext reactContext, JSResponderHandler jsResponderHandler) {
    return createView(reactContext, null, null, jsResponderHandler);
  }

  /** Creates a view with knowledge of props. */
  public @NonNull T createView(
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap props,
      @Nullable StateWrapper stateWrapper,
      JSResponderHandler jsResponderHandler) {
    T view = createViewInstance(reactContext, props, stateWrapper);
    addEventEmitters(reactContext, view);
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
   * view.
   *
   * @param reactContext
   */
  protected @NonNull T createViewInstance(
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap initialProps,
      @Nullable StateWrapper stateWrapper) {
    T view = createViewInstance(reactContext);
    if (initialProps != null) {
      updateProperties(view, initialProps);
    }
    return view;
  }

  /**
   * Called when view is detached from view hierarchy and allows for some additional cleanup by the
   * {@link ViewManager} subclass.
   */
  public void onDropViewInstance(@NonNull T view) {}

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
   * <p>TODO(7247021): Replace updateExtraData with generic update props mechanism after D2086999
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
  public void receiveCommand(@NonNull T root, String commandId, @Nullable ReadableArray args) {}

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

  public Map<String, String> getNativeProps() {
    return ViewManagerPropertyUpdater.getNativeProps(getClass(), getShadowNodeClass());
  }

  public @Nullable Object updateLocalData(
      @NonNull T view, ReactStylesDiffMap props, ReactStylesDiffMap localData) {
    return null;
  }

  /**
   * Subclasses can implement this method to receive state updates shared between all instances of
   * this component type.
   */
  public @Nullable Object updateState(
      @NonNull T view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    return null;
  }

  public long measure(
      Context context,
      ReadableMap localData,
      ReadableMap props,
      ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode) {
    return 0;
  }
}
