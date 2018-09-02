/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const {AnimatedEvent} = require('./AnimatedEvent');
const {
  createOrReusePropsNode,
  AnimatedProps,
} = require('./nodes/AnimatedProps');
const React = require('React');
const ViewStylePropTypes = require('ViewStylePropTypes');

const areEqual = require('fbjs/lib/areEqual');
const invariant = require('fbjs/lib/invariant');

function createAnimatedComponent(Component: any): any {
  invariant(
    typeof Component !== 'function' ||
      (Component.prototype && Component.prototype.isReactComponent),
    '`createAnimatedComponent` does not support stateless functional components; ' +
      'use a class component instead.',
  );

  class AnimatedComponent extends React.Component<Object> {
    _component: any;
    _invokeAnimatedPropsCallbackOnMount: boolean = false;
    _prevComponent: any;
    _propsAnimated: AnimatedProps;

    static __skipSetNativeProps_FOR_TESTS_ONLY = false;

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
      this._detachNativeEvents();
    }

    setNativeProps(props) {
      this._component.setNativeProps(props);
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

    UNSAFE_componentWillReceiveProps(nextProps) {
      this._attachProps(nextProps);
    }

    componentDidUpdate(prevProps) {
      this._propsAnimated.setNativeView(this._component);

      this._reattachNativeEvents(prevProps);
    }

    _getEventViewRef() {
      // Make sure to get the scrollable node for components that implement
      // `ScrollResponder.Mixin`.
      return this._component.getScrollableNode
        ? this._component.getScrollableNode()
        : this._component;
    }

    _attachNativeEvents() {
      const node = this._getEventViewRef();

      for (const key in this.props) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          prop.__attach(node, key);
        }
      }
    }

    _detachNativeEvents() {
      const node = this._getEventViewRef();

      for (const key in this.props) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          prop.__detach(node, key);
        }
      }
    }

    _reattachNativeEvents(prevProps) {
      const node = this._getEventViewRef();
      const attached = new Set();
      const nextEvts = new Set();
      for (const key in this.props) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          nextEvts.add(prop);
        }
      }
      for (const key in prevProps) {
        const prop = this.props[key];
        if (prop instanceof AnimatedEvent && prop.__isNative) {
          if (!nextEvts.has(prop)) {
            // event was in prev props but not in current props, we detach
            prop.__detach(node, key);
          } else {
            // event was in prev and is still in current props
            attached.add(prop);
          }
        }
      }
      for (const key in this.props) {
        const prop = this.props[key];
        if (
          prop instanceof AnimatedEvent &&
          prop.__isNative &&
          !attached.has(prop)
        ) {
          // not yet attached
          prop.__attach(node, key);
        }
      }
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
        AnimatedComponent.__skipSetNativeProps_FOR_TESTS_ONLY ||
        typeof this._component.setNativeProps !== 'function'
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

      this._propsAnimated = createOrReusePropsNode(
        nextProps,
        this._animatedPropsCallback,
        oldPropsAnimated,
      );
      // If prop node has been reused we don't need to call into "__detach"
      if (oldPropsAnimated !== this._propsAnimated) {
        // When you call detach, it removes the element from the parent list
        // of children. If it goes to 0, then the parent also detaches itself
        // and so on.
        // An optimization is to attach the new elements and THEN detach the old
        // ones instead of detaching and THEN attaching.
        // This way the intermediate state isn't to go to 0 and trigger
        // this expensive recursive detaching to then re-attach everything on
        // the very next operation.
        oldPropsAnimated && oldPropsAnimated.__detach();
      }
    }

    _setComponentRef = c => {
      if (c !== this._component) {
        this._component = c;
      }
    };

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

    // A third party library can use getNode()
    // to get the node reference of the decorated component
    getNode() {
      return this._component;
    }
  }

  const propTypes = Component.propTypes;

  AnimatedComponent.propTypes = {
    style: function(props, propName, componentName) {
      if (!propTypes) {
        return;
      }

      for (const key in ViewStylePropTypes) {
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

  return AnimatedComponent;
}

module.exports = createAnimatedComponent;
