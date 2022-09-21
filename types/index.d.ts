/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Definitions by: Eloy Durán <https://github.com/alloy>
//                 HuHuanming <https://github.com/huhuanming>
//                 Kyle Roach <https://github.com/iRoachie>
//                 Tim Wang <https://github.com/timwangdev>
//                 Kamal Mahyuddin <https://github.com/kamal>
//                 Alex Dunne <https://github.com/alexdunne>
//                 Manuel Alabor <https://github.com/swissmanu>
//                 Michele Bombardi <https://github.com/bm-software>
//                 Martin van Dam <https://github.com/mvdam>
//                 Kacper Wiszczuk <https://github.com/esemesek>
//                 Ryan Nickel <https://github.com/mrnickel>
//                 Souvik Ghosh <https://github.com/souvik-ghosh>
//                 Cheng Gibson <https://github.com/nossbigg>
//                 Saransh Kataria <https://github.com/saranshkataria>
//                 Wojciech Tyczynski <https://github.com/tykus160>
//                 Jake Bloom <https://github.com/jakebloom>
//                 Ceyhun Ozugur <https://github.com/ceyhun>
//                 Mike Martin <https://github.com/mcmar>
//                 Theo Henry de Villeneuve <https://github.com/theohdv>
//                 Romain Faust <https://github.com/romain-faust>
//                 Be Birchall <https://github.com/bebebebebe>
//                 Jesse Katsumata <https://github.com/Naturalclar>
//                 Xianming Zhong <https://github.com/chinesedfan>
//                 Valentyn Tolochko <https://github.com/vtolochk>
//                 Sergey Sychev <https://github.com/SychevSP>
//                 Kelvin Chu <https://github.com/RageBill>
//                 Daiki Ihara <https://github.com/sasurau4>
//                 Abe Dolinger <https://github.com/256hz>
//                 Dominique Richard <https://github.com/doumart>
//                 Mohamed Shaban <https://github.com/drmas>
//                 Jérémy Barbet <https://github.com/jeremybarbet>
//                 David Sheldrick <https://github.com/ds300>
//                 Natsathorn Yuthakovit <https://github.com/natsathorn>
//                 ConnectDotz <https://github.com/connectdotz>
//                 Alexey Molchan <https://github.com/alexeymolchan>
//                 Alex Brazier <https://github.com/alexbrazier>
//                 Arafat Zahan <https://github.com/kuasha420>
//                 Pedro Hernández <https://github.com/phvillegas>
//                 Sebastian Silbermann <https://github.com/eps1lon>
//                 Zihan Chen <https://github.com/ZihanChen-MSFT>
//                 Lorenzo Sciandra <https://github.com/kelset>
//                 Mateusz Wit <https://github.com/MateWW>
//                 Saad Najmi <https://github.com/saadnajmi>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// USING: these definitions are meant to be used with the TSC compiler target set to at least ES2015.
//
// USAGE EXAMPLES: check the RNTSExplorer project at https://github.com/bgrieder/RNTSExplorer
//
// CONTRIBUTING: please open pull requests
//
// CREDITS: This work is based on an original work made by Bernd Paradies: https://github.com/bparadie
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// <reference path="globals.d.ts" />
/// <reference path="legacy-properties.d.ts" />
/// <reference path="BatchedBridge.d.ts" />
/// <reference path="Codegen.d.ts" />
/// <reference path="Devtools.d.ts" />
/// <reference path="LaunchScreen.d.ts" />

import * as React from 'react';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type Constructor<T> = new (...args: any[]) => T;

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * EventSubscription represents a subscription to a particular event. It can
 * remove its own subscription.
 */
interface EventSubscription {
  eventType: string;
  key: number;
  subscriber: EventSubscriptionVendor;

  /**
   * @param subscriber the subscriber that controls
   *   this subscription.
   */
  new (subscriber: EventSubscriptionVendor): EventSubscription;

  /**
   * Removes this subscription from the subscriber that controls it.
   */
  remove(): void;
}

/**
 * EventSubscriptionVendor stores a set of EventSubscriptions that are
 * subscribed to a particular event type.
 */
declare class EventSubscriptionVendor {
  constructor();

  /**
   * Adds a subscription keyed by an event type.
   *
   */
  addSubscription(
    eventType: string,
    subscription: EventSubscription,
  ): EventSubscription;

  /**
   * Removes a bulk set of the subscriptions.
   *
   * @param eventType - Optional name of the event type whose
   *   registered supscriptions to remove, if null remove all subscriptions.
   */
  removeAllSubscriptions(eventType?: string): void;

  /**
   * Removes a specific subscription. Instead of calling this function, call
   * `subscription.remove()` directly.
   *
   */
  removeSubscription(subscription: any): void;

  /**
   * Returns the array of subscriptions that are currently registered for the
   * given event type.
   *
   * Note: This array can be potentially sparse as subscriptions are deleted
   * from it when they are removed.
   *
   */
  getSubscriptionsForType(eventType: string): EventSubscription[];
}

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
interface EmitterSubscription extends EventSubscription {
  emitter: EventEmitter;
  listener: () => any;
  context: any;

  /**
   * @param emitter - The event emitter that registered this
   *   subscription
   * @param subscriber - The subscriber that controls
   *   this subscription
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  new (
    emitter: EventEmitter,
    subscriber: EventSubscriptionVendor,
    listener: () => any,
    context: any,
  ): EmitterSubscription;

  /**
   * Removes this subscription from the emitter that registered it.
   * Note: we're overriding the `remove()` method of EventSubscription here
   * but deliberately not calling `super.remove()` as the responsibility
   * for removing the subscription lies with the EventEmitter.
   */
  remove(): void;
}

declare class EventEmitter {
  /**
   *
   * @param subscriber - Optional subscriber instance
   *   to use. If omitted, a new subscriber will be created for the emitter.
   */
  constructor(subscriber?: EventSubscriptionVendor | null);

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param eventType - Name of the event to listen to
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: (...args: any[]) => any,
    context?: any,
  ): EmitterSubscription;

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners(eventType?: string): void;

  /**
   * Returns the number of listeners that are currently registered for the given
   * event.
   *
   * @param eventType - Name of the event to query
   */
  listenerCount(eventType: string): number;

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   *
   * @param eventType - Name of the event to emit
   * @param Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.addListener('someEvent', function(message) {
   *     console.log(message);
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   */
  emit(eventType: string, ...params: any[]): void;
}

/**
 * NativeMethods provides methods to access the underlying native component directly.
 * This can be useful in cases when you want to focus a view or measure its on-screen dimensions,
 * for example.
 * The methods described here are available on most of the default components provided by React Native.
 * Note, however, that they are not available on composite components that aren't directly backed by a
 * native view. This will generally include most components that you define in your own app.
 * For more information, see [Direct Manipulation](https://reactnative.dev/docs/direct-manipulation).
 * @see https://github.com/facebook/react-native/blob/master/Libraries/Renderer/shims/ReactNativeTypes.js#L87
 */
export interface NativeMethods {
  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   */
  measure(callback: MeasureOnSuccessCallback): void;

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void;

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeComponentRef`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   * _Can also be called with a relativeNativeNodeHandle but is deprecated._
   */
  measureLayout(
    relativeToNativeComponentRef: HostComponent<unknown> | number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */,
  ): void;

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/direct-manipulation)).
   */
  setNativeProps(nativeProps: object): void;

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus(): void;

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur(): void;

  refs: {
    [key: string]: React.Component<any, any>;
  };
}

/**
 * @deprecated Use NativeMethods instead.
 */
export type NativeMethodsMixin = NativeMethods;
/**
 * @deprecated Use NativeMethods instead.
 */
export type NativeMethodsMixinType = NativeMethods;

/**
 * Represents a native component, such as those returned from `requireNativeComponent`.
 *
 * @see https://github.com/facebook/react-native/blob/v0.62.0-rc.5/Libraries/Renderer/shims/ReactNativeTypes.js
 *
 * @todo This should eventually be defined as an AbstractComponent, but that
 *       should first be introduced in the React typings.
 */
export interface HostComponent<P>
  extends Pick<
    React.ComponentClass<P>,
    Exclude<keyof React.ComponentClass<P>, 'new'>
  > {
  new (props: P, context?: any): React.Component<P> & Readonly<NativeMethods>;
}

// see react-jsx.d.ts
export function createElement<P>(
  type: React.ElementType,
  props?: P,
  ...children: React.ReactNode[]
): React.ReactElement<P>;

export type Runnable = (appParameters: any) => void;

type Task = (taskData: any) => Promise<void>;
type TaskProvider = () => Task;

type NodeHandle = number;

// Similar to React.SyntheticEvent except for nativeEvent
export interface NativeSyntheticEvent<T>
  extends React.BaseSyntheticEvent<T, NodeHandle, NodeHandle> {}

export interface NativeTouchEvent {
  /**
   * Array of all touch events that have changed since the last event
   */
  changedTouches: NativeTouchEvent[];

  /**
   * The ID of the touch
   */
  identifier: string;

  /**
   * The X position of the touch, relative to the element
   */
  locationX: number;

  /**
   * The Y position of the touch, relative to the element
   */
  locationY: number;

  /**
   * The X position of the touch, relative to the screen
   */
  pageX: number;

  /**
   * The Y position of the touch, relative to the screen
   */
  pageY: number;

  /**
   * The node id of the element receiving the touch event
   */
  target: string;

  /**
   * A time identifier for the touch, useful for velocity calculation
   */
  timestamp: number;

  /**
   * Array of all current touches on the screen
   */
  touches: NativeTouchEvent[];

  /**
   * 3D Touch reported force
   * @platform ios
   */
  force?: number | undefined;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
 */
export interface NativeUIEvent {
  /**
   * Returns a long with details about the event, depending on the event type.
   */
  readonly detail: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 */
export interface NativeMouseEvent extends NativeUIEvent {
  /**
   * The X coordinate of the mouse pointer in global (screen) coordinates.
   */
  readonly screenX: number;
  /**
   * The Y coordinate of the mouse pointer in global (screen) coordinates.
   */
  readonly screenY: number;
  /**
   * The X coordinate of the mouse pointer relative to the whole document.
   */
  readonly pageX: number;
  /**
   * The Y coordinate of the mouse pointer relative to the whole document.
   */
  readonly pageY: number;
  /**
   * The X coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  readonly clientX: number;
  /**
   * The Y coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  readonly clientY: number;
  /**
   * Alias for NativeMouseEvent.clientX
   */
  readonly x: number;
  /**
   * Alias for NativeMouseEvent.clientY
   */
  readonly y: number;
  /**
   * Returns true if the control key was down when the mouse event was fired.
   */
  readonly ctrlKey: boolean;
  /**
   * Returns true if the shift key was down when the mouse event was fired.
   */
  readonly shiftKey: boolean;
  /**
   * Returns true if the alt key was down when the mouse event was fired.
   */
  readonly altKey: boolean;
  /**
   * Returns true if the meta key was down when the mouse event was fired.
   */
  readonly metaKey: boolean;
  /**
   * The button number that was pressed (if applicable) when the mouse event was fired.
   */
  readonly button: number;
  /**
   * The buttons being depressed (if any) when the mouse event was fired.
   */
  readonly buttons: number;
  /**
   * The secondary target for the event, if there is one.
   */
  readonly relatedTarget:
    | null
    | number
    | React.ElementRef<HostComponent<unknown>>;
  // offset is proposed: https://drafts.csswg.org/cssom-view/#extensions-to-the-mouseevent-interface
  /**
   * The X coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  readonly offsetX: number;
  /**
   * The Y coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  readonly offsetY: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 */
export interface NativePointerEvent extends NativeMouseEvent {
  /**
   * A unique identifier for the pointer causing the event.
   */
  readonly pointerId: number;
  /**
   * The width (magnitude on the X axis), in CSS pixels, of the contact geometry of the pointer
   */
  readonly width: number;
  /**
   * The height (magnitude on the Y axis), in CSS pixels, of the contact geometry of the pointer.
   */
  readonly height: number;
  /**
   * The normalized pressure of the pointer input in the range 0 to 1, where 0 and 1 represent
   * the minimum and maximum pressure the hardware is capable of detecting, respectively.
   */
  readonly pressure: number;
  /**
   * The normalized tangential pressure of the pointer input (also known as barrel pressure or
   * cylinder stress) in the range -1 to 1, where 0 is the neutral position of the control.
   */
  readonly tangentialPressure: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the Y–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the Y axis.
   */
  readonly tiltX: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the X–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the X axis.
   */
  readonly tiltY: number;
  /**
   * The clockwise rotation of the pointer (e.g. pen stylus) around its major axis in degrees,
   * with a value in the range 0 to 359.
   */
  readonly twist: number;
  /**
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  readonly pointerType: string;
  /**
   * Indicates if the pointer represents the primary pointer of this pointer type.
   */
  readonly isPrimary: boolean;
}

export type PointerEvent = NativeSyntheticEvent<NativePointerEvent>;

export interface GestureResponderEvent
  extends NativeSyntheticEvent<NativeTouchEvent> {}

export interface MouseEvent extends NativeSyntheticEvent<NativeMouseEvent> {}

// See https://reactnative.dev/docs/scrollview#contentoffset
export interface PointProp {
  x: number;
  y: number;
}

export interface Insets {
  top?: number | undefined;
  left?: number | undefined;
  bottom?: number | undefined;
  right?: number | undefined;
}

export interface PressableStateCallbackType {
  readonly pressed: boolean;
}

export interface PressableAndroidRippleConfig {
  color?: null | ColorValue | undefined;
  borderless?: null | boolean | undefined;
  radius?: null | number | undefined;
  foreground?: null | boolean | undefined;
}

export interface PressableProps
  extends AccessibilityProps,
    Omit<ViewProps, 'children' | 'style' | 'hitSlop'> {
  /**
   * Called when the hover is activated to provide visual feedback.
   */
  onHoverIn?: null | ((event: MouseEvent) => void) | undefined;

  /**
   * Called when the hover is deactivated to undo visual feedback.
   */
  onHoverOut?: null | ((event: MouseEvent) => void) | undefined;

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a touch is engaged before `onPress`.
   */
  onPressIn?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a touch is released before `onPress`.
   */
  onPressOut?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when a long-tap gesture is detected.
   */
  onLongPress?: null | ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called after the element loses focus.
   * @platform macos windows
   */
  onBlur?:
    | null
    | ((event: NativeSyntheticEvent<TargetedEvent>) => void)
    | undefined;

  /**
   * Called after the element is focused.
   * @platform macos windows
   */
  onFocus?:
    | null
    | ((event: NativeSyntheticEvent<TargetedEvent>) => void)
    | undefined;

  /**
   * Either children or a render prop that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children?:
    | React.ReactNode
    | ((state: PressableStateCallbackType) => React.ReactNode)
    | undefined;

  /**
   * Whether a press gesture can be interrupted by a parent gesture such as a
   * scroll event. Defaults to true.
   */
  cancelable?: null | boolean | undefined;

  /**
   * Duration to wait after hover in before calling `onHoverIn`.
   * @platform macos windows
   */
  delayHoverIn?: number | null | undefined;

  /**
   * Duration to wait after hover out before calling `onHoverOut`.
   * @platform macos windows
   */
  delayHoverOut?: number | null | undefined;

  /**
   * Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
   */
  delayLongPress?: null | number | undefined;

  /**
   * Whether the press behavior is disabled.
   */
  disabled?: null | boolean | undefined;

  /**
   * Additional distance outside of this view in which a press is detected.
   */
  hitSlop?: null | Insets | number | undefined;

  /**
   * Additional distance outside of this view in which a touch is considered a
   * press before `onPressOut` is triggered.
   */
  pressRetentionOffset?: null | Insets | number | undefined;

  /**
   * If true, doesn't play system sound on touch.
   */
  android_disableSound?: null | boolean | undefined;

  /**
   * Enables the Android ripple effect and configures its color.
   */
  android_ripple?: null | PressableAndroidRippleConfig | undefined;

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: null | boolean | undefined;

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
    | undefined;

  /**
   * Duration (in milliseconds) to wait after press down before calling onPressIn.
   */
  unstable_pressDelay?: number;
}

// TODO use React.AbstractComponent when available
export const Pressable: React.ForwardRefExoticComponent<
  PressableProps & React.RefAttributes<View>
>;

/**
 * //FIXME: need to find documentation on which component is a TTouchable and can implement that interface
 * @see React.DOMAtributes
 */
export interface Touchable {
  onTouchStart?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchMove?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEnd?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchCancel?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEndCapture?: ((event: GestureResponderEvent) => void) | undefined;
}

export const Touchable: {
  TOUCH_TARGET_DEBUG: boolean;
  renderDebugView: (config: {
    color: string | number;
    hitSlop?: Insets | undefined;
  }) => React.ReactElement | null;
};

export interface PointerEvents {
  onPointerEnter?: ((event: PointerEvent) => void) | undefined;
  onPointerEnterCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerLeave?: ((event: PointerEvent) => void) | undefined;
  onPointerLeaveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerMove?: ((event: PointerEvent) => void) | undefined;
  onPointerMoveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerCancel?: ((event: PointerEvent) => void) | undefined;
  onPointerCancelCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerDown?: ((event: PointerEvent) => void) | undefined;
  onPointerDownCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerUp?: ((event: PointerEvent) => void) | undefined;
  onPointerUpCapture?: ((event: PointerEvent) => void) | undefined;
}

export type ComponentProvider = () => React.ComponentType<any>;

export type AppConfig = {
  appKey: string;
  component?: ComponentProvider | undefined;
  run?: Runnable | undefined;
};

// https://github.com/facebook/react-native/blob/master/Libraries/ReactNative/AppRegistry.js
/**
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * To "stop" an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * pass into `runApplication`. These should always be used as a pair.
 *
 * `AppRegistry` should be `require`d early in the `require` sequence to make
 * sure the JS execution environment is setup before other modules are
 * `require`d.
 */
export namespace AppRegistry {
  function registerConfig(config: AppConfig[]): void;

  function registerComponent(
    appKey: string,
    getComponentFunc: ComponentProvider,
  ): string;

  function registerRunnable(appKey: string, func: Runnable): string;

  function getAppKeys(): string[];

  function unmountApplicationComponentAtRootTag(rootTag: number): void;

  function runApplication(appKey: string, appParameters: any): void;

  function setSurfaceProps(
    appKey: string,
    appParameters: any,
    displayMode?: number,
  ): void;

  function registerHeadlessTask(appKey: string, task: TaskProvider): void;

  function getRunnable(appKey: string): Runnable | undefined;
}

export type LayoutAnimationType =
  | 'spring'
  | 'linear'
  | 'easeInEaseOut'
  | 'easeIn'
  | 'easeOut'
  | 'keyboard';

export type LayoutAnimationTypes = {
  [type in LayoutAnimationType]: type;
};

export type LayoutAnimationProperty =
  | 'opacity'
  | 'scaleX'
  | 'scaleY'
  | 'scaleXY';

export type LayoutAnimationProperties = {
  [prop in LayoutAnimationProperty]: prop;
};

export interface LayoutAnimationAnim {
  duration?: number | undefined;
  delay?: number | undefined;
  springDamping?: number | undefined;
  initialVelocity?: number | undefined;
  type?: LayoutAnimationType | undefined;
  property?: LayoutAnimationProperty | undefined;
}

export interface LayoutAnimationConfig {
  duration: number;
  create?: LayoutAnimationAnim | undefined;
  update?: LayoutAnimationAnim | undefined;
  delete?: LayoutAnimationAnim | undefined;
}

/** Automatically animates views to their new positions when the next layout happens.
 * A common way to use this API is to call LayoutAnimation.configureNext before
 * calling setState. */
export interface LayoutAnimationStatic {
  /** Schedules an animation to happen on the next layout.
   * @param config Specifies animation properties:
   * `duration` in milliseconds
   * `create`, config for animating in new views (see Anim type)
   * `update`, config for animating views that have been updated (see Anim type)
   * @param onAnimationDidEnd Called when the animation finished. Only supported on iOS.
   */
  configureNext: (
    config: LayoutAnimationConfig,
    onAnimationDidEnd?: () => void,
    onAnimationDidFail?: () => void,
  ) => void;
  /** Helper for creating a config for configureNext. */
  create: (
    duration: number,
    type?: LayoutAnimationType,
    creationProp?: LayoutAnimationProperty,
  ) => LayoutAnimationConfig;
  Types: LayoutAnimationTypes;
  Properties: LayoutAnimationProperties;
  configChecker: (shapeTypes: {[key: string]: any}) => any;
  Presets: {
    easeInEaseOut: LayoutAnimationConfig;
    linear: LayoutAnimationConfig;
    spring: LayoutAnimationConfig;
  };
  easeInEaseOut: (onAnimationDidEnd?: () => void) => void;
  linear: (onAnimationDidEnd?: () => void) => void;
  spring: (onAnimationDidEnd?: () => void) => void;
}

type FlexAlignType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

/**
 * Flex Prop Types
 * @see https://reactnative.dev/docs/flexbox
 * @see https://reactnative.dev/docs/layout-props
 */
export interface FlexStyle {
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | undefined;
  alignItems?: FlexAlignType | undefined;
  alignSelf?: 'auto' | FlexAlignType | undefined;
  aspectRatio?: number | undefined;
  borderBottomWidth?: number | undefined;
  borderEndWidth?: number | string | undefined;
  borderLeftWidth?: number | undefined;
  borderRightWidth?: number | undefined;
  borderStartWidth?: number | string | undefined;
  borderTopWidth?: number | undefined;
  borderWidth?: number | undefined;
  bottom?: number | string | undefined;
  display?: 'none' | 'flex' | undefined;
  end?: number | string | undefined;
  flex?: number | undefined;
  flexBasis?: number | string | undefined;
  flexDirection?:
    | 'row'
    | 'column'
    | 'row-reverse'
    | 'column-reverse'
    | undefined;
  flexGrow?: number | undefined;
  flexShrink?: number | undefined;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse' | undefined;
  height?: number | string | undefined;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | undefined;
  left?: number | string | undefined;
  margin?: number | string | undefined;
  marginBottom?: number | string | undefined;
  marginEnd?: number | string | undefined;
  marginHorizontal?: number | string | undefined;
  marginLeft?: number | string | undefined;
  marginRight?: number | string | undefined;
  marginStart?: number | string | undefined;
  marginTop?: number | string | undefined;
  marginVertical?: number | string | undefined;
  maxHeight?: number | string | undefined;
  maxWidth?: number | string | undefined;
  minHeight?: number | string | undefined;
  minWidth?: number | string | undefined;
  overflow?: 'visible' | 'hidden' | 'scroll' | undefined;
  padding?: number | string | undefined;
  paddingBottom?: number | string | undefined;
  paddingEnd?: number | string | undefined;
  paddingHorizontal?: number | string | undefined;
  paddingLeft?: number | string | undefined;
  paddingRight?: number | string | undefined;
  paddingStart?: number | string | undefined;
  paddingTop?: number | string | undefined;
  paddingVertical?: number | string | undefined;
  position?: 'absolute' | 'relative' | undefined;
  right?: number | string | undefined;
  start?: number | string | undefined;
  top?: number | string | undefined;
  width?: number | string | undefined;
  zIndex?: number | undefined;

  /**
   * @platform ios
   */
  direction?: 'inherit' | 'ltr' | 'rtl' | undefined;
}

/**
 * @see ShadowPropTypesIOS.js
 */
export interface ShadowPropTypesIOSStatic {
  /**
   * Sets the drop shadow color
   * @platform ios
   */
  shadowColor: ColorValue;

  /**
   * Sets the drop shadow offset
   * @platform ios
   */
  shadowOffset: {width: number; height: number};

  /**
   * Sets the drop shadow opacity (multiplied by the color's alpha component)
   * @platform ios
   */
  shadowOpacity: number;

  /**
   * Sets the drop shadow blur radius
   * @platform ios
   */
  shadowRadius: number;
}

interface PerpectiveTransform {
  perspective: number;
}

interface RotateTransform {
  rotate: string;
}

interface RotateXTransform {
  rotateX: string;
}

interface RotateYTransform {
  rotateY: string;
}

interface RotateZTransform {
  rotateZ: string;
}

interface ScaleTransform {
  scale: number;
}

interface ScaleXTransform {
  scaleX: number;
}

interface ScaleYTransform {
  scaleY: number;
}

interface TranslateXTransform {
  translateX: number;
}

interface TranslateYTransform {
  translateY: number;
}

interface SkewXTransform {
  skewX: string;
}

interface SkewYTransform {
  skewY: string;
}

interface MatrixTransform {
  matrix: number[];
}

export interface TransformsStyle {
  transform?:
    | (
        | PerpectiveTransform
        | RotateTransform
        | RotateXTransform
        | RotateYTransform
        | RotateZTransform
        | ScaleTransform
        | ScaleXTransform
        | ScaleYTransform
        | TranslateXTransform
        | TranslateYTransform
        | SkewXTransform
        | SkewYTransform
        | MatrixTransform
      )[]
    | undefined;
  /**
   * @deprecated Use matrix in transform prop instead.
   */
  transformMatrix?: Array<number> | undefined;
  /**
   * @deprecated Use rotate in transform prop instead.
   */
  rotation?: number | undefined;
  /**
   * @deprecated Use scaleX in transform prop instead.
   */
  scaleX?: number | undefined;
  /**
   * @deprecated Use scaleY in transform prop instead.
   */
  scaleY?: number | undefined;
  /**
   * @deprecated Use translateX in transform prop instead.
   */
  translateX?: number | undefined;
  /**
   * @deprecated Use translateY in transform prop instead.
   */
  translateY?: number | undefined;
}

export interface StyleSheetProperties {
  hairlineWidth: number;
  flatten<T extends string>(style: T): T;
}

export interface LayoutRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// @see TextProps.onLayout
export type LayoutChangeEvent = NativeSyntheticEvent<{layout: LayoutRectangle}>;

interface TextLayoutLine {
  ascender: number;
  capHeight: number;
  descender: number;
  height: number;
  text: string;
  width: number;
  x: number;
  xHeight: number;
  y: number;
}

/**
 * @see TextProps.onTextLayout
 */
export interface TextLayoutEventData extends TargetedEvent {
  lines: TextLayoutLine[];
}

export type FontVariant =
  | 'small-caps'
  | 'oldstyle-nums'
  | 'lining-nums'
  | 'tabular-nums'
  | 'proportional-nums';
export interface TextStyleIOS extends ViewStyle {
  fontVariant?: FontVariant[] | undefined;
  letterSpacing?: number | undefined;
  textDecorationColor?: ColorValue | undefined;
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | undefined;
  writingDirection?: 'auto' | 'ltr' | 'rtl' | undefined;
}

export interface TextStyleAndroid extends ViewStyle {
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined;
  includeFontPadding?: boolean | undefined;
}

// @see https://reactnative.dev/docs/text#style
export interface TextStyle extends TextStyleIOS, TextStyleAndroid, ViewStyle {
  color?: ColorValue | undefined;
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  fontStyle?: 'normal' | 'italic' | undefined;
  /**
   * Specifies font weight. The values 'normal' and 'bold' are supported
   * for most fonts. Not all fonts have a variant for each of the numeric
   * values, in that case the closest one is chosen.
   */
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | undefined;
  letterSpacing?: number | undefined;
  lineHeight?: number | undefined;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify' | undefined;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | undefined;
  textDecorationColor?: ColorValue | undefined;
  textShadowColor?: ColorValue | undefined;
  textShadowOffset?: {width: number; height: number} | undefined;
  textShadowRadius?: number | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  testID?: string | undefined;
}

export interface TextPropsIOS {
  /**
   * Specifies whether font should be scaled down automatically to fit given style constraints.
   */
  adjustsFontSizeToFit?: boolean | undefined;

  /**
   * Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0).
   */
  minimumFontScale?: number | undefined;

  /**
   * When `true`, no visual change is made when text is pressed down. By
   * default, a gray oval highlights the text on press down.
   */
  suppressHighlighting?: boolean | undefined;
}

export interface TextPropsAndroid {
  /**
   * Lets the user select text, to use the native copy and paste functionality.
   */
  selectable?: boolean | undefined;

  /**
   * The highlight color of the text.
   */
  selectionColor?: ColorValue | undefined;

  /**
   * Set text break strategy on Android API Level 23+
   * default is `highQuality`.
   */
  textBreakStrategy?: 'simple' | 'highQuality' | 'balanced' | undefined;

  /**
   * Determines the types of data converted to clickable URLs in the text element.
   * By default no data types are detected.
   */
  dataDetectorType?:
    | null
    | 'phoneNumber'
    | 'link'
    | 'email'
    | 'none'
    | 'all'
    | undefined;

  /**
   * Hyphenation strategy
   */
  android_hyphenationFrequency?: 'normal' | 'none' | 'full' | undefined;
}

// https://reactnative.dev/docs/text#props
export interface TextProps
  extends TextPropsIOS,
    TextPropsAndroid,
    AccessibilityProps {
  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings.
   * The default is `true`.
   */
  allowFontScaling?: boolean | undefined;

  children?: React.ReactNode;

  /**
   * This can be one of the following values:
   *
   * - `head` - The line is displayed so that the end fits in the container and the missing text
   * at the beginning of the line is indicated by an ellipsis glyph. e.g., "...wxyz"
   * - `middle` - The line is displayed so that the beginning and end fit in the container and the
   * missing text in the middle is indicated by an ellipsis glyph. "ab...yz"
   * - `tail` - The line is displayed so that the beginning fits in the container and the
   * missing text at the end of the line is indicated by an ellipsis glyph. e.g., "abcd..."
   * - `clip` - Lines are not drawn past the edge of the text container.
   *
   * The default is `tail`.
   *
   * `numberOfLines` must be set in conjunction with this prop.
   *
   * > `clip` is working only for iOS
   */
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * Line Break mode. Works only with numberOfLines.
   * clip is working only for iOS
   */
  lineBreakMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;

  /**
   * Used to truncate the text with an ellipsis after computing the text
   * layout, including line wrapping, such that the total number of lines
   * does not exceed this number.
   *
   * This prop is commonly used with `ellipsizeMode`.
   */
  numberOfLines?: number | undefined;

  /**
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * Invoked on Text layout
   */
  onTextLayout?:
    | ((event: NativeSyntheticEvent<TextLayoutEventData>) => void)
    | undefined;

  /**
   * This function is called on press.
   * Text intrinsically supports press handling with a default highlight state (which can be disabled with suppressHighlighting).
   */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;

  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;
  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * This function is called on long press.
   * e.g., `onLongPress={this.increaseSize}>``
   */
  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * @see https://reactnative.dev/docs/text#style
   */
  style?: StyleProp<TextStyle> | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  nativeID?: string | undefined;

  /**
   * Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values:
   * - null/undefined (default): inherit from the parent node or the global default (0)
   * - 0: no max, ignore parent/global default
   * - >= 1: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: number | null | undefined;
}

/**
 * A React component for displaying text which supports nesting, styling, and touch handling.
 */
declare class TextComponent extends React.Component<TextProps> {}
declare const TextBase: Constructor<NativeMethods> & typeof TextComponent;
export class Text extends TextBase {}

type DataDetectorTypes =
  | 'phoneNumber'
  | 'link'
  | 'address'
  | 'calendarEvent'
  | 'none'
  | 'all';

/**
 * DocumentSelectionState is responsible for maintaining selection information
 * for a document.
 *
 * It is intended for use by AbstractTextEditor-based components for
 * identifying the appropriate start/end positions to modify the
 * DocumentContent, and for programmatically setting browser selection when
 * components re-render.
 */
export interface DocumentSelectionState extends EventEmitter {
  new (anchor: number, focus: number): DocumentSelectionState;

  /**
   * Apply an update to the state. If either offset value has changed,
   * set the values and emit the `change` event. Otherwise no-op.
   *
   */
  update(anchor: number, focus: number): void;

  /**
   * Given a max text length, constrain our selection offsets to ensure
   * that the selection remains strictly within the text range.
   *
   */
  constrainLength(maxLength: number): void;

  focus(): void;
  blur(): void;
  hasFocus(): boolean;
  isCollapsed(): boolean;
  isBackward(): boolean;

  getAnchorOffset(): number;
  getFocusOffset(): number;
  getStartOffset(): number;
  getEndOffset(): number;
  overlaps(start: number, end: number): boolean;
}

/**
 * IOS Specific properties for TextInput
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputIOSProps {
  /**
   * enum('never', 'while-editing', 'unless-editing', 'always')
   * When the clear button should appear on the right side of the text view
   */
  clearButtonMode?:
    | 'never'
    | 'while-editing'
    | 'unless-editing'
    | 'always'
    | undefined;

  /**
   * If true, clears the text field automatically when editing begins
   */
  clearTextOnFocus?: boolean | undefined;

  /**
   * Determines the types of data converted to clickable URLs in the text input.
   * Only valid if `multiline={true}` and `editable={false}`.
   * By default no data types are detected.
   *
   * You can provide one type or an array of many types.
   *
   * Possible values for `dataDetectorTypes` are:
   *
   * - `'phoneNumber'`
   * - `'link'`
   * - `'address'`
   * - `'calendarEvent'`
   * - `'none'`
   * - `'all'`
   */
  dataDetectorTypes?: DataDetectorTypes | DataDetectorTypes[] | undefined;

  /**
   * If true, the keyboard disables the return key when there is no text and automatically enables it when there is text.
   * The default value is false.
   */
  enablesReturnKeyAutomatically?: boolean | undefined;

  /**
   * Determines the color of the keyboard.
   */
  keyboardAppearance?: 'default' | 'light' | 'dark' | undefined;

  /**
   * Provide rules for your password.
   * For example, say you want to require a password with at least eight characters consisting of a mix of uppercase and lowercase letters, at least one number, and at most two consecutive characters.
   * "required: upper; required: lower; required: digit; max-consecutive: 2; minlength: 8;"
   */
  passwordRules?: string | null | undefined;

  /**
   * If `true`, allows TextInput to pass touch events to the parent component.
   * This allows components to be swipeable from the TextInput on iOS,
   * as is the case on Android by default.
   * If `false`, TextInput always asks to handle the input (except when disabled).
   */
  rejectResponderTermination?: boolean | null | undefined;

  /**
   * See DocumentSelectionState.js, some state that is responsible for maintaining selection information for a document
   */
  selectionState?: DocumentSelectionState | undefined;

  /**
   * If false, disables spell-check style (i.e. red underlines). The default value is inherited from autoCorrect
   */
  spellCheck?: boolean | undefined;

  /**
   * Give the keyboard and the system information about the expected
   * semantic meaning for the content that users enter.
   *
   * For iOS 11+ you can set `textContentType` to `username` or `password` to
   * enable autofill of login details from the device keychain.
   *
   * For iOS 12+ `newPassword` can be used to indicate a new password input the
   * user may want to save in the keychain, and `oneTimeCode` can be used to indicate
   * that a field can be autofilled by a code arriving in an SMS.
   *
   * To disable autofill, set textContentType to `none`.
   *
   * Possible values for `textContentType` are:
   *
   *  - `'none'`
   *  - `'URL'`
   *  - `'addressCity'`
   *  - `'addressCityAndState'`
   *  - `'addressState'`
   *  - `'countryName'`
   *  - `'creditCardNumber'`
   *  - `'emailAddress'`
   *  - `'familyName'`
   *  - `'fullStreetAddress'`
   *  - `'givenName'`
   *  - `'jobTitle'`
   *  - `'location'`
   *  - `'middleName'`
   *  - `'name'`
   *  - `'namePrefix'`
   *  - `'nameSuffix'`
   *  - `'nickname'`
   *  - `'organizationName'`
   *  - `'postalCode'`
   *  - `'streetAddressLine1'`
   *  - `'streetAddressLine2'`
   *  - `'sublocality'`
   *  - `'telephoneNumber'`
   *  - `'username'`
   *  - `'password'`
   *  - `'newPassword'`
   *  - `'oneTimeCode'`
   *
   */
  textContentType?:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode'
    | undefined;

  /**
   * If false, scrolling of the text view will be disabled. The default value is true. Only works with multiline={true}
   */
  scrollEnabled?: boolean | undefined;
}

/**
 * Android Specific properties for TextInput
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputAndroidProps {
  /**
   * Specifies autocomplete hints for the system, so it can provide autofill. On Android, the system will always attempt to offer autofill by using heuristics to identify the type of content.
   * To disable autocomplete, set `autoComplete` to `off`.
   *
   * *Android Only*
   *
   * Possible values for `autoComplete` are:
   *
   * - `birthdate-day`
   * - `birthdate-full`
   * - `birthdate-month`
   * - `birthdate-year`
   * - `cc-csc`
   * - `cc-exp`
   * - `cc-exp-day`
   * - `cc-exp-month`
   * - `cc-exp-year`
   * - `cc-number`
   * - `email`
   * - `gender`
   * - `name`
   * - `name-family`
   * - `name-given`
   * - `name-middle`
   * - `name-middle-initial`
   * - `name-prefix`
   * - `name-suffix`
   * - `password`
   * - `password-new`
   * - `postal-address`
   * - `postal-address-country`
   * - `postal-address-extended`
   * - `postal-address-extended-postal-code`
   * - `postal-address-locality`
   * - `postal-address-region`
   * - `postal-code`
   * - `street-address`
   * - `sms-otp`
   * - `tel`
   * - `tel-country-code`
   * - `tel-national`
   * - `tel-device`
   * - `username`
   * - `username-new`
   * - `off`
   */
  autoComplete?:
    | 'birthdate-day'
    | 'birthdate-full'
    | 'birthdate-month'
    | 'birthdate-year'
    | 'cc-csc'
    | 'cc-exp'
    | 'cc-exp-day'
    | 'cc-exp-month'
    | 'cc-exp-year'
    | 'cc-number'
    | 'email'
    | 'gender'
    | 'name'
    | 'name-family'
    | 'name-given'
    | 'name-middle'
    | 'name-middle-initial'
    | 'name-prefix'
    | 'name-suffix'
    | 'password'
    | 'password-new'
    | 'postal-address'
    | 'postal-address-country'
    | 'postal-address-extended'
    | 'postal-address-extended-postal-code'
    | 'postal-address-locality'
    | 'postal-address-region'
    | 'postal-code'
    | 'street-address'
    | 'sms-otp'
    | 'tel'
    | 'tel-country-code'
    | 'tel-national'
    | 'tel-device'
    | 'username'
    | 'username-new'
    | 'off'
    | undefined;

  /**
   * When provided it will set the color of the cursor (or "caret") in the component.
   * Unlike the behavior of `selectionColor` the cursor color will be set independently
   * from the color of the text selection box.
   * @platform android
   */
  cursorColor?: ColorValue | null | undefined;

  /**
   * Determines whether the individual fields in your app should be included in a
   * view structure for autofill purposes on Android API Level 26+. Defaults to auto.
   * To disable auto complete, use `off`.
   *
   * *Android Only*
   *
   * The following values work on Android only:
   *
   * - `auto` - let Android decide
   * - `no` - not important for autofill
   * - `noExcludeDescendants` - this view and its children aren't important for autofill
   * - `yes` - is important for autofill
   * - `yesExcludeDescendants` - this view is important for autofill but its children aren't
   */
  importantForAutofill?:
    | 'auto'
    | 'no'
    | 'noExcludeDescendants'
    | 'yes'
    | 'yesExcludeDescendants'
    | undefined;

  /**
   * When false, if there is a small amount of space available around a text input (e.g. landscape orientation on a phone),
   *   the OS may choose to have the user edit the text inside of a full screen text input mode.
   * When true, this feature is disabled and users will always edit the text directly inside of the text input.
   * Defaults to false.
   */
  disableFullscreenUI?: boolean | undefined;

  /**
   * If defined, the provided image resource will be rendered on the left.
   */
  inlineImageLeft?: string | undefined;

  /**
   * Padding between the inline image, if any, and the text input itself.
   */
  inlineImagePadding?: number | undefined;

  /**
   * Sets the number of lines for a TextInput.
   * Use it with multiline set to true to be able to fill the lines.
   */
  numberOfLines?: number | undefined;

  /**
   * Sets the return key to the label. Use it instead of `returnKeyType`.
   * @platform android
   */
  returnKeyLabel?: string | undefined;

  /**
   * Set text break strategy on Android API Level 23+, possible values are simple, highQuality, balanced
   * The default value is simple.
   */
  textBreakStrategy?: 'simple' | 'highQuality' | 'balanced' | undefined;

  /**
   * The color of the textInput underline.
   */
  underlineColorAndroid?: ColorValue | undefined;

  /**
   * Vertically align text when `multiline` is set to true
   */
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined;

  /**
   * When false, it will prevent the soft keyboard from showing when the field is focused. The default value is true
   */
  showSoftInputOnFocus?: boolean | undefined;
}

