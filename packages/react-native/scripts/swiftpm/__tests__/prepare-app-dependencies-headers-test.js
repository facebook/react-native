/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// Mock the headers-utils module before importing anything
jest.mock('../headers-utils', () => ({
  hardlinkHeadersFromPath: jest.fn(),
  hardlinkReactAppleHeaders: jest.fn(),
  hardlinkReactCommonHeaders: jest.fn(),
}));

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const {
  hardlinkHeadersFromPath,
  hardlinkReactAppleHeaders,
  hardlinkReactCommonHeaders,
} = require('../headers-utils');
const {
  hardlinkReactNativeHeaders,
} = require('../prepare-app-dependencies-headers');
const fs = require('fs');
const path = require('path');

describe('hardlinkReactNativeHeaders', () => {
  let originalConsoleLog;

  beforeEach(() => {
    // Mock path.join to simply join with '/'
    path.join.mockImplementation((...args) => args.join('/'));

    // Setup mock return values
    hardlinkHeadersFromPath.mockReturnValue(5);
    hardlinkReactAppleHeaders.mockReturnValue(3);
    hardlinkReactCommonHeaders.mockReturnValue(7);

    // Mock console.log to prevent test output noise
    originalConsoleLog = console.log;
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  it('should create headers directory and call all processing functions with correct paths', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    const folderName = 'headers';

    // Mock fs.existsSync to return true for all React Native subdirectories
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false; // headers dir doesn't exist
      if (filePath === '/output/headers/React') return false; // React dir doesn't exist
      if (filePath === '/path/to/react-native/React') return true;
      if (filePath === '/path/to/react-native/Libraries') return true;
      if (filePath === '/path/to/react-native/ReactApple') return true;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder, folderName);

    // Assert - Verify directories are created
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });

    // Assert - Verify React folder processing
    expect(hardlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/React',
      '/output/headers/React',
      false,
      ['includes', 'headers', 'tests'],
      {'FBReactNativeSpec/': '/output/headers/FBReactNativeSpec'},
    );

    // Assert - Verify Libraries folder processing
    expect(hardlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/Libraries',
      '/output/headers/React',
      false,
      ['tests'],
      {
        'Required/': '/output/headers/RCTRequired',
        'TypeSafety/': '/output/headers/RCTTypeSafety',
        'FBLazyVector/': '/output/headers/FBLazyVector',
      },
    );

    // Assert - Verify ReactApple folder processing
    expect(hardlinkReactAppleHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactApple',
      '/output/headers',
    );

    // Assert - Verify ReactCommon folder processing
    expect(hardlinkReactCommonHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactCommon',
      '/output/headers',
      ['react/nativemodule/core/platform/ios'],
      {
        'yoga/': 'yoga',
        'cxxreact/': 'cxxreact',
        'jsinspector-modern/': 'jsinspector-modern',
        'jserrorhandler/': 'jserrorhandler',
        'oscompat/': 'oscompat',
      },
    );

    // Assert - Verify logging
    expect(console.log).toHaveBeenCalledWith(
      'Creating hard links for React Native headers...',
    );
    expect(console.log).toHaveBeenCalledWith('Processing React folder...');
    expect(console.log).toHaveBeenCalledWith(
      'Created 5 hard links from React folder',
    );
    expect(console.log).toHaveBeenCalledWith('Processing Libraries folder...');
    expect(console.log).toHaveBeenCalledWith(
      'Created 5 hard links from Libraries folder',
    );
    expect(console.log).toHaveBeenCalledWith('Processing ReactApple folder...');
    expect(console.log).toHaveBeenCalledWith(
      'Created 3 hard links from ReactApple folder',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Processing ReactCommon folder...',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created 7 hard links from ReactCommon folder',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 20 React Native headers total',
    );
  });

  it('should use default folderName "headers" when not provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    // Note: not providing folderName parameter

    fs.existsSync.mockReturnValue(false); // No directories exist
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should use default "headers" folder name
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });
  });

  it('should use custom folderName when provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';
    const customFolderName = 'custom-headers';

    fs.existsSync.mockReturnValue(false); // No directories exist
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder, customFolderName);

    // Assert - Should use custom folder name
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/custom-headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/custom-headers/React', {
      recursive: true,
    });
  });

  it('should skip processing folders that do not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Mock fs.existsSync to return false for some React Native subdirectories
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      if (filePath === '/path/to/react-native/React') return false; // React doesn't exist
      if (filePath === '/path/to/react-native/Libraries') return true; // Libraries exists
      if (filePath === '/path/to/react-native/ReactApple') return false; // ReactApple doesn't exist
      if (filePath === '/path/to/react-native/ReactCommon') return true; // ReactCommon exists
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should only process existing folders
    expect(hardlinkHeadersFromPath).toHaveBeenCalledTimes(1); // Only Libraries
    expect(hardlinkHeadersFromPath).toHaveBeenCalledWith(
      '/path/to/react-native/Libraries',
      '/output/headers/React',
      false,
      ['tests'],
      {
        'Required/': '/output/headers/RCTRequired',
        'TypeSafety/': '/output/headers/RCTTypeSafety',
        'FBLazyVector/': '/output/headers/FBLazyVector',
      },
    );

    expect(hardlinkReactAppleHeaders).not.toHaveBeenCalled();
    expect(hardlinkReactCommonHeaders).toHaveBeenCalledTimes(1); // Only ReactCommon

    // Assert - Should not log processing for non-existent folders
    expect(console.log).not.toHaveBeenCalledWith('Processing React folder...');
    expect(console.log).not.toHaveBeenCalledWith(
      'Processing ReactApple folder...',
    );
    expect(console.log).toHaveBeenCalledWith('Processing Libraries folder...');
    expect(console.log).toHaveBeenCalledWith(
      'Processing ReactCommon folder...',
    );
  });

  it('should not create directories that already exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Mock fs.existsSync to return true for directories (they already exist)
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return true; // headers dir exists
      if (filePath === '/output/headers/React') return true; // React dir exists
      if (filePath === '/path/to/react-native/React') return true;
      if (filePath === '/path/to/react-native/Libraries') return true;
      if (filePath === '/path/to/react-native/ReactApple') return true;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false;
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should not create directories that already exist
    expect(fs.mkdirSync).not.toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).not.toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });
  });

  it('should aggregate total linked count correctly from all functions', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Set up different return values for each function
    hardlinkHeadersFromPath.mockReturnValueOnce(3).mockReturnValueOnce(8); // React: 3, Libraries: 8
    hardlinkReactAppleHeaders.mockReturnValue(2);
    hardlinkReactCommonHeaders.mockReturnValue(12);

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should aggregate all counts: 3 + 8 + 2 + 12 = 25
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 25 React Native headers total',
    );
  });

  it('should handle case where only some functions are called due to missing directories', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // Only ReactCommon exists
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      if (filePath === '/path/to/react-native/ReactCommon') return true;
      return false; // All other paths don't exist
    });
    fs.mkdirSync.mockImplementation(() => {});

    hardlinkReactCommonHeaders.mockReturnValue(4);

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should only call ReactCommon function
    expect(hardlinkHeadersFromPath).not.toHaveBeenCalled();
    expect(hardlinkReactAppleHeaders).not.toHaveBeenCalled();
    expect(hardlinkReactCommonHeaders).toHaveBeenCalledTimes(1);

    // Assert - Should only show total from ReactCommon
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 4 React Native headers total',
    );
  });

  it('should pass correct custom mappings for React and Libraries folders', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check React folder custom mappings
    expect(hardlinkHeadersFromPath).toHaveBeenNthCalledWith(
      1, // First call
      '/path/to/react-native/React',
      '/output/headers/React',
      false,
      ['includes', 'headers', 'tests'],
      {'FBReactNativeSpec/': '/output/headers/FBReactNativeSpec'},
    );

    // Assert - Check Libraries folder custom mappings
    expect(hardlinkHeadersFromPath).toHaveBeenNthCalledWith(
      2, // Second call
      '/path/to/react-native/Libraries',
      '/output/headers/React',
      false,
      ['tests'],
      {
        'Required/': '/output/headers/RCTRequired',
        'TypeSafety/': '/output/headers/RCTTypeSafety',
        'FBLazyVector/': '/output/headers/FBLazyVector',
      },
    );
  });

  it('should pass correct parameters to ReactCommon processing function', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/path/to/react-native/ReactCommon' ||
        filePath.includes('/output/headers')
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check ReactCommon function is called with correct parameters
    expect(hardlinkReactCommonHeaders).toHaveBeenCalledWith(
      '/path/to/react-native/ReactCommon',
      '/output/headers',
      ['react/nativemodule/core/platform/ios'],
      {
        'yoga/': 'yoga',
        'cxxreact/': 'cxxreact',
        'jsinspector-modern/': 'jsinspector-modern',
        'jserrorhandler/': 'jserrorhandler',
        'oscompat/': 'oscompat',
      },
    );
  });

  it('should handle the function being called without any React Native subdirectories', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    // None of the React Native subdirectories exist
    fs.existsSync.mockImplementation(filePath => {
      if (filePath === '/output/headers') return false;
      if (filePath === '/output/headers/React') return false;
      return false; // No React Native subdirectories exist
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Should still create base directories
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers', {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/output/headers/React', {
      recursive: true,
    });

    // Assert - Should not call any processing functions
    expect(hardlinkHeadersFromPath).not.toHaveBeenCalled();
    expect(hardlinkReactAppleHeaders).not.toHaveBeenCalled();
    expect(hardlinkReactCommonHeaders).not.toHaveBeenCalled();

    // Assert - Should show zero total
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 0 React Native headers total',
    );
  });

  it('should properly log the orchestration process', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output';

    fs.existsSync.mockImplementation(filePath => {
      return (
        filePath.includes('/path/to/react-native/') ||
        filePath === '/output/headers' ||
        filePath === '/output/headers/React'
      );
    });
    fs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkReactNativeHeaders(reactNativePath, outputFolder);

    // Assert - Check logging sequence
    const logCalls = console.log.mock.calls.map(call => call[0]);

    expect(logCalls[0]).toBe('Creating hard links for React Native headers...');
    expect(logCalls[1]).toBe('Processing React folder...');
    expect(logCalls[2]).toBe('Created 5 hard links from React folder');
    expect(logCalls[3]).toBe('Processing Libraries folder...');
    expect(logCalls[4]).toBe('Created 5 hard links from Libraries folder');
    expect(logCalls[5]).toBe('Processing ReactApple folder...');
    expect(logCalls[6]).toBe('Created 3 hard links from ReactApple folder');
    expect(logCalls[7]).toBe('Processing ReactCommon folder...');
    expect(logCalls[8]).toBe('Created 7 hard links from ReactCommon folder');
    expect(logCalls[9]).toBe(
      'Created hard links for 20 React Native headers total',
    );
  });
});
