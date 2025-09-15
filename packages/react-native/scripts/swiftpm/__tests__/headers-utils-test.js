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

const {
  hardlinkCodegenHeaders,
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
  symlinkReactCommonHeaders,
  hardlinkThirdPartyDependenciesHeaders,
} = require('../headers-utils');

// Mock all required modules
jest.mock('../utils');
jest.mock('../headers-mappings');
jest.mock('fs');
jest.mock('path');

describe('symlinkHeadersFromPath', () => {
  let mockUtils;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockFs = require('fs');
    mockPath = require('path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      const result = parts.join('/');
      return result === '' ? '.' : result;
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for found header files without preserving structure', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/subdir/header1.h',
      '/source/path/header2.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/header2.h'
      );
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(sourcePath, []);
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header2.h',
      '/output/path/header2.h',
    );
    expect(result).toBe(2);
  });

  it('should preserve directory structure when preserveStructure is true', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/subdir/header1.h',
      '/source/path/another/header2.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/another/header2.h'
      );
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/subdir/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/another/header2.h',
      '/output/path/another/header2.h',
    );
    expect(result).toBe(2);
  });

  it('should exclude specified folders from find command', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const excludeFolders = ['node_modules', 'test'];

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, false, excludeFolders);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      sourcePath,
      excludeFolders,
    );
  });

  it('should use custom mappings when path matches prefix', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const customMappings = {
      'special/': '/custom/output/path',
    };
    const headerFiles = [
      '/source/path/special/header1.h',
      '/source/path/normal/header2.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/special/header1.h' ||
        filePath === '/source/path/normal/header2.h'
      );
    });

    // Execute
    const result = symlinkHeadersFromPath(
      sourcePath,
      outputPath,
      false,
      [],
      customMappings,
    );

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/special/header1.h',
      '/custom/output/path/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/normal/header2.h',
      '/output/path/header2.h',
    );
    expect(console.log).toHaveBeenCalledWith(
      '  Custom mapping: special/ -> /custom/output/path',
    );
    expect(result).toBe(2);
  });

  it('should create destination directories if they do not exist', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/subdir/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/subdir/header1.h';
    });

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert - setupSymlink should be called, which internally handles directory creation
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/subdir/header1.h',
    );
  });

  it('should remove existing symlink before creating new one', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h'; // Only source file exists
    });

    // Execute
    symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert - setupSymlink should be called, which internally handles removing existing links
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
  });

  it('should skip non-existent source files', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = [
      '/source/path/header1.h',
      '/source/path/nonexistent.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h'; // Only header1.h exists
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(1);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
    expect(result).toBe(1);
  });

  it('should handle empty find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle whitespace-only find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockUtils.listHeadersInFolder.mockReturnValue([]);

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const error = new Error('Command failed');

    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw error;
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to process headers from /source/path:',
      'Command failed',
    );
    expect(result).toBe(0);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const headerFiles = ['/source/path/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h';
    });
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute
    const result = symlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to process headers from /source/path:',
      'Link failed',
    );
    expect(result).toBe(0);
  });

  it('should work with multiple custom mappings', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const customMappings = {
      'lib1/': '/custom/lib1',
      'lib2/': '/custom/lib2',
    };
    const headerFiles = [
      '/source/path/lib1/header1.h',
      '/source/path/lib2/header2.h',
      '/source/path/other/header3.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/lib1/header1.h' ||
        filePath === '/source/path/lib2/header2.h' ||
        filePath === '/source/path/other/header3.h'
      );
    });
    // Mock setupSymlink to not throw any errors
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkHeadersFromPath(
      sourcePath,
      outputPath,
      false,
      [],
      customMappings,
    );

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(3);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/lib1/header1.h',
      '/custom/lib1/header1.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/lib2/header2.h',
      '/custom/lib2/header2.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/other/header3.h',
      '/output/path/header3.h',
    );
    expect(result).toBe(3);
  });

  it('should handle custom mappings with preserved structure', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const customMappings = {
      'special/': '/custom/output',
    };
    const headerFiles = ['/source/path/special/subdir/header1.h'];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/special/subdir/header1.h';
    });
    // Mock setupSymlink to not throw any errors
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkHeadersFromPath(
      sourcePath,
      outputPath,
      true,
      [],
      customMappings,
    );

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/source/path/special/subdir/header1.h',
      '/custom/output/special/subdir/header1.h',
    );
    expect(result).toBe(1);
  });
});

