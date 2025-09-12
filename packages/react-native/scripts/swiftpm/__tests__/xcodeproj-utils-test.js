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

const {generateXcodeObjectId} = require('../xcodeproj-utils');

// Mock crypto module
jest.mock('crypto');

describe('generateXcodeObjectId', () => {
  let mockCrypto;

  beforeEach(() => {
    // Setup mock
    mockCrypto = require('crypto');

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should generate a 24-character uppercase hexadecimal string', () => {
    // Setup - Mock crypto.randomBytes to return predictable data
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toBe('0123456789ABCDEF01234567');
    expect(result).toHaveLength(24);
    expect(result).toMatch(/^[0-9A-F]+$/);
  });

  it('should call crypto.randomBytes with 12 bytes', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    );

    // Execute
    generateXcodeObjectId();

    // Assert
    expect(mockCrypto.randomBytes).toHaveBeenCalledWith(12);
    expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(1);
  });

  it('should convert to uppercase hexadecimal', () => {
    // Setup - Mock with bytes that would produce lowercase hex
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toBe('ABCDEF123456789ABCDEF011');
    expect(result).not.toMatch(/[a-z]/); // Should not contain lowercase letters
  });

  it('should return a string type', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(typeof result).toBe('string');
  });

  it('should not contain any non-hexadecimal characters', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33, 0x44,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toMatch(/^[0-9A-F]{24}$/);
    expect(result).not.toMatch(/[G-Z]/); // Should not contain letters beyond F
    expect(result).not.toMatch(/[a-z]/); // Should not contain lowercase letters
    expect(result).not.toMatch(/[\s\-_]/); // Should not contain whitespace or special chars
  });

  it('should handle crypto.randomBytes errors gracefully', () => {
    // Setup
    mockCrypto.randomBytes.mockImplementation(() => {
      throw new Error('Crypto error');
    });

    // Execute & Assert
    expect(() => generateXcodeObjectId()).toThrow('Crypto error');
  });
});
