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
const React = require('React');
const DeprecatedViewStylePropTypes = require('DeprecatedViewStylePropTypes');

const {useCallback, useEffect, useImperativeHandle, useState} = React;

const invariant = require('invariant');

function createAnimatedComponentWithHooks(Component: any): any {
  invariant(
    typeof Component !== 'function' ||
      (Component.prototype && Component.prototype.isReactComponent),
    '`createAnimatedComponent` does not support stateless functional components; ' +
      'use a class component instead.',
  );

  const AnimatedComponent = (props: any, forwardedRef?: any) => {
    const [initialized, setInitialized] = useState(false);
    const [, forceUpdate] = useState();

    let _invokeAnimatedPropsCallbackOnMount: boolean = false;
    let _component: any = null;

    let _eventDetachers: Array<Function> = [];

    const _attachNativeEvents = () => {
      // Make sure to get the scrollable node for components that implement
      // `ScrollResponder.Mixin`.
      const scrollableNode = _component.getScrollableNode
        ? _component.getScrollableNode()
        : _component;

      for (const key in props) {
        const prop = props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          prop.__attach(scrollableNode, key);
          _eventDetachers.push(() => prop.__detach(scrollableNode, key));
        }
      }
    };

    const _detachNativeEvents = () => {
      _eventDetachers.forEach(remove => remove());
      _eventDetachers = [];
    };

    // The system is best designed when setNativeProps is implemented. It is
    // able to avoid re-rendering and directly set the attributes that changed.
    // However, setNativeProps can only be implemented on leaf native
    // components. If you want to animate a composite component, you need to
    // re-render it. In this case, we have a fallback that uses forceUpdate.
    const _animatedPropsCallback = () => {
      if (_component == null) {
        // AnimatedProps is created in will-mount because it's used in render.
        // But this callback may be invoked before mount in async mode,
        // In which case we should defer the setNativeProps() call.
        // React may throw away uncommitted work in async mode,
        // So a deferred call won't always be invoked.
        _invokeAnimatedPropsCallbackOnMount = true;
      } else if (
        AnimatedComponent.__skipSetNativeProps_FOR_TESTS_ONLY ||
        typeof _component.setNativeProps !== 'function'
      ) {
        forceUpdate();
      } else if (!_propsAnimated.__isNative) {
        _component.setNativeProps(_propsAnimated.__getAnimatedValue());
      } else {
        throw new Error(
          'Attempting to run JS driven animation on animated ' +
            'node that has been moved to "native" earlier by starting an ' +
            'animation with `useNativeDriver: true`',
        );
      }
    };

    const _setComponentRef = useCallback(
      node => {
        if (node !== null) {
          let _prevComponent = _component;
          _component = node;

          if (_component !== _prevComponent) {
            _propsAnimated.setNativeView(_component);

            if (!initialized) {
              if (_invokeAnimatedPropsCallbackOnMount) {
                _invokeAnimatedPropsCallbackOnMount = false;
                _animatedPropsCallback();
              }

              _propsAnimated.setNativeView(_component);
              _attachNativeEvents();
            }
          }
        }
      },
      [initialized],
    );

    useEffect(() => {
      if (!initialized) {
        setInitialized(true);
      }

      return () => {
        _detachNativeEvents();

        _propsAnimated && _propsAnimated.__detach();
      };
    }, []);

    useEffect(() => {
      if (_component) {
        _detachNativeEvents();
        _attachNativeEvents();
      }

      const oldPropsAnimated = _propsAnimated;

      _propsAnimated = new AnimatedProps(props, _animatedPropsCallback);

      // When you call detach, it removes the element from the parent list
      // of children. If it goes to 0, then the parent also detaches itself
      // and so on.
      // An optimization is to attach the new elements and THEN detach the old
      // ones instead of detaching and THEN attaching.
      // This way the intermediate state isn't to go to 0 and trigger
      // this expensive recursive detaching to then re-attach everything on
      // the very next operation.
      oldPropsAnimated && oldPropsAnimated.__detach();
    }, [props]);

    useImperativeHandle(forwardedRef, () => ({
      getNode: () => {
        return _component;
      },
    }));

    let _propsAnimated: AnimatedProps = new AnimatedProps(
      props,
      _animatedPropsCallback,
    );
    const animatedProps = _propsAnimated.__getValue();

    return (
      <Component
        {...animatedProps}
        ref={_setComponentRef}
        // The native driver updates views directly through the UI thread so we
        // have to make sure the view doesn't get optimized away because it cannot
        // go through the NativeViewHierarchyManager since it operates on the shadow
        // thread.
        collapsable={
          _propsAnimated.__isNative ? false : animatedProps.collapsable
        }
      />
    );
  };

  const propTypes = Component.propTypes;

  const AnimatedComponentWithRef = React.forwardRef(AnimatedComponent);
  AnimatedComponentWithRef.displayName = 'AnimatedComponent';

  AnimatedComponentWithRef.propTypes = {
    style: function(props, propName, componentName) {
      if (!propTypes) {
        return;
      }

      for (const key in DeprecatedViewStylePropTypes) {
        if (!propTypes[key] && props[key] !== undefined) {
          console.warn(
            'You are setting the style `{ ' +
              key +
              ': ... }` as a prop. You ' +
              'should nest it in a style object. ' +
              'E.g. `{ style: { ' +
              key +
              ': ... } }`',
          );
        }
      }
    },
  };

  return AnimatedComponentWithRef;
}

module.exports = createAnimatedComponentWithHooks;
