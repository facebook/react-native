/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const {AnimatedEvent} = require('./AnimatedEvent');
const AnimatedProps = require('./nodes/AnimatedProps');
const React = require('react');

const invariant = require('invariant');
const setAndForwardRef = require('../../Utilities/setAndForwardRef');

export type AnimatedComponentType<
  Props: {+[string]: mixed, ...},
  Instance,
> = React.AbstractComponent<$ObjMap<Props, () => any>, Instance>;

function createAnimatedComponent<Props: {+[string]: mixed, ...}, Instance>(
  Component: React.AbstractComponent<Props, Instance>,
): AnimatedComponentType<Props, Instance> {
  invariant(
    typeof Component !== 'function' ||
      (Component.prototype && Component.prototype.isReactComponent),
    '`createAnimatedComponent` does not support stateless functional components; ' +
      'use a class component instead.',
  );

  class AnimatedComponent extends React.Component<Object> {
    _component: any; // TODO T53738161: flow type this, and the whole file
    _invokeAnimatedPropsCallbackOnMount: boolean = false;
    _prevComponent: any;
    _propsAnimated: AnimatedProps;
    _eventDetachers: Array<Function> = [];

    _attachNativeEvents() {
      // Make sure to get the scrollable node for components that implement
      // `ScrollResponder.Mixin`.
      const scrollableNode = this._component?.getScrollableNode
        ? this._component.getScrollableNode()
        : this._component;

      for (const key in this.props) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          prop.__attach(scrollableNode, key);
          this._eventDetachers.push(() => prop.__detach(scrollableNode, key));
        }
      }
    }

    _detachNativeEvents() {
      this._eventDetachers.forEach(remove => remove());
      this._eventDetachers = [];
    }

    // The system is best designed when setNativeProps is implemented. It is
    // able to avoid re-rendering and directly set the attributes that changed.
    // However, setNativeProps can only be implemented on leaf native
    // components. If you want to animate a composite component, you need to
    // re-render it. In this case, we have a fallback that uses forceUpdate.
    _animatedPropsCallback = () => {
      if (this._component == null) {
        // AnimatedProps is created in will-mount because it's used in render.
        // But this callback may be invoked before mount in async mode,
        // In which case we should defer the setNativeProps() call.
        // React may throw away uncommitted work in async mode,
        // So a deferred call won't always be invoked.
        this._invokeAnimatedPropsCallbackOnMount = true;
      } else if (
        process.env.NODE_ENV === 'test' ||
        // For animating properties of non-leaf/non-native components
        typeof this._component.setNativeProps !== 'function' ||
        // In Fabric, force animations to go through forceUpdate and skip setNativeProps
        // eslint-disable-next-line dot-notation
        this._component['_internalInstanceHandle']?.stateNode?.canonical != null
      ) {
        this.forceUpdate();
      } else if (!this._propsAnimated.__isNative) {
        this._component.setNativeProps(
          this._propsAnimated.__getAnimatedValue(),
        );
      } else {
        throw new Error(
          'Attempting to run JS driven animation on animated ' +
            'node that has been moved to "native" earlier by starting an ' +
            'animation with `useNativeDriver: true`',
        );
      }
    };

    _attachProps(nextProps) {
      const oldPropsAnimated = this._propsAnimated;

      this._propsAnimated = new AnimatedProps(
        nextProps,
        this._animatedPropsCallback,
      );

      // When you call detach, it removes the element from the parent list
      // of children. If it goes to 0, then the parent also detaches itself
      // and so on.
      // An optimization is to attach the new elements and THEN detach the old
      // ones instead of detaching and THEN attaching.
      // This way the intermediate state isn't to go to 0 and trigger
      // this expensive recursive detaching to then re-attach everything on
      // the very next operation.
      if (oldPropsAnimated) {
        oldPropsAnimated.__restoreDefaultValues();
        oldPropsAnimated.__detach();
      }
    }

    _setComponentRef = setAndForwardRef({
      getForwardedRef: () => this.props.forwardedRef,
      setLocalRef: ref => {
        this._prevComponent = this._component;
        this._component = ref;

        // TODO: Delete this in a future release.
        if (ref != null && ref.getNode == null) {
          ref.getNode = () => {
            console.warn(
              '%s: Calling `getNode()` on the ref of an Animated component ' +
                'is no longer necessary. You can now directly use the ref ' +
                'instead. This method will be removed in a future release.',
              ref.constructor.name ?? '<<anonymous>>',
            );
            return ref;
          };
        }
      },
    });

    render() {
      const props = this._propsAnimated.__getValue();
      return (
        <Component
          {...props}
          ref={this._setComponentRef}
          // The native driver updates views directly through the UI thread so we
          // have to make sure the view doesn't get optimized away because it cannot
          // go through the NativeViewHierarchyManager since it operates on the shadow
          // thread.
          collapsable={
            this._propsAnimated.__isNative ? false : props.collapsable
          }
        />
      );
    }

    UNSAFE_componentWillMount() {
      this._attachProps(this.props);
    }

    componentDidMount() {
      if (this._invokeAnimatedPropsCallbackOnMount) {
        this._invokeAnimatedPropsCallbackOnMount = false;
        this._animatedPropsCallback();
      }

      this._propsAnimated.setNativeView(this._component);
      this._attachNativeEvents();
    }

    UNSAFE_componentWillReceiveProps(newProps) {
      this._attachProps(newProps);
    }

    componentDidUpdate(prevProps) {
      if (this._component !== this._prevComponent) {
        this._propsAnimated.setNativeView(this._component);
      }
      if (this._component !== this._prevComponent || prevProps !== this.props) {
        this._detachNativeEvents();
        this._attachNativeEvents();
      }
    }

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
      this._detachNativeEvents();
    }
  }

  return React.forwardRef(function AnimatedComponentWrapper(props, ref) {
    return (
      <AnimatedComponent
        {...props}
        {...(ref == null ? null : {forwardedRef: ref})}
      />
    );
  });
}

module.exports = createAnimatedComponent;
