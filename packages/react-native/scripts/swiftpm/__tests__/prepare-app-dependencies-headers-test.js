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
  hardlinkHeadersFromPath,
} = require('../prepare-app-dependencies-headers');

// Mock all required modules
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

describe('hardlinkHeadersFromPath', () => {
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

  it('should create hard links for found header files without preserving structure', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const findCommandOutput =
      '/source/path/subdir/header1.h\n/source/path/header2.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/header2.h'
      );
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith(
      'find "/source/path" -name "*.h" -type f',
      {encoding: 'utf8', stdio: 'pipe'},
    );
    expect(mockFs.linkSync).toHaveBeenCalledTimes(2);
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/header1.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/header2.h',
      '/output/path/header2.h',
    );
    expect(result).toBe(2);
  });

  it('should preserve directory structure when preserveStructure is true', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const findCommandOutput =
      '/source/path/subdir/header1.h\n/source/path/another/header2.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/subdir/header1.h' ||
        filePath === '/source/path/another/header2.h'
      );
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/subdir/header1.h',
      '/output/path/subdir/header1.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
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

    mockExecSync.mockReturnValue('');

    // Execute
    hardlinkHeadersFromPath(sourcePath, outputPath, false, excludeFolders);

    // Assert
    expect(mockExecSync).toHaveBeenCalledWith(
      'find "/source/path" -name "*.h" -type f | grep -v "/node_modules/" | grep -v "/test/"',
      {encoding: 'utf8', stdio: 'pipe'},
    );
  });

  it('should use custom mappings when path matches prefix', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const customMappings = {
      'special/': '/custom/output/path',
    };
    const findCommandOutput =
      '/source/path/special/header1.h\n/source/path/normal/header2.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return (
        filePath === '/source/path/special/header1.h' ||
        filePath === '/source/path/normal/header2.h'
      );
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(
      sourcePath,
      outputPath,
      false,
      [],
      customMappings,
    );

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/special/header1.h',
      '/custom/output/path/header1.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
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
    const findCommandOutput = '/source/path/subdir/header1.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      if (filePath === '/source/path/subdir/header1.h') return true;
      if (filePath === '/output/path/subdir') return false; // directory doesn't exist
      return false;
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkHeadersFromPath(sourcePath, outputPath, true, []);

    // Assert
    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/output/path/subdir', {
      recursive: true,
    });
  });

  it('should remove existing hard link before creating new one', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const findCommandOutput = '/source/path/header1.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return true; // All files exist including destination
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockFs.unlinkSync).toHaveBeenCalledWith('/output/path/header1.h');
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
  });

  it('should skip non-existent source files', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const findCommandOutput =
      '/source/path/header1.h\n/source/path/nonexistent.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h'; // Only header1.h exists
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledTimes(1);
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/header1.h',
      '/output/path/header1.h',
    );
    expect(result).toBe(1);
  });

  it('should handle empty find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockExecSync.mockReturnValue('');

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle whitespace-only find command output', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';

    mockExecSync.mockReturnValue('   \n  \n  ');

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(mockFs.linkSync).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('should handle execSync throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const error = new Error('Command failed');

    mockExecSync.mockImplementation(() => {
      throw error;
    });

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

    // Assert
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to process headers from /source/path:',
      'Command failed',
    );
    expect(result).toBe(0);
  });

  it('should handle fs.linkSync throwing an error', () => {
    // Setup
    const sourcePath = '/source/path';
    const outputPath = '/output/path';
    const findCommandOutput = '/source/path/header1.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockImplementation(filePath => {
      return filePath === '/source/path/header1.h';
    });
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {
      throw new Error('Link failed');
    });

    // Execute
    const result = hardlinkHeadersFromPath(sourcePath, outputPath, false, []);

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
    const findCommandOutput =
      '/source/path/lib1/header1.h\n/source/path/lib2/header2.h\n/source/path/other/header3.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(
      sourcePath,
      outputPath,
      false,
      [],
      customMappings,
    );

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/lib1/header1.h',
      '/custom/lib1/header1.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/lib2/header2.h',
      '/custom/lib2/header2.h',
    );
    expect(mockFs.linkSync).toHaveBeenCalledWith(
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
    const findCommandOutput = '/source/path/special/subdir/header1.h\n';

    mockExecSync.mockReturnValue(findCommandOutput);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.linkSync.mockImplementation(() => {});

    // Execute
    const result = hardlinkHeadersFromPath(
      sourcePath,
      outputPath,
      true,
      [],
      customMappings,
    );

    // Assert
    expect(mockFs.linkSync).toHaveBeenCalledWith(
      '/source/path/special/subdir/header1.h',
      '/custom/output/special/subdir/header1.h',
    );
    expect(result).toBe(1);
  });
});
