/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');

const setAndForwardRef = require('setAndForwardRef');

let innerFuncCalled = false;
let outerFuncCalled = false;

class ForwardedComponent extends React.Component {
  testFunc() {
    innerFuncCalled = true;
    return true;
  }

  render() {
    return null;
  }
}

class TestComponent extends React.Component {
  _nativeRef = null;
  _setNativeRef = setAndForwardRef({
    getForwardedRef: () => this.props.forwardedRef,
    setLocalRef: ref => {
      this._nativeRef = ref;
    },
  });

  componentDidMount() {
    if (this.props.callFunc) {
      this._nativeRef.testFunc();
      outerFuncCalled = true;
    }
  }

  render() {
    return <ForwardedComponent ref={this._setNativeRef} />;
  }
}

const TestComponentWithRef = React.forwardRef((props, ref) => (
  <TestComponent {...props} forwardedRef={ref} />
));

describe('setAndForwardRef', () => {
  let createdRef = null;

  beforeEach(() => {
    createdRef = React.createRef();
    innerFuncCalled = false;
    outerFuncCalled = false;
  });

  it('should forward refs (function-based)', () => {
    let testRef = null;

    ReactTestRenderer.create(
      <TestComponentWithRef
        ref={ref => {
          testRef = ref;
        }}
      />,
    );
    const val = testRef.testFunc();

    expect(innerFuncCalled).toBe(true);
    expect(val).toBe(true);
  });

  it('should forward refs (createRef-based)', () => {
    ReactTestRenderer.create(
      <TestComponentWithRef ref={createdRef} />,
    );
    const val = createdRef.current.testFunc();

    expect(innerFuncCalled).toBe(true);
    expect(val).toBe(true);
  });

  it('should be able to use the ref from inside of the forwarding class', () => {
    expect(() =>
      ReactTestRenderer.create(<TestComponentWithRef callFunc={true} />),
    ).not.toThrow();

    expect(innerFuncCalled).toBe(true);
    expect(outerFuncCalled).toBe(true);
  });

  it('should throw on string-based refs', () => {
    /* eslint-disable react/no-string-refs */
    expect(() =>
      ReactTestRenderer.create(<TestComponentWithRef ref="stringRef" />),
    ).toThrow();
    /* eslint-enable react/no-string-refs */
  });
});
