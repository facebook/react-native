/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import View from '../../Components/View/View';
import Dimensions from '../Dimensions';
import {
  type DisplayMetrics,
  type DisplayMetricsAndroid,
} from '../NativeDeviceInfo';
import useWindowDimensions from '../useWindowDimensions';
import {useEffect} from 'react';
import {act, create} from 'react-test-renderer';

type State = DisplayMetrics | DisplayMetricsAndroid;
type TestProps = {
  selector?: (state: State) => number,
  onResult?: (result: number | State) => void,
  testID?: string,
};
function TestView({selector, onResult}: TestProps) {
  const result = useWindowDimensions(selector);
  useEffect(() => {
    onResult?.(result);
  }, [onResult, result]);
  return <View />;
}

const defaultWindow = {fontScale: 2, height: 1334, scale: 2, width: 750};

describe('useWindowDimensions', () => {
  const expectedDimensions = Dimensions.get('window');
  let cleanupFns = [];

  // Auto cleanup
  afterEach(() => {
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];
  });

  const renderHook = (props?: TestProps) => {
    let root;
    const defaultProps: TestProps = {onResult: jest.fn(), selector: undefined};
    // Mount
    act(() => {
      root = create(<TestView {...defaultProps} {...props} />);
    });

    const rerender = (newProps: TestProps) => {
      act(() => {
        root.update(<TestView {...defaultProps} {...props} {...newProps} />);
      });
    };
    const unmount = () => {
      act(() => {
        root.unmount();
      });
    };
    cleanupFns.push(unmount); // auto-cleanup
    return {unmount, rerender};
  };

  const mockGetWindow = () => {
    const spy = jest.spyOn(Dimensions, 'get');
    cleanupFns.push(() => spy.mockRestore()); // auto-cleanup
    return {
      getWindow: spy,
    };
  };
  const mockAddEventListener = () => {
    const sub = {remove: jest.fn()};
    const spy = jest
      .spyOn(Dimensions, 'addEventListener')
      .mockImplementation(() => sub);
    cleanupFns.push(() => spy.mockRestore()); // auto-cleanup
    return {
      addListener: spy,
      removeListener: sub.remove,
      // $FlowFixMe[unclear-type]
      getListener: (): Function => spy.mock.calls.at(-1)?.at(1), // `-1` - last call, `1` - second argument
    };
  };

  it('should cleanup a listener on a component unmount', () => {
    // Arrange
    const {addListener, removeListener} = mockAddEventListener();

    const {unmount} = renderHook();

    expect(addListener).toHaveBeenCalledTimes(1);
    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function));

    // Act
    unmount();

    // Assert
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith();
  });

  it('should return the current window dimensions on mount', () => {
    // Arrange
    const onResult = jest.fn();

    // Act
    renderHook({onResult});

    // Assert
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(expectedDimensions);
    expect(expectedDimensions).toStrictEqual(defaultWindow);
  });

  it('should return the same object on re-render', () => {
    // Arrange
    const onResult = jest.fn();

    const {rerender} = renderHook({onResult});

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(expectedDimensions);
    expect(expectedDimensions).toStrictEqual(defaultWindow);

    // Act
    rerender({testID: 'test-123'});

    // Assert
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('should not re-render when screen dimension has changed but window is the same', () => {
    // Arrange
    const {getListener} = mockAddEventListener();
    const onResult = jest.fn();
    renderHook({onResult});

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(expectedDimensions);
    expect(expectedDimensions).toStrictEqual(defaultWindow);

    // Act
    const listener = getListener();
    act(() => {
      listener({
        window: {...expectedDimensions},
        screen: {...expectedDimensions, height: 1000},
      });
    });

    // Assert
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  describe('selector argument', () => {
    it('should return partial of state', () => {
      const onResult = jest.fn();

      renderHook({onResult, selector: state => state.height});

      // Assert
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(expectedDimensions.height);
    });

    it('should re-render if selected value has changed', () => {
      // Arrange
      const newHeight = 666;
      const onResult = jest.fn();
      const {getListener} = mockAddEventListener();
      const {getWindow} = mockGetWindow();

      renderHook({onResult, selector: state => state.height});

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenNthCalledWith(1, expectedDimensions.height);

      // Act
      act(() => {
        const listener = getListener();
        const newWindow = {...expectedDimensions, height: newHeight};
        getWindow.mockReturnValue(newWindow);
        listener({window: newWindow});
      });

      // Assert
      expect(onResult).toHaveBeenCalledTimes(2);
      expect(onResult).toHaveBeenNthCalledWith(2, newHeight);
    });

    it('should return derived value based on state', () => {
      // Arrange
      const onResult = jest.fn();

      // Act
      renderHook({onResult, selector: state => state.width / state.height});

      // Assert
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(
        expectedDimensions.width / expectedDimensions.height,
      );
    });

    it('should not re-render if selected value has not changed', () => {
      // Arrange
      const onResult = jest.fn();
      const {getListener} = mockAddEventListener();
      const {getWindow} = mockGetWindow();

      renderHook({onResult, selector: state => state.fontScale});
      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(expectedDimensions.fontScale);

      // Act
      act(() => {
        const listener = getListener();
        const newWindow = {...expectedDimensions, width: 400, height: 400};
        getWindow.mockReturnValue(newWindow);
        listener({window: newWindow});
      });

      // Assert
      expect(onResult).toHaveBeenCalledTimes(1);
    });
  });
});
