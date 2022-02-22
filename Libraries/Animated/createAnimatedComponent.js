/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as createAnimatedComponentInjection from './createAnimatedComponentInjection';

const View = require('../Components/View/View');
const {AnimatedEvent} = require('./AnimatedEvent');
const AnimatedProps = require('./nodes/AnimatedProps');
const React = require('react');
const NativeAnimatedHelper = require('./NativeAnimatedHelper');

const invariant = require('invariant');
const setAndForwardRef = require('../Utilities/setAndForwardRef');

let animatedComponentNextId = 1;

export type AnimatedComponentType<
  -Props: {+[string]: mixed, ...},
  +Instance = mixed,
> = React.AbstractComponent<
  $ObjMap<
    Props &
      $ReadOnly<{
        passthroughAnimatedPropExplicitValues?: React.ElementConfig<
          typeof View,
        >,
      }>,
    () => any,
  >,
  Instance,
>;

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

    // Only to be used in this file, and only in Fabric.
    _animatedComponentId: string = `${animatedComponentNextId++}:animatedComponent`;

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

    _isFabric = (): boolean => {
      // When called during the first render, `_component` is always null.
      // Therefore, even if a component is rendered in Fabric, we can't detect
      // that until ref is set, which happens sometime after the first render.
      // In cases where this value switching between "false" and "true" on Fabric
      // causes issues, add an additional check for _component nullity.
      if (this._component == null) {
        return false;
      }
      return (
        // eslint-disable-next-line dot-notation
        this._component['_internalInstanceHandle']?.stateNode?.canonical !=
          null ||
        // Some components have a setNativeProps function but aren't a host component
        // such as lists like FlatList and SectionList. These should also use
        // forceUpdate in Fabric since setNativeProps doesn't exist on the underlying
        // host component. This crazy hack is essentially special casing those lists and
        // ScrollView itself to use forceUpdate in Fabric.
        // If these components end up using forwardRef then these hacks can go away
        // as this._component would actually be the underlying host component and the above check
        // would be sufficient.
        (this._component.getNativeScrollRef != null &&
          this._component.getNativeScrollRef() != null &&
          // eslint-disable-next-line dot-notation
          this._component.getNativeScrollRef()['_internalInstanceHandle']
            ?.stateNode?.canonical != null) ||
        (this._component.getScrollResponder != null &&
          this._component.getScrollResponder() != null &&
          this._component.getScrollResponder().getNativeScrollRef != null &&
          this._component.getScrollResponder().getNativeScrollRef() != null &&
          this._component.getScrollResponder().getNativeScrollRef()[
            // eslint-disable-next-line dot-notation
            '_internalInstanceHandle'
          ]?.stateNode?.canonical != null)
      );
    };

    _waitForUpdate = (): void => {
      if (this._isFabric()) {
        NativeAnimatedHelper.API.setWaitingForIdentifier(
          this._animatedComponentId,
        );
      }
    };

    _markUpdateComplete = (): void => {
      if (this._isFabric()) {
        NativeAnimatedHelper.API.unsetWaitingForIdentifier(
          this._animatedComponentId,
        );
      }
    };

    // The system is best designed when setNativeProps is implemented. It is
    // able to avoid re-rendering and directly set the attributes that changed.
    // However, setNativeProps can only be implemented on leaf native
    // components. If you want to animate a composite component, you need to
    // re-render it. In this case, we have a fallback that uses forceUpdate.
    // This fallback is also called in Fabric.
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
        this._isFabric()
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

    _attachProps(nextProps: any) {
      const oldPropsAnimated = this._propsAnimated;

      this._propsAnimated = new AnimatedProps(
        nextProps,
        this._animatedPropsCallback,
      );
      this._propsAnimated.__attach();

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
      },
    });

    render() {
      const {style = {}, ...props} = this._propsAnimated.__getValue() || {};
      const {style: passthruStyle = {}, ...passthruProps} =
        this.props.passthroughAnimatedPropExplicitValues || {};
      const mergedStyle = {...style, ...passthruStyle};

      // Force `collapsable` to be false so that native view is not flattened.
      // Flattened views cannot be accurately referenced by a native driver.
      return (
        <Component
          {...props}
          {...passthruProps}
          collapsable={false}
          style={mergedStyle}
          ref={this._setComponentRef}
        />
      );
    }

    UNSAFE_componentWillMount() {
      this._waitForUpdate();
      this._attachProps(this.props);
    }

    componentDidMount() {
      if (this._invokeAnimatedPropsCallbackOnMount) {
        this._invokeAnimatedPropsCallbackOnMount = false;
        this._animatedPropsCallback();
      }

      this._propsAnimated.setNativeView(this._component);
      this._attachNativeEvents();
      this._markUpdateComplete();
    }

    UNSAFE_componentWillReceiveProps(newProps: any) {
      this._waitForUpdate();
      this._attachProps(newProps);
    }

    componentDidUpdate(prevProps: any) {
      if (this._component !== this._prevComponent) {
        this._propsAnimated.setNativeView(this._component);
      }
      if (this._component !== this._prevComponent || prevProps !== this.props) {
        this._detachNativeEvents();
        this._attachNativeEvents();
      }
      this._markUpdateComplete();
    }

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
      this._detachNativeEvents();
      this._markUpdateComplete();
      this._component = null;
      this._prevComponent = null;
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

// $FlowIgnore[incompatible-cast] - Will be compatible after refactors.
module.exports = (createAnimatedComponentInjection.recordAndRetrieve() ??
  createAnimatedComponent: typeof createAnimatedComponent);