export type KeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad';
export type KeyboardTypeIOS =
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'url'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search';
export type KeyboardTypeAndroid = 'visible-password';
export type KeyboardTypeOptions =
  | KeyboardType
  | KeyboardTypeAndroid
  | KeyboardTypeIOS;

export type ReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send';
export type ReturnKeyTypeAndroid = 'none' | 'previous';
export type ReturnKeyTypeIOS =
  | 'default'
  | 'google'
  | 'join'
  | 'route'
  | 'yahoo'
  | 'emergency-call';
export type ReturnKeyTypeOptions =
  | ReturnKeyType
  | ReturnKeyTypeAndroid
  | ReturnKeyTypeIOS;

export interface TargetedEvent {
  target: number;
}

/**
 * @see TextInputProps.onFocus
 */
export interface TextInputFocusEventData extends TargetedEvent {
  text: string;
  eventCount: number;
}

/**
 * @see TextInputProps.onScroll
 */
export interface TextInputScrollEventData {
  contentOffset: {x: number; y: number};
}

/**
 * @see TextInputProps.onSelectionChange
 */
export interface TextInputSelectionChangeEventData extends TargetedEvent {
  selection: {
    start: number;
    end: number;
  };
}

/**
 * @see TextInputProps.onKeyPress
 */
export interface TextInputKeyPressEventData {
  key: string;
}

/**
 * @see TextInputProps.onChange
 */
export interface TextInputChangeEventData extends TargetedEvent {
  eventCount: number;
  text: string;
}

/**
 * @see TextInputProps.onContentSizeChange
 */
export interface TextInputContentSizeChangeEventData {
  contentSize: {width: number; height: number};
}

/**
 * @see TextInputProps.onEndEditing
 */
export interface TextInputEndEditingEventData {
  text: string;
}

/**
 * @see TextInputProps.onSubmitEditing
 */
export interface TextInputSubmitEditingEventData {
  text: string;
}

/**
 * @see TextInputProps.onTextInput
 */
export interface TextInputTextInputEventData {
  text: string;
  previousText: string;
  range: {start: number; end: number};
}

/**
 * @see https://reactnative.dev/docs/textinput#props
 */
export interface TextInputProps
  extends ViewProps,
    TextInputIOSProps,
    TextInputAndroidProps,
    AccessibilityProps {
  /**
   * Specifies whether fonts should scale to respect Text Size accessibility settings.
   * The default is `true`.
   */
  allowFontScaling?: boolean | undefined;

  /**
   * Can tell TextInput to automatically capitalize certain characters.
   *      characters: all characters,
   *      words: first letter of each word
   *      sentences: first letter of each sentence (default)
   *      none: don't auto capitalize anything
   *
   * https://reactnative.dev/docs/textinput#autocapitalize
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;

  /**
   * If false, disables auto-correct.
   * The default value is true.
   */
  autoCorrect?: boolean | undefined;

  /**
   * If true, focuses the input on componentDidMount.
   * The default value is false.
   */
  autoFocus?: boolean | undefined;

  /**
   * If true, the text field will blur when submitted.
   * The default value is true.
   */
  blurOnSubmit?: boolean | undefined;

  /**
   * If true, caret is hidden. The default value is false.
   */
  caretHidden?: boolean | undefined;

  /**
   * If true, context menu is hidden. The default value is false.
   */
  contextMenuHidden?: boolean | undefined;

  /**
   * Provides an initial value that will change when the user starts typing.
   * Useful for simple use-cases where you don't want to deal with listening to events
   * and updating the value prop to keep the controlled state in sync.
   */
  defaultValue?: string | undefined;

  /**
   * If false, text is not editable. The default value is true.
   */
  editable?: boolean | undefined;

  /**
   * enum("default", 'numeric', 'email-address', "ascii-capable", 'numbers-and-punctuation', 'url', 'number-pad', 'phone-pad', 'name-phone-pad',
   * 'decimal-pad', 'twitter', 'web-search', 'visible-password')
   * Determines which keyboard to open, e.g.numeric.
   * The following values work across platforms: - default - numeric - email-address - phone-pad
   * The following values work on iOS: - ascii-capable - numbers-and-punctuation - url - number-pad - name-phone-pad - decimal-pad - twitter - web-search
   * The following values work on Android: - visible-password
   */
  keyboardType?: KeyboardTypeOptions | undefined;

  /**
   * Limits the maximum number of characters that can be entered.
   * Use this instead of implementing the logic in JS to avoid flicker.
   */
  maxLength?: number | undefined;

  /**
   * If true, the text input can be multiple lines. The default value is false.
   */
  multiline?: boolean | undefined;

  /**
   * Callback that is called when the text input is blurred
   */
  onBlur?:
    | ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void)
    | undefined;

  /**
   * Callback that is called when the text input's text changes.
   */
  onChange?:
    | ((e: NativeSyntheticEvent<TextInputChangeEventData>) => void)
    | undefined;

  /**
   * Callback that is called when the text input's text changes.
   * Changed text is passed as an argument to the callback handler.
   */
  onChangeText?: ((text: string) => void) | undefined;

  /**
   * Callback that is called when the text input's content size changes.
   * This will be called with
   * `{ nativeEvent: { contentSize: { width, height } } }`.
   *
   * Only called for multiline text inputs.
   */
  onContentSizeChange?:
    | ((e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => void)
    | undefined;

  /**
   * Callback that is called when text input ends.
   */
  onEndEditing?:
    | ((e: NativeSyntheticEvent<TextInputEndEditingEventData>) => void)
    | undefined;

  /**
   * Callback that is called when a touch is engaged.
   */
  onPressIn?: ((e: NativeSyntheticEvent<NativeTouchEvent>) => void) | undefined;

  /**
   * Callback that is called when a touch is released.
   */
  onPressOut?:
    | ((e: NativeSyntheticEvent<NativeTouchEvent>) => void)
    | undefined;

  /**
   * Callback that is called when the text input is focused
   */
  onFocus?:
    | ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void)
    | undefined;

  /**
   * Callback that is called when the text input selection is changed.
   */
  onSelectionChange?:
    | ((e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void)
    | undefined;

  /**
   * Callback that is called when the text input's submit button is pressed.
   */
  onSubmitEditing?:
    | ((e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void)
    | undefined;

  /**
   * Callback that is called on new text input with the argument
   *  `{ nativeEvent: { text, previousText, range: { start, end } } }`.
   *
   * This prop requires multiline={true} to be set.
   */
  onTextInput?:
    | ((e: NativeSyntheticEvent<TextInputTextInputEventData>) => void)
    | undefined;

  /**
   * Invoked on content scroll with
   *  `{ nativeEvent: { contentOffset: { x, y } } }`.
   *
   * May also contain other properties from ScrollEvent but on Android contentSize is not provided for performance reasons.
   */
  onScroll?:
    | ((e: NativeSyntheticEvent<TextInputScrollEventData>) => void)
    | undefined;

  /**
   * Callback that is called when a key is pressed.
   * This will be called with
   *  `{ nativeEvent: { key: keyValue } }`
   * where keyValue is 'Enter' or 'Backspace' for respective keys and the typed-in character otherwise including ' ' for space.
   *
   * Fires before onChange callbacks.
   * Note: on Android only the inputs from soft keyboard are handled, not the hardware keyboard inputs.
   */
  onKeyPress?:
    | ((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void)
    | undefined;

  /**
   * The string that will be rendered before text input has been entered
   */
  placeholder?: string | undefined;

  /**
   * The text color of the placeholder string
   */
  placeholderTextColor?: ColorValue | undefined;

  /**
   * enum('default', 'go', 'google', 'join', 'next', 'route', 'search', 'send', 'yahoo', 'done', 'emergency-call')
   * Determines how the return key should look.
   */
  returnKeyType?: ReturnKeyTypeOptions | undefined;

  /**
   * If true, the text input obscures the text entered so that sensitive text like passwords stay secure.
   * The default value is false.
   */
  secureTextEntry?: boolean | undefined;

  /**
   * If true, all text will automatically be selected on focus
   */
  selectTextOnFocus?: boolean | undefined;

  /**
   * The start and end of the text input's selection. Set start and end to
   * the same value to position the cursor.
   */
  selection?: {start: number; end?: number | undefined} | undefined;

  /**
   * The highlight (and cursor on ios) color of the text input
   */
  selectionColor?: ColorValue | undefined;

  /**
   * Styles
   */
  style?: StyleProp<TextStyle> | undefined;

  /**
   * Align the input text to the left, center, or right sides of the input field.
   */
  textAlign?: 'left' | 'center' | 'right' | undefined;

  /**
   * Used to locate this view in end-to-end tests
   */
  testID?: string | undefined;

  /**
   * Used to connect to an InputAccessoryView. Not part of react-natives documentation, but present in examples and
   * code.
   * See https://reactnative.dev/docs/inputaccessoryview for more information.
   */
  inputAccessoryViewID?: string | undefined;

  /**
   * The value to show for the text input. TextInput is a controlled component,
   * which means the native value will be forced to match this value prop if provided.
   * For most uses this works great, but in some cases this may cause flickering - one common cause is preventing edits by keeping value the same.
   * In addition to simply setting the same value, either set editable={false},
   * or set/update maxLength to prevent unwanted edits without flicker.
   */
  value?: string | undefined;

  /**
   * Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values:
   * - null/undefined (default): inherit from the parent node or the global default (0)
   * - 0: no max, ignore parent/global default
   * - >= 1: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: number | null | undefined;
}

/**
 * This class is responsible for coordinating the "focused"
 * state for TextInputs. All calls relating to the keyboard
 * should be funneled through here
 */
interface TextInputState {
  /**
   * @deprecated Use currentlyFocusedInput
   * Returns the ID of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedField(): number;

  /**
   * Returns the ref of the currently focused text field, if one exists
   * If no text field is focused it returns null
   */
  currentlyFocusedInput(): React.ElementRef<HostComponent<unknown>>;

  /**
   * @param textField ref of the text field to focus
   * Focuses the specified text field
   * noop if the text field was already focused
   */
  focusTextInput(textField?: React.ElementRef<HostComponent<unknown>>): void;

  /**
   * @param textField ref of the text field to focus
   * Unfocuses the specified text field
   * noop if it wasn't focused
   */
  blurTextInput(textField?: React.ElementRef<HostComponent<unknown>>): void;
}

/**
 * @see https://reactnative.dev/docs/textinput#methods
 */
declare class TextInputComponent extends React.Component<TextInputProps> {}
declare const TextInputBase: Constructor<NativeMethods> &
  Constructor<TimerMixin> &
  typeof TextInputComponent;
export class TextInput extends TextInputBase {
  /**
   * Access the current focus state.
   */
  static State: TextInputState;

  /**
   * Returns if the input is currently focused.
   */
  isFocused: () => boolean;

  /**
   * Removes all text from the input.
   */
  clear: () => void;
}

/**
 * Gesture recognition on mobile devices is much more complicated than web.
 * A touch can go through several phases as the app determines what the user's intention is.
 * For example, the app needs to determine if the touch is scrolling, sliding on a widget, or tapping.
 * This can even change during the duration of a touch. There can also be multiple simultaneous touches.
 *
 * The touch responder system is needed to allow components to negotiate these touch interactions
 * without any additional knowledge about their parent or child components.
 * This system is implemented in ResponderEventPlugin.js, which contains further details and documentation.
 *
 * Best Practices
 * Users can feel huge differences in the usability of web apps vs. native, and this is one of the big causes.
 * Every action should have the following attributes:
 *      Feedback/highlighting- show the user what is handling their touch, and what will happen when they release the gesture
 *      Cancel-ability- when making an action, the user should be able to abort it mid-touch by dragging their finger away
 *
 * These features make users more comfortable while using an app,
 * because it allows people to experiment and interact without fear of making mistakes.
 *
 * TouchableHighlight and Touchable*
 * The responder system can be complicated to use.
 * So we have provided an abstract Touchable implementation for things that should be "tappable".
 * This uses the responder system and allows you to easily configure tap interactions declaratively.
 * Use TouchableHighlight anywhere where you would use a button or link on web.
 */
export interface GestureResponderHandlers {
  /**
   * A view can become the touch responder by implementing the correct negotiation methods.
   * There are two methods to ask the view if it wants to become responder:
   */

  /**
   * Does this view want to become responder on the start of a touch?
   */
  onStartShouldSetResponder?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;

  /**
   * Called for every touch move on the View when it is not the responder: does this view want to "claim" touch responsiveness?
   */
  onMoveShouldSetResponder?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;

  /**
   * If the View returns true and attempts to become the responder, one of the following will happen:
   */

  onResponderEnd?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * The View is now responding for touch events.
   * This is the time to highlight and show the user what is happening
   */
  onResponderGrant?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Something else is the responder right now and will not release it
   */
  onResponderReject?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * If the view is responding, the following handlers can be called:
   */

  /**
   * The user is moving their finger
   */
  onResponderMove?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Fired at the end of the touch, ie "touchUp"
   */
  onResponderRelease?: ((event: GestureResponderEvent) => void) | undefined;

  onResponderStart?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   *  Something else wants to become responder.
   *  Should this view release the responder? Returning true allows release
   */
  onResponderTerminationRequest?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;

  /**
   * The responder has been taken from the View.
   * Might be taken by other views after a call to onResponderTerminationRequest,
   * or might be taken by the OS without asking (happens with control center/ notification center on iOS)
   */
  onResponderTerminate?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * onStartShouldSetResponder and onMoveShouldSetResponder are called with a bubbling pattern,
   * where the deepest node is called first.
   * That means that the deepest component will become responder when multiple Views return true for *ShouldSetResponder handlers.
   * This is desirable in most cases, because it makes sure all controls and buttons are usable.
   *
   * However, sometimes a parent will want to make sure that it becomes responder.
   * This can be handled by using the capture phase.
   * Before the responder system bubbles up from the deepest component,
   * it will do a capture phase, firing on*ShouldSetResponderCapture.
   * So if a parent View wants to prevent the child from becoming responder on a touch start,
   * it should have a onStartShouldSetResponderCapture handler which returns true.
   */
  onStartShouldSetResponderCapture?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;

  /**
   * onStartShouldSetResponder and onMoveShouldSetResponder are called with a bubbling pattern,
   * where the deepest node is called first.
   * That means that the deepest component will become responder when multiple Views return true for *ShouldSetResponder handlers.
   * This is desirable in most cases, because it makes sure all controls and buttons are usable.
   *
   * However, sometimes a parent will want to make sure that it becomes responder.
   * This can be handled by using the capture phase.
   * Before the responder system bubbles up from the deepest component,
   * it will do a capture phase, firing on*ShouldSetResponderCapture.
   * So if a parent View wants to prevent the child from becoming responder on a touch start,
   * it should have a onStartShouldSetResponderCapture handler which returns true.
   */
  onMoveShouldSetResponderCapture?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
}

/**
 * @see https://reactnative.dev/docs/view#style
 */
export interface ViewStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  backfaceVisibility?: 'visible' | 'hidden' | undefined;
  backgroundColor?: ColorValue | undefined;
  borderBottomColor?: ColorValue | undefined;
  borderBottomEndRadius?: number | undefined;
  borderBottomLeftRadius?: number | undefined;
  borderBottomRightRadius?: number | undefined;
  borderBottomStartRadius?: number | undefined;
  borderBottomWidth?: number | undefined;
  borderColor?: ColorValue | undefined;
  borderEndColor?: ColorValue | undefined;
  borderLeftColor?: ColorValue | undefined;
  borderLeftWidth?: number | undefined;
  borderRadius?: number | undefined;
  borderRightColor?: ColorValue | undefined;
  borderRightWidth?: number | undefined;
  borderStartColor?: ColorValue | undefined;
  borderStyle?: 'solid' | 'dotted' | 'dashed' | undefined;
  borderTopColor?: ColorValue | undefined;
  borderTopEndRadius?: number | undefined;
  borderTopLeftRadius?: number | undefined;
  borderTopRightRadius?: number | undefined;
  borderTopStartRadius?: number | undefined;
  borderTopWidth?: number | undefined;
  borderWidth?: number | undefined;
  opacity?: number | undefined;
  testID?: string | undefined;
  /**
   * Sets the elevation of a view, using Android's underlying
   * [elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation).
   * This adds a drop shadow to the item and affects z-order for overlapping views.
   * Only supported on Android 5.0+, has no effect on earlier versions.
   *
   * @platform android
   */
  elevation?: number | undefined;
}

export type TVParallaxProperties = {
  /**
   * If true, parallax effects are enabled.  Defaults to true.
   */
  enabled?: boolean | undefined;

  /**
   * Defaults to 2.0.
   */
  shiftDistanceX?: number | undefined;

  /**
   * Defaults to 2.0.
   */
  shiftDistanceY?: number | undefined;

  /**
   * Defaults to 0.05.
   */
  tiltAngle?: number | undefined;

  /**
   * Defaults to 1.0
   */
  magnification?: number | undefined;

  /**
   * Defaults to 1.0
   */
  pressMagnification?: number | undefined;

  /**
   * Defaults to 0.3
   */
  pressDuration?: number | undefined;

  /**
   * Defaults to 0.3
   */
  pressDelay?: number | undefined;
};

export interface TVViewPropsIOS {
  /**
   * *(Apple TV only)* When set to true, this view will be focusable
   * and navigable using the Apple TV remote.
   *
   * @platform ios
   */
  isTVSelectable?: boolean | undefined;

  /**
   * *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view.
   *
   * @platform ios
   */
  hasTVPreferredFocus?: boolean | undefined;

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * @platform ios
   */
  tvParallaxProperties?: TVParallaxProperties | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceX?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceY?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
   *
   * @platform ios
   */
  tvParallaxTiltAngle?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
   *
   * @platform ios
   */
  tvParallaxMagnification?: number | undefined;
}

export interface ViewPropsIOS extends TVViewPropsIOS {
  /**
   * Whether this view should be rendered as a bitmap before compositing.
   *
   * On iOS, this is useful for animations and interactions that do not modify this component's dimensions nor its children;
   * for example, when translating the position of a static view, rasterization allows the renderer to reuse a cached bitmap of a static view
   * and quickly composite it during each frame.
   *
   * Rasterization incurs an off-screen drawing pass and the bitmap consumes memory.
   * Test and measure when using this property.
   */
  shouldRasterizeIOS?: boolean | undefined;
}

export interface ViewPropsAndroid {
  /**
   * Views that are only used to layout their children or otherwise don't draw anything
   * may be automatically removed from the native hierarchy as an optimization.
   * Set this property to false to disable this optimization and ensure that this View exists in the native view hierarchy.
   */
  collapsable?: boolean | undefined;

  /**
   * Whether this view needs to rendered offscreen and composited with an alpha in order to preserve 100% correct colors and blending behavior.
   * The default (false) falls back to drawing the component and its children
   * with an alpha applied to the paint used to draw each element instead of rendering the full component offscreen and compositing it back with an alpha value.
   * This default may be noticeable and undesired in the case where the View you are setting an opacity on
   * has multiple overlapping elements (e.g. multiple overlapping Views, or text and a background).
   *
   * Rendering offscreen to preserve correct alpha behavior is extremely expensive
   * and hard to debug for non-native developers, which is why it is not turned on by default.
   * If you do need to enable this property for an animation,
   * consider combining it with renderToHardwareTextureAndroid if the view contents are static (i.e. it doesn't need to be redrawn each frame).
   * If that property is enabled, this View will be rendered off-screen once,
   * saved in a hardware texture, and then composited onto the screen with an alpha each frame without having to switch rendering targets on the GPU.
   */
  needsOffscreenAlphaCompositing?: boolean | undefined;

  /**
   * Whether this view should render itself (and all of its children) into a single hardware texture on the GPU.
   *
   * On Android, this is useful for animations and interactions that only modify opacity, rotation, translation, and/or scale:
   * in those cases, the view doesn't have to be redrawn and display lists don't need to be re-executed. The texture can just be
   * re-used and re-composited with different parameters. The downside is that this can use up limited video memory, so this prop should be set back to false at the end of the interaction/animation.
   */
  renderToHardwareTextureAndroid?: boolean | undefined;

  /**
   * Whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   */
  focusable?: boolean | undefined;
}

type Falsy = undefined | null | false;
interface RecursiveArray<T>
  extends Array<T | ReadonlyArray<T> | RecursiveArray<T>> {}
/** Keep a brand of 'T' so that calls to `StyleSheet.flatten` can take `RegisteredStyle<T>` and return `T`. */
type RegisteredStyle<T> = number & {__registeredStyleBrand: T};
export type StyleProp<T> =
  | T
  | RegisteredStyle<T>
  | RecursiveArray<T | RegisteredStyle<T> | Falsy>
  | Falsy;

/**
 * @see https://reactnative.dev/docs/accessibility#accessibility-properties
 */
export interface AccessibilityProps
  extends AccessibilityPropsAndroid,
    AccessibilityPropsIOS {
  /**
   * When true, indicates that the view is an accessibility element.
   * By default, all the touchable elements are accessible.
   */
  accessible?: boolean | undefined;

  /**
   * Provides an array of custom actions available for accessibility.
   */
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo> | undefined;

  /**
   * Overrides the text that's read by the screen reader when the user interacts with the element. By default, the
   * label is constructed by traversing all the children and accumulating all the Text nodes separated by space.
   */
  accessibilityLabel?: string | undefined;

  /**
   * Alias for accessibilityLabel  https://reactnative.dev/docs/view#accessibilitylabel
   * https://github.com/facebook/react-native/issues/34424
   */
  'aria-label'?: string | undefined;

  /**
   * Accessibility Role tells a person using either VoiceOver on iOS or TalkBack on Android the type of element that is focused on.
   */
  accessibilityRole?: AccessibilityRole | undefined;
  /**
   * Accessibility State tells a person using either VoiceOver on iOS or TalkBack on Android the state of the element currently focused on.
   */
  accessibilityState?: AccessibilityState | undefined;

  /**
   * alias for accessibilityState
   *
   * see https://reactnative.dev/docs/accessibility#accessibilitystate
   */
  'aria-busy'?: boolean | undefined;
  'aria-checked'?: boolean | undefined;
  'aria-disabled'?: boolean | undefined;
  'aria-expanded'?: boolean | undefined;
  'aria-selected'?: boolean | undefined;

  /**
   * An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not obvious from the accessibility label.
   */
  accessibilityHint?: string | undefined;
  /**
   * Represents the current value of a component. It can be a textual description of a component's value, or for range-based components, such as sliders and progress bars,
   * it contains range information (minimum, current, and maximum).
   */
  accessibilityValue?: AccessibilityValue | undefined;

  'aria-valuemax'?: AccessibilityValue['max'];
  'aria-valuemin'?: AccessibilityValue['min'];
  'aria-valuenow'?: AccessibilityValue['now'];
  'aria-valuetext'?: AccessibilityValue['text'];
  /**
   * When `accessible` is true, the system will try to invoke this function when the user performs an accessibility custom action.
   */
  onAccessibilityAction?:
    | ((event: AccessibilityActionEvent) => void)
    | undefined;

  /**
   * [Android] Controlling if a view fires accessibility events and if it is reported to accessibility services.
   */
  importantForAccessibility?:
    | ('auto' | 'yes' | 'no' | 'no-hide-descendants')
    | undefined;

  /**
   * A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   */
  'aria-hidden'?: boolean | undefined;

  'aria-live'?: ('polite' | 'assertive' | 'off') | undefined;
  'aria-modal'?: boolean | undefined;
}

export type AccessibilityActionInfo = Readonly<{
  name: AccessibilityActionName | string;
  label?: string | undefined;
}>;

export type AccessibilityActionName =
  /**
   * Generated when a screen reader user double taps the component.
   */
  | 'activate'
  /**
   * Generated when a screen reader user increments an adjustable component.
   */
  | 'increment'
  /**
   * Generated when a screen reader user decrements an adjustable component.
   */
  | 'decrement'
  /**
   * Generated when a TalkBack user places accessibility focus on the component and double taps and holds one finger on the screen.
   * @platform android
   */
  | 'longpress'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and double taps with two fingers.
   * @platform ios
   * */
  | 'magicTap'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and performs a two finger scrub gesture (left, right, left).
   * @platform ios
   * */
  | 'escape';

export type AccessibilityActionEvent = NativeSyntheticEvent<
  Readonly<{
    actionName: string;
  }>
>;

export interface AccessibilityState {
  /**
   * When true, informs accessible tools if the element is disabled
   */
  disabled?: boolean | undefined;
  /**
   * When true, informs accessible tools if the element is selected
   */
  selected?: boolean | undefined;
  /**
   * For items like Checkboxes and Toggle switches, reports their state to accessible tools
   */
  checked?: boolean | 'mixed' | undefined;
  /**
   *  When present, informs accessible tools if the element is busy
   */
  busy?: boolean | undefined;
  /**
   *  When present, informs accessible tools the element is expanded or collapsed
   */
  expanded?: boolean | undefined;
}

export interface AccessibilityValue {
  /**
   * The minimum value of this component's range. (should be an integer)
   */
  min?: number | undefined;

  /**
   * The maximum value of this component's range. (should be an integer)
   */
  max?: number | undefined;

  /**
   * The current value of this component's range. (should be an integer)
   */
  now?: number | undefined;

  /**
   * A textual description of this component's value. (will override minimum, current, and maximum if set)
   */
  text?: string | undefined;
}

export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'togglebutton'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tabbar'
  | 'tablist'
  | 'timer'
  | 'list'
  | 'toolbar';

export interface AccessibilityPropsAndroid {
  /**
   * Indicates to accessibility services whether the user should be notified when this view changes.
   * Works for Android API >= 19 only.
   * See http://developer.android.com/reference/android/view/View.html#attr_android:accessibilityLiveRegion for references.
   * @platform android
   */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive' | undefined;

  /**
   * Controls how view is important for accessibility which is if it fires accessibility events
   * and if it is reported to accessibility services that query the screen.
   * Works for Android only. See http://developer.android.com/reference/android/R.attr.html#importantForAccessibility for references.
   *
   * Possible values:
   *      'auto' - The system determines whether the view is important for accessibility - default (recommended).
   *      'yes' - The view is important for accessibility.
   *      'no' - The view is not important for accessibility.
   *      'no-hide-descendants' - The view is not important for accessibility, nor are any of its descendant views.
   */
  importantForAccessibility?:
    | 'auto'
    | 'yes'
    | 'no'
    | 'no-hide-descendants'
    | undefined;
}

export interface AccessibilityPropsIOS {
  /**
   * A Boolean value indicating whether the accessibility elements contained within this accessibility element
   * are hidden to the screen reader.
   * @platform ios
   */
  accessibilityElementsHidden?: boolean | undefined;

  /**
   * A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver.
   * @platform ios
   */
  accessibilityViewIsModal?: boolean | undefined;

  /**
   * When accessibile is true, the system will invoke this function when the user performs the escape gesture (scrub with two fingers).
   * @platform ios
   */
  onAccessibilityEscape?: (() => void) | undefined;

  /**
   * When `accessible` is true, the system will try to invoke this function when the user performs accessibility tap gesture.
   * @platform ios
   */
  onAccessibilityTap?: (() => void) | undefined;

  /**
   * When accessible is true, the system will invoke this function when the user performs the magic tap gesture.
   * @platform ios
   */
  onMagicTap?: (() => void) | undefined;

  /**
   * https://reactnative.dev/docs/accessibility#accessibilityignoresinvertcolorsios
   * @platform ios
   */
  accessibilityIgnoresInvertColors?: boolean | undefined;
}

/**
 * @see https://reactnative.dev/docs/view#props
 */
export interface ViewProps
  extends ViewPropsAndroid,
    ViewPropsIOS,
    GestureResponderHandlers,
    Touchable,
    PointerEvents,
    AccessibilityProps {
  children?: React.ReactNode;
  /**
   * This defines how far a touch event can start away from the view.
   * Typical interface guidelines recommend touch targets that are at least
   * 30 - 40 points/density-independent pixels. If a Touchable view has
   * a height of 20 the touchable height can be extended to 40 with
   * hitSlop={{top: 10, bottom: 10, left: 0, right: 0}}
   * NOTE The touch area never extends past the parent view bounds and
   * the Z-index of sibling views always takes precedence if a touch
   * hits two overlapping views.
   */
  hitSlop?: Insets | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   *
   * In the absence of auto property, none is much like CSS's none value. box-none is as if you had applied the CSS class:
   *
   * .box-none {
   *   pointer-events: none;
   * }
   * .box-none * {
   *   pointer-events: all;
   * }
   *
   * box-only is the equivalent of
   *
   * .box-only {
   *   pointer-events: all;
   * }
   * .box-only * {
   *   pointer-events: none;
   * }
   *
   * But since pointerEvents does not affect layout/appearance, and we are already deviating from the spec by adding additional modes,
   * we opt to not include pointerEvents on style. On some platforms, we would need to implement it as a className anyways. Using style or not is an implementation detail of the platform.
   */
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto' | undefined;

  /**
   *
   * This is a special performance property exposed by RCTView and is useful for scrolling content when there are many subviews,
   * most of which are offscreen. For this property to be effective, it must be applied to a view that contains many subviews that extend outside its bound.
   * The subviews must also have overflow: hidden, as should the containing view (or one of its superviews).
   */
  removeClippedSubviews?: boolean | undefined;

  style?: StyleProp<ViewStyle> | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  nativeID?: string | undefined;
}

/**
 * The most fundamental component for building UI, View is a container that supports layout with flexbox, style, some touch handling,
 * and accessibility controls, and is designed to be nested inside other views and to have 0 to many children of any type.
 * View maps directly to the native view equivalent on whatever platform React is running on,
 * whether that is a UIView, <div>, android.view, etc.
 */
declare class ViewComponent extends React.Component<ViewProps> {}
declare const ViewBase: Constructor<NativeMethods> & typeof ViewComponent;
export class View extends ViewBase {
  /**
   * Is 3D Touch / Force Touch available (i.e. will touch events include `force`)
   * @platform ios
   */
  static forceTouchAvailable: boolean;
}

/**
 * @see https://reactnative.dev/docs/viewpagerandroid#props
 */

export interface ViewPagerAndroidOnPageScrollEventData {
  position: number;
  offset: number;
}

export interface ViewPagerAndroidOnPageSelectedEventData {
  position: number;
}

export interface ViewPagerAndroidProps extends ViewProps {
  /**
   * Index of initial page that should be selected. Use `setPage` method to
   * update the page, and `onPageSelected` to monitor page changes
   */
  initialPage?: number | undefined;

  /**
   * When false, the content does not scroll.
   * The default value is true.
   */
  scrollEnabled?: boolean | undefined;

  /**
   * Executed when transitioning between pages (ether because of animation for
   * the requested page change or when user is swiping/dragging between pages)
   * The `event.nativeEvent` object for this callback will carry following data:
   *  - position - index of first page from the left that is currently visible
   *  - offset - value from range [0,1) describing stage between page transitions.
   *    Value x means that (1 - x) fraction of the page at "position" index is
   *    visible, and x fraction of the next page is visible.
   */
  onPageScroll?:
    | ((
        event: NativeSyntheticEvent<ViewPagerAndroidOnPageScrollEventData>,
      ) => void)
    | undefined;

  /**
   * This callback will be called once ViewPager finish navigating to selected page
   * (when user swipes between pages). The `event.nativeEvent` object passed to this
   * callback will have following fields:
   *  - position - index of page that has been selected
   */
  onPageSelected?:
    | ((
        event: NativeSyntheticEvent<ViewPagerAndroidOnPageSelectedEventData>,
      ) => void)
    | undefined;

  /**
   * Function called when the page scrolling state has changed.
   * The page scrolling state can be in 3 states:
   * - idle, meaning there is no interaction with the page scroller happening at the time
   * - dragging, meaning there is currently an interaction with the page scroller
   * - settling, meaning that there was an interaction with the page scroller, and the
   *   page scroller is now finishing it's closing or opening animation
   */
  onPageScrollStateChanged?:
    | ((state: 'Idle' | 'Dragging' | 'Settling') => void)
    | undefined;

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default), drags do not dismiss the keyboard.
   *   - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: 'none' | 'on-drag' | undefined;

  /**
   * Blank space to show between pages. This is only visible while scrolling, pages are still
   * edge-to-edge.
   */
  pageMargin?: number | undefined;
}

declare class ViewPagerAndroidComponent extends React.Component<ViewPagerAndroidProps> {}
declare const ViewPagerAndroidBase: Constructor<NativeMethods> &
  typeof ViewPagerAndroidComponent;

/**
 * ViewPagerAndroid has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/viewpager` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-viewpager
 * @deprecated
 */
export class ViewPagerAndroid extends ViewPagerAndroidBase {
  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will be animated.
   */
  setPage(selectedPage: number): void;

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will *not* be animated.
   */
  setPageWithoutAnimation(selectedPage: number): void;
}

/**
 * It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard.
 * It can automatically adjust either its position or bottom padding based on the position of the keyboard.
 */
declare class KeyboardAvoidingViewComponent extends React.Component<KeyboardAvoidingViewProps> {}
declare const KeyboardAvoidingViewBase: Constructor<TimerMixin> &
  typeof KeyboardAvoidingViewComponent;
export class KeyboardAvoidingView extends KeyboardAvoidingViewBase {}

export interface KeyboardAvoidingViewProps extends ViewProps {
  behavior?: 'height' | 'position' | 'padding' | undefined;

  /**
   * The style of the content container(View) when behavior is 'position'.
   */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * This is the distance between the top of the user screen and the react native view,
   * may be non-zero in some use cases.
   */
  keyboardVerticalOffset?: number | undefined;

  /**
   * Enables or disables the KeyboardAvoidingView.
   *
   * Default is true
   */
  enabled?: boolean | undefined;
}

/**
 * Renders nested content and automatically applies paddings reflect the portion of the view
 * that is not covered by navigation bars, tab bars, toolbars, and other ancestor views.
 * Moreover, and most importantly, Safe Area's paddings reflect physical limitation of the screen,
 * such as rounded corners or camera notches (aka sensor housing area on iPhone X).
 */
declare class SafeAreaViewComponent extends React.Component<ViewProps> {}
declare const SafeAreaViewBase: Constructor<NativeMethods> &
  typeof SafeAreaViewComponent;
export class SafeAreaView extends SafeAreaViewBase {}

/**
 * A component which enables customization of the keyboard input accessory view on iOS. The input accessory view is
 * displayed above the keyboard whenever a TextInput has focus. This component can be used to create custom toolbars.
 *
 * To use this component wrap your custom toolbar with the InputAccessoryView component, and set a nativeID. Then, pass
 * that nativeID as the inputAccessoryViewID of whatever TextInput you desire.
 */
export class InputAccessoryView extends React.Component<InputAccessoryViewProps> {}

export interface InputAccessoryViewProps {
  backgroundColor?: ColorValue | undefined;

  children?: React.ReactNode;

  /**
   * An ID which is used to associate this InputAccessoryView to specified TextInput(s).
   */
  nativeID?: string | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}

export interface NavigatorIOSProps {
  /**
   * The default background color of the navigation bar.
   */
  barTintColor?: ColorValue | undefined;

  /**
   * NavigatorIOS uses "route" objects to identify child views, their props, and navigation bar configuration.
   * "push" and all the other navigation operations expect routes to be like this
   */
  initialRoute: Route;

  /**
   * The default wrapper style for components in the navigator.
   * A common use case is to set the backgroundColor for every page
   */
  itemWrapperStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Boolean value that indicates whether the interactive pop gesture is
   * enabled. This is useful for enabling/disabling the back swipe navigation
   * gesture.
   *
   * If this prop is not provided, the default behavior is for the back swipe
   * gesture to be enabled when the navigation bar is shown and disabled when
   * the navigation bar is hidden. Once you've provided the
   * `interactivePopGestureEnabled` prop, you can never restore the default
   * behavior.
   */
  interactivePopGestureEnabled?: boolean | undefined;

  /**
   * A Boolean value that indicates whether the navigation bar is hidden
   */
  navigationBarHidden?: boolean | undefined;

  /**
   * A Boolean value that indicates whether to hide the 1px hairline shadow
   */
  shadowHidden?: boolean | undefined;

  /**
   * The color used for buttons in the navigation bar
   */
  tintColor?: ColorValue | undefined;

  /**
   * The text color of the navigation bar title
   */
  titleTextColor?: ColorValue | undefined;

  /**
   * A Boolean value that indicates whether the navigation bar is translucent
   */
  translucent?: boolean | undefined;

  /**
   * NOT IN THE DOC BUT IN THE EXAMPLES
   */
  style?: StyleProp<ViewStyle> | undefined;
}

/**
 * A navigator is an object of navigation functions that a view can call.
 * It is passed as a prop to any component rendered by NavigatorIOS.
 *
 * Navigator functions are also available on the NavigatorIOS component:
 *
 * @see https://reactnative.dev/docs/navigatorios#navigator
 */
export class NavigatorIOS extends React.Component<NavigatorIOSProps> {
  /**
   * Navigate forward to a new route
   */
  push: (route: Route) => void;

  /**
   * Go back one page
   */
  pop: () => void;

  /**
   * Go back N pages at once. When N=1, behavior matches pop()
   */
  popN: (n: number) => void;

  /**
   * Replace the route for the current page and immediately load the view for the new route
   */
  replace: (route: Route) => void;

  /**
   * Replace the route/view for the previous page
   */
  replacePrevious: (route: Route) => void;

  /**
   * Replaces the previous route/view and transitions back to it
   */
  replacePreviousAndPop: (route: Route) => void;

  /**
   * Replaces the top item and popToTop
   */
  resetTo: (route: Route) => void;

  /**
   * Go back to the item for a particular route object
   */
  popToRoute(route: Route): void;

  /**
   * Go back to the top item
   */
  popToTop(): void;
}

/**
 * @see https://reactnative.dev/docs/activityindicator#props
 */
export interface ActivityIndicatorProps extends ViewProps {
  /**
   * Whether to show the indicator (true, the default) or hide it (false).
   */
  animating?: boolean | undefined;

  /**
   * The foreground color of the spinner (default is gray).
   */
  color?: ColorValue | undefined;

  /**
   * Whether the indicator should hide when not animating (true by default).
   */
  hidesWhenStopped?: boolean | undefined;

  /**
   * Size of the indicator.
   * Small has a height of 20, large has a height of 36.
   *
   * enum('small', 'large')
   */
  size?: number | 'small' | 'large' | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}

declare class ActivityIndicatorComponent extends React.Component<ActivityIndicatorProps> {}
declare const ActivityIndicatorBase: Constructor<NativeMethods> &
  typeof ActivityIndicatorComponent;
export class ActivityIndicator extends ActivityIndicatorBase {}

/**
 * @see https://reactnative.dev/docs/activityindicatorios#props
 */
export interface ActivityIndicatorIOSProps extends ViewProps {
  /**
   * Whether to show the indicator (true, the default) or hide it (false).
   */
  animating?: boolean | undefined;

  /**
   * The foreground color of the spinner (default is gray).
   */
  color?: ColorValue | undefined;

  /**
   * Whether the indicator should hide when not animating (true by default).
   */
  hidesWhenStopped?: boolean | undefined;

  /**
   * Invoked on mount and layout changes with
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * Size of the indicator.
   * Small has a height of 20, large has a height of 36.
   *
   * enum('small', 'large')
   */
  size?: 'small' | 'large' | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}

export interface DatePickerIOSProps extends ViewProps {
  /**
   * The currently selected date.
   */
  date?: Date | null | undefined;

  /**
   * Provides an initial value that will change when the user starts selecting
   * a date. It is useful for simple use-cases where you do not want to deal
   * with listening to events and updating the date prop to keep the
   * controlled state in sync. The controlled state has known bugs which
   * causes it to go out of sync with native. The initialDate prop is intended
   * to allow you to have native be source of truth.
   */
  initialDate?: Date | null | undefined;

  /**
   * The date picker locale.
   */
  locale?: string | undefined;

  /**
   * Maximum date.
   * Restricts the range of possible date/time values.
   */
  maximumDate?: Date | undefined;

  /**
   * Maximum date.
   * Restricts the range of possible date/time values.
   */
  minimumDate?: Date | undefined;

  /**
   *  enum(1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30)
   *  The interval at which minutes can be selected.
   */
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30 | undefined;

  /**
   *  enum('date', 'time', 'datetime')
   *  The date picker mode.
   */
  mode?: 'date' | 'time' | 'datetime' | undefined;

  /**
   * Date change handler.
   * This is called when the user changes the date or time in the UI.
   * The first and only argument is a Date object representing the new date and time.
   */
  onDateChange: (newDate: Date) => void;

  /**
   * Timezone offset in minutes.
   * By default, the date picker will use the device's timezone. With this parameter, it is possible to force a certain timezone offset.
   * For instance, to show times in Pacific Standard Time, pass -7 * 60.
   */
  timeZoneOffsetInMinutes?: number | undefined;

  /**
   * The date picker style
   * This is only available on devices with iOS 14.0 and later.
   * 'spinner' is the default style if this prop isn't set.
   */
  pickerStyle?: 'compact' | 'spinner' | 'inline' | undefined;
}

declare class DatePickerIOSComponent extends React.Component<DatePickerIOSProps> {}
declare const DatePickerIOSBase: Constructor<NativeMethods> &
  typeof DatePickerIOSComponent;

/**
 * DatePickerIOS has been merged with DatePickerAndroid and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export class DatePickerIOS extends DatePickerIOSBase {}

export interface DrawerSlideEvent
  extends NativeSyntheticEvent<NativeTouchEvent> {}

/**
 * @see DrawerLayoutAndroid.android.js
 */
export interface DrawerLayoutAndroidProps extends ViewProps {
  /**
   * Specifies the background color of the drawer. The default value
   * is white. If you want to set the opacity of the drawer, use rgba.
   * Example:
   * return (
   *   <DrawerLayoutAndroid drawerBackgroundColor="rgba(0,0,0,0.5)">
   *   </DrawerLayoutAndroid>
   *);
   */
  drawerBackgroundColor?: ColorValue | undefined;

  /**
   * Specifies the lock mode of the drawer. The drawer can be locked
   * in 3 states:
   *
   * - unlocked (default), meaning that the drawer will respond
   *   (open/close) to touch gestures.
   *
   * - locked-closed, meaning that the drawer will stay closed and not
   *   respond to gestures.
   *
   * - locked-open, meaning that the drawer will stay opened and
   *   not respond to gestures. The drawer may still be opened and
   *   closed programmatically (openDrawer/closeDrawer).
   */
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open' | undefined;

  /**
   * Specifies the side of the screen from which the drawer will slide in.
   * - 'left' (the default)
   * - 'right'
   */
  drawerPosition?: 'left' | 'right' | undefined;

  /**
   * Specifies the width of the drawer, more precisely the width of the
   * view that be pulled in from the edge of the window.
   */
  drawerWidth?: number | undefined;

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   * - 'none' (the default), drags do not dismiss the keyboard.
   * - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: 'none' | 'on-drag' | undefined;

  /**
   * Function called whenever the navigation view has been closed.
   */
  onDrawerClose?: (() => void) | undefined;

  /**
   * Function called whenever the navigation view has been opened.
   */
  onDrawerOpen?: (() => void) | undefined;

  /**
   * Function called whenever there is an interaction with the navigation view.
   */
  onDrawerSlide?: ((event: DrawerSlideEvent) => void) | undefined;

  /**
   * Function called when the drawer state has changed.
   * The drawer can be in 3 states:
   * - idle, meaning there is no interaction with the navigation
   *   view happening at the time
   * - dragging, meaning there is currently an interaction with the
   *   navigation view
   * - settling, meaning that there was an interaction with the
   *   navigation view, and the navigation view is now finishing
   *   it's closing or opening animation
   */
  onDrawerStateChanged?:
    | ((event: 'Idle' | 'Dragging' | 'Settling') => void)
    | undefined;

  /**
   * The navigation view that will be rendered to the side of the
   * screen and can be pulled in.
   */
  renderNavigationView: () => JSX.Element;

  /**
   * Make the drawer take the entire screen and draw the background of
   * the status bar to allow it to open over the status bar. It will
   * only have an effect on API 21+.
   */
  statusBarBackgroundColor?: ColorValue | undefined;
}

interface DrawerPosition {
  Left: number;
  Right: number;
}

declare class DrawerLayoutAndroidComponent extends React.Component<DrawerLayoutAndroidProps> {}
declare const DrawerLayoutAndroidBase: Constructor<NativeMethods> &
  typeof DrawerLayoutAndroidComponent;
export class DrawerLayoutAndroid extends DrawerLayoutAndroidBase {
  /**
   * drawer's positions.
   */
  positions: DrawerPosition;

  /**
   * Opens the drawer.
   */
  openDrawer(): void;

  /**
   * Closes the drawer.
   */
  closeDrawer(): void;
}

/**
 * ProgressBarAndroid has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-bar-android` instead of 'react-native'.
 * @see https://github.com/react-native-community/progress-bar-android
 * @deprecated
 */
export interface ProgressBarAndroidProps extends ViewProps {
  /**
     * Style of the ProgressBar. One of:
         Horizontal
         Normal (default)
         Small
         Large
         Inverse
         SmallInverse
         LargeInverse
     */
  styleAttr?:
    | 'Horizontal'
    | 'Normal'
    | 'Small'
    | 'Large'
    | 'Inverse'
    | 'SmallInverse'
    | 'LargeInverse'
    | undefined;

  /**
   * If the progress bar will show indeterminate progress.
   * Note that this can only be false if styleAttr is Horizontal.
   */
  indeterminate?: boolean | undefined;

  /**
   * The progress value (between 0 and 1).
   */
  progress?: number | undefined;

  /**
   * Whether to show the ProgressBar (true, the default) or hide it (false).
   */
  animating?: boolean | undefined;

  /**
   * Color of the progress bar.
   */
  color?: ColorValue | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;
}
/**
 * React component that wraps the Android-only `ProgressBar`. This component is used to indicate
 * that the app is loading or there is some activity in the app.
 */
declare class ProgressBarAndroidComponent extends React.Component<ProgressBarAndroidProps> {}
declare const ProgressBarAndroidBase: Constructor<NativeMethods> &
  typeof ProgressBarAndroidComponent;
/**
 * ProgressBarAndroid has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-bar-android` instead of 'react-native'.
 * @see https://github.com/react-native-progress-view/progress-bar-android
 * @deprecated
 */
export class ProgressBarAndroid extends ProgressBarAndroidBase {}

/**
 * @see https://reactnative.dev/docs/progressviewios
 * @see ProgressViewIOS.ios.js
 */
export interface ProgressViewIOSProps extends ViewProps {
  /**
   * The progress bar style.
   */
  progressViewStyle?: 'default' | 'bar' | undefined;

  /**
   * The progress value (between 0 and 1).
   */
  progress?: number | undefined;

  /**
   * The tint color of the progress bar itself.
   */
  progressTintColor?: ColorValue | undefined;

  /**
   * The tint color of the progress bar track.
   */
  trackTintColor?: ColorValue | undefined;

  /**
   * A stretchable image to display as the progress bar.
   */
  progressImage?: ImageURISource | ImageURISource[] | undefined;

  /**
   * A stretchable image to display behind the progress bar.
   */
  trackImage?: ImageURISource | ImageURISource[] | undefined;
}
declare class ProgressViewIOSComponent extends React.Component<ProgressViewIOSProps> {}
declare const ProgressViewIOSBase: Constructor<NativeMethods> &
  typeof ProgressViewIOSComponent;
/**
 * ProgressViewIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-view` instead of 'react-native'.
 * @see https://github.com/react-native-community/progress-view
 * @deprecated
 */
export class ProgressViewIOS extends ProgressViewIOSBase {}

export interface RefreshControlPropsIOS extends ViewProps {
  /**
   * The color of the refresh indicator.
   */
  tintColor?: ColorValue | undefined;

  /**
   * The title displayed under the refresh indicator.
   */
  title?: string | undefined;

  /**
   * Title color.
   */
  titleColor?: ColorValue | undefined;
}

export interface RefreshControlPropsAndroid extends ViewProps {
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ColorValue[] | undefined;

  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: boolean | undefined;

  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ColorValue | undefined;

  /**
   * Size of the refresh indicator, see RefreshControl.SIZE.
   */
  size?: number | undefined;
}

export interface RefreshControlProps
  extends RefreshControlPropsIOS,
    RefreshControlPropsAndroid {
  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: (() => void) | undefined;

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean;

  /**
   * Progress view top offset
   */
  progressViewOffset?: number | undefined;
}

/**
 * This component is used inside a ScrollView or ListView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 *
 * __Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
 * in the `onRefresh` function otherwise the refresh indicator will stop immediately.
 */
declare class RefreshControlComponent extends React.Component<RefreshControlProps> {}
declare const RefreshControlBase: Constructor<NativeMethods> &
  typeof RefreshControlComponent;
export class RefreshControl extends RefreshControlBase {
  static SIZE: Object; // Undocumented
}

export interface RecyclerViewBackedScrollViewProps extends ScrollViewProps {}

/**
 * Wrapper around android native recycler view.
 *
 * It simply renders rows passed as children in a separate recycler view cells
 * similarly to how `ScrollView` is doing it. Thanks to the fact that it uses
 * native `RecyclerView` though, rows that are out of sight are going to be
 * automatically detached (similarly on how this would work with
 * `removeClippedSubviews = true` on a `ScrollView.js`).
 *
 * CAUTION: This is an experimental component and should only be used together
 * with javascript implementation of list view (see ListView.js). In order to
 * use it pass this component as `renderScrollComponent` to the list view. For
 * now only horizontal scrolling is supported.
 */
declare class RecyclerViewBackedScrollViewComponent extends React.Component<RecyclerViewBackedScrollViewProps> {}
declare const RecyclerViewBackedScrollViewBase: Constructor<ScrollResponderMixin> &
  typeof RecyclerViewBackedScrollViewComponent;
export class RecyclerViewBackedScrollView extends RecyclerViewBackedScrollViewBase {
  /**
   * A helper function to scroll to a specific point  in the scrollview.
   * This is currently used to help focus on child textviews, but can also
   * be used to quickly scroll to any element we want to focus. Syntax:
   *
   * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo(
    y?:
      | number
      | {
          x?: number | undefined;
          y?: number | undefined;
          animated?: boolean | undefined;
        },
    x?: number,
    animated?: boolean,
  ): void;

  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  getScrollResponder(): JSX.Element;
}

export interface SliderPropsAndroid extends ViewProps {
  /**
   * Color of the foreground switch grip.
   */
  thumbTintColor?: ColorValue | undefined;
}

export interface SliderPropsIOS extends ViewProps {
  /**
   * Assigns a maximum track image. Only static images are supported.
   * The leftmost pixel of the image will be stretched to fill the track.
   */
  maximumTrackImage?: ImageURISource | undefined;

  /**
   * Assigns a minimum track image. Only static images are supported.
   * The rightmost pixel of the image will be stretched to fill the track.
   */
  minimumTrackImage?: ImageURISource | undefined;

  /**
   * Sets an image for the thumb. Only static images are supported.
   */
  thumbImage?: ImageURISource | undefined;

  /**
   * Assigns a single image for the track. Only static images
   * are supported. The center pixel of the image will be stretched
   * to fill the track.
   */
  trackImage?: ImageURISource | undefined;
}

export interface SliderProps extends SliderPropsIOS, SliderPropsAndroid {
  /**
   * If true the user won't be able to move the slider.
   * Default value is false.
   */
  disabled?: boolean | undefined;

  /**
   * The color used for the track to the right of the button.
   * Overrides the default blue gradient image.
   */
  maximumTrackTintColor?: ColorValue | undefined;

  /**
   * Initial maximum value of the slider. Default value is 1.
   */
  maximumValue?: number | undefined;

  /**
   * The color used for the track to the left of the button.
   * Overrides the default blue gradient image.
   */
  minimumTrackTintColor?: ColorValue | undefined;

  /**
   * Initial minimum value of the slider. Default value is 0.
   */
  minimumValue?: number | undefined;

  /**
   * Callback called when the user finishes changing the value (e.g. when the slider is released).
   */
  onSlidingComplete?: ((value: number) => void) | undefined;

  /**
   * Callback continuously called while the user is dragging the slider.
   */
  onValueChange?: ((value: number) => void) | undefined;

  /**
   * Step value of the slider. The value should be between 0 and (maximumValue - minimumValue). Default value is 0.
   */
  step?: number | undefined;

  /**
   * Used to style and layout the Slider. See StyleSheet.js for more info.
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * Used to locate this view in UI automation tests.
   */
  testID?: string | undefined;

  /**
   * Initial value of the slider. The value should be between minimumValue
   * and maximumValue, which default to 0 and 1 respectively.
   * Default value is 0.
   * This is not a controlled component, you don't need to update
   * the value during dragging.
   */
  value?: number | undefined;
}

/**
 * A component used to select a single value from a range of values.
 */
declare class SliderComponent extends React.Component<SliderProps> {}
declare const SliderBase: Constructor<NativeMethods> & typeof SliderComponent;
/**
 * Slider has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/slider` instead of 'react-native'.
 * @see https://github.com/callstack/react-native-slider
 * @deprecated
 */
export class Slider extends SliderBase {}
/**  SliderIOS has been removed from react-native.
 * It can now be installed and imported from `@react-native-community/slider` instead of 'react-native'.
 * @see https://github.com/callstack/react-native-slider
 * @deprecated
 */
export type SliderIOS = Slider;

/**
 * SwitchIOS Component has been removed from react-native in favor of Switch Component
 * https://github.com/facebook/react-native/pull/9891/files
 * @deprecated see SwitchProps
 */
export interface SwitchIOSProps extends ViewProps {
  /**
   * If true the user won't be able to toggle the switch. Default value is false.
   */
  disabled?: boolean | undefined;

  /**
   * Background color when the switch is turned on.
   */
  onTintColor?: ColorValue | undefined;

  /**
   * Callback that is called when the user toggles the switch.
   */
  onValueChange?: ((value: boolean) => void) | undefined;

  /**
   * Background color for the switch round button.
   */
  thumbTintColor?: ColorValue | undefined;

  /**
   * Background color when the switch is turned off.
   */
  tintColor?: ColorValue | undefined;

  /**
   * The value of the switch, if true the switch will be turned on. Default value is false.
   */
  value?: boolean | undefined;
}

/**
 * SwitchIOS component has been removed from react-native in favor of Switch component
 * https://github.com/facebook/react-native/pull/9891/files
 * @deprecated see Switch
 */
export class SwitchIOS extends React.Component<SwitchIOSProps> {}

export type ImageResizeMode =
  | 'cover'
  | 'contain'
  | 'stretch'
  | 'repeat'
  | 'center';

/**
 * @see ImageResizeMode.js
 */
export interface ImageResizeModeStatic {
  /**
   * contain - The image will be resized such that it will be completely
   * visible, contained within the frame of the View.
   */
  contain: ImageResizeMode;
  /**
   * cover - The image will be resized such that the entire area of the view
   * is covered by the image, potentially clipping parts of the image.
   */
  cover: ImageResizeMode;
  /**
   * stretch - The image will be stretched to fill the entire frame of the
   * view without clipping.  This may change the aspect ratio of the image,
   * distoring it.  Only supported on iOS.
   */
  stretch: ImageResizeMode;
  /**
   * center - The image will be scaled down such that it is completely visible,
   * if bigger than the area of the view.
   * The image will not be scaled up.
   */
  center: ImageResizeMode;

  /**
   * repeat - The image will be repeated to cover the frame of the View. The
   * image will keep it's size and aspect ratio.
   */
  repeat: ImageResizeMode;
}

export interface ShadowStyleIOS {
  shadowColor?: ColorValue | undefined;
  shadowOffset?: {width: number; height: number} | undefined;
  shadowOpacity?: number | undefined;
  shadowRadius?: number | undefined;
}

/**
 * Image style
 * @see https://reactnative.dev/docs/image#style
 */
export interface ImageStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  resizeMode?: ImageResizeMode | undefined;
  backfaceVisibility?: 'visible' | 'hidden' | undefined;
  borderBottomLeftRadius?: number | undefined;
  borderBottomRightRadius?: number | undefined;
  backgroundColor?: ColorValue | undefined;
  borderColor?: ColorValue | undefined;
  borderWidth?: number | undefined;
  borderRadius?: number | undefined;
  borderTopLeftRadius?: number | undefined;
  borderTopRightRadius?: number | undefined;
  overflow?: 'visible' | 'hidden' | undefined;
  overlayColor?: ColorValue | undefined;
  tintColor?: ColorValue | undefined;
  opacity?: number | undefined;
}