describe('hardlinkCodegenHeaders', () => {
  let mockExecSync;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockExecSync = require('child_process').execSync;
    mockFs = require('fs');
    mockPath = require('path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      const result = parts.join('/');
      return result === '' ? '.' : result;
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create hard links for codegen headers with conditional directory structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/ModuleProvider.h\n` +
      `${reactCodegenPath}/react/renderer/components/MyComponent/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/react/renderer/components/MyComponent/EventEmitter.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(reactCodegenPath);
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${reactCodegenPath}" -name "*.h" -type f | grep -v "/headers/" | grep -v "/tests/"`,
      {encoding: 'utf8', stdio: 'pipe'},
    );
    // Files with no subpath go to ReactCodegen folder
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ComponentDescriptors.h`,
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ModuleProvider.h`,
      '/output/folder/headers/ReactCodegen/ModuleProvider.h',
    );
    // Files with subpaths preserve structure under headers/
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/MyComponent/ComponentDescriptors.h`,
      '/output/folder/headers/react/renderer/components/MyComponent/ComponentDescriptors.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/MyComponent/EventEmitter.h`,
      '/output/folder/headers/react/renderer/components/MyComponent/EventEmitter.h',
    );
  });

  it('should create headers output directory if it does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const headersOutput = '/output/folder/headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath === headersOutput) return false; // headers output doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(headersOutput, {
      recursive: true,
    });
  });

  it('should create ReactCodegen subdirectory if it does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const reactCodegenHeadersOutput = '/output/folder/headers/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath === reactCodegenHeadersOutput) return false; // ReactCodegen dir doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(reactCodegenHeadersOutput, {
      recursive: true,
    });
  });

  it('should warn and return early if ReactCodegen path does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return false; // ReactCodegen path doesn't exist
      return false;
    });

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      `ReactCodegen path does not exist: ${reactCodegenPath}`,
    );
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('should create destination subdirectories for nested header structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput = `${reactCodegenPath}/react/renderer/components/nested/deep/Component.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      if (
        filePath ===
        '/output/folder/headers/react/renderer/components/nested/deep'
      )
        return false; // subdirectory doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      '/output/folder/headers/react/renderer/components/nested/deep',
      {recursive: true},
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/nested/deep/Component.h`,
      '/output/folder/headers/react/renderer/components/nested/deep/Component.h',
    );
  });

  it('should remove existing hard links before creating new ones', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput = `${reactCodegenPath}/ComponentDescriptors.h\n`;

    mockFs.existsSync.mockReturnValue(true); // All files and directories exist
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ComponentDescriptors.h`,
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
  });

  it('should skip non-existent source header files', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/nonexistent.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath === `${reactCodegenPath}/ComponentDescriptors.h`)
        return true;
      if (filePath === `${reactCodegenPath}/nonexistent.h`) return false; // doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert - only the existing file should be linked
    expect(mockFs.linkSync).toHaveBeenCalledTimes(1);
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ComponentDescriptors.h`,
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
  });

  it('should handle empty find command output', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 0 Codegen headers with conditional directory structure',
    );
  });

  it('should handle whitespace-only find command output', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('   \n  \n  ');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 0 Codegen headers with conditional directory structure',
    );
  });

  it('should handle execSync throwing an error', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const error = new Error('Command failed');

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      return false;
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to create hard links for codegen headers:',
      'Command failed',
    );
  });

  it('should exclude headers and tests directories from find command', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${reactCodegenPath}" -name "*.h" -type f | grep -v "/headers/" | grep -v "/tests/"`,
      {encoding: 'utf8', stdio: 'pipe'},
    );
  });

  it('should differentiate between files with and without subpaths correctly', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/TopLevelHeader.h\n` +
      `${reactCodegenPath}/subdir/SubdirHeader.h\n` +
      `${reactCodegenPath}/react/renderer/ComponentDescriptor.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    // File with no subpath (dirname is '.') goes to ReactCodegen folder
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/TopLevelHeader.h`,
      '/output/folder/headers/ReactCodegen/TopLevelHeader.h',
    );
    // Files with subpaths preserve structure under headers/
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/subdir/SubdirHeader.h`,
      '/output/folder/headers/subdir/SubdirHeader.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/ComponentDescriptor.h`,
      '/output/folder/headers/react/renderer/ComponentDescriptor.h',
    );
  });

  it('should handle fs.linkSync throwing an error but continue processing', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/ModuleProvider.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});

    // Make linkSync fail for the first file but succeed for the second
    let callCount = 0;
    mockFs.linkSync.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Link failed for first file');
      }
    });

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert - when fs.linkSync throws an error, the entire try-catch block fails
    // and only the initial console.log and console.warn are called
    expect(console.log).toHaveBeenCalledWith(
      'Creating hard links for Codegen headers...',
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to create hard links for codegen headers:',
      'Link failed for first file',
    );
    expect(mockFs.linkSync).toHaveBeenCalledTimes(1);
  });

  it('should log creation message and success count', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/react/renderer/ComponentDescriptor.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(console.log).toHaveBeenCalledWith(
      'Creating hard links for Codegen headers...',
    );
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 2 Codegen headers with conditional directory structure',
    );
  });

  it('should handle complex mixed file structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput =
      `${reactCodegenPath}/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/ModuleProvider.h\n` +
      `${reactCodegenPath}/RCTThirdPartyFabricComponentsProvider.h\n` +
      `${reactCodegenPath}/react/renderer/components/image/ComponentDescriptors.h\n` +
      `${reactCodegenPath}/react/renderer/components/text/EventEmitter.h\n` +
      `${reactCodegenPath}/react/renderer/components/view/Props.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    // Files with no subpath go to ReactCodegen folder
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ComponentDescriptors.h`,
      '/output/folder/headers/ReactCodegen/ComponentDescriptors.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/ModuleProvider.h`,
      '/output/folder/headers/ReactCodegen/ModuleProvider.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/RCTThirdPartyFabricComponentsProvider.h`,
      '/output/folder/headers/ReactCodegen/RCTThirdPartyFabricComponentsProvider.h',
    );
    // Files with subpaths preserve structure under headers/
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/image/ComponentDescriptors.h`,
      '/output/folder/headers/react/renderer/components/image/ComponentDescriptors.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/text/EventEmitter.h`,
      '/output/folder/headers/react/renderer/components/text/EventEmitter.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/react/renderer/components/view/Props.h`,
      '/output/folder/headers/react/renderer/components/view/Props.h',
    );
  });

  it('should handle edge case with deeply nested single file', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const iosAppPath = '/path/to/ios-app';
    const outputFolder = '/output/folder';
    const reactCodegenPath =
      '/path/to/ios-app/build/generated/ios/ReactCodegen';
    const findCommandOutput = `${reactCodegenPath}/very/deeply/nested/path/to/header/DeepHeader.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === reactCodegenPath) return true;
      if (filePath.includes('ReactCodegen') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${reactCodegenPath}/very/deeply/nested/path/to/header/DeepHeader.h`,
      '/output/folder/headers/very/deeply/nested/path/to/header/DeepHeader.h',
    );
  });
});

