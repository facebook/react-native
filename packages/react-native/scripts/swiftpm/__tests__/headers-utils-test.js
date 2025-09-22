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
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
} = require('../headers-utils');

// Mock all required modules
jest.mock('../utils');
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

  it('should work correctly with the hardcoded mapping structure', () => {
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

  it('should work correctly with single hardcoded mapping', () => {
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

    // Assert - Test the specific mapping that's hardcoded
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