/*
 * @see https://github.com/facebook/react-native/blob/master/Libraries/Image/ImageSource.js
 */
export interface ImageURISource {
  /**
   * `uri` is a string representing the resource identifier for the image, which
   * could be an http address, a local file path, or the name of a static image
   * resource (which should be wrapped in the `require('./path/to/image.png')`
   * function).
   */
  uri?: string | undefined;
  /**
   * `bundle` is the iOS asset bundle which the image is included in. This
   * will default to [NSBundle mainBundle] if not set.
   * @platform ios
   */
  bundle?: string | undefined;
  /**
   * `method` is the HTTP Method to use. Defaults to GET if not specified.
   */
  method?: string | undefined;
  /**
   * `headers` is an object representing the HTTP headers to send along with the
   * request for a remote image.
   */
  headers?: {[key: string]: string} | undefined;
  /**
   * `cache` determines how the requests handles potentially cached
   * responses.
   *
   * - `default`: Use the native platforms default strategy. `useProtocolCachePolicy` on iOS.
   *
   * - `reload`: The data for the URL will be loaded from the originating source.
   * No existing cache data should be used to satisfy a URL load request.
   *
   * - `force-cache`: The existing cached data will be used to satisfy the request,
   * regardless of its age or expiration date. If there is no existing data in the cache
   * corresponding the request, the data is loaded from the originating source.
   *
   * - `only-if-cached`: The existing cache data will be used to satisfy a request, regardless of
   * its age or expiration date. If there is no existing data in the cache corresponding
   * to a URL load request, no attempt is made to load the data from the originating source,
   * and the load is considered to have failed.
   *
   * @platform ios
   */
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached' | undefined;
  /**
   * `body` is the HTTP body to send with the request. This must be a valid
   * UTF-8 string, and will be sent exactly as specified, with no
   * additional encoding (e.g. URL-escaping or base64) applied.
   */
  body?: string | undefined;
  /**
   * `width` and `height` can be specified if known at build time, in which case
   * these will be used to set the default `<Image/>` component dimensions.
   */
  width?: number | undefined;
  height?: number | undefined;
  /**
   * `scale` is used to indicate the scale factor of the image. Defaults to 1.0 if
   * unspecified, meaning that one image pixel equates to one display point / DIP.
   */
  scale?: number | undefined;
}

export type ImageRequireSource = number;

/**
 * @see ImagePropsIOS.onProgress
 */
export interface ImageProgressEventDataIOS {
  loaded: number;
  total: number;
}

export interface ImagePropsIOS {
  /**
   * blurRadius: the blur radius of the blur filter added to the image
   * @platform ios
   */
  blurRadius?: number | undefined;

  /**
   * When the image is resized, the corners of the size specified by capInsets will stay a fixed size,
   * but the center content and borders of the image will be stretched.
   * This is useful for creating resizable rounded buttons, shadows, and other resizable assets.
   * More info on Apple documentation
   */
  capInsets?: Insets | undefined;

  /**
   * Invoked on download progress with {nativeEvent: {loaded, total}}
   */
  onProgress?:
    | ((event: NativeSyntheticEvent<ImageProgressEventDataIOS>) => void)
    | undefined;

  /**
   * Invoked when a partial load of the image is complete. The definition of
   * what constitutes a "partial load" is loader specific though this is meant
   * for progressive JPEG loads.
   * @platform ios
   */
  onPartialLoad?: (() => void) | undefined;
}

interface ImagePropsAndroid {
  /**
   * The mechanism that should be used to resize the image when the image's dimensions
   * differ from the image view's dimensions. Defaults to auto.
   *
   * 'auto': Use heuristics to pick between resize and scale.
   *
   * 'resize': A software operation which changes the encoded image in memory before it gets decoded.
   * This should be used instead of scale when the image is much larger than the view.
   *
   * 'scale': The image gets drawn downscaled or upscaled. Compared to resize, scale is faster (usually hardware accelerated)
   * and produces higher quality images. This should be used if the image is smaller than the view.
   * It should also be used if the image is slightly bigger than the view.
   */
  resizeMethod?: 'auto' | 'resize' | 'scale' | undefined;

  /**
   * Duration of fade in animation in ms. Defaults to 300
   *
   * @platform android
   */
  fadeDuration?: number | undefined;
}

/**
 * @see https://reactnative.dev/docs/image#source
 */
export type ImageSourcePropType =
  | ImageURISource
  | ImageURISource[]
  | ImageRequireSource;

export interface ImageLoadEventData {
  source: {
    height: number;
    width: number;
    uri: string;
  };
}

export interface ImageErrorEventData {
  error: any;
}

/**
 * @see https://reactnative.dev/docs/image#resolveassetsource
 */
export interface ImageResolvedAssetSource {
  height: number;
  width: number;
  scale: number;
  uri: string;
}

/**
 * @see https://reactnative.dev/docs/image
 */
export interface ImagePropsBase
  extends ImagePropsIOS,
    ImagePropsAndroid,
    AccessibilityProps {
  /**
   * Used to reference react managed images from native code.
   */
  id?: string | undefined;

  /**
   * onLayout function
   *
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height} }}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * Invoked on load error with {nativeEvent: {error}}
   */
  onError?:
    | ((error: NativeSyntheticEvent<ImageErrorEventData>) => void)
    | undefined;

  /**
   * Invoked when load completes successfully
   * { source: { uri, height, width } }.
   */
  onLoad?:
    | ((event: NativeSyntheticEvent<ImageLoadEventData>) => void)
    | undefined;

  /**
   * Invoked when load either succeeds or fails
   */
  onLoadEnd?: (() => void) | undefined;

  /**
   * Invoked on load start
   */
  onLoadStart?: (() => void) | undefined;

  progressiveRenderingEnabled?: boolean | undefined;

  borderRadius?: number | undefined;

  borderTopLeftRadius?: number | undefined;

  borderTopRightRadius?: number | undefined;

  borderBottomLeftRadius?: number | undefined;

  borderBottomRightRadius?: number | undefined;

  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * 'cover': Scale the image uniformly (maintain the image's aspect ratio)
   * so that both dimensions (width and height) of the image will be equal
   * to or larger than the corresponding dimension of the view (minus padding).
   *
   * 'contain': Scale the image uniformly (maintain the image's aspect ratio)
   * so that both dimensions (width and height) of the image will be equal to
   * or less than the corresponding dimension of the view (minus padding).
   *
   * 'stretch': Scale width and height independently, This may change the
   * aspect ratio of the src.
   *
   * 'repeat': Repeat the image to cover the frame of the view.
   * The image will keep it's size and aspect ratio. (iOS only)
   *
   * 'center': Scale the image down so that it is completely visible,
   * if bigger than the area of the view.
   * The image will not be scaled up.
   */
  resizeMode?: ImageResizeMode | undefined;

  /**
   * The mechanism that should be used to resize the image when the image's dimensions
   * differ from the image view's dimensions. Defaults to `auto`.
   *
   * - `auto`: Use heuristics to pick between `resize` and `scale`.
   *
   * - `resize`: A software operation which changes the encoded image in memory before it
   * gets decoded. This should be used instead of `scale` when the image is much larger
   * than the view.
   *
   * - `scale`: The image gets drawn downscaled or upscaled. Compared to `resize`, `scale` is
   * faster (usually hardware accelerated) and produces higher quality images. This
   * should be used if the image is smaller than the view. It should also be used if the
   * image is slightly bigger than the view.
   *
   * More details about `resize` and `scale` can be found at http://frescolib.org/docs/resizing-rotating.html.
   *
   * @platform android
   */
  resizeMethod?: 'auto' | 'resize' | 'scale' | undefined;

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * This prop can also contain several remote URLs, specified together with their width and height and potentially with scale/other URI arguments.
   * The native side will then choose the best uri to display based on the measured size of the image container.
   * A cache property can be added to control how networked request interacts with the local cache.
   *
   * The currently supported formats are png, jpg, jpeg, bmp, gif, webp (Android only), psd (iOS only).
   */
  source: ImageSourcePropType;

  /**
   * similarly to `source`, this property represents the resource used to render
   * the loading indicator for the image, displayed until image is ready to be
   * displayed, typically after when it got downloaded from network.
   */
  loadingIndicatorSource?: ImageURISource | undefined;

  /**
   * A unique identifier for this element to be used in UI Automation testing scripts.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed images from native code.
   */
  nativeID?: string | undefined;

  /**
   * A static image to display while downloading the final image off the network.
   */
  defaultSource?: ImageURISource | number | undefined;
}

export interface ImageProps extends ImagePropsBase {
  /**
   *
   * Style
   */
  style?: StyleProp<ImageStyle> | undefined;
}

declare class ImageComponent extends React.Component<ImageProps> {}
declare const ImageBase: Constructor<NativeMethods> & typeof ImageComponent;
export class Image extends ImageBase {
  static getSize(
    uri: string,
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ): any;
  static getSizeWithHeaders(
    uri: string,
    headers: {[index: string]: string},
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ): any;
  static prefetch(url: string): Promise<boolean>;
  static prefetchWithMetadata(
    url: string,
    queryRootName: string,
    rootTag?: number,
  ): Promise<boolean>;
  static abortPrefetch?(requestId: number): void;
  static queryCache?(
    urls: string[],
  ): Promise<{[url: string]: 'memory' | 'disk' | 'disk/memory'}>;

  /**
   * @see https://reactnative.dev/docs/image#resolveassetsource
   */
  static resolveAssetSource(
    source: ImageSourcePropType,
  ): ImageResolvedAssetSource;
}

export interface ImageBackgroundProps extends ImagePropsBase {
  children?: React.ReactNode;
  imageStyle?: StyleProp<ImageStyle> | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  imageRef?(image: Image): void;
}

declare class ImageBackgroundComponent extends React.Component<ImageBackgroundProps> {}
declare const ImageBackgroundBase: Constructor<NativeMethods> &
  typeof ImageBackgroundComponent;
export class ImageBackground extends ImageBackgroundBase {
  resizeMode: ImageResizeMode;
  getSize(
    uri: string,
    success: (width: number, height: number) => void,
    failure: (error: any) => void,
  ): any;
  prefetch(url: string): any;
  abortPrefetch?(requestId: number): void;
  queryCache?(
    urls: string[],
  ): Promise<{[url: string]: 'memory' | 'disk' | 'disk/memory'}>;
}

export interface ViewToken {
  item: any;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}

export interface ViewabilityConfig {
  /**
   * Minimum amount of time (in milliseconds) that an item must be physically viewable before the
   * viewability callback will be fired. A high number means that scrolling through content without
   * stopping will not mark the content as viewable.
   */
  minimumViewTime?: number | undefined;

  /**
   * Percent of viewport that must be covered for a partially occluded item to count as
   * "viewable", 0-100. Fully visible items are always considered viewable. A value of 0 means
   * that a single pixel in the viewport makes the item viewable, and a value of 100 means that
   * an item must be either entirely visible or cover the entire viewport to count as viewable.
   */
  viewAreaCoveragePercentThreshold?: number | undefined;

  /**
   * Similar to `viewAreaCoveragePercentThreshold`, but considers the percent of the item that is visible,
   * rather than the fraction of the viewable area it covers.
   */
  itemVisiblePercentThreshold?: number | undefined;

  /**
   * Nothing is considered viewable until the user scrolls or `recordInteraction` is called after
   * render.
   */
  waitForInteraction?: boolean | undefined;
}

export interface ViewabilityConfigCallbackPair {
  viewabilityConfig: ViewabilityConfig;
  onViewableItemsChanged:
    | ((info: {
        viewableItems: Array<ViewToken>;
        changed: Array<ViewToken>;
      }) => void)
    | null;
}

export type ViewabilityConfigCallbackPairs = ViewabilityConfigCallbackPair[];

/**
 * @see https://reactnative.dev/docs/flatlist#props
 */

export interface ListRenderItemInfo<ItemT> {
  item: ItemT;

  index: number;

  separators: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: 'leading' | 'trailing', newProps: any) => void;
  };
}