describe('hardlinkThirdPartyDependenciesHeaders', () => {
  let mockExecSync;
  let mockFs;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockExecSync = require('child_process').execSync;
    mockFs = require('fs');
    mockPath = require('path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create hard links for third-party dependencies headers with preserved structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput =
      `${thirdPartyHeadersPath}/boost/boost.h\n` +
      `${thirdPartyHeadersPath}/glog/glog.h\n` +
      `${thirdPartyHeadersPath}/fmt/format.h\n` +
      `${thirdPartyHeadersPath}/folly/folly.hpp\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (
        filePath.includes('third-party') &&
        (filePath.endsWith('.h') || filePath.endsWith('.hpp'))
      )
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.existsSync).toHaveBeenCalledWith(thirdPartyHeadersPath);
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${thirdPartyHeadersPath}" \\( -name "*.h" -o -name "*.hpp" \\) -type f | grep -v "/tests/"`,
      {encoding: 'utf8', stdio: 'pipe'},
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/glog/glog.h`,
      '/output/folder/headers/glog/glog.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/fmt/format.h`,
      '/output/folder/headers/fmt/format.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/folly/folly.hpp`,
      '/output/folder/headers/folly/folly.hpp',
    );
  });

  it('should use default folder name when folderName parameter is not provided', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput = `${thirdPartyHeadersPath}/boost/boost.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute - without folderName parameter
    hardlinkThirdPartyDependenciesHeaders(reactNativePath, outputFolder);

    // Assert - should use default 'headers' folder
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
  });

  it('should create headers output directory if it does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'custom-headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const headersOutput = '/output/folder/custom-headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath === headersOutput) return false; // headers output doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(headersOutput, {
      recursive: true,
    });
  });

  it('should create destination subdirectories for nested header structure', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput = `${thirdPartyHeadersPath}/boost/algorithm/string.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      if (filePath === '/output/folder/headers/boost/algorithm') return false; // subdirectory doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      '/output/folder/headers/boost/algorithm',
      {recursive: true},
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/algorithm/string.h`,
      '/output/folder/headers/boost/algorithm/string.h',
    );
  });

  it('should remove existing hard links before creating new ones', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput = `${thirdPartyHeadersPath}/boost/boost.h\n`;

    mockFs.existsSync.mockReturnValue(true); // All files and directories exist
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      '/output/folder/headers/boost/boost.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
  });

  it('should skip non-existent source header files', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput =
      `${thirdPartyHeadersPath}/boost/boost.h\n` +
      `${thirdPartyHeadersPath}/nonexistent/header.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath === `${thirdPartyHeadersPath}/boost/boost.h`) return true;
      if (filePath === `${thirdPartyHeadersPath}/nonexistent/header.h`)
        return false; // doesn't exist
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert - only the existing file should be linked
    expect(mockFs.linkSync).toHaveBeenCalledTimes(1);
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/headers/boost/boost.h',
    );
  });

  it('should warn and return early if third-party headers path does not exist', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return false; // third-party headers path doesn't exist
      return false;
    });

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      `Third-party dependencies headers path does not exist: ${thirdPartyHeadersPath}`,
    );
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('should handle empty find command output', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 0 Third-Party Dependencies headers with preserved directory structure',
    );
  });

  it('should handle whitespace-only find command output', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('   \n  \n  ');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Created hard links for 0 Third-Party Dependencies headers with preserved directory structure',
    );
  });

  it('should handle execSync throwing an error', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const error = new Error('Command failed');

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      return false;
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to create hard links for third-party dependencies headers:',
      'Command failed',
    );
  });

  it('should handle both .h and .hpp files', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput =
      `${thirdPartyHeadersPath}/library1/header.h\n` +
      `${thirdPartyHeadersPath}/library2/header.hpp\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (
        filePath.includes('third-party') &&
        (filePath.endsWith('.h') || filePath.endsWith('.hpp'))
      )
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${thirdPartyHeadersPath}" \\( -name "*.h" -o -name "*.hpp" \\) -type f | grep -v "/tests/"`,
      {encoding: 'utf8', stdio: 'pipe'},
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/library1/header.h`,
      '/output/folder/headers/library1/header.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/library2/header.hpp`,
      '/output/folder/headers/library2/header.hpp',
    );
  });

  it('should exclude test directories from find command', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      return false;
    });
    mockExecSync.mockReturnValue('');
    mockFs.mkdirSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${thirdPartyHeadersPath}" \\( -name "*.h" -o -name "*.hpp" \\) -type f | grep -v "/tests/"`,
      {encoding: 'utf8', stdio: 'pipe'},
    );
  });

  it('should log creation message and handle fs.linkSync errors gracefully', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput =
      `${thirdPartyHeadersPath}/boost/boost.h\n` +
      `${thirdPartyHeadersPath}/glog/glog.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});

    // Make linkSync fail for the first file
    let callCount = 0;
    mockFs.linkSync.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Link failed for first file');
      }
    });

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert - when fs.linkSync throws an error, the entire try-catch block fails
    // and only the initial console.log and console.warn are called
    expect(console.log).toHaveBeenCalledWith(
      'Creating hard links for Third-Party Dependencies headers...',
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to create hard links for third-party dependencies headers:',
      'Link failed for first file',
    );
    expect(mockFs.linkSync).toHaveBeenCalledTimes(1);
  });

  it('should handle complex nested directory structures', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'headers';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput =
      `${thirdPartyHeadersPath}/boost/algorithm/string/trim.h\n` +
      `${thirdPartyHeadersPath}/folly/container/F14Map.h\n` +
      `${thirdPartyHeadersPath}/fmt/core.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert - all nested structures should be preserved
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/algorithm/string/trim.h`,
      '/output/folder/headers/boost/algorithm/string/trim.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/folly/container/F14Map.h`,
      '/output/folder/headers/folly/container/F14Map.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/fmt/core.h`,
      '/output/folder/headers/fmt/core.h',
    );
  });

  it('should handle custom folder name parameter', () => {
    // Setup
    const reactNativePath = '/path/to/react-native';
    const outputFolder = '/output/folder';
    const folderName = 'custom-includes';
    const thirdPartyHeadersPath =
      '/path/to/react-native/third-party/ReactNativeDependencies.xcframework/Headers';
    const findCommandOutput = `${thirdPartyHeadersPath}/boost/boost.h\n`;

    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === thirdPartyHeadersPath) return true;
      if (filePath.includes('third-party') && filePath.endsWith('.h'))
        return true;
      return false;
    });
    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      outputFolder,
      folderName,
    );

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      `${thirdPartyHeadersPath}/boost/boost.h`,
      '/output/folder/custom-includes/boost/boost.h',
    );
  });
});