export type ListRenderItem<ItemT> = (
  info: ListRenderItemInfo<ItemT>,
) => React.ReactElement | null;

export interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
  /**
   * Rendered in between each item, but not at the top or bottom
   */
  ItemSeparatorComponent?: React.ComponentType<any> | null | undefined;

  /**
   * Rendered when the list is empty.
   */
  ListEmptyComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Rendered at the very end of the list.
   */
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Styling for internal View for ListFooterComponent
   */
  ListFooterComponentStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Rendered at the very beginning of the list.
   */
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Styling for internal View for ListHeaderComponent
   */
  ListHeaderComponentStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Optional custom style for multi-item rows generated when numColumns > 1
   */
  columnWrapperStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * Determines when the keyboard should stay visible after a tap.
   * - 'never' (the default), tapping outside of the focused text input when the keyboard is up dismisses the keyboard. When this happens, children won't receive the tap.
   * - 'always', the keyboard will not dismiss automatically, and the scroll view will not catch taps, but children of the scroll view can catch taps.
   * - 'handled', the keyboard will not dismiss automatically when the tap was handled by a children, (or captured by an ancestor).
   * - false, deprecated, use 'never' instead
   * - true, deprecated, use 'always' instead
   */
  keyboardShouldPersistTaps?:
    | boolean
    | 'always'
    | 'never'
    | 'handled'
    | undefined;

  /**
   * For simplicity, data is just a plain array. If you want to use something else,
   * like an immutable list, use the underlying VirtualizedList directly.
   */
  data: ReadonlyArray<ItemT> | null | undefined;

  /**
   * A marker property for telling the list to re-render (since it implements PureComponent).
   * If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop,
   * stick it here and treat it immutably.
   */
  extraData?: any;

  /**
   * `getItemLayout` is an optional optimization that lets us skip measurement of dynamic
   * content if you know the height of items a priori. getItemLayout is the most efficient,
   * and is easy to use if you have fixed height items, for example:
   * ```
   * getItemLayout={(data, index) => (
   *   {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
   * )}
   * ```
   * Remember to include separator length (height or width) in your offset calculation if you specify
   * `ItemSeparatorComponent`.
   */
  getItemLayout?:
    | ((
        data: Array<ItemT> | null | undefined,
        index: number,
      ) => {length: number; offset: number; index: number})
    | undefined;

  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: boolean | null | undefined;

  /**
   * How many items to render in the initial batch
   */
  initialNumToRender?: number | undefined;

  /**
   * Instead of starting at the top with the first item, start at initialScrollIndex
   */
  initialScrollIndex?: number | null | undefined;

  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;

  /**
   * Uses legacy MetroListView instead of default VirtualizedSectionList
   */
  legacyImplementation?: boolean | undefined;

  /**
   * Multiple columns can only be rendered with `horizontal={false}` and will zig-zag like a `flexWrap` layout.
   * Items should all be the same height - masonry layouts are not supported.
   */
  numColumns?: number | undefined;

  /**
   * Called once when the scroll position gets within onEndReachedThreshold of the rendered content.
   */
  onEndReached?: ((info: {distanceFromEnd: number}) => void) | null | undefined;

  /**
   * How far from the end (in units of visible length of the list) the bottom edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list.
   */
  onEndReachedThreshold?: number | null | undefined;

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality.
   * Make sure to also set the refreshing prop correctly.
   */
  onRefresh?: (() => void) | null | undefined;

  /**
   * Called when the viewability of rows changes, as defined by the `viewablePercentThreshold` prop.
   */
  onViewableItemsChanged?:
    | ((info: {
        viewableItems: Array<ViewToken>;
        changed: Array<ViewToken>;
      }) => void)
    | null
    | undefined;

  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean | null | undefined;

  /**
   * Takes an item from data and renders it into the list. Typical usage:
   * ```
   * _renderItem = ({item}) => (
   *   <TouchableOpacity onPress={() => this._onPress(item)}>
   *     <Text>{item.title}</Text>
   *   <TouchableOpacity/>
   * );
   * ...
   * <FlatList data={[{title: 'Title Text', key: 'item1'}]} renderItem={this._renderItem} />
   * ```
   * Provides additional metadata like `index` if you need it.
   */
  renderItem: ListRenderItem<ItemT> | null | undefined;

  /**
   * See `ViewabilityHelper` for flow type and further documentation.
   */
  viewabilityConfig?: any;

  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * Fades out the edges of the the scroll content.
   *
   * If the value is greater than 0, the fading edges will be set accordingly
   * to the current scroll direction and position,
   * indicating if there is more content to show.
   *
   * The default value is 0.
   * @platform android
   */
  fadingEdgeLength?: number | undefined;
}

export class FlatList<ItemT = any> extends React.Component<
  FlatListProps<ItemT>