describe('symlinkReactAppleHeaders', () => {
  let mockUtils;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockPath = require('path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });
    mockPath.sep = '/';

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should create symlinks for ReactApple headers with Exported folder structure', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });

  it('should handle empty header files from mapping', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';

    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle multiple header files in the same mapping', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTUtility.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTUtility.h',
      '/output/headers/RCTDeprecation/RCTUtility.h',
    );
    expect(result).toBe(2);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute and Assert - function throws the error from setupSymlink
    expect(() => {
      symlinkReactAppleHeaders(reactApplePath, headersOutput);
    }).toThrow('Link failed');
  });

  it('should work correctly with the symcoded mapping structure', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert - setupSymlink handles removing existing files and creating new ones internally
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });

  it('should handle listHeadersInFolder returning empty array', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';

    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const error = new Error('Command failed');

    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw error;
    });

    // Execute and Assert - function throws the error from listHeadersInFolder
    expect(() => {
      symlinkReactAppleHeaders(reactApplePath, headersOutput);
    }).toThrow('Command failed');
  });

  it('should work correctly with single symcoded mapping', () => {
    // Setup - Test the specific mapping defined in the function
    const reactApplePath = '/path/to/ReactApple';
    const headersOutput = '/output/headers';
    const headerFiles = [
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
    ];

    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactAppleHeaders(reactApplePath, headersOutput);

    // Assert - Test the specific mapping that's symcoded
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported/RCTDeprecation.h',
      '/output/headers/RCTDeprecation/RCTDeprecation.h',
    );
    expect(result).toBe(1);
  });
});

describe('symlinkReactCommonHeaders', () => {
  let mockUtils;
  let mockReactCommonMappings;
  let mockPath;
  let originalConsoleWarn;
  let originalConsoleLog;

  beforeEach(() => {
    // Setup mocks
    mockUtils = require('../utils');
    mockReactCommonMappings =
      require('../headers-mappings').reactCommonMappings;
    mockPath = require('path');

    // Mock path functions
    mockPath.relative.mockImplementation((from, to) => {
      return to.replace(from + '/', '');
    });
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation(filePath => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    mockPath.basename.mockImplementation(filePath => {
      return filePath.split('/').pop();
    });
    mockPath.sep = '/';

    // Mock console methods to prevent test output noise
    originalConsoleWarn = console.warn;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  it('should use reactCommonMappings and create symlinks for mapped directories', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockReactCommonMappings).toHaveBeenCalledWith(
      reactCommonPath,
      headersOutput,
    );
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon',
      ['tests'],
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(1);
  });

  it('should handle multiple mappings with different configurations', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles1 = [
      '/path/to/ReactCommon/react/renderer/core/Component.h',
    ];
    const headerFiles2 = [
      '/path/to/ReactCommon/turbomodule/core/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder
      .mockReturnValueOnce(headerFiles1)
      .mockReturnValueOnce(headerFiles2);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/renderer/core/Component.h',
      '/output/headers/react/renderer/core/Component.h',
    );
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/turbomodule/core/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(2);
  });

  it('should handle empty mappings from reactCommonMappings', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {}; // Empty mappings

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockReactCommonMappings).toHaveBeenCalledWith(
      reactCommonPath,
      headersOutput,
    );
    expect(mockUtils.listHeadersInFolder).not.toHaveBeenCalled();
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle mapping with preserveStructure true', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/renderer/core/subdir/Component.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/react/renderer/core/subdir/Component.h',
      '/output/headers/react/renderer/core/subdir/Component.h',
    );
    expect(result).toBe(1);
  });

  it('should handle mapping with preserveStructure false (flattened)', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/turbomodule/core/subdir/TurboModule.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.setupSymlink).toHaveBeenCalledWith(
      '/path/to/ReactCommon/turbomodule/core/subdir/TurboModule.h',
      '/output/headers/ReactCommon/TurboModule.h',
    );
    expect(result).toBe(1);
  });

  it('should handle listHeadersInFolder returning empty arrays for all mappings', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
      '/path/to/ReactCommon/turbomodule/core': {
        destination: '/output/headers/ReactCommon',
        excludeFolders: ['tests'],
        preserveStructure: false,
      },
    };

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue([]);
    mockUtils.setupSymlink.mockImplementation(() => {});

    // Execute
    const result = symlinkReactCommonHeaders(reactCommonPath, headersOutput);

    // Assert
    expect(mockUtils.listHeadersInFolder).toHaveBeenCalledTimes(2);
    expect(mockUtils.setupSymlink).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle setupSymlink throwing an error', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };
    const headerFiles = [
      '/path/to/ReactCommon/react/renderer/core/Component.h',
    ];

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockReturnValue(headerFiles);
    mockUtils.setupSymlink.mockImplementation(() => {
      throw new Error('Setup failed');
    });

    // Execute and Assert - function should throw the error from setupSymlink
    expect(() => {
      symlinkReactCommonHeaders(reactCommonPath, headersOutput);
    }).toThrow('Setup failed');
  });

  it('should handle listHeadersInFolder throwing an error', () => {
    // Setup
    const reactCommonPath = '/path/to/ReactCommon';
    const headersOutput = '/output/headers';
    const mappings = {
      '/path/to/ReactCommon/react/renderer/core': {
        destination: '/output/headers/react/renderer/core',
        excludeFolders: ['tests'],
        preserveStructure: true,
      },
    };

    mockReactCommonMappings.mockReturnValue(mappings);
    mockUtils.listHeadersInFolder.mockImplementation(() => {
      throw new Error('List failed');
    });

    // Execute and Assert - function should throw the error from listHeadersInFolder
    expect(() => {
      symlinkReactCommonHeaders(reactCommonPath, headersOutput);
    }).toThrow('List failed');
  });
});