> {
  /**
   * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
   */
  scrollToEnd: (params?: {animated?: boolean | null | undefined}) => void;

  /**
   * Scrolls to the item at the specified index such that it is positioned in the viewable area
   * such that viewPosition 0 places it at the top, 1 at the bottom, and 0.5 centered in the middle.
   * Cannot scroll to locations outside the render window without specifying the getItemLayout prop.
   */
  scrollToIndex: (params: {
    animated?: boolean | null | undefined;
    index: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Requires linear scan through data - use `scrollToIndex` instead if possible.
   * May be janky without `getItemLayout` prop.
   */
  scrollToItem: (params: {
    animated?: boolean | null | undefined;
    item: ItemT;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Scroll to a specific content pixel offset, like a normal `ScrollView`.
   */
  scrollToOffset: (params: {
    animated?: boolean | null | undefined;
    offset: number;
  }) => void;

  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations,
   * e.g. if waitForInteractions is true and the user has not scrolled. This is typically called
   * by taps on items or by navigation actions.
   */
  recordInteraction: () => void;

  /**
   * Displays the scroll indicators momentarily.
   */
  flashScrollIndicators: () => void;

  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder: () => JSX.Element | null | undefined;

  /**
   * Provides a reference to the underlying host component
   */
  getNativeScrollRef: () =>
    | React.ElementRef<typeof View>
    | React.ElementRef<typeof ScrollViewComponent>
    | null
    | undefined;

  getScrollableNode: () => any;

  // TODO: use `unknown` instead of `any` for Typescript >= 3.0
  setNativeProps: (props: {[key: string]: any}) => void;
}

/**
 * @see https://reactnative.dev/docs/sectionlist
 */

type DefaultSectionT = {
  [key: string]: any;
};

export interface SectionBase<ItemT, SectionT = DefaultSectionT> {
  data: ReadonlyArray<ItemT>;

  key?: string | undefined;

  renderItem?: SectionListRenderItem<ItemT, SectionT> | undefined;

  ItemSeparatorComponent?: React.ComponentType<any> | null | undefined;

  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;
}

export type SectionListData<ItemT, SectionT = DefaultSectionT> = SectionBase<
  ItemT,
  SectionT
> &
  SectionT;

/**
 * @see https://reactnative.dev/docs/sectionlist.html#props
 */

export interface SectionListRenderItemInfo<ItemT, SectionT = DefaultSectionT>
  extends ListRenderItemInfo<ItemT> {
  section: SectionListData<ItemT, SectionT>;
}

export type SectionListRenderItem<ItemT, SectionT = DefaultSectionT> = (
  info: SectionListRenderItemInfo<ItemT, SectionT>,
) => React.ReactElement | null;

export interface SectionListProps<ItemT, SectionT = DefaultSectionT>
  extends VirtualizedListWithoutRenderItemProps<ItemT> {
  /**
   * Rendered in between adjacent Items within each section.
   */
  ItemSeparatorComponent?: React.ComponentType<any> | null | undefined;

  /**
   * Rendered when the list is empty.
   */
  ListEmptyComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Rendered at the very end of the list.
   */
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Styling for internal View for ListFooterComponent
   */
  ListFooterComponentStyle?: StyleProp<ViewStyle> | undefined | null;

  /**
   * Rendered at the very beginning of the list.
   */
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Styling for internal View for ListHeaderComponent
   */
  ListHeaderComponentStyle?: StyleProp<ViewStyle> | undefined | null;

  /**
   * Rendered in between each section.
   */
  SectionSeparatorComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * A marker property for telling the list to re-render (since it implements PureComponent).
   * If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop,
   * stick it here and treat it immutably.
   */
  extraData?: any;

  /**
   * `getItemLayout` is an optional optimization that lets us skip measurement of dynamic
   * content if you know the height of items a priori. getItemLayout is the most efficient,
   * and is easy to use if you have fixed height items, for example:
   * ```
   * getItemLayout={(data, index) => (
   *   {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
   * )}
   * ```
   */
  getItemLayout?:
    | ((
        data: SectionListData<ItemT, SectionT>[] | null,
        index: number,
      ) => {length: number; offset: number; index: number})
    | undefined;

  /**
   * How many items to render in the initial batch
   */
  initialNumToRender?: number | undefined;

  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: boolean | null | undefined;

  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;

  /**
   * Called once when the scroll position gets within onEndReachedThreshold of the rendered content.
   */
  onEndReached?: ((info: {distanceFromEnd: number}) => void) | null | undefined;

  /**
   * How far from the end (in units of visible length of the list) the bottom edge of the
   * list must be from the end of the content to trigger the `onEndReached` callback.
   * Thus a value of 0.5 will trigger `onEndReached` when the end of the content is
   * within half the visible length of the list.
   */
  onEndReachedThreshold?: number | null | undefined;

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality.
   * Make sure to also set the refreshing prop correctly.
   */
  onRefresh?: (() => void) | null | undefined;

  /**
   * Used to handle failures when scrolling to an index that has not been measured yet.
   * Recommended action is to either compute your own offset and `scrollTo` it, or scroll as far
   * as possible and then try again after more items have been rendered.
   */
  onScrollToIndexFailed?:
    | ((info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
      }) => void)
    | undefined;

  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean | null | undefined;

  /**
   * Default renderer for every item in every section. Can be over-ridden on a per-section basis.
   */
  renderItem?: SectionListRenderItem<ItemT, SectionT> | undefined;

  /**
   * Rendered at the top of each section. Sticky headers are not yet supported.
   */
  renderSectionHeader?:
    | ((info: {
        section: SectionListData<ItemT, SectionT>;
      }) => React.ReactElement | null)
    | undefined;

  /**
   * Rendered at the bottom of each section.
   */
  renderSectionFooter?:
    | ((info: {
        section: SectionListData<ItemT, SectionT>;
      }) => React.ReactElement | null)
    | undefined;

  /**
   * An array of objects with data for each section.
   */
  sections: ReadonlyArray<SectionListData<ItemT, SectionT>>;

  /**
   * Render a custom scroll component, e.g. with a differently styled `RefreshControl`.
   */
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;

  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * Makes section headers stick to the top of the screen until the next one pushes it off.
   * Only enabled by default on iOS because that is the platform standard there.
   */
  stickySectionHeadersEnabled?: boolean | undefined;

  /**
   * Uses legacy MetroListView instead of default VirtualizedSectionList
   */
  legacyImplementation?: boolean | undefined;
}

export interface SectionListScrollParams {
  animated?: boolean | undefined;
  itemIndex: number;
  sectionIndex: number;
  viewOffset?: number | undefined;
  viewPosition?: number | undefined;
}

export class SectionList<
  ItemT = any,
  SectionT = DefaultSectionT,
> extends React.Component<SectionListProps<ItemT, SectionT>> {
  /**
   * Scrolls to the item at the specified sectionIndex and itemIndex (within the section)
   * positioned in the viewable area such that viewPosition 0 places it at the top
   * (and may be covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle.
   */
  scrollToLocation(params: SectionListScrollParams): void;

  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
   * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
   * taps on items or by navigation actions.
   */
  recordInteraction(): void;

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators(): void;

  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder(): ScrollView | undefined;

  /**
   * Provides a handle to the underlying scroll node.
   */
  getScrollableNode(): NodeHandle | undefined;
}

/* This definition is deprecated because it extends the wrong base type */
export interface SectionListStatic<ItemT, SectionT = DefaultSectionT>
  extends React.ComponentClass<SectionListProps<ItemT, SectionT>> {
  /**
   * Scrolls to the item at the specified sectionIndex and itemIndex (within the section)
   * positioned in the viewable area such that viewPosition 0 places it at the top
   * (and may be covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle.
   */
  scrollToLocation?(params: SectionListScrollParams): void;
}

/**
 * @see https://reactnative.dev/docs/virtualizedlist
 */

export class VirtualizedList<ItemT> extends React.Component<
  VirtualizedListProps<ItemT>
> {
  scrollToEnd: (params?: {animated?: boolean | undefined}) => void;
  scrollToIndex: (params: {
    animated?: boolean | undefined;
    index: number;
    viewOffset?: number | undefined;
    viewPosition?: number | undefined;
  }) => void;
  scrollToItem: (params: {
    animated?: boolean | undefined;
    item: ItemT;
    viewPosition?: number | undefined;
  }) => void;

  /**
   * Scroll to a specific content pixel offset in the list.
   * Param `offset` expects the offset to scroll to. In case of horizontal is true, the
   * offset is the x-value, in any other case the offset is the y-value.
   * Param `animated` (true by default) defines whether the list should do an animation while scrolling.
   */
  scrollToOffset: (params: {
    animated?: boolean | undefined;
    offset: number;
  }) => void;

  recordInteraction: () => void;
}

/**
 * @see https://reactnative.dev/docs/virtualizedlist#props
 */

export interface VirtualizedListProps<ItemT>
  extends VirtualizedListWithoutRenderItemProps<ItemT> {
  renderItem: ListRenderItem<ItemT> | null | undefined;
}

export interface VirtualizedListWithoutRenderItemProps<ItemT>
  extends ScrollViewProps {
  /**
   * Rendered when the list is empty. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListEmptyComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Rendered at the bottom of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListFooterComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * Rendered at the top of all the items. Can be a React Component Class, a render function, or
   * a rendered element.
   */
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;

  /**
   * The default accessor functions assume this is an Array<{key: string}> but you can override
   * getItem, getItemCount, and keyExtractor to handle any type of index-based data.
   */
  data?: any;

  /**
   * `debug` will turn on extra logging and visual overlays to aid with debugging both usage and
   * implementation, but with a significant perf hit.
   */
  debug?: boolean | undefined;

  /**
   * DEPRECATED: Virtualization provides significant performance and memory optimizations, but fully
   * unmounts react instances that are outside of the render window. You should only need to disable
   * this for debugging purposes.
   */
  disableVirtualization?: boolean | undefined;

  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any;

  /**
   * A generic accessor for extracting an item from any sort of data blob.
   */
  getItem?: ((data: any, index: number) => ItemT) | undefined;

  /**
   * Determines how many items are in the data blob.
   */
  getItemCount?: ((data: any) => number) | undefined;

  getItemLayout?:
    | ((
        data: any,
        index: number,
      ) => {
        length: number;
        offset: number;
        index: number;
      })
    | undefined;

  horizontal?: boolean | null | undefined;

  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: number | undefined;

  /**
   * Instead of starting at the top with the first item, start at `initialScrollIndex`. This
   * disables the "scroll to top" optimization that keeps the first `initialNumToRender` items
   * always rendered and immediately renders the items starting at this initial index. Requires
   * `getItemLayout` to be implemented.
   */
  initialScrollIndex?: number | null | undefined;

  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: boolean | null | undefined;

  keyExtractor?: ((item: ItemT, index: number) => string) | undefined;

  /**
   * The maximum number of items to render in each incremental render batch. The more rendered at
   * once, the better the fill rate, but responsiveness my suffer because rendering content may
   * interfere with responding to button taps or other interactions.
   */
  maxToRenderPerBatch?: number | undefined;

  onEndReached?: ((info: {distanceFromEnd: number}) => void) | null | undefined;

  onEndReachedThreshold?: number | null | undefined;

  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   * If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make
   * sure to also set the `refreshing` prop correctly.
   */
  onRefresh?: (() => void) | null | undefined;

  /**
   * Used to handle failures when scrolling to an index that has not been measured yet.
   * Recommended action is to either compute your own offset and `scrollTo` it, or scroll as far
   * as possible and then try again after more items have been rendered.
   */
  onScrollToIndexFailed?:
    | ((info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
      }) => void)
    | undefined;

  /**
   * Called when the viewability of rows changes, as defined by the
   * `viewabilityConfig` prop.
   */
  onViewableItemsChanged?:
    | ((info: {
        viewableItems: Array<ViewToken>;
        changed: Array<ViewToken>;
      }) => void)
    | null
    | undefined;

  /**
   * Set this when offset is needed for the loading indicator to show correctly.
   * @platform android
   */
  progressViewOffset?: number | undefined;

  /**
   * Set this true while waiting for new data from a refresh.
   */
  refreshing?: boolean | null | undefined;

  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * Render a custom scroll component, e.g. with a differently styled `RefreshControl`.
   */
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;

  /**
   * Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off
   * screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.
   */
  updateCellsBatchingPeriod?: number | undefined;

  viewabilityConfig?: ViewabilityConfig | undefined;

  viewabilityConfigCallbackPairs?: ViewabilityConfigCallbackPairs | undefined;

  /**
   * Determines the maximum number of items rendered outside of the visible area, in units of
   * visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will
   * render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing
   * this number will reduce memory consumption and may improve performance, but will increase the
   * chance that fast scrolling may reveal momentary blank areas of unrendered content.
   */
  windowSize?: number | undefined;

  CellRendererComponent?: React.ComponentType<any> | undefined;
}

/**
 * @see https://reactnative.dev/docs/listview#props
 */
export interface ListViewProps extends ScrollViewProps {
  /**
   * An instance of [ListView.DataSource](docs/listviewdatasource.html) to use
   */
  dataSource: ListViewDataSource;

  /**
   * Flag indicating whether empty section headers should be rendered.
   * In the future release empty section headers will be rendered by
   * default, and the flag will be deprecated. If empty sections are not
   * desired to be rendered their indices should be excluded from
   * sectionID object.
   */
  enableEmptySections?: boolean | undefined;

  /**
   * How many rows to render on initial component mount.  Use this to make
   * it so that the first screen worth of data apears at one time instead of
   * over the course of multiple frames.
   */
  initialListSize?: number | undefined;

  /**
   * (visibleRows, changedRows) => void
   *
   * Called when the set of visible rows changes.  `visibleRows` maps
   * { sectionID: { rowID: true }} for all the visible rows, and
   * `changedRows` maps { sectionID: { rowID: true | false }} for the rows
   * that have changed their visibility, with true indicating visible, and
   * false indicating the view has moved out of view.
   */
  onChangeVisibleRows?:
    | ((
        visibleRows: Array<{[sectionId: string]: {[rowID: string]: boolean}}>,
        changedRows: Array<{[sectionId: string]: {[rowID: string]: boolean}}>,
      ) => void)
    | undefined;

  /**
   * Called when all rows have been rendered and the list has been scrolled
   * to within onEndReachedThreshold of the bottom.  The native scroll
   * event is provided.
   */
  onEndReached?: (() => void) | undefined;

  /**
   * Threshold in pixels for onEndReached.
   */
  onEndReachedThreshold?: number | undefined;

  /**
   * Number of rows to render per event loop.
   */
  pageSize?: number | undefined;

  /**
   * A performance optimization for improving scroll perf of
   * large lists, used in conjunction with overflow: 'hidden' on the row
   * containers.  Use at your own risk.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * () => renderable
   *
   * The header and footer are always rendered (if these props are provided)
   * on every render pass.  If they are expensive to re-render, wrap them
   * in StaticContainer or other mechanism as appropriate.  Footer is always
   * at the bottom of the list, and header at the top, on every render pass.
   */
  renderFooter?: (() => React.ReactElement) | undefined;

  /**
   * () => renderable
   *
   * The header and footer are always rendered (if these props are provided)
   * on every render pass.  If they are expensive to re-render, wrap them
   * in StaticContainer or other mechanism as appropriate.  Footer is always
   * at the bottom of the list, and header at the top, on every render pass.
   */
  renderHeader?: (() => React.ReactElement) | undefined;

  /**
   * (rowData, sectionID, rowID) => renderable
   * Takes a data entry from the data source and its ids and should return
   * a renderable component to be rendered as the row.  By default the data
   * is exactly what was put into the data source, but it's also possible to
   * provide custom extractors.
   */
  renderRow: (
    rowData: any,
    sectionID: string | number,
    rowID: string | number,
    highlightRow?: boolean,
  ) => React.ReactElement;

  /**
   * A function that returns the scrollable component in which the list rows are rendered.
   * Defaults to returning a ScrollView with the given props.
   */
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;

  /**
   * (sectionData, sectionID) => renderable
   *
   * If provided, a sticky header is rendered for this section.  The sticky
   * behavior means that it will scroll with the content at the top of the
   * section until it reaches the top of the screen, at which point it will
   * stick to the top until it is pushed off the screen by the next section
   * header.
   */
  renderSectionHeader?:
    | ((sectionData: any, sectionId: string | number) => React.ReactElement)
    | undefined;

  /**
   * (sectionID, rowID, adjacentRowHighlighted) => renderable
   * If provided, a renderable component to be rendered as the separator below each row
   * but not the last row if there is a section header below.
   * Take a sectionID and rowID of the row above and whether its adjacent row is highlighted.
   */
  renderSeparator?:
    | ((
        sectionID: string | number,
        rowID: string | number,
        adjacentRowHighlighted?: boolean,
      ) => React.ReactElement)
    | undefined;

  /**
   * How early to start rendering rows before they come on screen, in
   * pixels.
   */
  scrollRenderAheadDistance?: number | undefined;

  /**
   * An array of child indices determining which children get docked to the
   * top of the screen when scrolling. For example, passing
   * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
   * top of the scroll view. This property is not supported in conjunction
   * with `horizontal={true}`.
   * @platform ios
   */
  stickyHeaderIndices?: number[] | undefined;

  /**
   * Makes the sections headers sticky. The sticky behavior means that it will scroll with the
   * content at the top of the section until it reaches the top of the screen, at which point it
   * will stick to the top until it is pushed off the screen by the next section header. This
   * property is not supported in conjunction with `horizontal={true}`. Only enabled by default
   * on iOS because of typical platform standards.
   */
  stickySectionHeadersEnabled?: boolean | undefined;
}

interface TimerMixin {
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  setImmediate: typeof setImmediate;
  clearImmediate: typeof clearImmediate;
  requestAnimationFrame: typeof requestAnimationFrame;
  cancelAnimationFrame: typeof cancelAnimationFrame;
}

declare class ListViewComponent extends React.Component<ListViewProps> {}
declare const ListViewBase: Constructor<ScrollResponderMixin> &
  Constructor<TimerMixin> &
  typeof ListViewComponent;
/**
 * @deprecated See Flatlist or SectionList
 * or use `deprecated-react-native-listview`
 * @see https://fb.me/nolistview
 */
export class ListView extends ListViewBase {
  static DataSource: ListViewDataSource;

  /**
   * Exports some data, e.g. for perf investigations or analytics.
   */
  getMetrics: () => {
    contentLength: number;
    totalRows: number;
    renderedRows: number;
    visibleRows: number;
  };

  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder: () => any;

  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   *
   * See `ScrollView#scrollTo`.
   */
  scrollTo: (
    y?:
      | number
      | {
          x?: number | undefined;
          y?: number | undefined;
          animated?: boolean | undefined;
        },
    x?: number,
    animated?: boolean,
  ) => void;
}

interface MaskedViewIOSProps extends ViewProps {
  maskElement: React.ReactElement;
}

/**
 * @see https://reactnative.dev/docs/maskedviewios
 */
declare class MaskedViewComponent extends React.Component<MaskedViewIOSProps> {}
declare const MaskedViewBase: Constructor<NativeMethods> &
  typeof MaskedViewComponent;
/**
 * MaskedViewIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/masked-view` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-masked-view
 * @deprecated
 */
export class MaskedViewIOS extends MaskedViewBase {}

export interface ModalBaseProps {
  /**
   * @deprecated Use animationType instead
   */
  animated?: boolean | undefined;
  /**
   * The `animationType` prop controls how the modal animates.
   *
   * - `slide` slides in from the bottom
   * - `fade` fades into view
   * - `none` appears without an animation
   */
  animationType?: 'none' | 'slide' | 'fade' | undefined;
  /**
   * The `transparent` prop determines whether your modal will fill the entire view.
   * Setting this to `true` will render the modal over a transparent background.
   */
  transparent?: boolean | undefined;
  /**
   * The `visible` prop determines whether your modal is visible.
   */
  visible?: boolean | undefined;
  /**
   * The `onRequestClose` callback is called when the user taps the hardware back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   */
  onRequestClose?: ((event: NativeSyntheticEvent<any>) => void) | undefined;
  /**
   * The `onShow` prop allows passing a function that will be called once the modal has been shown.
   */
  onShow?: ((event: NativeSyntheticEvent<any>) => void) | undefined;
}

export interface ModalPropsIOS {
  /**
   * The `presentationStyle` determines the style of modal to show
   */
  presentationStyle?:
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'overFullScreen'
    | undefined;

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   * On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.
   */
  supportedOrientations?:
    | Array<
        | 'portrait'
        | 'portrait-upside-down'
        | 'landscape'
        | 'landscape-left'
        | 'landscape-right'
      >
    | undefined;

  /**
   * The `onDismiss` prop allows passing a function that will be called once the modal has been dismissed.
   */
  onDismiss?: (() => void) | undefined;

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   * The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.
   */
  onOrientationChange?:
    | ((event: NativeSyntheticEvent<any>) => void)
    | undefined;
}

export interface ModalPropsAndroid {
  /**
   *  Controls whether to force hardware acceleration for the underlying window.
   */
  hardwareAccelerated?: boolean | undefined;

  /**
   *  Determines whether your modal should go under the system statusbar.
   */
  statusBarTranslucent?: boolean | undefined;
}

export type ModalProps = ModalBaseProps &
  ModalPropsIOS &
  ModalPropsAndroid &
  ViewProps;

export class Modal extends React.Component<ModalProps> {}

/**
 * @see https://github.com/facebook/react-native/blob/0.34-stable\Libraries\Components\Touchable\Touchable.js
 */
interface TouchableMixin {
  /**
   * Invoked when the item should be highlighted. Mixers should implement this
   * to visually distinguish the `VisualRect` so that the user knows that
   * releasing a touch will result in a "selection" (analog to click).
   */
  touchableHandleActivePressIn(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is "active" (in that it is still eligible to become
   * a "select") but the touch has left the `PressRect`. Usually the mixer will
   * want to unhighlight the `VisualRect`. If the user (while pressing) moves
   * back into the `PressRect` `touchableHandleActivePressIn` will be invoked
   * again and the mixer should probably highlight the `VisualRect` again. This
   * event will not fire on an `touchEnd/mouseUp` event, only move events while
   * the user is depressing the mouse/touch.
   */
  touchableHandleActivePressOut(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is "selected" - meaning the interaction ended by
   * letting up while the item was either in the state
   * `RESPONDER_ACTIVE_PRESS_IN` or `RESPONDER_INACTIVE_PRESS_IN`.
   */
  touchableHandlePress(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is long pressed - meaning the interaction ended by
   * letting up while the item was in `RESPONDER_ACTIVE_LONG_PRESS_IN`. If
   * `touchableHandleLongPress` is *not* provided, `touchableHandlePress` will
   * be called as it normally is. If `touchableHandleLongPress` is provided, by
   * default any `touchableHandlePress` callback will not be invoked. To
   * override this default behavior, override `touchableLongPressCancelsPress`
   * to return false. As a result, `touchableHandlePress` will be called when
   * lifting up, even if `touchableHandleLongPress` has also been called.
   */
  touchableHandleLongPress(e: GestureResponderEvent): void;

  /**
   * Returns the amount to extend the `HitRect` into the `PressRect`. Positive
   * numbers mean the size expands outwards.
   */
  touchableGetPressRectOffset(): Insets;

  /**
   * Returns the number of millis to wait before triggering a highlight.
   */
  touchableGetHighlightDelayMS(): number;

  // These methods are undocumented but still being used by TouchableMixin internals
  touchableGetLongPressDelayMS(): number;
  touchableGetPressOutDelayMS(): number;
  touchableGetHitSlop(): Insets;
}

export interface TouchableWithoutFeedbackPropsIOS {}

export interface TouchableWithoutFeedbackPropsAndroid {
  /**
   * If true, doesn't play a system sound on touch.
   *
   * @platform android
   */
  touchSoundDisabled?: boolean | null | undefined;
}

/**
 * @see https://reactnative.dev/docs/touchablewithoutfeedback#props
 */
export interface TouchableWithoutFeedbackProps
  extends TouchableWithoutFeedbackPropsIOS,
    TouchableWithoutFeedbackPropsAndroid,
    AccessibilityProps {
  children?: React.ReactNode;

  /**
   * Delay in ms, from onPressIn, before onLongPress is called.
   */
  delayLongPress?: number | undefined;

  /**
   * Delay in ms, from the start of the touch, before onPressIn is called.
   */
  delayPressIn?: number | undefined;

  /**
   * Delay in ms, from the release of the touch, before onPressOut is called.
   */
  delayPressOut?: number | undefined;

  /**
   * If true, disable all interactions for this component.
   */
  disabled?: boolean | null | undefined;

  /**
   * This defines how far your touch can start away from the button.
   * This is added to pressRetentionOffset when moving off of the button.
   * NOTE The touch area never extends past the parent view bounds and
   * the Z-index of sibling views always takes precedence if a touch hits
   * two overlapping views.
   */
  hitSlop?: Insets | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "blur" occurs, meaning the element lost focus.
   * Some platforms may not have the concept of blur.
   */
  onBlur?: ((e: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * When `accessible` is true (which is the default) this may be called when
   * the OS-specific concept of "focus" occurs. Some platforms may not have
   * the concept of focus.
   */
  onFocus?: ((e: NativeSyntheticEvent<TargetedEvent>) => void) | undefined;

  /**
   * Invoked on mount and layout changes with
   * {nativeEvent: {layout: {x, y, width, height}}}
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Called when the touch is released,
   * but not if cancelled (e.g. by a scroll that steals the responder lock).
   */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;

  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;

  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * //FIXME: not in doc but available in examples
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * When the scroll view is disabled, this defines how far your
   * touch may move off of the button, before deactivating the button.
   * Once deactivated, try moving it back and you'll see that the button
   * is once again reactivated! Move it back and forth several times
   * while the scroll view is disabled. Ensure you pass in a constant
   * to reduce memory allocations.
   */
  pressRetentionOffset?: Insets | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;
}

/**
 * Do not use unless you have a very good reason.
 * All the elements that respond to press should have a visual feedback when touched.
 * This is one of the primary reason a "web" app doesn't feel "native".
 *
 * @see https://reactnative.dev/docs/touchablewithoutfeedback
 */
declare class TouchableWithoutFeedbackComponent extends React.Component<TouchableWithoutFeedbackProps> {}
declare const TouchableWithoutFeedbackBase: Constructor<TimerMixin> &
  Constructor<TouchableMixin> &
  typeof TouchableWithoutFeedbackComponent;
export class TouchableWithoutFeedback extends TouchableWithoutFeedbackBase {}

/**
 * @see https://reactnative.dev/docs/touchablehighlight#props
 */
export interface TouchableHighlightProps extends TouchableWithoutFeedbackProps {
  /**
   * Determines what the opacity of the wrapped view should be when touch is active.
   */
  activeOpacity?: number | undefined;

  /**
   *
   * Called immediately after the underlay is hidden
   */
  onHideUnderlay?: (() => void) | undefined;

  /**
   * Called immediately after the underlay is shown
   */
  onShowUnderlay?: (() => void) | undefined;

  /**
   * @see https://reactnative.dev/docs/view#style
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * The color of the underlay that will show through when the touch is active.
   */
  underlayColor?: ColorValue | undefined;
}

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased,
 * which allows the underlay color to show through, darkening or tinting the view.
 * The underlay comes from adding a view to the view hierarchy,
 * which can sometimes cause unwanted visual artifacts if not used correctly,
 * for example if the backgroundColor of the wrapped view isn't explicitly set to an opaque color.
 *
 * NOTE: TouchableHighlight supports only one child
 * If you wish to have several child components, wrap them in a View.
 *
 * @see https://reactnative.dev/docs/touchablehighlight
 */
declare class TouchableHighlightComponent extends React.Component<TouchableHighlightProps> {}
declare const TouchableHighlightBase: Constructor<NativeMethods> &
  Constructor<TimerMixin> &
  Constructor<TouchableMixin> &
  typeof TouchableHighlightComponent;
export class TouchableHighlight extends TouchableHighlightBase {}

/**
 * @see https://reactnative.dev/docs/touchableopacity#props
 */
export interface TouchableOpacityProps
  extends TouchableWithoutFeedbackProps,
    TVProps {
  /**
   * Determines what the opacity of the wrapped view should be when touch is active.
   * Defaults to 0.2
   */
  activeOpacity?: number | undefined;

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * enabled: If true, parallax effects are enabled.  Defaults to true.
   * shiftDistanceX: Defaults to 2.0.
   * shiftDistanceY: Defaults to 2.0.
   * tiltAngle: Defaults to 0.05.
   * magnification: Defaults to 1.0.
   * pressMagnification: Defaults to 1.0.
   * pressDuration: Defaults to 0.3.
   * pressDelay: Defaults to 0.0.
   *
   * @platform android
   */
  tvParallaxProperties?: TVParallaxProperties | undefined;
}

/**
 * A wrapper for making views respond properly to touches.
 * On press down, the opacity of the wrapped view is decreased, dimming it.
 * This is done without actually changing the view hierarchy,
 * and in general is easy to add to an app without weird side-effects.
 *
 * @see https://reactnative.dev/docs/touchableopacity
 */
declare class TouchableOpacityComponent extends React.Component<TouchableOpacityProps> {}
declare const TouchableOpacityBase: Constructor<TimerMixin> &
  Constructor<TouchableMixin> &
  Constructor<NativeMethods> &
  typeof TouchableOpacityComponent;
export class TouchableOpacity extends TouchableOpacityBase {
  /**
   * Animate the touchable to a new opacity.
   */
  setOpacityTo: (value: number) => void;
}

interface BaseBackgroundPropType {
  type: string;
  rippleRadius?: number | null | undefined;
}

interface RippleBackgroundPropType extends BaseBackgroundPropType {
  type: 'RippleAndroid';
  borderless: boolean;
  color?: number | null | undefined;
}

interface ThemeAttributeBackgroundPropType extends BaseBackgroundPropType {
  type: 'ThemeAttrAndroid';
  attribute: string;
}

type BackgroundPropType =
  | RippleBackgroundPropType
  | ThemeAttributeBackgroundPropType;

interface TVProps {
  /**
   * *(Apple TV only)* TV preferred focus (see documentation for the View component).
   *
   * @platform ios
   */
  hasTVPreferredFocus?: boolean | undefined;

  /**
   * Designates the next view to receive focus when the user navigates down. See the Android documentation.
   *
   * @platform android
   */
  nextFocusDown?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates forward. See the Android documentation.
   *
   * @platform android
   */
  nextFocusForward?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates left. See the Android documentation.
   *
   * @platform android
   */
  nextFocusLeft?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates right. See the Android documentation.
   *
   * @platform android
   */
  nextFocusRight?: number | undefined;

  /**
   * Designates the next view to receive focus when the user navigates up. See the Android documentation.
   *
   * @platform android
   */
  nextFocusUp?: number | undefined;
}

/**
 * @see https://reactnative.dev/docs/touchablenativefeedback#props
 */
export interface TouchableNativeFeedbackProps
  extends TouchableWithoutFeedbackProps,
    TVProps {
  /**
   * Determines the type of background drawable that's going to be used to display feedback.
   * It takes an object with type property and extra data depending on the type.
   * It's recommended to use one of the following static methods to generate that dictionary:
   *      1) TouchableNativeFeedback.SelectableBackground() - will create object that represents android theme's
   *         default background for selectable elements (?android:attr/selectableItemBackground)
   *      2) TouchableNativeFeedback.SelectableBackgroundBorderless() - will create object that represent android
   *         theme's default background for borderless selectable elements
   *         (?android:attr/selectableItemBackgroundBorderless). Available on android API level 21+
   *      3) TouchableNativeFeedback.Ripple(color, borderless) - will create object that represents ripple drawable
   *         with specified color (as a string). If property borderless evaluates to true the ripple will render
   *         outside of the view bounds (see native actionbar buttons as an example of that behavior). This background
   *         type is available on Android API level 21+
   */
  background?: BackgroundPropType | undefined;
  useForeground?: boolean | undefined;
}

/**
 * A wrapper for making views respond properly to touches (Android only).
 * On Android this component uses native state drawable to display touch feedback.
 * At the moment it only supports having a single View instance as a child node,
 * as it's implemented by replacing that View with another instance of RCTView node with some additional properties set.
 *
 * Background drawable of native feedback touchable can be customized with background property.
 *
 * @see https://reactnative.dev/docs/touchablenativefeedback#content
 */
declare class TouchableNativeFeedbackComponent extends React.Component<TouchableNativeFeedbackProps> {}
declare const TouchableNativeFeedbackBase: Constructor<TouchableMixin> &
  typeof TouchableNativeFeedbackComponent;
export class TouchableNativeFeedback extends TouchableNativeFeedbackBase {
  /**
   * Creates an object that represents android theme's default background for
   * selectable elements (?android:attr/selectableItemBackground).
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackground(
    rippleRadius?: number | null,
  ): ThemeAttributeBackgroundPropType;

  /**
   * Creates an object that represent android theme's default background for borderless
   * selectable elements (?android:attr/selectableItemBackgroundBorderless).
   * Available on android API level 21+.
   *
   * @param rippleRadius The radius of ripple effect
   */
  static SelectableBackgroundBorderless(
    rippleRadius?: number | null,
  ): ThemeAttributeBackgroundPropType;

  /**
   * Creates an object that represents ripple drawable with specified color (as a
   * string). If property `borderless` evaluates to true the ripple will
   * render outside of the view bounds (see native actionbar buttons as an
   * example of that behavior). This background type is available on Android
   * API level 21+.
   *
   * @param color The ripple color
   * @param borderless If the ripple can render outside it's bounds
   * @param rippleRadius The radius of ripple effect
   */
  static Ripple(
    color: ColorValue,
    borderless: boolean,
    rippleRadius?: number | null,
  ): RippleBackgroundPropType;
  static canUseNativeForeground(): boolean;
}

export interface Route {
  component?: React.ComponentType<any> | undefined;
  id?: string | undefined;
  title?: string | undefined;
  passProps?: Object | undefined;

  //anything else
  [key: string]: any;

  //Commonly found properties
  backButtonTitle?: string | undefined;
  content?: string | undefined;
  message?: string | undefined;
  index?: number | undefined;
  onRightButtonPress?: (() => void) | undefined;
  rightButtonTitle?: string | undefined;
  wrapperStyle?: any;
}

interface InteractionMixin {
  createInteractionHandle(): number;
  clearInteractionHandle(clearHandle: number): void;
  /**
   * Schedule work for after all interactions have completed.
   *
   */
  runAfterInteractions(callback: () => any): void;
}

interface SubscribableMixin {
  /**
   * Special form of calling `addListener` that *guarantees* that a
   * subscription *must* be tied to a component instance, and therefore will
   * be cleaned up when the component is unmounted. It is impossible to create
   * the subscription and pass it in - this method must be the one to create
   * the subscription and therefore can guarantee it is retained in a way that
   * will be cleaned up.
   *
   * @param eventEmitter emitter to subscribe to.
   * @param eventType Type of event to listen to.
   * @param listener Function to invoke when event occurs.
   * @param context Object to use as listener context.
   */
  addListenerOn(
    eventEmitter: any,
    eventType: string,
    listener: () => any,
    context: any,
  ): void;
}

// @see https://github.com/facebook/react-native/blob/0.34-stable\Libraries\StyleSheet\StyleSheetTypes.js
export namespace StyleSheet {
  type NamedStyles<T> = {[P in keyof T]: ViewStyle | TextStyle | ImageStyle};

  /**
   * Creates a StyleSheet style reference from the given object.
   */
  export function create<T extends NamedStyles<T> | NamedStyles<any>>(
    styles: T | NamedStyles<T>,
  ): T;

  /**
   * Flattens an array of style objects, into one aggregated style object.
   * Alternatively, this method can be used to lookup IDs, returned by
   * StyleSheet.register.
   *
   * > **NOTE**: Exercise caution as abusing this can tax you in terms of
   * > optimizations.
   * >
   * > IDs enable optimizations through the bridge and memory in general. Referring
   * > to style objects directly will deprive you of these optimizations.
   *
   * Example:
   * ```
   * const styles = StyleSheet.create({
   *   listItem: {
   *     flex: 1,
   *     fontSize: 16,
   *     color: 'white'
   *   },
   *   selectedListItem: {
   *     color: 'green'
   *   }
   * });
   *
   * StyleSheet.flatten([styles.listItem, styles.selectedListItem])
   * // returns { flex: 1, fontSize: 16, color: 'green' }
   * ```
   * Alternative use:
   * ```
   * StyleSheet.flatten(styles.listItem);
   * // return { flex: 1, fontSize: 16, color: 'white' }
   * // Simply styles.listItem would return its ID (number)
   * ```
   * This method internally uses `StyleSheetRegistry.getStyleByID(style)`
   * to resolve style objects represented by IDs. Thus, an array of style
   * objects (instances of StyleSheet.create), are individually resolved to,
   * their respective objects, merged as one and then returned. This also explains
   * the alternative use.
   */
  export function flatten<T>(
    style?: StyleProp<T>,
  ): T extends (infer U)[] ? U : T;

  /**
   * Combines two styles such that style2 will override any styles in style1.
   * If either style is falsy, the other one is returned without allocating
   * an array, saving allocations and maintaining reference equality for
   * PureComponent checks.
   */
  export function compose<T>(
    style1: StyleProp<T> | Array<StyleProp<T>>,
    style2: StyleProp<T> | Array<StyleProp<T>>,
  ): StyleProp<T>;

  /**
   * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
   * not be reliably announced. The whole thing might be deleted, who knows? Use
   * at your own risk.
   *
   * Sets a function to use to pre-process a style property value. This is used
   * internally to process color and transform values. You should not use this
   * unless you really know what you are doing and have exhausted other options.
   */
  export function setStyleAttributePreprocessor(
    property: string,
    process: (nextProp: any) => any,
  ): void;

  /**
   * This is defined as the width of a thin line on the platform. It can be
   * used as the thickness of a border or division between two elements.
   * Example:
   * ```
   *   {
   *     borderBottomColor: '#bbb',
   *     borderBottomWidth: StyleSheet.hairlineWidth
   *   }
   * ```
   *
   * This constant will always be a round number of pixels (so a line defined
   * by it look crisp) and will try to match the standard width of a thin line
   * on the underlying platform. However, you should not rely on it being a
   * constant size, because on different platforms and screen densities its
   * value may be calculated differently.
   */
  export const hairlineWidth: number;

  interface AbsoluteFillStyle {
    position: 'absolute';
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  /**
   * Sometimes you may want `absoluteFill` but with a couple tweaks - `absoluteFillObject` can be
   * used to create a customized entry in a `StyleSheet`, e.g.:
   *
   *   const styles = StyleSheet.create({
   *     wrapper: {
   *       ...StyleSheet.absoluteFillObject,
   *       top: 10,
   *       backgroundColor: 'transparent',
   *     },
   *   });
   */
  export const absoluteFillObject: AbsoluteFillStyle;

  /**
   * A very common pattern is to create overlays with position absolute and zero positioning,
   * so `absoluteFill` can be used for convenience and to reduce duplication of these repeated
   * styles.
   */
  export const absoluteFill: RegisteredStyle<AbsoluteFillStyle>;
}

export interface RelayProfiler {
  attachProfileHandler(
    name: string,
    handler: (name: string, state?: any) => () => void,
  ): void;

  attachAggregateHandler(
    name: string,
    handler: (name: string, callback: () => void) => void,
  ): void;
}

export interface SystraceStatic {
  setEnabled(enabled: boolean): void;

  /**
   * beginEvent/endEvent for starting and then ending a profile within the same call stack frame
   **/
  beginEvent(profileName?: any, args?: any): void;
  endEvent(): void;

  /**
   * beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either
   * occur on another thread or out of the current stack frame, eg await
   * the returned cookie variable should be used as input into the endAsyncEvent call to end the profile
   **/
  beginAsyncEvent(profileName?: any): any;
  endAsyncEvent(profileName?: any, cookie?: any): void;

  /**
   * counterEvent registers the value to the profileName on the systrace timeline
   **/
  counterEvent(profileName?: any, value?: any): void;

  /**
   * Relay profiles use await calls, so likely occur out of current stack frame
   * therefore async variant of profiling is used
   **/
  attachToRelayProfiler(relayProfiler: RelayProfiler): void;

  /* This is not called by default due to perf overhead but it's useful
        if you want to find traces which spend too much time in JSON. */
  swizzleJSON(): void;

  /**
   * Measures multiple methods of a class. For example, you can do:
   * Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);
   *
   * @param methodNames Map from method names to method display names.
   */
  measureMethods(
    object: any,
    objectName: string,
    methodNames: Array<string>,
  ): void;

  /**
   * Returns an profiled version of the input function. For example, you can:
   * JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);
   *
   * @return replacement function
   */
  measure<T extends Function>(objName: string, fnName: string, func: T): T;
}

/**
 * //FIXME: Could not find docs. Inferred from examples and jscode : ListViewDataSource.js
 */
export interface DataSourceAssetCallback {
  rowHasChanged?: ((r1: any, r2: any) => boolean) | undefined;
  sectionHeaderHasChanged?: ((h1: any, h2: any) => boolean) | undefined;
  getRowData?:
    | ((
        dataBlob: any,
        sectionID: number | string,
        rowID: number | string,
      ) => any)
    | undefined;
  getSectionHeaderData?:
    | ((dataBlob: any, sectionID: number | string) => any)
    | undefined;
}

/**
 * Provides efficient data processing and access to the
 * `ListView` component.  A `ListViewDataSource` is created with functions for
 * extracting data from the input blob, and comparing elements (with default
 * implementations for convenience).  The input blob can be as simple as an
 * array of strings, or an object with rows nested inside section objects.
 *
 * To update the data in the datasource, use `cloneWithRows` (or
 * `cloneWithRowsAndSections` if you care about sections).  The data in the
 * data source is immutable, so you can't modify it directly.  The clone methods
 * suck in the new data and compute a diff for each row so ListView knows
 * whether to re-render it or not.
 */
export interface ListViewDataSource {
  /**
   * You can provide custom extraction and `hasChanged` functions for section
   * headers and rows.  If absent, data will be extracted with the
   * `defaultGetRowData` and `defaultGetSectionHeaderData` functions.
   *
   * The default extractor expects data of one of the following forms:
   *
   *      { sectionID_1: { rowID_1: <rowData1>, ... }, ... }
   *
   *    or
   *
   *      { sectionID_1: [ <rowData1>, <rowData2>, ... ], ... }
   *
   *    or
   *
   *      [ [ <rowData1>, <rowData2>, ... ], ... ]
   *
   * The constructor takes in a params argument that can contain any of the
   * following:
   *
   * - getRowData(dataBlob, sectionID, rowID);
   * - getSectionHeaderData(dataBlob, sectionID);
   * - rowHasChanged(prevRowData, nextRowData);
   * - sectionHeaderHasChanged(prevSectionData, nextSectionData);
   */
  new (onAsset: DataSourceAssetCallback): ListViewDataSource;

  /**
   * Clones this `ListViewDataSource` with the specified `dataBlob` and
   * `rowIdentities`. The `dataBlob` is just an aribitrary blob of data. At
   * construction an extractor to get the interesting information was defined
   * (or the default was used).
   *
   * The `rowIdentities` is is a 2D array of identifiers for rows.
   * ie. [['a1', 'a2'], ['b1', 'b2', 'b3'], ...].  If not provided, it's
   * assumed that the keys of the section data are the row identities.
   *
   * Note: This function does NOT clone the data in this data source. It simply
   * passes the functions defined at construction to a new data source with
   * the data specified. If you wish to maintain the existing data you must
   * handle merging of old and new data separately and then pass that into
   * this function as the `dataBlob`.
   */
  cloneWithRows(
    dataBlob: Array<any> | {[key: string]: any},
    rowIdentities?: Array<string | number>,
  ): ListViewDataSource;

  /**
   * This performs the same function as the `cloneWithRows` function but here
   * you also specify what your `sectionIdentities` are. If you don't care
   * about sections you should safely be able to use `cloneWithRows`.
   *
   * `sectionIdentities` is an array of identifiers for  sections.
   * ie. ['s1', 's2', ...].  If not provided, it's assumed that the
   * keys of dataBlob are the section identities.
   *
   * Note: this returns a new object!
   */
  cloneWithRowsAndSections(
    dataBlob: Array<any> | {[key: string]: any},
    sectionIdentities?: Array<string | number>,
    rowIdentities?: Array<Array<string | number>>,
  ): ListViewDataSource;

  getRowCount(): number;
  getRowAndSectionCount(): number;

  /**
   * Returns if the row is dirtied and needs to be rerendered
   */
  rowShouldUpdate(sectionIndex: number, rowIndex: number): boolean;

  /**
   * Gets the data required to render the row.
   */
  getRowData(sectionIndex: number, rowIndex: number): any;

  /**
   * Gets the rowID at index provided if the dataSource arrays were flattened,
   * or null of out of range indexes.
   */
  getRowIDForFlatIndex(index: number): string;

  /**
   * Gets the sectionID at index provided if the dataSource arrays were flattened,
   * or null for out of range indexes.
   */
  getSectionIDForFlatIndex(index: number): string;

  /**
   * Returns an array containing the number of rows in each section
   */
  getSectionLengths(): Array<number>;

  /**
   * Returns if the section header is dirtied and needs to be rerendered
   */
  sectionHeaderShouldUpdate(sectionIndex: number): boolean;

  /**
   * Gets the data required to render the section header
   */
  getSectionHeaderData(sectionIndex: number): any;
}

/**
 * @see https://reactnative.dev/docs/tabbarios-item#props
 */
export interface TabBarIOSItemProps extends ViewProps {
  /**
   * Little red bubble that sits at the top right of the icon.
   */
  badge?: string | number | undefined;

  /**
   * Background color for the badge. Available since iOS 10.
   */
  badgeColor?: ColorValue | undefined;

  /**
   * A custom icon for the tab. It is ignored when a system icon is defined.
   */
  icon?: ImageURISource | undefined;

  /**
   * Callback when this tab is being selected,
   * you should change the state of your component to set selected={true}.
   */
  onPress?: (() => void) | undefined;

  /**
   * If set to true it renders the image as original,
   * it defaults to being displayed as a template
   */
  renderAsOriginal?: boolean | undefined;

  /**
   * It specifies whether the children are visible or not. If you see a blank content, you probably forgot to add a selected one.
   */
  selected?: boolean | undefined;

  /**
   * A custom icon when the tab is selected.
   * It is ignored when a system icon is defined. If left empty, the icon will be tinted in blue.
   */
  selectedIcon?: ImageURISource | undefined;

  /**
   * React style object.
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * Items comes with a few predefined system icons.
   * Note that if you are using them, the title and selectedIcon will be overridden with the system ones.
   *
   *  enum('bookmarks', 'contacts', 'downloads', 'favorites', 'featured', 'history', 'more', 'most-recent', 'most-viewed', 'recents', 'search', 'top-rated')
   */
  systemIcon?:
    | 'bookmarks'
    | 'contacts'
    | 'downloads'
    | 'favorites'
    | 'featured'
    | 'history'
    | 'more'
    | 'most-recent'
    | 'most-viewed'
    | 'recents'
    | 'search'
    | 'top-rated'
    | undefined;

  /**
   * Text that appears under the icon. It is ignored when a system icon is defined.
   */
  title?: string | undefined;
}

export class TabBarIOSItem extends React.Component<TabBarIOSItemProps> {}

/**
 * @see https://reactnative.dev/docs/tabbarios#props
 */
export interface TabBarIOSProps extends ViewProps {
  /**
   * Background color of the tab bar
   */
  barTintColor?: ColorValue | undefined;

  /**
   * Specifies tab bar item positioning. Available values are:
   * - fill - distributes items across the entire width of the tab bar
   * - center - centers item in the available tab bar space
   * - auto (default) - distributes items dynamically according to the
   * user interface idiom. In a horizontally compact environment (e.g. iPhone 5)
   * this value defaults to `fill`, in a horizontally regular one (e.g. iPad)
   * it defaults to center.
   */
  itemPositioning?: 'fill' | 'center' | 'auto' | undefined;

  /**
   * Color of the currently selected tab icon
   */
  tintColor?: ColorValue | undefined;

  /**
   * A Boolean value that indicates whether the tab bar is translucent
   */
  translucent?: boolean | undefined;

  /**
   * Color of text on unselected tabs
   */
  unselectedTintColor?: ColorValue | undefined;

  /**
   * Color of unselected tab icons. Available since iOS 10.
   */
  unselectedItemTintColor?: ColorValue | undefined;
}

/**
 * TabBarIOS has been removed from react-native
 * @deprecated
 */
export class TabBarIOS extends React.Component<TabBarIOSProps> {
  static Item: typeof TabBarIOSItem;
}

export interface PixelRatioStatic {
  /*
        Returns the device pixel density. Some examples:
            PixelRatio.get() === 1
            mdpi Android devices (160 dpi)
            PixelRatio.get() === 1.5
            hdpi Android devices (240 dpi)
            PixelRatio.get() === 2
            iPhone 4, 4S
            iPhone 5, 5c, 5s
            iPhone 6
            xhdpi Android devices (320 dpi)
            PixelRatio.get() === 3
            iPhone 6 plus
            xxhdpi Android devices (480 dpi)
            PixelRatio.get() === 3.5
            Nexus 6
    */
  get(): number;

  /*
        Returns the scaling factor for font sizes. This is the ratio that is
        used to calculate the absolute font size, so any elements that
        heavily depend on that should use this to do calculations.

        If a font scale is not set, this returns the device pixel ratio.

        Currently this is only implemented on Android and reflects the user
        preference set in Settings > Display > Font size,
        on iOS it will always return the default pixel ratio.
        */
  getFontScale(): number;

  /**
   * Converts a layout size (dp) to pixel size (px).
   * Guaranteed to return an integer number.
   */
  getPixelSizeForLayoutSize(layoutSize: number): number;

  /**
   * Rounds a layout size (dp) to the nearest layout size that
   * corresponds to an integer number of pixels. For example,
   * on a device with a PixelRatio of 3,
   * PixelRatio.roundToNearestPixel(8.4) = 8.33,
   * which corresponds to exactly (8.33 * 3) = 25 pixels.
   */
  roundToNearestPixel(layoutSize: number): number;

  /**
   * No-op for iOS, but used on the web. Should not be documented. [sic]
   */
  startDetecting(): void;
}

/**
 * @see https://reactnative.dev/docs/platform-specific-code#content
 */
export type PlatformOSType =
  | 'ios'
  | 'android'
  | 'macos'
  | 'windows'
  | 'web'
  | 'native';
type PlatformConstants = {
  isTesting: boolean;
  reactNativeVersion: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: number | null | undefined;
  };
};
interface PlatformStatic {
  isTV: boolean;
  isTesting: boolean;
  Version: number | string;
  constants: PlatformConstants;

  /**
   * @see https://reactnative.dev/docs/platform-specific-code#content
   */
  select<T>(
    specifics:
      | ({[platform in PlatformOSType]?: T} & {default: T})
      | {[platform in PlatformOSType]: T},
  ): T;
  select<T>(specifics: {[platform in PlatformOSType]?: T}): T | undefined;
}

interface PlatformIOSStatic extends PlatformStatic {
  constants: PlatformConstants & {
    forceTouchAvailable: boolean;
    interfaceIdiom: string;
    osVersion: string;
    systemName: string;
  };
  OS: 'ios';
  isPad: boolean;
  isTV: boolean;
  Version: string;
}

interface PlatformAndroidStatic extends PlatformStatic {
  constants: PlatformConstants & {
    Version: number;
    Release: string;
    Serial: string;
    Fingerprint: string;
    Model: string;
    Brand: string;
    Manufacturer: string;
    ServerHost?: string | undefined;
    uiMode: 'car' | 'desk' | 'normal' | 'tv' | 'watch' | 'unknown';
  };
  OS: 'android';
  Version: number;
}

interface PlatformMacOSStatic extends PlatformStatic {
  OS: 'macos';
  Version: string;
  constants: PlatformConstants & {
    osVersion: string;
  };
}

interface PlatformWindowsOSStatic extends PlatformStatic {
  OS: 'windows';
  Version: number;
  constants: PlatformConstants & {
    osVersion: number;
  };
}

interface PlatformWebStatic extends PlatformStatic {
  OS: 'web';
}

type OpaqueColorValue = symbol & {__TYPE__: 'Color'};
export type ColorValue = string | OpaqueColorValue;

export type ProcessedColorValue = number | OpaqueColorValue;

type DynamicColorIOSTuple = {
  light: ColorValue;
  dark: ColorValue;
  highContrastLight?: ColorValue | undefined;
  highContrastDark?: ColorValue | undefined;
};

/**
 * Specify color to display depending on the current system appearance settings
 *
 * @param tuple Colors you want to use for "light mode" and "dark mode"
 * @platform ios
 */
export function DynamicColorIOS(tuple: DynamicColorIOSTuple): OpaqueColorValue;

/**
 * Select native platform color
 * The color must match the string that exists on the native platform
 *
 * @see https://reactnative.dev/docs/platformcolor#example
 */
export function PlatformColor(...colors: string[]): OpaqueColorValue;

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
interface DeviceEventEmitterStatic extends EventEmitter {
  sharedSubscriber: EventSubscriptionVendor;
  new (): DeviceEventEmitterStatic;
  addListener(
    type: string,
    listener: (data: any) => void,
    context?: any,
  ): EmitterSubscription;
}

// Used by Dimensions below
export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Initial dimensions are set before `runApplication` is called so they should
 * be available before any other require's are run, but may be updated later.
 *
 * Note: Although dimensions are available immediately, they may change (e.g
 * due to device rotation) so any rendering logic or styles that depend on
 * these constants should try to call this function on every render, rather
 * than caching the value (for example, using inline styles rather than
 * setting a value in a `StyleSheet`).
 *
 * Example: `const {height, width} = Dimensions.get('window');`
 *
 * @param dim Name of dimension as defined when calling `set`.
 * @returns Value for the dimension.
 * @see https://reactnative.dev/docs/dimensions#content
 */
export interface Dimensions {
  /**
     * Initial dimensions are set before runApplication is called so they
     * should be available before any other require's are run, but may be
     * updated later.
     * Note: Although dimensions are available immediately, they may
     * change (e.g due to device rotation) so any rendering logic or
     * styles that depend on these constants should try to call this
     * function on every render, rather than caching the value (for
     * example, using inline styles rather than setting a value in a
     * StyleSheet).
     * Example: const {height, width} = Dimensions.get('window');
     @param dim Name of dimension as defined when calling set.
     @returns Value for the dimension.
     */
  get(dim: 'window' | 'screen'): ScaledSize;

  /**
   * This should only be called from native code by sending the didUpdateDimensions event.
   * @param dims Simple string-keyed object of dimensions to set
   */
  set(dims: {[key: string]: any}): void;

  /**
   * Add an event listener for dimension changes
   *
   * @param type the type of event to listen to
   * @param handler the event handler
   */
  addEventListener(
    type: 'change',
    handler: ({
      window,
      screen,
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => void,
  ): EmitterSubscription;
}

export function useWindowDimensions(): ScaledSize;

export type SimpleTask = {
  name: string;
  gen: () => void;
};
export type PromiseTask = {
  name: string;
  gen: () => Promise<any>;
};

export type Handle = number;

export interface InteractionManagerStatic {
  Events: {
    interactionStart: string;
    interactionComplete: string;
  };

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param eventType - Name of the event to listen to
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: (...args: any[]) => any,
    context?: any,
  ): EmitterSubscription;

  /**
   * Schedule a function to run after all interactions have completed.
   * Returns a cancellable
   */
  runAfterInteractions(task?: (() => any) | SimpleTask | PromiseTask): {
    then: (onfulfilled?: () => any, onrejected?: () => any) => Promise<any>;
    done: (...args: any[]) => any;
    cancel: () => void;
  };

  /**
   * Notify manager that an interaction has started.
   */
  createInteractionHandle(): Handle;

  /**
   * Notify manager that an interaction has completed.
   */
  clearInteractionHandle(handle: Handle): void;

  /**
   * A positive number will use setTimeout to schedule any tasks after
   * the eventLoopRunningTime hits the deadline value, otherwise all
   * tasks will be executed in one setImmediate batch (default).
   */
  setDeadline(deadline: number): void;
}

export interface ScrollResponderEvent
  extends NativeSyntheticEvent<NativeTouchEvent> {}

interface ScrollResponderMixin extends SubscribableMixin {
  /**
   * Invoke this from an `onScroll` event.
   */
  scrollResponderHandleScrollShouldSetResponder(): boolean;

  /**
   * Merely touch starting is not sufficient for a scroll view to become the
   * responder. Being the "responder" means that the very next touch move/end
   * event will result in an action/movement.
   *
   * Invoke this from an `onStartShouldSetResponder` event.
   *
   * `onStartShouldSetResponder` is used when the next move/end will trigger
   * some UI movement/action, but when you want to yield priority to views
   * nested inside of the view.
   *
   * There may be some cases where scroll views actually should return `true`
   * from `onStartShouldSetResponder`: Any time we are detecting a standard tap
   * that gives priority to nested views.
   *
   * - If a single tap on the scroll view triggers an action such as
   *   recentering a map style view yet wants to give priority to interaction
   *   views inside (such as dropped pins or labels), then we would return true
   *   from this method when there is a single touch.
   *
   * - Similar to the previous case, if a two finger "tap" should trigger a
   *   zoom, we would check the `touches` count, and if `>= 2`, we would return
   *   true.
   *
   */
  scrollResponderHandleStartShouldSetResponder(): boolean;

  /**
   * There are times when the scroll view wants to become the responder
   * (meaning respond to the next immediate `touchStart/touchEnd`), in a way
   * that *doesn't* give priority to nested views (hence the capture phase):
   *
   * - Currently animating.
   * - Tapping anywhere that is not the focused input, while the keyboard is
   *   up (which should dismiss the keyboard).
   *
   * Invoke this from an `onStartShouldSetResponderCapture` event.
   */
  scrollResponderHandleStartShouldSetResponderCapture(
    e: ScrollResponderEvent,
  ): boolean;

  /**
   * Invoke this from an `onResponderReject` event.
   *
   * Some other element is not yielding its role as responder. Normally, we'd
   * just disable the `UIScrollView`, but a touch has already began on it, the
   * `UIScrollView` will not accept being disabled after that. The easiest
   * solution for now is to accept the limitation of disallowing this
   * altogether. To improve this, find a way to disable the `UIScrollView` after
   * a touch has already started.
   */
  scrollResponderHandleResponderReject(): any;

  /**
   * We will allow the scroll view to give up its lock iff it acquired the lock
   * during an animation. This is a very useful default that happens to satisfy
   * many common user experiences.
   *
   * - Stop a scroll on the left edge, then turn that into an outer view's
   *   backswipe.
   * - Stop a scroll mid-bounce at the top, continue pulling to have the outer
   *   view dismiss.
   * - However, without catching the scroll view mid-bounce (while it is
   *   motionless), if you drag far enough for the scroll view to become
   *   responder (and therefore drag the scroll view a bit), any backswipe
   *   navigation of a swipe gesture higher in the view hierarchy, should be
   *   rejected.
   */
  scrollResponderHandleTerminationRequest(): boolean;

  /**
   * Invoke this from an `onTouchEnd` event.
   *
   * @param e Event.
   */
  scrollResponderHandleTouchEnd(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onResponderRelease` event.
   */
  scrollResponderHandleResponderRelease(e: ScrollResponderEvent): void;

  scrollResponderHandleScroll(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onResponderGrant` event.
   */
  scrollResponderHandleResponderGrant(e: ScrollResponderEvent): void;

  /**
   * Unfortunately, `onScrollBeginDrag` also fires when *stopping* the scroll
   * animation, and there's not an easy way to distinguish a drag vs. stopping
   * momentum.
   *
   * Invoke this from an `onScrollBeginDrag` event.
   */
  scrollResponderHandleScrollBeginDrag(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onScrollEndDrag` event.
   */
  scrollResponderHandleScrollEndDrag(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onMomentumScrollBegin` event.
   */
  scrollResponderHandleMomentumScrollBegin(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onMomentumScrollEnd` event.
   */
  scrollResponderHandleMomentumScrollEnd(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onTouchStart` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param e Touch Start event.
   */
  scrollResponderHandleTouchStart(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onTouchMove` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param e Touch Start event.
   */
  scrollResponderHandleTouchMove(e: ScrollResponderEvent): void;

  /**
   * A helper function for this class that lets us quickly determine if the
   * view is currently animating. This is particularly useful to know when
   * a touch has just started or ended.
   */
  scrollResponderIsAnimating(): boolean;

  /**
   * Returns the node that represents native view that can be scrolled.
   * Components can pass what node to use by defining a `getScrollableNode`
   * function otherwise `this` is used.
   */
  scrollResponderGetScrollableNode(): any;

  /**
   * A helper function to scroll to a specific point  in the scrollview.
   * This is currently used to help focus on child textviews, but can also
   * be used to quickly scroll to any element we want to focus. Syntax:
   *
   * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollResponderScrollTo(
    x?:
      | number
      | {
          x?: number | undefined;
          y?: number | undefined;
          animated?: boolean | undefined;
        },
    y?: number,
    animated?: boolean,
  ): void;

  /**
   * A helper function to zoom to a specific rect in the scrollview. The argument has the shape
   * {x: number; y: number; width: number; height: number; animated: boolean = true}
   *
   * @platform ios
   */
  scrollResponderZoomTo(
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
      animated?: boolean | undefined;
    },
    animated?: boolean, // deprecated, put this inside the rect argument instead
  ): void;

  /**
   * This method should be used as the callback to onFocus in a TextInputs'
   * parent view. Note that any module using this mixin needs to return
   * the parent view's ref in getScrollViewRef() in order to use this method.
   * @param nodeHandle The TextInput node handle
   * @param additionalOffset The scroll view's top "contentInset".
   *        Default is 0.
   * @param preventNegativeScrolling Whether to allow pulling the content
   *        down to make it meet the keyboard's top. Default is false.
   */
  scrollResponderScrollNativeHandleToKeyboard(
    nodeHandle: any,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ): void;

  /**
   * The calculations performed here assume the scroll view takes up the entire
   * screen - even if has some content inset. We then measure the offsets of the
   * keyboard, and compensate both for the scroll view's "contentInset".
   *
   * @param left Position of input w.r.t. table view.
   * @param top Position of input w.r.t. table view.
   * @param width Width of the text input.
   * @param height Height of the text input.
   */
  scrollResponderInputMeasureAndScrollToKeyboard(
    left: number,
    top: number,
    width: number,
    height: number,
  ): void;

  scrollResponderTextInputFocusError(e: ScrollResponderEvent): void;

  /**
   * `componentWillMount` is the closest thing to a  standard "constructor" for
   * React components.
   *
   * The `keyboardWillShow` is called before input focus.
   */
  componentWillMount(): void;

  /**
   * Warning, this may be called several times for a single keyboard opening.
   * It's best to store the information in this method and then take any action
   * at a later point (either in `keyboardDidShow` or other).
   *
   * Here's the order that events occur in:
   * - focus
   * - willShow {startCoordinates, endCoordinates} several times
   * - didShow several times
   * - blur
   * - willHide {startCoordinates, endCoordinates} several times
   * - didHide several times
   *
   * The `ScrollResponder` providesModule callbacks for each of these events.
   * Even though any user could have easily listened to keyboard events
   * themselves, using these `props` callbacks ensures that ordering of events
   * is consistent - and not dependent on the order that the keyboard events are
   * subscribed to. This matters when telling the scroll view to scroll to where
   * the keyboard is headed - the scroll responder better have been notified of
   * the keyboard destination before being instructed to scroll to where the
   * keyboard will be. Stick to the `ScrollResponder` callbacks, and everything
   * will work.
   *
   * WARNING: These callbacks will fire even if a keyboard is displayed in a
   * different navigation pane. Filter out the events to determine if they are
   * relevant to you. (For example, only if you receive these callbacks after
   * you had explicitly focused a node etc).
   */
  scrollResponderKeyboardWillShow(e: ScrollResponderEvent): void;

  scrollResponderKeyboardWillHide(e: ScrollResponderEvent): void;

  scrollResponderKeyboardDidShow(e: ScrollResponderEvent): void;

  scrollResponderKeyboardDidHide(e: ScrollResponderEvent): void;
}

export interface ScrollViewPropsIOS {
  /**
   * When true the scroll view bounces horizontally when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is true when `horizontal={true}` and false otherwise.
   */
  alwaysBounceHorizontal?: boolean | undefined;
  /**
   * When true the scroll view bounces vertically when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is false when `horizontal={true}` and true otherwise.
   */
  alwaysBounceVertical?: boolean | undefined;

  /**
   * Controls whether iOS should automatically adjust the content inset for scroll views that are placed behind a navigation bar or tab bar/ toolbar.
   * The default value is true.
   */
  automaticallyAdjustContentInsets?: boolean | undefined; // true

  /**
   * Controls whether the ScrollView should automatically adjust its contentInset and
   * scrollViewInsets when the Keyboard changes its size. The default value is false.
   */
  automaticallyAdjustKeyboardInsets?: boolean | undefined;

  /**
   * Controls whether iOS should automatically adjust the scroll indicator
   * insets. The default value is true. Available on iOS 13 and later.
   */
  automaticallyAdjustsScrollIndicatorInsets?: boolean | undefined;

  /**
   * When true the scroll view bounces when it reaches the end of the
   * content if the content is larger then the scroll view along the axis of
   * the scroll direction. When false it disables all bouncing even if
   * the `alwaysBounce*` props are true. The default value is true.
   */
  bounces?: boolean | undefined;
  /**
   * When true gestures can drive zoom past min/max and the zoom will animate
   * to the min/max value at gesture end otherwise the zoom will not exceed
   * the limits.
   */
  bouncesZoom?: boolean | undefined;

  /**
   * When false once tracking starts won't try to drag if the touch moves.
   * The default value is true.
   */
  canCancelContentTouches?: boolean | undefined;

  /**
   * When true the scroll view automatically centers the content when the
   * content is smaller than the scroll view bounds; when the content is
   * larger than the scroll view this property has no effect. The default
   * value is false.
   */
  centerContent?: boolean | undefined;

  /**
   * The amount by which the scroll view content is inset from the edges of the scroll view.
   * Defaults to {0, 0, 0, 0}.
   */
  contentInset?: Insets | undefined; // zeros

  /**
   * Used to manually set the starting scroll offset.
   * The default value is {x: 0, y: 0}
   */
  contentOffset?: PointProp | undefined; // zeros

  /**
   * This property specifies how the safe area insets are used to modify the content area of the scroll view.
   * The default value of this property must be 'automatic'. But the default value is 'never' until RN@0.51.
   */
  contentInsetAdjustmentBehavior?:
    | 'automatic'
    | 'scrollableAxes'
    | 'never'
    | 'always'
    | undefined;

  /**
   * When true the ScrollView will try to lock to only vertical or horizontal
   * scrolling while dragging.  The default value is false.
   */
  directionalLockEnabled?: boolean | undefined;

  /**
   * The style of the scroll indicators.
   * - default (the default), same as black.
   * - black, scroll indicator is black. This style is good against
   *   a white content background.
   * - white, scroll indicator is white. This style is good against
   *   a black content background.
   */
  indicatorStyle?: 'default' | 'black' | 'white' | undefined;

  /**
   * When set, the scroll view will adjust the scroll position so that the first child
   * that is currently visible and at or beyond minIndexForVisible will not change position.
   * This is useful for lists that are loading content in both directions, e.g. a chat thread,
   * where new messages coming in might otherwise cause the scroll position to jump. A value
   * of 0 is common, but other values such as 1 can be used to skip loading spinners or other
   * content that should not maintain position.
   *
   * The optional autoscrollToTopThreshold can be used to make the content automatically scroll
   * to the top after making the adjustment if the user was within the threshold of the top
   * before the adjustment was made. This is also useful for chat-like applications where you
   * want to see new messages scroll into place, but not if the user has scrolled up a ways and
   * it would be disruptive to scroll a bunch.
   *
   * Caveat 1: Reordering elements in the scrollview with this enabled will probably cause
   * jumpiness and jank. It can be fixed, but there are currently no plans to do so. For now,
   * don't re-order the content of any ScrollViews or Lists that use this feature.
   *
   * Caveat 2: This uses contentOffset and frame.origin in native code to compute visibility.
   * Occlusion, transforms, and other complexity won't be taken into account as to whether
   * content is "visible" or not.
   */
  maintainVisibleContentPosition?:
    | null
    | {
        autoscrollToTopThreshold?: number | null | undefined;
        minIndexForVisible: number;
      }
    | undefined;
  /**
   * The maximum allowed zoom scale. The default value is 1.0.
   */
  maximumZoomScale?: number | undefined;

  /**
   * The minimum allowed zoom scale. The default value is 1.0.
   */
  minimumZoomScale?: number | undefined;

  /**
   * Called when a scrolling animation ends.
   */
  onScrollAnimationEnd?: (() => void) | undefined;

  /**
   * When true, ScrollView allows use of pinch gestures to zoom in and out.
   * The default value is true.
   */
  pinchGestureEnabled?: boolean | undefined;

  /**
   * This controls how often the scroll event will be fired while scrolling (as a time interval in ms).
   * A lower number yields better accuracy for code that is tracking the scroll position,
   * but can lead to scroll performance problems due to the volume of information being sent over the bridge.
   * The default value is zero, which means the scroll event will be sent only once each time the view is scrolled.
   */
  scrollEventThrottle?: number | undefined; // null

  /**
   * The amount by which the scroll view indicators are inset from the edges of the scroll view.
   * This should normally be set to the same value as the contentInset.
   * Defaults to {0, 0, 0, 0}.
   */
  scrollIndicatorInsets?: Insets | undefined; //zeroes

  /**
   * When true, the scroll view can be programmatically scrolled beyond its
   * content size. The default value is false.
   * @platform ios
   */
  scrollToOverflowEnabled?: boolean | undefined;

  /**
   * When true the scroll view scrolls to top when the status bar is tapped.
   * The default value is true.
   */
  scrollsToTop?: boolean | undefined;

  /**
   * When `snapToInterval` is set, `snapToAlignment` will define the relationship of the the snapping to the scroll view.
   *      - `start` (the default) will align the snap at the left (horizontal) or top (vertical)
   *      - `center` will align the snap in the center
   *      - `end` will align the snap at the right (horizontal) or bottom (vertical)
   */
  snapToAlignment?: 'start' | 'center' | 'end' | undefined;

  /**
   * Fires when the scroll view scrolls to top after the status bar has been tapped
   * @platform ios
   */
  onScrollToTop?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * The current scale of the scroll view content. The default value is 1.0.
   */
  zoomScale?: number | undefined;
}

export interface ScrollViewPropsAndroid {
  /**
   * Sometimes a scrollview takes up more space than its content fills.
   * When this is the case, this prop will fill the rest of the
   * scrollview with a color to avoid setting a background and creating
   * unnecessary overdraw. This is an advanced optimization that is not
   * needed in the general case.
   */
  endFillColor?: ColorValue | undefined;

  /**
   * Tag used to log scroll performance on this scroll view. Will force
   * momentum events to be turned on (see sendMomentumEvents). This doesn't do
   * anything out of the box and you need to implement a custom native
   * FpsListener for it to be useful.
   * @platform android
   */
  scrollPerfTag?: string | undefined;

  /**
     * Used to override default value of overScroll mode.

        * Possible values:
        *   - 'auto' - Default value, allow a user to over-scroll this view only if the content is large enough to meaningfully scroll.
        *   - 'always' - Always allow a user to over-scroll this view.
        *   - 'never' - Never allow a user to over-scroll this view.
        */
  overScrollMode?: 'auto' | 'always' | 'never' | undefined;

  /**
   * Enables nested scrolling for Android API level 21+. Nested scrolling is supported by default on iOS.
   */
  nestedScrollEnabled?: boolean | undefined;

  /**
   * Fades out the edges of the the scroll content.
   *
   * If the value is greater than 0, the fading edges will be set accordingly
   * to the current scroll direction and position,
   * indicating if there is more content to show.
   *
   * The default value is 0.
   * @platform android
   */
  fadingEdgeLength?: number | undefined;

  /**
   * Causes the scrollbars not to turn transparent when they are not in use. The default value is false.
   */
  persistentScrollbar?: boolean | undefined;
}

export interface ScrollViewProps
  extends ViewProps,
    ScrollViewPropsIOS,
    ScrollViewPropsAndroid,
    Touchable {
  /**
   * These styles will be applied to the scroll view content container which
   * wraps all of the child views. Example:
   *
   *   return (
   *     <ScrollView contentContainerStyle={styles.contentContainer}>
   *     </ScrollView>
   *   );
   *   ...
   *   const styles = StyleSheet.create({
   *     contentContainer: {
   *       paddingVertical: 20
   *     }
   *   });
   */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use string
   * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
   * for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively.
   *
   *  - `'normal'`: 0.998 on iOS, 0.985 on Android (the default)
   *  - `'fast'`: 0.99 on iOS, 0.9 on Android
   */
  decelerationRate?: 'fast' | 'normal' | number | undefined;

  /**
   * When true the scroll view's children are arranged horizontally in a row
   * instead of vertically in a column. The default value is false.
   */
  horizontal?: boolean | null | undefined;

  /**
   * If sticky headers should stick at the bottom instead of the top of the
   * ScrollView. This is usually used with inverted ScrollViews.
   */
  invertStickyHeaders?: boolean | undefined;

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default) drags do not dismiss the keyboard.
   *   - 'onDrag' the keyboard is dismissed when a drag begins.
   *   - 'interactive' the keyboard is dismissed interactively with the drag
   *     and moves in synchrony with the touch; dragging upwards cancels the
   *     dismissal.
   */
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag' | undefined;

  /**
   * Determines when the keyboard should stay visible after a tap.
   * - 'never' (the default), tapping outside of the focused text input when the keyboard is up dismisses the keyboard. When this happens, children won't receive the tap.
   * - 'always', the keyboard will not dismiss automatically, and the scroll view will not catch taps, but children of the scroll view can catch taps.
   * - 'handled', the keyboard will not dismiss automatically when the tap was handled by a children, (or captured by an ancestor).
   * - false, deprecated, use 'never' instead
   * - true, deprecated, use 'always' instead
   */
  keyboardShouldPersistTaps?:
    | boolean
    | 'always'
    | 'never'
    | 'handled'
    | undefined;

  /**
   * Called when scrollable content view of the ScrollView changes.
   * Handler function is passed the content width and content height as parameters: (contentWidth, contentHeight)
   * It's implemented using onLayout handler attached to the content container which this ScrollView renders.
   *
   */
  onContentSizeChange?: ((w: number, h: number) => void) | undefined;

  /**
   * Fires at most once per frame during scrolling.
   * The frequency of the events can be contolled using the scrollEventThrottle prop.
   */
  onScroll?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires if a user initiates a scroll gesture.
   */
  onScrollBeginDrag?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when a user has finished scrolling.
   */
  onScrollEndDrag?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when scroll view has finished moving
   */
  onMomentumScrollEnd?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when scroll view has begun moving
   */
  onMomentumScrollBegin?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * When true the scroll view stops on multiples of the scroll view's size
   * when scrolling. This can be used for horizontal pagination. The default
   * value is false.
   */
  pagingEnabled?: boolean | undefined;

  /**
   * When false, the content does not scroll. The default value is true
   */
  scrollEnabled?: boolean | undefined; // true

  /**
   * Experimental: When true offscreen child views (whose `overflow` value is
   * `hidden`) are removed from their native backing superview when offscreen.
   * This can improve scrolling performance on long lists. The default value is
   * false.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * When true, shows a horizontal scroll indicator.
   */
  showsHorizontalScrollIndicator?: boolean | undefined;

  /**
   * When true, shows a vertical scroll indicator.
   */
  showsVerticalScrollIndicator?: boolean | undefined;

  /**
   * When true, Sticky header is hidden when scrolling down, and dock at the top when scrolling up.
   */
  stickyHeaderHiddenOnScroll?: boolean;

  /**
   * Style
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the ScrollView.
   */
  refreshControl?: React.ReactElement<RefreshControlProps> | undefined;

  /**
   * When set, causes the scroll view to stop at multiples of the value of `snapToInterval`.
   * This can be used for paginating through children that have lengths smaller than the scroll view.
   * Used in combination with `snapToAlignment` and `decelerationRate="fast"`. Overrides less
   * configurable `pagingEnabled` prop.
   */
  snapToInterval?: number | undefined;

  /**
   * When set, causes the scroll view to stop at the defined offsets. This can be used for
   * paginating through variously sized children that have lengths smaller than the scroll view.
   * Typically used in combination with `decelerationRate="fast"`. Overrides less configurable
   * `pagingEnabled` and `snapToInterval` props.
   */
  snapToOffsets?: number[] | undefined;

  /**
   * Use in conjunction with `snapToOffsets`. By default, the beginning of the list counts as a
   * snap offset. Set `snapToStart` to false to disable this behavior and allow the list to scroll
   * freely between its start and the first `snapToOffsets` offset. The default value is true.
   */
  snapToStart?: boolean | undefined;

  /**
   * Use in conjunction with `snapToOffsets`. By default, the end of the list counts as a snap
   * offset. Set `snapToEnd` to false to disable this behavior and allow the list to scroll freely
   * between its end and the last `snapToOffsets` offset. The default value is true.
   */
  snapToEnd?: boolean | undefined;

  /**
   * An array of child indices determining which children get docked to the
   * top of the screen when scrolling. For example passing
   * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
   * top of the scroll view. This property is not supported in conjunction
   * with `horizontal={true}`.
   */
  stickyHeaderIndices?: number[] | undefined;

  /**
   * When true, the scroll view stops on the next index (in relation to scroll position at release)
   * regardless of how fast the gesture is. This can be used for horizontal pagination when the page
   * is less than the width of the ScrollView. The default value is false.
   */
  disableIntervalMomentum?: boolean | undefined;

  /**
   * When true, the default JS pan responder on the ScrollView is disabled, and full control over
   * touches inside the ScrollView is left to its child components. This is particularly useful
   * if `snapToInterval` is enabled, since it does not follow typical touch patterns. Do not use
   * this on regular ScrollView use cases without `snapToInterval` as it may cause unexpected
   * touches to occur while scrolling. The default value is false.
   */
  disableScrollViewPanResponder?: boolean | undefined;

  /**
   * A React Component that will be used to render sticky headers, should be used together with
   * stickyHeaderIndices. You may need to set this component if your sticky header uses custom
   * transforms, for example, when you want your list to have an animated and hidable header.
   * If component have not been provided, the default ScrollViewStickyHeader component will be used.
   */
  StickyHeaderComponent?: React.ComponentType<any> | undefined;
}

declare class ScrollViewComponent extends React.Component<ScrollViewProps> {}
declare const ScrollViewBase: Constructor<ScrollResponderMixin> &
  typeof ScrollViewComponent;
export class ScrollView extends ScrollViewBase {
  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   * Syntax:
   *
   * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo(
    y?:
      | number
      | {
          x?: number | undefined;
          y?: number | undefined;
          animated?: boolean | undefined;
        },
    x?: number,
    animated?: boolean,
  ): void;

  /**
   * A helper function that scrolls to the end of the scrollview;
   * If this is a vertical ScrollView, it scrolls to the bottom.
   * If this is a horizontal ScrollView scrolls to the right.
   *
   * The options object has an animated prop, that enables the scrolling animation or not.
   * The animated prop defaults to true
   */
  scrollToEnd(options?: {animated: boolean}): void;

  /**
   * Displays the scroll indicators momentarily.
   */
  flashScrollIndicators(): void;

  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  getScrollResponder(): ScrollResponderMixin;

  getScrollableNode(): any;

  // Undocumented
  getInnerViewNode(): any;

  /**
   * @deprecated Use scrollTo instead
   */
  scrollWithoutAnimationTo?: ((y: number, x: number) => void) | undefined;

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/direct-manipulation)).
   */
  setNativeProps(nativeProps: object): void;
}

export interface NativeScrollRectangle {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface NativeScrollPoint {
  x: number;
  y: number;
}

export interface NativeScrollVelocity {
  x: number;
  y: number;
}

export interface NativeScrollSize {
  height: number;
  width: number;
}

export interface NativeScrollEvent {
  contentInset: NativeScrollRectangle;
  contentOffset: NativeScrollPoint;
  contentSize: NativeScrollSize;
  layoutMeasurement: NativeScrollSize;
  velocity?: NativeScrollVelocity | undefined;
  zoomScale: number;
  /**
   * @platform ios
   */
  targetContentOffset?: NativeScrollPoint | undefined;
}

export interface SnapshotViewIOSProps extends ViewProps {
  // A callback when the Snapshot view is ready to be compared
  onSnapshotReady(): any;

  // A name to identify the individual instance to the SnapshotView
  testIdentifier: string;
}

declare class SnapshotViewIOSComponent extends React.Component<SnapshotViewIOSProps> {}
declare const SnapshotViewIOSBase: Constructor<NativeMethods> &
  typeof SnapshotViewIOSComponent;
export class SnapshotViewIOS extends SnapshotViewIOSBase {}

// Deduced from
// https://github.com/facebook/react-native/commit/052cd7eb8afa7a805ef13e940251be080499919c

/**
 * Data source wrapper around ListViewDataSource to allow for tracking of
 * which row is swiped open and close opened row(s) when another row is swiped
 * open.
 *
 * See https://github.com/facebook/react-native/pull/5602 for why
 * ListViewDataSource is not subclassed.
 */
export interface SwipeableListViewDataSource {
  cloneWithRowsAndSections(
    dataBlob: any,
    sectionIdentities?: Array<string>,
    rowIdentities?: Array<Array<string>>,
  ): SwipeableListViewDataSource;
  getDataSource(): ListViewDataSource;
  getOpenRowID(): string;
  getFirstRowID(): string;
  setOpenRowID(rowID: string): SwipeableListViewDataSource;
}

export interface SwipeableListViewProps {
  /**
   * To alert the user that swiping is possible, the first row can bounce
   * on component mount.
   */
  bounceFirstRowOnMount: boolean;

  /**
   * Use `SwipeableListView.getNewDataSource()` to get a data source to use,
   * then use it just like you would a normal ListView data source
   */
  dataSource: SwipeableListViewDataSource;

  // Maximum distance to open to after a swipe
  maxSwipeDistance: number;

  // Callback method to render the swipeable view
  renderRow: (
    rowData: any,
    sectionID: string | number,
    rowID: string | number,
    highlightRow?: boolean,
  ) => React.ReactElement;

  // Callback method to render the view that will be unveiled on swipe
  renderQuickActions(
    rowData: any,
    sectionID: string | number,
    rowID: string | number,
  ): React.ReactElement;
}

/**
 * SwipeableListView has been removed from React Native.
 * See https://fb.me/nolistview for more information or use `deprecated-react-native-swipeable-listview`.
 * @deprecated
 */
export class SwipeableListView extends React.Component<SwipeableListViewProps> {
  static getNewDataSource(): SwipeableListViewDataSource;
}

//////////////////////////////////////////////////////////////////////////
//
// A P I s
//
//////////////////////////////////////////////////////////////////////////

/**
 * @see: https://reactnative.dev/docs/actionsheetios#content
 */
export interface ActionSheetIOSOptions {
  title?: string | undefined;
  options: string[];
  cancelButtonIndex?: number | undefined;
  destructiveButtonIndex?: number | number[] | undefined | null;
  message?: string | undefined;
  anchor?: number | undefined;
  tintColor?: ColorValue | ProcessedColorValue | undefined;
  cancelButtonTintColor?: ColorValue | ProcessedColorValue | undefined;
  userInterfaceStyle?: 'light' | 'dark' | undefined;
  disabledButtonIndices?: number[] | undefined;
}

export interface ShareActionSheetIOSOptions {
  message?: string | undefined;
  url?: string | undefined;
  subject?: string | undefined;
  /** The activities to exclude from the ActionSheet.
   * For example: ['com.apple.UIKit.activity.PostToTwitter']
   */
  excludedActivityTypes?: string[] | undefined;
}

/**
 * @see https://reactnative.dev/docs/actionsheetios#content
 */
export interface ActionSheetIOSStatic {
  /**
   * Display an iOS action sheet. The `options` object must contain one or more
   * of:
   * - `options` (array of strings) - a list of button titles (required)
   * - `cancelButtonIndex` (int) - index of cancel button in `options`
   * - `destructiveButtonIndex` (int) - index of destructive button in `options`
   * - `title` (string) - a title to show above the action sheet
   * - `message` (string) - a message to show below the title
   */
  showActionSheetWithOptions: (
    options: ActionSheetIOSOptions,
    callback: (buttonIndex: number) => void,
  ) => void;

  /**
   * Display the iOS share sheet. The `options` object should contain
   * one or both of `message` and `url` and can additionally have
   * a `subject` or `excludedActivityTypes`:
   *
   * - `url` (string) - a URL to share
   * - `message` (string) - a message to share
   * - `subject` (string) - a subject for the message
   * - `excludedActivityTypes` (array) - the activities to exclude from the ActionSheet
   *
   * NOTE: if `url` points to a local file, or is a base64-encoded
   * uri, the file it points to will be loaded and shared directly.
   * In this way, you can share images, videos, PDF files, etc.
   */
  showShareActionSheetWithOptions: (
    options: ShareActionSheetIOSOptions,
    failureCallback: (error: Error) => void,
    successCallback: (success: boolean, method: string) => void,
  ) => void;
}

export type ShareContent =
  | {
      title?: string | undefined;
      message: string;
    }
  | {
      title?: string | undefined;
      url: string;
    };

export type ShareOptions = {
  dialogTitle?: string | undefined;
  excludedActivityTypes?: Array<string> | undefined;
  tintColor?: ColorValue | undefined;
  subject?: string | undefined;
};

export type ShareSharedAction = {
  action: 'sharedAction';
  activityType?: string | undefined;
};

export type ShareDismissedAction = {
  action: 'dismissedAction';
};

export type ShareAction = ShareSharedAction | ShareDismissedAction;

export interface ShareStatic {
  /**
   * Open a dialog to share text content.
   *
   * In iOS, Returns a Promise which will be invoked an object containing `action`, `activityType`.
   * If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction`
   * and all the other keys being undefined.
   *
   * In Android, Returns a Promise which always be resolved with action being `Share.sharedAction`.
   *
   * ### Content
   *
   *  - `message` - a message to share
   *  - `title` - title of the message
   *
   * #### iOS
   *
   *  - `url` - an URL to share
   *
   * At least one of URL and message is required.
   *
   * ### Options
   *
   * #### iOS
   *
   * - `excludedActivityTypes`
   * - `tintColor`
   *
   * #### Android
   *
   * - `dialogTitle`
   *
   */
  share(content: ShareContent, options?: ShareOptions): Promise<ShareAction>;
  sharedAction: 'sharedAction';
  dismissedAction: 'dismissedAction';
}

type AccessibilityChangeEventName =
  | 'change' // deprecated, maps to screenReaderChanged
  | 'boldTextChanged' // iOS-only Event
  | 'grayscaleChanged' // iOS-only Event
  | 'invertColorsChanged' // iOS-only Event
  | 'reduceMotionChanged'
  | 'screenReaderChanged'
  | 'reduceTransparencyChanged'; // iOS-only Event

type AccessibilityChangeEvent = boolean;

type AccessibilityChangeEventHandler = (
  event: AccessibilityChangeEvent,
) => void;

type AccessibilityAnnouncementEventName = 'announcementFinished'; // iOS-only Event

type AccessibilityAnnouncementFinishedEvent = {
  announcement: string;
  success: boolean;
};

type AccessibilityAnnouncementFinishedEventHandler = (
  event: AccessibilityAnnouncementFinishedEvent,
) => void;

type AccessibilityEventTypes = 'click' | 'focus';

/**
 * @see https://reactnative.dev/docs/accessibilityinfo
 */
export interface AccessibilityInfoStatic {
  /**
   * Query whether bold text is currently enabled.
   *
   * @platform ios
   */
  isBoldTextEnabled: () => Promise<boolean>;

  /**
   * Query whether grayscale is currently enabled.
   *
   * @platform ios
   */
  isGrayscaleEnabled: () => Promise<boolean>;

  /**
   * Query whether invert colors is currently enabled.
   *
   * @platform ios
   */
  isInvertColorsEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce motion is currently enabled.
   */
  isReduceMotionEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce transparency is currently enabled.
   *
   * @platform ios
   */
  isReduceTransparencyEnabled: () => Promise<boolean>;

  /**
   * Query whether a screen reader is currently enabled.
   */
  isScreenReaderEnabled: () => Promise<boolean>;

  /**
   * Add an event handler. Supported events:
   * - announcementFinished: iOS-only event. Fires when the screen reader has finished making an announcement.
   *                         The argument to the event handler is a dictionary with these keys:
   *                          - announcement: The string announced by the screen reader.
   *                          - success: A boolean indicating whether the announcement was successfully made.
   * - AccessibilityEventName constants other than announcementFinished: Fires on accessibility feature change.
   *            The argument to the event handler is a boolean.
   *            The boolean is true when the related event's feature is enabled and false otherwise.
   *
   */
  addEventListener(
    eventName: AccessibilityChangeEventName,
    handler: AccessibilityChangeEventHandler,
  ): EmitterSubscription;
  addEventListener(
    eventName: AccessibilityAnnouncementEventName,
    handler: AccessibilityAnnouncementFinishedEventHandler,
  ): EmitterSubscription;

  /**
   * Set accessibility focus to a react component.
   */
  setAccessibilityFocus: (reactTag: number) => void;

  /**
   * Post a string to be announced by the screen reader.
   */
  announceForAccessibility: (announcement: string) => void;

  /**
   * Gets the timeout in millisecond that the user needs.
   * This value is set in "Time to take action (Accessibility timeout)" of "Accessibility" settings.
   *
   * @platform android
   */
  getRecommendedTimeoutMillis: (originalTimeout: number) => Promise<number>;
  sendAccessibilityEvent: (
    handle: React.ElementRef<HostComponent<unknown>>,
    eventType: AccessibilityEventTypes,
  ) => void;
}

/**
 * @see https://reactnative.dev/docs/alert#content
 */
export interface AlertButton {
  text?: string | undefined;
  onPress?: ((value?: string) => void) | undefined;
  isPreferred?: boolean;
  style?: 'default' | 'cancel' | 'destructive' | undefined;
}

interface AlertOptions {
  /** @platform android */
  cancelable?: boolean | undefined;
  userInterfaceStyle?: 'unspecified' | 'light' | 'dark';
  /** @platform android */
  onDismiss?: (() => void) | undefined;
}

/**
 * Launches an alert dialog with the specified title and message.
 *
 * Optionally provide a list of buttons. Tapping any button will fire the
 * respective onPress callback and dismiss the alert. By default, the only
 * button will be an 'OK' button.
 *
 * This is an API that works both on iOS and Android and can show static
 * alerts. To show an alert that prompts the user to enter some information,
 * see `AlertIOS`; entering text in an alert is common on iOS only.
 *
 * ## iOS
 *
 * On iOS you can specify any number of buttons. Each button can optionally
 * specify a style, which is one of 'default', 'cancel' or 'destructive'.
 *
 * ## Android
 *
 * On Android at most three buttons can be specified. Android has a concept
 * of a neutral, negative and a positive button:
 *
 *   - If you specify one button, it will be the 'positive' one (such as 'OK')
 *   - Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')
 *   - Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')
 *
 * ```
 * // Works on both iOS and Android
 * Alert.alert(
 *   'Alert Title',
 *   'My Alert Msg',
 *   [
 *     {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
 *     {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
 *     {text: 'OK', onPress: () => console.log('OK Pressed')},
 *   ]
 * )
 * ```
 */
export interface AlertStatic {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
  prompt: (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: AlertType,
    defaultValue?: string,
    keyboardType?: string,
  ) => void;
}

export type AlertType =
  | 'default'
  | 'plain-text'
  | 'secure-text'
  | 'login-password';

/**
 * AppState can tell you if the app is in the foreground or background,
 * and notify you when the state changes.
 *
 * AppState is frequently used to determine the intent and proper behavior
 * when handling push notifications.
 *
 * App State Events
 *      change - This even is received when the app state has changed.
 *      focus [Android] - Received when the app gains focus (the user is interacting with the app).
 *      blur [Android] - Received when the user is not actively interacting with the app.
 *
 * App States
 *      active - The app is running in the foreground
 *      background - The app is running in the background. The user is either in another app or on the home screen
 *      inactive [iOS] - This is a transition state that currently never happens for typical React Native apps.
 *      unknown [iOS] - Initial value until the current app state is determined
 *      extension [iOS] - The app is running as an app extension
 *
 * For more information, see Apple's documentation: https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html
 *
 * @see https://reactnative.dev/docs/appstate#app-states
 */
export type AppStateEvent = 'change' | 'memoryWarning' | 'blur' | 'focus';
export type AppStateStatus =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'
  | 'extension';

export interface AppStateStatic {
  currentState: AppStateStatus;
  isAvailable: boolean;

  /**
   * Add a handler to AppState changes by listening to the change event
   * type and providing the handler
   */
  addEventListener(
    type: AppStateEvent,
    listener: (state: AppStateStatus) => void,
  ): NativeEventSubscription;
}

/**
 * AsyncStorage is a simple, unencrypted, asynchronous, persistent, key-value storage
 * system that is global to the app.  It should be used instead of LocalStorage.
 *
 * It is recommended that you use an abstraction on top of `AsyncStorage`
 * instead of `AsyncStorage` directly for anything more than light usage since
 * it operates globally.
 *
 * On iOS, `AsyncStorage` is backed by native code that stores small values in a
 * serialized dictionary and larger values in separate files. On Android,
 * `AsyncStorage` will use either [RocksDB](http://rocksdb.org/) or SQLite
 * based on what is available.
 *
 * @see https://reactnative.dev/docs/asyncstorage#content
 */
export interface AsyncStorageStatic {
  /**
   * Fetches key and passes the result to callback, along with an Error if there is any.
   */
  getItem(
    key: string,
    callback?: (error?: Error, result?: string) => void,
  ): Promise<string | null>;

  /**
   * Sets value for key and calls callback on completion, along with an Error if there is any
   */
  setItem(
    key: string,
    value: string,
    callback?: (error?: Error) => void,
  ): Promise<void>;

  removeItem(key: string, callback?: (error?: Error) => void): Promise<void>;

  /**
   * Merges existing value with input value, assuming they are stringified json. Returns a Promise object.
   * Not supported by all native implementation
   */
  mergeItem(
    key: string,
    value: string,
    callback?: (error?: Error) => void,
  ): Promise<void>;

  /**
   * Erases all AsyncStorage for all clients, libraries, etc. You probably don't want to call this.
   * Use removeItem or multiRemove to clear only your own keys instead.
   */
  clear(callback?: (error?: Error) => void): Promise<void>;

  /**
   * Gets all keys known to the app, for all callers, libraries, etc
   */
  getAllKeys(
    callback?: (error?: Error, keys?: string[]) => void,
  ): Promise<string[]>;

  /**
   * multiGet invokes callback with an array of key-value pair arrays that matches the input format of multiSet
   */
  multiGet(
    keys: string[],
    callback?: (errors?: Error[], result?: [string, string][]) => void,
  ): Promise<[string, string][]>;

  /**
   * multiSet and multiMerge take arrays of key-value array pairs that match the output of multiGet,
   *
   * multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
   */
  multiSet(
    keyValuePairs: string[][],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;

  /**
   * Delete all the keys in the keys array.
   */
  multiRemove(
    keys: string[],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;

  /**
   * Merges existing values with input values, assuming they are stringified json.
   * Returns a Promise object.
   *
   * Not supported by all native implementations.
   */
  multiMerge(
    keyValuePairs: string[][],
    callback?: (errors?: Error[]) => void,
  ): Promise<void>;
}

export type BackPressEventName = 'hardwareBackPress';

/**
 * Detect hardware back button presses, and programmatically invoke the
 * default back button functionality to exit the app if there are no
 * listeners or if none of the listeners return true.
 * The event subscriptions are called in reverse order
 * (i.e. last registered subscription first), and if one subscription
 * returns true then subscriptions registered earlier
 * will not be called.
 *
 * @see https://reactnative.dev/docs/backhandler
 */
export interface BackHandlerStatic {
  exitApp(): void;
  addEventListener(
    eventName: BackPressEventName,
    handler: () => boolean | null | undefined,
  ): NativeEventSubscription;
  removeEventListener(
    eventName: BackPressEventName,
    handler: () => boolean | null | undefined,
  ): void;
}

export interface ButtonProps
  extends Pick<
    TouchableNativeFeedbackProps & TouchableOpacityProps,
    | 'accessibilityLabel'
    | 'accessibilityState'
    | 'hasTVPreferredFocus'
    | 'nextFocusDown'
    | 'nextFocusForward'
    | 'nextFocusLeft'
    | 'nextFocusRight'
    | 'nextFocusUp'
    | 'testID'
    | 'disabled'
    | 'onPress'
    | 'touchSoundDisabled'
  > {
  /**
   * Text to display inside the button. On Android the given title will be converted to the uppercased form.
   */
  title: string;

  /**
   * Color of the text (iOS), or background color of the button (Android).
   */
  color?: ColorValue | undefined;
}

export class Button extends React.Component<ButtonProps> {}

export type CameraRollGroupType =
  | 'Album'
  | 'All'
  | 'Event'
  | 'Faces'
  | 'Library'
  | 'PhotoStream'
  | 'SavedPhotos';
export type CameraRollAssetType = 'All' | 'Videos' | 'Photos';

export interface CameraRollFetchParams {
  first: number;
  after?: string | undefined;
  groupTypes?: CameraRollGroupType | undefined;
  groupName?: string | undefined;
  assetType?: CameraRollAssetType | undefined;
}

export interface CameraRollNodeInfo {
  image: Image;
  group_name: string;
  timestamp: number;
  location: any;
}

export interface CameraRollEdgeInfo {
  node: CameraRollNodeInfo;
}

export interface CameraRollAssetInfo {
  edges: CameraRollEdgeInfo[];
  page_info: {
    has_next_page: boolean;
    end_cursor: string;
  };
}

export interface GetPhotosParamType {
  first: number;
  after?: string | undefined;
  groupTypes?: CameraRollGroupType | undefined;
  groupName?: string | undefined;
  assetType?: CameraRollAssetType | undefined;
  mimeTypes?: string[] | undefined;
}

export interface GetPhotosReturnType {
  edges: {
    node: {
      type: string;
      group_name: string;
      image: {
        uri: string;
        height: number;
        width: number;
        playableDuration: number;
        isStored?: boolean | undefined;
      };
      timestamp: number;
      location: {
        latitude: number;
        longitude: number;
        altitude: number;
        heading: number;
        speed: number;
      };
    };
  }[];

  page_info: {
    has_next_page: boolean;
    start_cursor?: string | undefined;
    end_cursor?: string | undefined;
  };
}

/**
 * CameraRoll provides access to the local camera roll / gallery.
 * Before using this you must link the RCTCameraRoll library.
 * You can refer to (Linking)[https://reactnative.dev/docs/linking-libraries-ios] for help.
 */
export interface CameraRollStatic {
  GroupTypesOptions: CameraRollGroupType[]; //'Album','All','Event','Faces','Library','PhotoStream','SavedPhotos'
  AssetTypeOptions: CameraRollAssetType[]; // "All", "Videos", "Photos"

  /**
   * Saves the image to the camera roll / gallery.
   *
   * @tag On Android, this is a local URI, such as "file:///sdcard/img.png".
   * On iOS, the tag can be one of the following:
   *      local URI
   *      assets-library tag
   *      a tag not matching any of the above, which means the image data will be stored in memory (and consume memory as long as the process is alive)
   *
   * @deprecated use saveToCameraRoll instead
   */
  saveImageWithTag(tag: string): Promise<string>;

  /**
   * Saves the photo or video to the camera roll / gallery.
   *
   * On Android, the tag must be a local image or video URI, such as `"file:///sdcard/img.png"`.
   *
   * On iOS, the tag can be any image URI (including local, remote asset-library and base64 data URIs)
   * or a local video file URI (remote or data URIs are not supported for saving video at this time).
   *
   * If the tag has a file extension of .mov or .mp4, it will be inferred as a video. Otherwise
   * it will be treated as a photo. To override the automatic choice, you can pass an optional
   * `type` parameter that must be one of 'photo' or 'video'.
   *
   * Returns a Promise which will resolve with the new URI.
   */
  saveToCameraRoll(tag: string, type?: 'photo' | 'video'): Promise<string>;

  /**
   * Invokes callback with photo identifier objects from the local camera roll of the device matching shape defined by getPhotosReturnChecker.
   *
   * @param params See getPhotosParamChecker.
   */
  getPhotos(params: GetPhotosParamType): Promise<GetPhotosReturnType>;
}

/** Clipboard gives you an interface for setting and getting content from Clipboard on both iOS and Android */
export interface ClipboardStatic {
  getString(): Promise<string>;
  setString(content: string): void;
}

export interface DatePickerAndroidOpenOptions {
  date?: Date | number | undefined;
  minDate?: Date | number | undefined;
  maxDate?: Date | number | undefined;
  mode?: 'calendar' | 'spinner' | 'default' | undefined;
}

// Deduced from DatePickerAndroid.android.js
export interface DatePickerAndroidDateSetAction {
  action: 'dateSetAction';
  year: number;
  month: number;
  day: number;
}

export interface DatePickerAndroidDismissedAction {
  action: 'dismissedAction';
}

export type DatePickerAndroidOpenReturn =
  | DatePickerAndroidDateSetAction
  | DatePickerAndroidDismissedAction;

export interface DatePickerAndroidStatic {
  /**
   * Opens the standard Android date picker dialog.
   *
   * The available keys for the options object are:
   * - date (Date object or timestamp in milliseconds) - date to show by default
   * - minDate (Date or timestamp in milliseconds) - minimum date that can be selected
   * - maxDate (Date object or timestamp in milliseconds) - maximum date that can be selected
   * - mode (enum('calendar', 'spinner', 'default')) - To set the date-picker mode to calendar/spinner/default
   *  - 'calendar': Show a date picker in calendar mode.
   *  - 'spinner': Show a date picker in spinner mode.
   *  - 'default': Show a default native date picker(spinner/calendar) based on android versions.
   *
   * Returns a Promise which will be invoked an object containing action, year, month (0-11), day if the user picked a date.
   * If the user dismissed the dialog, the Promise will still be resolved with action being DatePickerAndroid.dismissedAction and all the other keys being undefined.
   * Always check whether the action before reading the values.
   *
   * Note the native date picker dialog has some UI glitches on Android 4 and lower when using the minDate and maxDate options.
   */
  open(
    options?: DatePickerAndroidOpenOptions,
  ): Promise<DatePickerAndroidOpenReturn>;

  /**
   * A date has been selected.
   */
  dateSetAction: 'dateSetAction';

  /**
   * The dialog has been dismissed.
   */
  dismissedAction: 'dismissedAction';
}

export interface LinkingStatic extends NativeEventEmitter {
  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   */
  addEventListener(
    type: 'url',
    handler: (event: {url: string}) => void,
  ): EmitterSubscription;

  /**
   * Try to open the given url with any of the installed apps.
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact, or any other URL that can be opened with the installed apps.
   * NOTE: This method will fail if the system doesn't know how to open the specified URL. If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   */
  openURL(url: string): Promise<any>;

  /**
   * Determine whether or not an installed app can handle a given URL.
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   * NOTE: As of iOS 9, your app needs to provide the LSApplicationQueriesSchemes key inside Info.plist.
   * @param URL the URL to open
   */
  canOpenURL(url: string): Promise<boolean>;

  /**
   * If the app launch was triggered by an app link with, it will give the link url, otherwise it will give null
   * NOTE: To support deep linking on Android, refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents
   */
  getInitialURL(): Promise<string | null>;

  /**
   * Open the Settings app and displays the app’s custom settings, if it has any.
   */
  openSettings(): Promise<void>;

  /**
   * Sends an Android Intent - a broad surface to express Android functions.  Useful for deep-linking to settings pages,
   * opening an SMS app with a message draft in place, and more.  See https://developer.android.com/reference/kotlin/android/content/Intent?hl=en
   */
  sendIntent(
    action: string,
    extras?: Array<{key: string; value: string | number | boolean}>,
  ): Promise<void>;
}

export interface LogBoxStatic {
  /**
   * Silence any logs that match the given strings or regexes.
   */
  ignoreLogs(patterns: (string | RegExp)[]): void;

  /**
   * Toggle error and warning notifications
   * Note: this only disables notifications, uncaught errors will still open a full screen LogBox.
   * @param ignore whether to ignore logs or not
   */
  ignoreAllLogs(ignore?: boolean): void;

  install(): void;
  uninstall(): void;
}

export interface PanResponderGestureState {
  /**
   *  ID of the gestureState- persisted as long as there at least one touch on
   */
  stateID: number;

  /**
   *  the latest screen coordinates of the recently-moved touch
   */
  moveX: number;

  /**
   *  the latest screen coordinates of the recently-moved touch
   */
  moveY: number;

  /**
   * the screen coordinates of the responder grant
   */
  x0: number;

  /**
   * the screen coordinates of the responder grant
   */
  y0: number;

  /**
   * accumulated distance of the gesture since the touch started
   */
  dx: number;

  /**
   * accumulated distance of the gesture since the touch started
   */
  dy: number;

  /**
   * current velocity of the gesture
   */
  vx: number;

  /**
   * current velocity of the gesture
   */
  vy: number;

  /**
   * Number of touches currently on screen
   */
  numberActiveTouches: number;

  // All `gestureState` accounts for timeStamps up until:
  _accountsForMovesUpTo: number;
}

/**
 * @see documentation of GestureResponderHandlers
 */
export interface PanResponderCallbacks {
  onMoveShouldSetPanResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onStartShouldSetPanResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onPanResponderGrant?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderMove?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderRelease?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderTerminate?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;

  onMoveShouldSetPanResponderCapture?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onStartShouldSetPanResponderCapture?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onPanResponderReject?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderStart?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderEnd?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderTerminationRequest?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onShouldBlockNativeResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
}

export interface PanResponderInstance {
  panHandlers: GestureResponderHandlers;
}

/**
 * PanResponder reconciles several touches into a single gesture.
 * It makes single-touch gestures resilient to extra touches,
 * and can be used to recognize simple multi-touch gestures.
 *
 * It provides a predictable wrapper of the responder handlers provided by the gesture responder system.
 * For each handler, it provides a new gestureState object alongside the normal event.
 */
export interface PanResponderStatic {
  /**
   * @param config Enhanced versions of all of the responder callbacks
   * that provide not only the typical `ResponderSyntheticEvent`, but also the
   * `PanResponder` gesture state.  Simply replace the word `Responder` with
   * `PanResponder` in each of the typical `onResponder*` callbacks. For
   * example, the `config` object would look like:
   *
   *  - `onMoveShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onMoveShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onPanResponderReject: (e, gestureState) => {...}`
   *  - `onPanResponderGrant: (e, gestureState) => {...}`
   *  - `onPanResponderStart: (e, gestureState) => {...}`
   *  - `onPanResponderEnd: (e, gestureState) => {...}`
   *  - `onPanResponderRelease: (e, gestureState) => {...}`
   *  - `onPanResponderMove: (e, gestureState) => {...}`
   *  - `onPanResponderTerminate: (e, gestureState) => {...}`
   *  - `onPanResponderTerminationRequest: (e, gestureState) => {...}`
   *  - `onShouldBlockNativeResponder: (e, gestureState) => {...}`
   *
   *  In general, for events that have capture equivalents, we update the
   *  gestureState once in the capture phase and can use it in the bubble phase
   *  as well.
   *
   *  Be careful with onStartShould* callbacks. They only reflect updated
   *  `gestureState` for start/end events that bubble/capture to the Node.
   *  Once the node is the responder, you can rely on every start/end event
   *  being processed by the gesture and `gestureState` being updated
   *  accordingly. (numberActiveTouches) may not be totally accurate unless you
   *  are the responder.
   */
  create(config: PanResponderCallbacks): PanResponderInstance;
}

export interface Rationale {
  title: string;
  message: string;
  buttonPositive: string;
  buttonNegative?: string | undefined;
  buttonNeutral?: string | undefined;
}

export type Permission =
  | 'android.permission.READ_CALENDAR'
  | 'android.permission.WRITE_CALENDAR'
  | 'android.permission.CAMERA'
  | 'android.permission.READ_CONTACTS'
  | 'android.permission.WRITE_CONTACTS'
  | 'android.permission.GET_ACCOUNTS'
  | 'android.permission.ACCESS_BACKGROUND_LOCATION'
  | 'android.permission.ACCESS_FINE_LOCATION'
  | 'android.permission.ACCESS_COARSE_LOCATION'
  | 'android.permission.RECORD_AUDIO'
  | 'android.permission.READ_PHONE_STATE'
  | 'android.permission.CALL_PHONE'
  | 'android.permission.READ_CALL_LOG'
  | 'android.permission.WRITE_CALL_LOG'
  | 'com.android.voicemail.permission.ADD_VOICEMAIL'
  | 'com.android.voicemail.permission.READ_VOICEMAIL'
  | 'com.android.voicemail.permission.WRITE_VOICEMAIL'
  | 'android.permission.USE_SIP'
  | 'android.permission.PROCESS_OUTGOING_CALLS'
  | 'android.permission.BODY_SENSORS'
  | 'android.permission.BODY_SENSORS_BACKGROUND'
  | 'android.permission.SEND_SMS'
  | 'android.permission.RECEIVE_SMS'
  | 'android.permission.READ_SMS'
  | 'android.permission.RECEIVE_WAP_PUSH'
  | 'android.permission.RECEIVE_MMS'
  | 'android.permission.READ_EXTERNAL_STORAGE'
  | 'android.permission.READ_MEDIA_IMAGES'
  | 'android.permission.READ_MEDIA_VIDEO'
  | 'android.permission.READ_MEDIA_AUDIO'
  | 'android.permission.WRITE_EXTERNAL_STORAGE'
  | 'android.permission.BLUETOOTH_CONNECT'
  | 'android.permission.BLUETOOTH_SCAN'
  | 'android.permission.BLUETOOTH_ADVERTISE'
  | 'android.permission.ACCESS_MEDIA_LOCATION'
  | 'android.permission.ACCEPT_HANDOVER'
  | 'android.permission.ACTIVITY_RECOGNITION'
  | 'android.permission.ANSWER_PHONE_CALLS'
  | 'android.permission.READ_PHONE_NUMBERS'
  | 'android.permission.UWB_RANGING'
  | 'android.permission.POST_NOTIFICATIONS'
  | 'android.permission.NEARBY_WIFI_DEVICES';

export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';

export interface PermissionsAndroidStatic {
  /**
   * A list of permission results that are returned
   */
  RESULTS: {[key: string]: PermissionStatus};
  /**
   * A list of specified "dangerous" permissions that require prompting the user
   */
  PERMISSIONS: {[key: string]: Permission};
  new (): PermissionsAndroidStatic;
  /**
   * @deprecated Use check instead
   */
  checkPermission(permission: Permission): Promise<boolean>;
  /**
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   */
  check(permission: Permission): Promise<boolean>;
  /**
   * @deprecated Use request instead
   */
  requestPermission(
    permission: Permission,
    rationale?: Rationale,
  ): Promise<boolean>;
  /**
   * Prompts the user to enable a permission and returns a promise resolving to a
   * string value indicating whether the user allowed or denied the request
   *
   * If the optional rationale argument is included (which is an object with a
   * title and message), this function checks with the OS whether it is necessary
   * to show a dialog explaining why the permission is needed
   * (https://developer.android.com/training/permissions/requesting.html#explain)
   * and then shows the system permission dialog
   */
  request(
    permission: Permission,
    rationale?: Rationale,
  ): Promise<PermissionStatus>;
  /**
   * Prompts the user to enable multiple permissions in the same dialog and
   * returns an object with the permissions as keys and strings as values
   * indicating whether the user allowed or denied the request
   */
  requestMultiple(
    permissions: Array<Permission>,
  ): Promise<{[key in Permission]: PermissionStatus}>;
}

export interface PushNotificationPermissions {
  alert?: boolean | undefined;
  badge?: boolean | undefined;
  sound?: boolean | undefined;
}

export interface PushNotification {
  /**
   * An alias for `getAlert` to get the notification's main message string
   */
  getMessage(): string | Object;

  /**
   * Gets the sound string from the `aps` object
   */
  getSound(): string;

  /**
   * Gets the category string from the `aps` object
   */
  getCategory(): string;

  /**
   * Gets the notification's main message from the `aps` object
   */
  getAlert(): string | Object;

  /**
   * Gets the content-available number from the `aps` object
   */
  getContentAvailable(): number;

  /**
   * Gets the badge count number from the `aps` object
   */
  getBadgeCount(): number;

  /**
   * Gets the data object on the notif
   */
  getData(): Object;

  /**
   * iOS Only
   * Signifies remote notification handling is complete
   */
  finish(result: string): void;
}

type PresentLocalNotificationDetails = {
  alertBody: string;
  alertAction: string;
  alertTitle?: string | undefined;
  soundName?: string | undefined;
  category?: string | undefined;
  userInfo?: Object | undefined;
  applicationIconBadgeNumber?: number | undefined;
};

type ScheduleLocalNotificationDetails = {
  alertAction?: string | undefined;
  alertBody?: string | undefined;
  alertTitle?: string | undefined;
  applicationIconBadgeNumber?: number | undefined;
  category?: string | undefined;
  fireDate?: number | string | undefined;
  isSilent?: boolean | undefined;
  repeatInterval?:
    | 'year'
    | 'month'
    | 'week'
    | 'day'
    | 'hour'
    | 'minute'
    | undefined;
  soundName?: string | undefined;
  userInfo?: Object | undefined;
};

export type PushNotificationEventName =
  | 'notification'
  | 'localNotification'
  | 'register'
  | 'registrationError';

type FetchResult = {
  NewData: 'UIBackgroundFetchResultNewData';
  NoData: 'UIBackgroundFetchResultNoData';
  ResultFailed: 'UIBackgroundFetchResultFailed';
};

/**
 * Handle push notifications for your app, including permission handling and icon badge number.
 * @see https://reactnative.dev/docs/pushnotificationios#content
 *
 * //FIXME: BGR: The documentation seems completely off compared to the actual js implementation. I could never get the example to run
 */
export interface PushNotificationIOSStatic {
  /**
   * Schedules the localNotification for immediate presentation.
   * details is an object containing:
   * alertBody : The message displayed in the notification alert.
   * alertAction : The "action" displayed beneath an actionable notification. Defaults to "view";
   * soundName : The sound played when the notification is fired (optional).
   * category : The category of this notification, required for actionable notifications (optional).
   * userInfo : An optional object containing additional notification data.
   * applicationIconBadgeNumber (optional) : The number to display as the app's icon badge. The default value of this property is 0, which means that no badge is displayed.
   */
  presentLocalNotification(details: PresentLocalNotificationDetails): void;

  /**
   * Schedules the localNotification for future presentation.
   * details is an object containing:
   * fireDate : The date and time when the system should deliver the notification.
   * alertBody : The message displayed in the notification alert.
   * alertAction : The "action" displayed beneath an actionable notification. Defaults to "view";
   * soundName : The sound played when the notification is fired (optional).
   * category : The category of this notification, required for actionable notifications (optional).
   * userInfo : An optional object containing additional notification data.
   * applicationIconBadgeNumber (optional) : The number to display as the app's icon badge. Setting the number to 0 removes the icon badge.
   */
  scheduleLocalNotification(details: ScheduleLocalNotificationDetails): void;

  /**
   * Cancels all scheduled localNotifications
   */
  cancelAllLocalNotifications(): void;

  /**
   * Cancel local notifications.
   * Optionally restricts the set of canceled notifications to those notifications whose userInfo fields match the corresponding fields in the userInfo argument.
   */
  cancelLocalNotifications(userInfo: Object): void;

  /**
   * Sets the badge number for the app icon on the home screen
   */
  setApplicationIconBadgeNumber(number: number): void;

  /**
   * Gets the current badge number for the app icon on the home screen
   */
  getApplicationIconBadgeNumber(callback: (badge: number) => void): void;

  /**
   * Gets the local notifications that are currently scheduled.
   */
  getScheduledLocalNotifications(
    callback: (notifications: ScheduleLocalNotificationDetails[]) => void,
  ): void;

  /**
   * Attaches a listener to remote notifications while the app is running in the
   * foreground or the background.
   *
   * The handler will get be invoked with an instance of `PushNotificationIOS`
   *
   * The type MUST be 'notification'
   */
  addEventListener(
    type: 'notification' | 'localNotification',
    handler: (notification: PushNotification) => void,
  ): void;

  /**
   * Fired when the user registers for remote notifications.
   *
   * The handler will be invoked with a hex string representing the deviceToken.
   *
   * The type MUST be 'register'
   */
  addEventListener(
    type: 'register',
    handler: (deviceToken: string) => void,
  ): void;

  /**
   * Fired when the user fails to register for remote notifications.
   * Typically occurs when APNS is having issues, or the device is a simulator.
   *
   * The handler will be invoked with {message: string, code: number, details: any}.
   *
   * The type MUST be 'registrationError'
   */
  addEventListener(
    type: 'registrationError',
    handler: (error: {message: string; code: number; details: any}) => void,
  ): void;

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks
   */
  removeEventListener(
    type: PushNotificationEventName,
    handler:
      | ((notification: PushNotification) => void)
      | ((deviceToken: string) => void)
      | ((error: {message: string; code: number; details: any}) => void),
  ): void;

  /**
   * Requests all notification permissions from iOS, prompting the user's
   * dialog box.
   */
  requestPermissions(permissions?: PushNotificationPermissions[]): void;

  /**
   * Requests all notification permissions from iOS, prompting the user's
   * dialog box.
   */
  requestPermissions(
    permissions?: PushNotificationPermissions,
  ): Promise<PushNotificationPermissions>;

  /**
   * Unregister for all remote notifications received via Apple Push
   * Notification service.
   * You should call this method in rare circumstances only, such as when
   * a new version of the app removes support for all types of remote
   * notifications. Users can temporarily prevent apps from receiving
   * remote notifications through the Notifications section of the
   * Settings app. Apps unregistered through this method can always
   * re-register.
   */
  abandonPermissions(): void;

  /**
   * See what push permissions are currently enabled. `callback` will be
   * invoked with a `permissions` object:
   *
   *  - `alert` :boolean
   *  - `badge` :boolean
   *  - `sound` :boolean
   */
  checkPermissions(
    callback: (permissions: PushNotificationPermissions) => void,
  ): void;

  /**
   * This method returns a promise that resolves to either the notification
   * object if the app was launched by a push notification, or `null` otherwise.
   */
  getInitialNotification(): Promise<PushNotification | null>;

  /**
   * iOS fetch results that best describe the result of a finished remote notification handler.
   * For a list of possible values, see `PushNotificationIOS.FetchResult`.
   */
  FetchResult: FetchResult;
}

export interface SettingsStatic {
  get(key: string): any;
  set(settings: Object): void;
  watchKeys(keys: string | Array<string>, callback: () => void): number;
  clearWatch(watchId: number): void;
}

export type StatusBarStyle = 'default' | 'light-content' | 'dark-content';

export type StatusBarAnimation = 'none' | 'fade' | 'slide';

export interface StatusBarPropsIOS {
  /**
   * If the network activity indicator should be visible.
   *
   * @platform ios
   */
  networkActivityIndicatorVisible?: boolean | undefined;

  /**
   * The transition effect when showing and hiding the status bar using
   * the hidden prop. Defaults to 'fade'.
   *
   * @platform ios
   */
  showHideTransition?: null | 'fade' | 'slide' | 'none' | undefined;
}

export interface StatusBarPropsAndroid {
  /**
   * The background color of the status bar.
   *
   * @platform android
   */
  backgroundColor?: ColorValue | undefined;

  /**
   * If the status bar is translucent. When translucent is set to true,
   * the app will draw under the status bar. This is useful when using a
   * semi transparent status bar color.
   *
   * @platform android
   */
  translucent?: boolean | undefined;
}

export interface StatusBarProps
  extends StatusBarPropsIOS,
    StatusBarPropsAndroid {
  /**
   * If the transition between status bar property changes should be
   * animated. Supported for backgroundColor, barStyle and hidden.
   */
  animated?: boolean | undefined;

  /**
   * Sets the color of the status bar text.
   */
  barStyle?: null | StatusBarStyle | undefined;

  /**
   * If the status bar is hidden.
   */
  hidden?: boolean | undefined;
}

export class StatusBar extends React.Component<StatusBarProps> {
  /**
   * The current height of the status bar on the device.
   * @platform android
   */
  static currentHeight?: number | undefined;

  /**
   * Show or hide the status bar
   * @param hidden The dialog's title.
   * @param animation Optional animation when
   *    changing the status bar hidden property.
   */
  static setHidden: (hidden: boolean, animation?: StatusBarAnimation) => void;

  /**
   * Set the status bar style
   * @param style Status bar style to set
   * @param animated Animate the style change.
   */
  static setBarStyle: (style: StatusBarStyle, animated?: boolean) => void;

  /**
   * Control the visibility of the network activity indicator
   * @param visible Show the indicator.
   */
  static setNetworkActivityIndicatorVisible: (visible: boolean) => void;

  /**
   * Set the background color for the status bar
   * @param color Background color.
   * @param animated Animate the style change.
   */
  static setBackgroundColor: (color: ColorValue, animated?: boolean) => void;

  /**
   * Control the translucency of the status bar
   * @param translucent Set as translucent.
   */
  static setTranslucent: (translucent: boolean) => void;

  /**
   * Push a StatusBar entry onto the stack.
   * The return value should be passed to `popStackEntry` when complete.
   *
   * @param props Object containing the StatusBar props to use in the stack entry.
   */
  static pushStackEntry: (props: StatusBarProps) => StatusBarProps;

  /**
   * Pop a StatusBar entry from the stack.
   *
   * @param entry Entry returned from `pushStackEntry`.
   */
  static popStackEntry: (entry: StatusBarProps) => void;

  /**
   * Replace an existing StatusBar stack entry with new props.
   *
   * @param entry Entry returned from `pushStackEntry` to replace.
   * @param props Object containing the StatusBar props to use in the replacement stack entry.
   */
  static replaceStackEntry: (
    entry: StatusBarProps,
    props: StatusBarProps,
  ) => StatusBarProps;
}

export interface TimePickerAndroidOpenOptions {
  hour?: number | undefined;
  minute?: number | undefined;
  is24Hour?: boolean | undefined;
  mode?: 'clock' | 'spinner' | 'default' | undefined;
}

export interface TimePickerAndroidTimeSetAction {
  action: 'timeSetAction';
  hour: number;
  minute: number;
}

export interface TimePickerAndroidDismissedAction {
  action: 'dismissedAction';
}

export type TimePickerAndroidOpenReturn =
  | TimePickerAndroidTimeSetAction
  | TimePickerAndroidDismissedAction;

/**
 * Opens the standard Android time picker dialog.
 *
 * ### Example
 *
 * ```
 * try {
 *   const {action, hour, minute} = await TimePickerAndroid.open({
 *     hour: 14,
 *     minute: 0,
 *     is24Hour: false, // Will display '2 PM'
 *   });
 *   if (action !== TimePickerAndroid.dismissedAction) {
 *     // Selected hour (0-23), minute (0-59)
 *   }
 * } catch ({code, message}) {
 *   console.warn('Cannot open time picker', message);
 * }
 * ```
 */
export interface TimePickerAndroidStatic {
  /**
   * Opens the standard Android time picker dialog.
   *
   * The available keys for the `options` object are:
   *   * `hour` (0-23) - the hour to show, defaults to the current time
   *   * `minute` (0-59) - the minute to show, defaults to the current time
   *   * `is24Hour` (boolean) - If `true`, the picker uses the 24-hour format. If `false`,
   *     the picker shows an AM/PM chooser. If undefined, the default for the current locale
   *     is used.
   *   * `mode` (enum('clock', 'spinner', 'default')) - set the time picker mode
   *     * 'clock': Show a time picker in clock mode.
   *     * 'spinner': Show a time picker in spinner mode.
   *     * 'default': Show a default time picker based on Android versions.
   *
   * Returns a Promise which will be invoked an object containing `action`, `hour` (0-23),
   * `minute` (0-59) if the user picked a time. If the user dismissed the dialog, the Promise will
   * still be resolved with action being `TimePickerAndroid.dismissedAction` and all the other keys
   * being undefined. **Always** check whether the `action` before reading the values.
   */
  open(
    options: TimePickerAndroidOpenOptions,
  ): Promise<TimePickerAndroidOpenReturn>;

  /**
   * A time has been selected.
   */
  timeSetAction: 'timeSetAction';

  /**
   * The dialog has been dismissed.
   */
  dismissedAction: 'dismissedAction';
}

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 *
 * There is also a function `showWithGravity` to specify the layout gravity. May be
 * ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER
 */
export interface ToastAndroidStatic {
  /**
   * String message: A string with the text to toast
   * int duration: The duration of the toast.
   * May be ToastAndroid.SHORT or ToastAndroid.LONG
   */
  show(message: string, duration: number): void;
  /** `gravity` may be ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER */
  showWithGravity(message: string, duration: number, gravity: number): void;

  showWithGravityAndOffset(
    message: string,
    duration: number,
    gravity: number,
    xOffset: number,
    yOffset: number,
  ): void;
  // Toast duration constants
  SHORT: number;
  LONG: number;
  // Toast gravity constants
  TOP: number;
  BOTTOM: number;
  CENTER: number;
}

export interface UIManagerStatic {
  /**
   * Capture an image of the screen, window or an individual view. The image
   * will be stored in a temporary file that will only exist for as long as the
   * app is running.
   *
   * The `view` argument can be the literal string `window` if you want to
   * capture the entire window, or it can be a reference to a specific
   * React Native component.
   *
   * The `options` argument may include:
   * - width/height (number) - the width and height of the image to capture.
   * - format (string) - either 'png' or 'jpeg'. Defaults to 'png'.
   * - quality (number) - the quality when using jpeg. 0.0 - 1.0 (default).
   *
   * Returns a Promise<string> (tempFilePath)
   * @platform ios
   */
  takeSnapshot: (
    view?: 'window' | React.ReactElement | number,
    options?: {
      width?: number | undefined;
      height?: number | undefined;
      format?: 'png' | 'jpeg' | undefined;
      quality?: number | undefined;
    },
  ) => Promise<string>;

  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   *
   * @deprecated Use `ref.measure` instead.
   */
  measure(node: number, callback: MeasureOnSuccessCallback): void;

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   *
   * @deprecated Use `ref.measureInWindow` instead.
   */
  measureInWindow(
    node: number,
    callback: MeasureInWindowOnSuccessCallback,
  ): void;

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeNode`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   *
   * @deprecated Use `ref.measureLayout` instead.
   */
  measureLayout(
    node: number,
    relativeToNativeNode: number,
    onFail: () => void /* currently unused */,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ): void;

  /**
   * Automatically animates views to their new positions when the
   * next layout happens.
   *
   * A common way to use this API is to call it before calling `setState`.
   *
   * Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:
   *
   *     UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
   */
  setLayoutAnimationEnabledExperimental(value: boolean): void;

  /**
   * Used to display an Android PopupMenu. If a menu item is pressed, the success callback will
   * be called with the following arguments:
   *
   *  - item - the menu item.
   *  - index - index of the pressed item in array. Returns `undefined` if cancelled.
   *
   * To obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   *
   * Note that this works only on Android
   */
  showPopupMenu(
    node: number,
    items: string[],
    error: () => void /* currently unused */,
    success: (item: string, index: number | undefined) => void,
  ): void;

  getViewManagerConfig: (name: string) => {
    Commands: {[key: string]: number};
  };

  hasViewManagerConfig: (name: string) => boolean;

  /**
   * Used to call a native view method from JavaScript
   *
   * reactTag - Id of react view.
   * commandID - Id of the native method that should be called.
   * commandArgs - Args of the native method that we can pass from JS to native.
   */
  dispatchViewManagerCommand: (
    reactTag: number | null,
    commandID: number | string,
    commandArgs?: Array<any>,
  ) => void;
}

export interface SwitchPropsIOS extends ViewProps {
  /**
   * Background color when the switch is turned on.
   *
   * @deprecated use trackColor instead
   */
  onTintColor?: ColorValue | undefined;

  /**
   * Color of the foreground switch grip.
   *
   * @deprecated use thumbColor instead
   */
  thumbTintColor?: ColorValue | undefined;

  /**
   * Background color when the switch is turned off.
   *
   * @deprecated use trackColor instead
   */
  tintColor?: ColorValue | undefined;
}

export interface SwitchChangeEvent extends React.SyntheticEvent {
  value: boolean;
}

export interface SwitchProps extends SwitchPropsIOS {
  /**
   * Color of the foreground switch grip.
   */
  thumbColor?: ColorValue | undefined;

  /**
   * Custom colors for the switch track
   *
   * Color when false and color when true
   */
  trackColor?:
    | {
        false?: ColorValue | null | undefined;
        true?: ColorValue | null | undefined;
      }
    | undefined;

  /**
   * If true the user won't be able to toggle the switch.
   * Default value is false.
   */
  disabled?: boolean | undefined;

  /**
   * Invoked with the the change event as an argument when the value changes.
   */
  onChange?:
    | ((event: SwitchChangeEvent) => Promise<void> | void)
    | null
    | undefined;

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ((value: boolean) => Promise<void> | void) | null | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * The value of the switch. If true the switch will be turned on.
   * Default value is false.
   */
  value?: boolean | undefined;

  /**
   * On iOS, custom color for the background.
   * Can be seen when the switch value is false or when the switch is disabled.
   */
  ios_backgroundColor?: ColorValue | undefined;

  style?: StyleProp<ViewStyle> | undefined;
}

/**
 * Renders a boolean input.
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render
 * the supplied `value` prop instead of the expected result of any user actions.
 */
declare class SwitchComponent extends React.Component<SwitchProps> {}
declare const SwitchBase: Constructor<NativeMethods> & typeof SwitchComponent;
export class Switch extends SwitchBase {}

/**
 * The Vibration API is exposed at `Vibration.vibrate()`.
 * The vibration is asynchronous so this method will return immediately.
 *
 * There will be no effect on devices that do not support Vibration, eg. the simulator.
 *
 * **Note for android**
 * add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`
 *
 * **Android Usage:**
 *
 * [0, 500, 200, 500]
 * V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * [300, 500, 200, 500]
 * --wait(0.3s)--> V(0.5s) --wait(0.2s)--> V(0.5s)
 *
 * **iOS Usage:**
 * if first argument is 0, it will not be included in pattern array.
 *
 * [0, 1000, 2000, 3000]
 * V(fixed) --wait(1s)--> V(fixed) --wait(2s)--> V(fixed) --wait(3s)--> V(fixed)
 */
export interface VibrationStatic {
  vibrate(pattern?: number | number[] | null, repeat?: boolean | null): void;

  /**
   * Stop vibration
   */
  cancel(): void;
}

type ColorSchemeName = 'light' | 'dark' | null | undefined;

export namespace Appearance {
  type AppearancePreferences = {
    colorScheme: ColorSchemeName;
  };

  type AppearanceListener = (preferences: AppearancePreferences) => void;

  /**
   * Note: Although color scheme is available immediately, it may change at any
   * time. Any rendering logic or styles that depend on this should try to call
   * this function on every render, rather than caching the value (for example,
   * using inline styles rather than setting a value in a `StyleSheet`).
   *
   * Example: `const colorScheme = Appearance.getColorScheme();`
   */
  export function getColorScheme(): ColorSchemeName;

  /**
   * Add an event handler that is fired when appearance preferences change.
   */
  export function addChangeListener(
    listener: AppearanceListener,
  ): NativeEventSubscription;
}

/**
 * A new useColorScheme hook is provided as the preferred way of accessing
 * the user's preferred color scheme (aka Dark Mode).
 */
export function useColorScheme(): ColorSchemeName;

/**
 * This class implements common easing functions. The math is pretty obscure,
 * but this cool website has nice visual illustrations of what they represent:
 * http://xaedes.de/dev/transitions/
 */
export type EasingFunction = (value: number) => number;
export interface EasingStatic {
  step0: EasingFunction;
  step1: EasingFunction;
  linear: EasingFunction;
  ease: EasingFunction;
  quad: EasingFunction;
  cubic: EasingFunction;
  poly(n: number): EasingFunction;
  sin: EasingFunction;
  circle: EasingFunction;
  exp: EasingFunction;
  elastic(bounciness: number): EasingFunction;
  back(s: number): EasingFunction;
  bounce: EasingFunction;
  bezier(x1: number, y1: number, x2: number, y2: number): EasingFunction;
  in(easing: EasingFunction): EasingFunction;
  out(easing: EasingFunction): EasingFunction;
  inOut(easing: EasingFunction): EasingFunction;
}

// We need to alias these views so we can reference them in the Animated
// namespace where their names are shadowed.
declare const _View: typeof View;
declare const _Image: typeof Image;
declare const _Text: typeof Text;
declare const _ScrollView: typeof ScrollView;
export namespace Animated {
  type AnimatedValue = Value;
  type AnimatedValueXY = ValueXY;

  class Animated {
    // Internal class, no public API.
  }

  class AnimatedNode {
    /**
     * Adds an asynchronous listener to the value so you can observe updates from
     * animations.  This is useful because there is no way to
     * synchronously read the value because it might be driven natively.
     *
     * See https://reactnative.dev/docs/animatedvalue.html#addlistener
     */
    addListener(callback: (value: any) => any): string;
    /**
     * Unregister a listener. The `id` param shall match the identifier
     * previously returned by `addListener()`.
     *
     * See https://reactnative.dev/docs/animatedvalue.html#removelistener
     */
    removeListener(id: string): void;
    /**
     * Remove all registered listeners.
     *
     * See https://reactnative.dev/docs/animatedvalue.html#removealllisteners
     */
    removeAllListeners(): void;

    hasListeners(): boolean;
  }

  class AnimatedWithChildren extends AnimatedNode {
    // Internal class, no public API.
  }

  type RgbaValue = {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
  };

  type RgbaAnimatedValue = {
    readonly r: AnimatedValue;
    readonly g: AnimatedValue;
    readonly b: AnimatedValue;
    readonly a: AnimatedValue;
  };

  type AnimatedConfig = {
    readonly useNativeDriver: boolean;
  };

  class AnimatedColor extends AnimatedWithChildren {
    r: AnimatedValue;
    g: AnimatedValue;
    b: AnimatedValue;
    a: AnimatedValue;

    constructor(
      valueIn?: RgbaValue | RgbaAnimatedValue | ColorValue | null,
      config?: AnimatedConfig | null,
    );
    nativeColor: unknown; // Unsure what to do here
    setValue: (value: RgbaValue | ColorValue) => void;
    setOffset: (offset: RgbaValue) => void;
    flattenOffset: () => void;
    extractOffset: () => void;
    addListener: (callback: (value: ColorValue) => unknown) => string;
    removeListener: (id: string) => void;
    removeAllListeners: () => void;
    stopAnimation: (callback: (value: ColorValue) => unknown) => void;
    resetAnimation: (callback: (value: ColorValue) => unknown) => void;
  }

  class AnimatedInterpolation<
    OutputT extends number | string,
  > extends AnimatedWithChildren {
    interpolate(
      config: InterpolationConfigType,
    ): AnimatedInterpolation<OutputT>;
  }

  type ExtrapolateType = 'extend' | 'identity' | 'clamp';

  type InterpolationConfigType = {
    inputRange: number[];
    outputRange: number[] | string[];
    easing?: ((input: number) => number) | undefined;
    extrapolate?: ExtrapolateType | undefined;
    extrapolateLeft?: ExtrapolateType | undefined;
    extrapolateRight?: ExtrapolateType | undefined;
  };

  type ValueListenerCallback = (state: {value: number}) => void;

  /**
   * Standard value for driving animations.  One `Animated.Value` can drive
   * multiple properties in a synchronized fashion, but can only be driven by one
   * mechanism at a time.  Using a new mechanism (e.g. starting a new animation,
   * or calling `setValue`) will stop any previous ones.
   */
  export class Value extends AnimatedWithChildren {
    constructor(value: number, config?: AnimatedConfig | null);

    /**
     * Directly set the value.  This will stop any animations running on the value
     * and update all the bound properties.
     */
    setValue(value: number): void;

    /**
     * Sets an offset that is applied on top of whatever value is set, whether via
     * `setValue`, an animation, or `Animated.event`.  Useful for compensating
     * things like the start of a pan gesture.
     */
    setOffset(offset: number): void;

    /**
     * Merges the offset value into the base value and resets the offset to zero.
     * The final output of the value is unchanged.
     */
    flattenOffset(): void;

    /**
     * Sets the offset value to the base value, and resets the base value to zero.
     * The final output of the value is unchanged.
     */
    extractOffset(): void;

    /**
     * Adds an asynchronous listener to the value so you can observe updates from
     * animations.  This is useful because there is no way to
     * synchronously read the value because it might be driven natively.
     */
    addListener(callback: ValueListenerCallback): string;

    removeListener(id: string): void;

    removeAllListeners(): void;

    /**
     * Stops any running animation or tracking.  `callback` is invoked with the
     * final value after stopping the animation, which is useful for updating
     * state to match the animation position with layout.
     */
    stopAnimation(callback?: (value: number) => void): void;

    /**
     * Interpolates the value before updating the property, e.g. mapping 0-1 to
     * 0-10.
     */
    interpolate<OutputT extends number | string>(
      config: InterpolationConfigType,
    ): AnimatedInterpolation<OutputT>;
  }

  type ValueXYListenerCallback = (value: {x: number; y: number}) => void;

  /**
   * 2D Value for driving 2D animations, such as pan gestures.  Almost identical
   * API to normal `Animated.Value`, but multiplexed.  Contains two regular
   * `Animated.Value`s under the hood.
   */
  export class ValueXY extends AnimatedWithChildren {
    x: AnimatedValue;
    y: AnimatedValue;

    constructor(
      valueIn?: {x: number | AnimatedValue; y: number | AnimatedValue},
      config?: AnimatedConfig | null,
    );

    setValue(value: {x: number; y: number}): void;

    setOffset(offset: {x: number; y: number}): void;

    flattenOffset(): void;

    extractOffset(): void;

    stopAnimation(callback?: (value: {x: number; y: number}) => void): void;

    addListener(callback: ValueXYListenerCallback): string;

    removeListener(id: string): void;

    /**
     * Converts `{x, y}` into `{left, top}` for use in style, e.g.
     *
     *```javascript
     *  style={this.state.anim.getLayout()}
     *```
     */
    getLayout(): {[key: string]: AnimatedValue};

    /**
     * Converts `{x, y}` into a useable translation transform, e.g.
     *
     *```javascript
     *  style={{
     *    transform: this.state.anim.getTranslateTransform()
     *  }}
     *```
     */
    getTranslateTransform(): [
      {translateX: AnimatedValue},
      {translateY: AnimatedValue},
    ];
  }

  type EndResult = {finished: boolean};
  type EndCallback = (result: EndResult) => void;

  export interface CompositeAnimation {
    /**
     * Animations are started by calling start() on your animation.
     * start() takes a completion callback that will be called when the
     * animation is done or when the animation is done because stop() was
     * called on it before it could finish.
     *
     * @param callback - Optional function that will be called
     *      after the animation finished running normally or when the animation
     *      is done because stop() was called on it before it could finish
     *
     * @example
     *   Animated.timing({}).start(({ finished }) => {
     *    // completion callback
     *   });
     */
    start: (callback?: EndCallback) => void;
    /**
     * Stops any running animation.
     */
    stop: () => void;
    /**
     * Stops any running animation and resets the value to its original.
     */
    reset: () => void;
  }

  interface AnimationConfig {
    isInteraction?: boolean | undefined;
    useNativeDriver: boolean;
  }

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   */
  export function decay(
    value: AnimatedValue | AnimatedValueXY,
    config: DecayAnimationConfig,
  ): CompositeAnimation;

  interface DecayAnimationConfig extends AnimationConfig {
    velocity: number | {x: number; y: number};
    deceleration?: number | undefined;
  }

  /**
   * Animates a value along a timed easing curve.  The `Easing` module has tons
   * of pre-defined curves, or you can use your own function.
   */
  export const timing: (
    value: AnimatedValue | AnimatedValueXY,
    config: TimingAnimationConfig,
  ) => CompositeAnimation;

  interface TimingAnimationConfig extends AnimationConfig {
    toValue:
      | number
      | AnimatedValue
      | {x: number; y: number}
      | AnimatedValueXY
      | AnimatedInterpolation<number>;
    easing?: ((value: number) => number) | undefined;
    duration?: number | undefined;
    delay?: number | undefined;
  }

  interface SpringAnimationConfig extends AnimationConfig {
    toValue:
      | number
      | AnimatedValue
      | {x: number; y: number}
      | AnimatedValueXY
      | RgbaValue
      | AnimatedColor
      | AnimatedInterpolation<number>;
    overshootClamping?: boolean | undefined;
    restDisplacementThreshold?: number | undefined;
    restSpeedThreshold?: number | undefined;
    velocity?: number | {x: number; y: number} | undefined;
    bounciness?: number | undefined;
    speed?: number | undefined;
    tension?: number | undefined;
    friction?: number | undefined;
    stiffness?: number | undefined;
    mass?: number | undefined;
    damping?: number | undefined;
    delay?: number | undefined;
  }

  interface LoopAnimationConfig {
    iterations?: number | undefined; // default -1 for infinite
    /**
     * Defaults to `true`
     */
    resetBeforeIteration?: boolean | undefined;
  }

  /**
   * Creates a new Animated value composed from two Animated values added
   * together.
   */
  export function add<OutputT extends number | string>(
    a: Animated,
    b: Animated,
  ): AnimatedAddition<OutputT>;

  class AnimatedAddition<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Creates a new Animated value composed by subtracting the second Animated
   * value from the first Animated value.
   */
  export function subtract<OutputT extends number | string>(
    a: Animated,
    b: Animated,
  ): AnimatedSubtraction<OutputT>;

  class AnimatedSubtraction<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Creates a new Animated value composed by dividing the first Animated
   * value by the second Animated value.
   */
  export function divide<OutputT extends number | string>(
    a: Animated,
    b: Animated,
  ): AnimatedDivision<OutputT>;

  class AnimatedDivision<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Creates a new Animated value composed from two Animated values multiplied
   * together.
   */
  export function multiply<OutputT extends number | string>(
    a: Animated,
    b: Animated,
  ): AnimatedMultiplication<OutputT>;

  class AnimatedMultiplication<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Creates a new Animated value that is the (non-negative) modulo of the
   * provided Animated value
   */
  export function modulo<OutputT extends number | string>(
    a: Animated,
    modulus: number,
  ): AnimatedModulo<OutputT>;

  class AnimatedModulo<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Create a new Animated value that is limited between 2 values. It uses the
   * difference between the last value so even if the value is far from the bounds
   * it will start changing when the value starts getting closer again.
   * (`value = clamp(value + diff, min, max)`).
   *
   * This is useful with scroll events, for example, to show the navbar when
   * scrolling up and to hide it when scrolling down.
   */
  export function diffClamp<OutputT extends number | string>(
    a: Animated,
    min: number,
    max: number,
  ): AnimatedDiffClamp<OutputT>;

  class AnimatedDiffClamp<
    OutputT extends number | string,
  > extends AnimatedInterpolation<OutputT> {}

  /**
   * Starts an animation after the given delay.
   */
  export function delay(time: number): CompositeAnimation;

  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next.  If the current running animation is stopped, no
   * following animations will be started.
   */
  export function sequence(
    animations: Array<CompositeAnimation>,
  ): CompositeAnimation;

  /**
   * Array of animations may run in parallel (overlap), but are started in
   * sequence with successive delays.  Nice for doing trailing effects.
   */

  export function stagger(
    time: number,
    animations: Array<CompositeAnimation>,
  ): CompositeAnimation;

  /**
   * Loops a given animation continuously, so that each time it reaches the end,
   * it resets and begins again from the start. Can specify number of times to
   * loop using the key 'iterations' in the config. Will loop without blocking
   * the UI thread if the child animation is set to 'useNativeDriver'.
   */

  export function loop(
    animation: CompositeAnimation,
    config?: LoopAnimationConfig,
  ): CompositeAnimation;

  /**
   * Spring animation based on Rebound and Origami.  Tracks velocity state to
   * create fluid motions as the `toValue` updates, and can be chained together.
   */
  export function spring(
    value: AnimatedValue | AnimatedValueXY,
    config: SpringAnimationConfig,
  ): CompositeAnimation;

  type ParallelConfig = {
    stopTogether?: boolean | undefined; // If one is stopped, stop all.  default: true
  };

  /**
   * Starts an array of animations all at the same time.  By default, if one
   * of the animations is stopped, they will all be stopped.  You can override
   * this with the `stopTogether` flag.
   */
  export function parallel(
    animations: Array<CompositeAnimation>,
    config?: ParallelConfig,
  ): CompositeAnimation;

  type Mapping = {[key: string]: Mapping} | AnimatedValue;
  interface EventConfig<T> {
    listener?: ((event: NativeSyntheticEvent<T>) => void) | undefined;
    useNativeDriver: boolean;
  }

  /**
   *  Takes an array of mappings and extracts values from each arg accordingly,
   *  then calls `setValue` on the mapped outputs.  e.g.
   *
   *```javascript
   *  onScroll={Animated.event(
   *    [{nativeEvent: {contentOffset: {x: this._scrollX}}}]
   *    {listener},          // Optional async listener
   *  )
   *  ...
   *  onPanResponderMove: Animated.event([
   *    null,                // raw event arg ignored
   *    {dx: this._panX},    // gestureState arg
   *  ]),
   *```
   */
  export function event<T>(
    argMapping: Array<Mapping | null>,
    config?: EventConfig<T>,
  ): (...args: any[]) => void;

  export type ComponentProps<T> = T extends
    | React.ComponentType<infer P>
    | React.Component<infer P>
    ? P
    : never;

  export type LegacyRef<C> = {getNode(): C};

  type Nullable = undefined | null;
  type Primitive = string | number | boolean | symbol;
  type Builtin = Function | Date | Error | RegExp;

  interface WithAnimatedArray<P> extends Array<WithAnimatedValue<P>> {}
  type WithAnimatedObject<T> = {
    [K in keyof T]: WithAnimatedValue<T[K]>;
  };

  export type WithAnimatedValue<T> = T extends Builtin | Nullable
    ? T
    : T extends Primitive
    ? T | Value | AnimatedInterpolation<number | string> // add `Value` and `AnimatedInterpolation` but also preserve original T
    : T extends Array<infer P>
    ? WithAnimatedArray<P>
    : T extends {}
    ? WithAnimatedObject<T>
    : T; // in case it's something we don't yet know about (for .e.g bigint)

  type NonAnimatedProps = 'key' | 'ref';

  type TAugmentRef<T> = T extends React.Ref<infer R>
    ? React.Ref<R | LegacyRef<R>>
    : never;

  export type AnimatedProps<T> = {
    [key in keyof T]: key extends NonAnimatedProps
      ? key extends 'ref'
        ? TAugmentRef<T[key]>
        : T[key]
      : WithAnimatedValue<T[key]>;
  };

  export interface AnimatedComponent<T extends React.ComponentType<any>>
    extends React.FC<AnimatedProps<React.ComponentPropsWithRef<T>>> {}

  export type AnimatedComponentOptions = {
    collapsable?: boolean;
  };

  /**
   * Make any React component Animatable.  Used to create `Animated.View`, etc.
   */
  export function createAnimatedComponent<T extends React.ComponentType<any>>(
    component: T,
    options?: AnimatedComponentOptions,
  ): AnimatedComponent<T>;

  /**
   * Animated variants of the basic native views. Accepts Animated.Value for
   * props and style.
   */
  export const View: AnimatedComponent<typeof _View>;
  export const Image: AnimatedComponent<typeof _Image>;
  export const Text: AnimatedComponent<typeof _Text>;
  export const ScrollView: AnimatedComponent<typeof _ScrollView>;

  /**
   * FlatList and SectionList infer generic Type defined under their `data` and `section` props.
   */
  export class FlatList<ItemT = any> extends React.Component<
    AnimatedProps<FlatListProps<ItemT>>
  > {}
  export class SectionList<
    ItemT = any,
    SectionT = DefaultSectionT,
  > extends React.Component<AnimatedProps<SectionListProps<ItemT, SectionT>>> {}
}

// tslint:disable-next-line:interface-name
export interface I18nManagerStatic {
  getConstants: () => {
    isRTL: boolean;
    doLeftAndRightSwapInRTL: boolean;
    localeIdentifier?: string | null | undefined;
  };
  allowRTL: (allowRTL: boolean) => void;
  forceRTL: (forceRTL: boolean) => void;
  swapLeftAndRightInRTL: (swapLeftAndRight: boolean) => void;
  isRTL: boolean;
  doLeftAndRightSwapInRTL: boolean;
}

export interface OpenCameraDialogOptions {
  /** Defaults to false */
  videoMode?: boolean | undefined;
}

export interface OpenSelectDialogOptions {
  /** Defaults to true */
  showImages?: boolean | undefined;
  /** Defaults to false */
  showVideos?: boolean | undefined;
}

/** [imageURL|tempImageTag, height, width] */
export type ImagePickerResult = [string, number, number];

export interface ImagePickerIOSStatic {
  canRecordVideos(callback: (value: boolean) => void): void;
  canUseCamera(callback: (value: boolean) => void): void;
  openCameraDialog(
    config: OpenCameraDialogOptions,
    successCallback: (args: ImagePickerResult) => void,
    cancelCallback: (args: any[]) => void,
  ): void;
  openSelectDialog(
    config: OpenSelectDialogOptions,
    successCallback: (args: ImagePickerResult) => void,
    cancelCallback: (args: any[]) => void,
  ): void;
}

export interface ImageStoreStatic {
  /**
   * Check if the ImageStore contains image data for the specified URI.
   * @platform ios
   */
  hasImageForTag(uri: string, callback: (hasImage: boolean) => void): void;

  /**
   * Delete an image from the ImageStore. Images are stored in memory and
   * must be manually removed when you are finished with them, otherwise they
   * will continue to use up RAM until the app is terminated. It is safe to
   * call `removeImageForTag()` without first calling `hasImageForTag()`, it
   * will simply fail silently.
   * @platform ios
   */
  removeImageForTag(uri: string): void;

  /**
   * Stores a base64-encoded image in the ImageStore, and returns a URI that
   * can be used to access or display the image later. Images are stored in
   * memory only, and must be manually deleted when you are finished with
   * them by calling `removeImageForTag()`.
   *
   * Note that it is very inefficient to transfer large quantities of binary
   * data between JS and native code, so you should avoid calling this more
   * than necessary.
   * @platform ios
   */
  addImageFromBase64(
    base64ImageData: string,
    success: (uri: string) => void,
    failure: (error: any) => void,
  ): void;

  /**
   * Retrieves the base64-encoded data for an image in the ImageStore. If the
   * specified URI does not match an image in the store, the failure callback
   * will be called.
   *
   * Note that it is very inefficient to transfer large quantities of binary
   * data between JS and native code, so you should avoid calling this more
   * than necessary. To display an image in the ImageStore, you can just pass
   * the URI to an `<Image/>` component; there is no need to retrieve the
   * base64 data.
   */
  getBase64ForTag(
    uri: string,
    success: (base64ImageData: string) => void,
    failure: (error: any) => void,
  ): void;
}

//
// Turbo Module
//

export interface TurboModule {
  getConstants?(): {};
}

export const TurboModuleRegistry: {
  get<T extends TurboModule>(name: string): T | null;
  getEnforcing<T extends TurboModule>(name: string): T;
};

//
// Interfacing with Native Modules
// https://reactnative.dev/docs/native-modules-ios
//

export interface NativeEventSubscription {
  /**
   * Call this method to un-subscribe from a native-event
   */
  remove(): void;
}

/**
 * Receive events from native-code
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTNativeAppEventEmitter.
 * @see https://github.com/facebook/react-native/blob/0.34-stable\Libraries\EventEmitter\RCTNativeAppEventEmitter.js
 * @see https://reactnative.dev/docs/native-modules-ios#sending-events-to-javascript
 */
type RCTNativeAppEventEmitter = DeviceEventEmitterStatic;

interface ImageCropData {
  /**
   * The top-left corner of the cropped image, specified in the original
   * image's coordinate space.
   */
  offset: {
    x: number;
    y: number;
  };

  /**
   * The size (dimensions) of the cropped image, specified in the original
   * image's coordinate space.
   */
  size: {
    width: number;
    height: number;
  };

  /**
   * (Optional) size to scale the cropped image to.
   */
  displaySize?: {width: number; height: number} | undefined;

  /**
   * (Optional) the resizing mode to use when scaling the image. If the
   * `displaySize` param is not specified, this has no effect.
   */
  resizeMode?: 'contain' | 'cover' | 'stretch' | undefined;
}

interface ImageEditorStatic {
  /**
   * Crop the image specified by the URI param. If URI points to a remote
   * image, it will be downloaded automatically. If the image cannot be
   * loaded/downloaded, the failure callback will be called.
   *
   * If the cropping process is successful, the resultant cropped image
   * will be stored in the ImageStore, and the URI returned in the success
   * callback will point to the image in the store. Remember to delete the
   * cropped image from the ImageStore when you are done with it.
   */
  cropImage(
    uri: string,
    cropData: ImageCropData,
    success: (uri: string) => void,
    failure: (error: Object) => void,
  ): void;
}

export type KeyboardEventName =
  | 'keyboardWillShow'
  | 'keyboardDidShow'
  | 'keyboardWillHide'
  | 'keyboardDidHide'
  | 'keyboardWillChangeFrame'
  | 'keyboardDidChangeFrame';

export type KeyboardEventEasing =
  | 'easeIn'
  | 'easeInEaseOut'
  | 'easeOut'
  | 'linear'
  | 'keyboard';

type KeyboardMetrics = {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

interface KeyboardEventIOS {
  /**
   * @platform ios
   */
  startCoordinates: KeyboardMetrics;
  /**
   * @platform ios
   */
  isEventFromThisApp: boolean;
}

export interface KeyboardEvent extends Partial<KeyboardEventIOS> {
  /**
   * Always set to 0 on Android.
   */
  duration: number;
  /**
   * Always set to "keyboard" on Android.
   */
  easing: KeyboardEventEasing;
  endCoordinates: KeyboardMetrics;
}

type KeyboardEventListener = (event: KeyboardEvent) => void;

export interface KeyboardStatic extends NativeEventEmitter {
  /**
   * Dismisses the active keyboard and removes focus.
   */
  dismiss: () => void;
  /**
   * The `addListener` function connects a JavaScript function to an identified native
   * keyboard notification event.
   *
   * This function then returns the reference to the listener.
   *
   * {string} eventName The `nativeEvent` is the string that identifies the event you're listening for.  This
   *can be any of the following:
   *
   * - `keyboardWillShow`
   * - `keyboardDidShow`
   * - `keyboardWillHide`
   * - `keyboardDidHide`
   * - `keyboardWillChangeFrame`
   * - `keyboardDidChangeFrame`
   *
   * Note that if you set `android:windowSoftInputMode` to `adjustResize`  or `adjustNothing`,
   * only `keyboardDidShow` and `keyboardDidHide` events will be available on Android.
   * `keyboardWillShow` as well as `keyboardWillHide` are generally not available on Android
   * since there is no native corresponding event.
   *
   * {function} callback function to be called when the event fires.
   */
  addListener: (
    eventType: KeyboardEventName,
    listener: KeyboardEventListener,
  ) => EmitterSubscription;
  /**
   * Useful for syncing TextInput (or other keyboard accessory view) size of
   * position changes with keyboard movements.
   */
  scheduleLayoutAnimation: (event: KeyboardEvent) => void;

  /**
   * Whether the keyboard is last known to be visible.
   */
  isVisible(): boolean;

  /**
   * Return the metrics of the soft-keyboard if visible.
   */
  metrics(): KeyboardMetrics | undefined;
}

/**
 * The DevSettings module exposes methods for customizing settings for developers in development.
 */
export interface DevSettingsStatic extends NativeEventEmitter {
  /**
   * Adds a custom menu item to the developer menu.
   *
   * @param title - The title of the menu item. Is internally used as id and should therefore be unique.
   * @param handler - The callback invoked when pressing the menu item.
   */
  addMenuItem(title: string, handler: () => any): void;

  /**
   * Reload the application.
   *
   * @param reason
   */
  reload(reason?: string): void;
}

export const DevSettings: DevSettingsStatic;

//////////////////////////////////////////////////////////////////////////
//
//  R E - E X P O R T S
//
//////////////////////////////////////////////////////////////////////////

//////////// APIS //////////////
export const ActionSheetIOS: ActionSheetIOSStatic;
export type ActionSheetIOS = ActionSheetIOSStatic;

export const AccessibilityInfo: AccessibilityInfoStatic;
export type AccessibilityInfo = AccessibilityInfoStatic;

export const Alert: AlertStatic;
export type Alert = AlertStatic;

export const AppState: AppStateStatic;
export type AppState = AppStateStatic;

/**
 * AsyncStorage has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/async-storage` instead of 'react-native'.
 * @see https://github.com/react-native-community/async-storage
 * @deprecated
 */
export const AsyncStorage: AsyncStorageStatic;
/**
 * AsyncStorage has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/async-storage` instead of 'react-native'.
 * @see https://github.com/react-native-community/async-storage
 * @deprecated
 */
export type AsyncStorage = AsyncStorageStatic;

export const BackHandler: BackHandlerStatic;
export type BackHandler = BackHandlerStatic;

/**
 * CameraRoll has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/cameraroll` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-cameraroll
 * @deprecated
 */
export const CameraRoll: CameraRollStatic;
/**
 * CameraRoll has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/cameraroll` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-cameraroll
 * @deprecated
 */
export type CameraRoll = CameraRollStatic;

/**
 * Clipboard has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/clipboard` instead of 'react-native'.
 * @see https://github.com/react-native-community/clipboard
 * @deprecated
 */
export const Clipboard: ClipboardStatic;
/**
 * Clipboard has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/clipboard` instead of 'react-native'.
 * @see https://github.com/react-native-community/clipboard
 * @deprecated
 */
export type Clipboard = ClipboardStatic;

/**
 * DatePickerAndroid has been merged with DatePickerIOS and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export const DatePickerAndroid: DatePickerAndroidStatic;
/**
 * DatePickerAndroid has been merged with DatePickerIOS and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export type DatePickerAndroid = DatePickerAndroidStatic;

export const Dimensions: Dimensions;

export type Easing = EasingStatic;
export const Easing: EasingStatic;

/** https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps */
export const I18nManager: I18nManagerStatic;
export type I18nManager = I18nManagerStatic;

/**
 * ImageEditor has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/image-editor` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-image-editor
 * @deprecated
 */
export const ImageEditor: ImageEditorStatic;
export type ImageEditor = ImageEditorStatic;

/**
 * ImagePickerIOS has been extracted from react-native core and will be removed in a future release.
 * Please upgrade to use either `@react-native-community/react-native-image-picker` or 'expo-image-picker'.
 * If you cannot upgrade to a different library, please install the deprecated `@react-native-community/image-picker-ios` package.
 * @see https://github.com/react-native-community/react-native-image-picker-ios
 * @deprecated
 */
export const ImagePickerIOS: ImagePickerIOSStatic;
export type ImagePickerIOS = ImagePickerIOSStatic;

/**
 * ImageStore has been removed from React Native.
 * To get a base64-encoded string from a local image use either of the following third-party libraries:
 * * expo-file-system: `readAsStringAsync(filepath, 'base64')`
 * * react-native-fs: `readFile(filepath, 'base64')`
 * @deprecated
 */
export const ImageStore: ImageStoreStatic;
export type ImageStore = ImageStoreStatic;

export const InteractionManager: InteractionManagerStatic;

export const Keyboard: KeyboardStatic;

export const LayoutAnimation: LayoutAnimationStatic;
export type LayoutAnimation = LayoutAnimationStatic;

export const Linking: LinkingStatic;
export type Linking = LinkingStatic;

export const LogBox: LogBoxStatic;
export type LogBox = LogBoxStatic;

export const PanResponder: PanResponderStatic;
export type PanResponder = PanResponderStatic;

export const PermissionsAndroid: PermissionsAndroidStatic;
export type PermissionsAndroid = PermissionsAndroidStatic;

/**
 * PushNotificationIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/push-notification-ios` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-push-notification-ios
 * @deprecated
 */
export const PushNotificationIOS: PushNotificationIOSStatic;
/**
 * PushNotificationIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/push-notification-ios` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-push-notification-ios
 * @deprecated
 */
export type PushNotificationIOS = PushNotificationIOSStatic;

export const Settings: SettingsStatic;
export type Settings = SettingsStatic;

export const Share: ShareStatic;
export type Share = ShareStatic;

export const Systrace: SystraceStatic;
export type Systrace = SystraceStatic;

/**
 * TimePickerAndroid has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export const TimePickerAndroid: TimePickerAndroidStatic;
/**
 * TimePickerAndroid has been removed from React Native.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export type TimePickerAndroid = TimePickerAndroidStatic;

export const ToastAndroid: ToastAndroidStatic;
export type ToastAndroid = ToastAndroidStatic;

export const UIManager: UIManagerStatic;
export type UIManager = UIManagerStatic;

export const Vibration: VibrationStatic;
export type Vibration = VibrationStatic;

export const ShadowPropTypesIOS: ShadowPropTypesIOSStatic;

//////////// Plugins //////////////

export const DeviceEventEmitter: DeviceEventEmitterStatic;

/**
 * The React Native implementation of the IOS RCTEventEmitter which is required when creating
 * a module that communicates with IOS
 */
type NativeModule = {
  /**
   * Add the provided eventType as an active listener
   * @param eventType name of the event for which we are registering listener
   */
  addListener: (eventType: string) => void;

  /**
   * Remove a specified number of events.  There are no eventTypes in this case, as
   * the native side doesn't remove the name, but only manages a counter of total
   * listeners
   * @param count number of listeners to remove (of any type)
   */
  removeListeners: (count: number) => void;
};

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
declare class NativeEventEmitter extends EventEmitter {
  /**
   * @param nativeModule the NativeModule implementation.  This is required on IOS and will throw
   *      an invariant error if undefined.
   */
  constructor(nativeModule?: NativeModule);

  /**
   * Add the specified listener, this call passes through to the NativeModule
   * addListener
   *
   * @param eventType name of the event for which we are registering listener
   * @param listener the listener function
   * @param context context of the listener
   */
  addListener(
    eventType: string,
    listener: (event: any) => void,
    context?: Object,
  ): EmitterSubscription;

  /**
   * @param eventType  name of the event whose registered listeners to remove
   */
  removeAllListeners(eventType: string): void;

  /**
   * Removes a subscription created by the addListener, the EventSubscription#remove()
   * function actually calls through to this.
   */
  removeSubscription(subscription: EmitterSubscription): void;
}

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTNativeAppEventEmitter.
 */
export const NativeAppEventEmitter: RCTNativeAppEventEmitter;

/**
 * Interface for NativeModules which allows to augment NativeModules with type informations.
 * See react-native-sensor-manager for example.
 */
interface NativeModulesStatic {
  [name: string]: any;
}

/**
 * Native Modules written in ObjectiveC/Swift/Java exposed via the RCTBridge
 * Define lazy getters for each module. These will return the module if already loaded, or load it if not.
 * See https://reactnative.dev/docs/native-modules-ios
 * @example
 * const MyModule = NativeModules.ModuleName
 */
export const NativeModules: NativeModulesStatic;
export const Platform:
  | PlatformIOSStatic
  | PlatformAndroidStatic
  | PlatformWindowsOSStatic
  | PlatformMacOSStatic
  | PlatformWebStatic;
export const PixelRatio: PixelRatioStatic;

/**
 * Creates values that can be used like React components which represent native
 * view managers. You should create JavaScript modules that wrap these values so
 * that the results are memoized. Example:
 *
 *   const View = requireNativeComponent('RCTView');
 *
 * The concrete return type of `requireNativeComponent` is a string, but the declared type is
 * `HostComponent` because TypeScript assumes anonymous JSX intrinsics (e.g. a `string`) not
 * to have any props.
 */
export function requireNativeComponent<T>(viewName: string): HostComponent<T>;

export function findNodeHandle(
  componentOrHandle:
    | null
    | number
    | React.Component<any, any>
    | React.ComponentClass<any>,
): null | number;

export function processColor(
  color?: number | ColorValue,
): ProcessedColorValue | null | undefined;

/**
 * YellowBox has been replaced with LogBox.
 * @see LogBox
 * @deprecated
 */
export const YellowBox: React.ComponentClass<any, any> & {
  ignoreWarnings: (warnings: string[]) => void;
};

/**
 * LogBox is enabled by default so there is no need to call unstable_enableLogBox() anymore. This is a no op and will be removed in the next version.
 * @deprecated
 */
export function unstable_enableLogBox(): void;

/**
 * React Native also implements unstable_batchedUpdates
 */
export function unstable_batchedUpdates<A, B>(
  callback: (a: A, b: B) => any,
  a: A,
  b: B,
): void;
export function unstable_batchedUpdates<A>(callback: (a: A) => any, a: A): void;
export function unstable_batchedUpdates(callback: () => any): void;

//////////////////////////////////////////////////////////////////////////
//
// Additional ( and controversial)
//
//////////////////////////////////////////////////////////////////////////

export function __spread(target: any, ...sources: any[]): any;

type ErrorHandlerCallback = (error: any, isFatal?: boolean) => void;

export interface ErrorUtils {
  setGlobalHandler: (callback: ErrorHandlerCallback) => void;
  getGlobalHandler: () => ErrorHandlerCallback;
}

//
// Add-Ons
//
export namespace addons {
  //FIXME: Documentation ?
  export interface TestModuleStatic {
    verifySnapshot: (done: (indicator?: any) => void) => void;
    markTestPassed: (indicator: any) => void;
    markTestCompleted: () => void;
  }

  export const TestModule: TestModuleStatic;
  export type TestModule = TestModuleStatic;
}

declare global {
  interface NodeRequire {
    (id: string): any;
  }

  var require: NodeRequire;

  /**
   * Console polyfill
   * @see https://reactnative.dev/docs/javascript-environment#polyfills
   */
  interface Console {
    error(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    trace(message?: any, ...optionalParams: any[]): void;
    debug(message?: any, ...optionalParams: any[]): void;
    table(...data: any[]): void;
    groupCollapsed(label?: string): void;
    groupEnd(): void;
    group(label?: string): void;
    /**
     * @deprecated Use LogBox.ignoreLogs(patterns) instead
     */
    ignoredYellowBox: string[];
  }

  var console: Console;

  /**
   * This contains the non-native `XMLHttpRequest` object, which you can use if you want to route network requests
   * through DevTools (to trace them):
   *
   *   global.XMLHttpRequest = global.originalXMLHttpRequest;
   *
   * @see https://github.com/facebook/react-native/issues/934
   */
  const originalXMLHttpRequest: any;

  const __BUNDLE_START_TIME__: number;
  const ErrorUtils: ErrorUtils;

  /**
   * This variable is set to true when react-native is running in Dev mode
   * @example
   * if (__DEV__) console.log('Running in dev mode')
   */
  const __DEV__: boolean;

  const HermesInternal: null | {};
}
