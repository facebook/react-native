/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  prepareFailurePayload,
  sendMessageToDiscord,
} = require('../notifyDiscord');

describe('prepareFailurePayload', () => {
  it('should handle undefined failures', () => {
    const message = prepareFailurePayload(undefined);
    expect(message).toEqual({
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nNo failures to report.',
    });
  });

  it('should handle empty failures array', () => {
    const message = prepareFailurePayload([]);
    expect(message).toEqual({
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nNo failures to report.',
    });
  });

  it('should format a single failure correctly', () => {
    const failures = [
      {
        library: 'react-native-reanimated',
        platform: 'iOS',
      },
    ];

    const message = prepareFailurePayload(failures);
    expect(message).toEqual({
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nThe integration of libraries with React Native nightly failed for the following libraries:\n\n❌ [iOS] react-native-reanimated',
    });
  });

  it('should sort multiple failures by platform and library name', () => {
    const failures = [
      {
        library: 'react-native-reanimated',
        platform: 'iOS',
      },
      {
        library: 'react-native-gesture-handler',
        platform: 'Android',
      },
      {
        library: 'react-native-screens',
        platform: 'iOS',
      },
      {
        library: 'react-native-svg',
        platform: 'Android',
      },
    ];

    const message = prepareFailurePayload(failures);

    // The failures should be sorted: first Android (alphabetically), then iOS
    // Within each platform, libraries should be sorted alphabetically
    expect(message).toEqual({
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nThe integration of libraries with React Native nightly failed for the following libraries:\n\n❌ [Android] react-native-gesture-handler\n❌ [Android] react-native-svg\n❌ [iOS] react-native-reanimated\n❌ [iOS] react-native-screens',
    });
  });

  it('should handle failures with missing properties', () => {
    const failures = [
      {
        // Missing library
        platform: 'iOS',
      },
      {
        library: 'react-native-gesture-handler',
        // Missing platform
      },
      {
        // Both missing
      },
    ];

    const message = prepareFailurePayload(failures);

    expect(message).toEqual({
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nThe integration of libraries with React Native nightly failed for the following libraries:\n\n❌ [iOS] Unknown\n❌ [Unknown] react-native-gesture-handler\n❌ [Unknown] Unknown',
    });
  });
});

describe('sendMessageToDiscord', () => {
  // Store the original fetch function
  const originalFetch = global.fetch;

  // Setup and teardown for each test
  beforeEach(() => {
    // Mock the global fetch function
    global.fetch = jest.fn();
    // Silence console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original fetch function
    global.fetch = originalFetch;
    // Restore console functions
    jest.restoreAllMocks();
  });

  it('should throw an error if webhook URL is missing', async () => {
    await expect(sendMessageToDiscord(null, {})).rejects.toThrow(
      'Discord webhook URL is missing',
    );
  });

  it('should send a message successfully', async () => {
    // Mock a successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const webhook = 'https://discord.com/api/webhooks/123/abc';
    const message = {content: 'Test message'};

    await expect(sendMessageToDiscord(webhook, message)).resolves.not.toThrow();

    // Verify fetch was called with the right arguments
    expect(global.fetch).toHaveBeenCalledWith(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    // Verify console.log was called
    expect(console.log).toHaveBeenCalledWith(
      'Successfully sent message to Discord',
    );
  });

  it('should throw an error if the response is not ok', async () => {
    // Mock a failed response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValueOnce('Bad Request'),
    });

    const webhook = 'https://discord.com/api/webhooks/123/abc';
    const message = {content: 'Test message'};

    await expect(sendMessageToDiscord(webhook, message)).rejects.toThrow(
      'HTTP status code: 400',
    );

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith(
      'Failed to send message to Discord: 400 Bad Request',
    );
  });

  it('should throw an error if fetch fails', async () => {
    // Mock a network error
    const networkError = new Error('Network error');
    global.fetch.mockRejectedValueOnce(networkError);

    const webhook = 'https://discord.com/api/webhooks/123/abc';
    const message = {content: 'Test message'};

    await expect(sendMessageToDiscord(webhook, message)).rejects.toThrow(
      'Network error',
    );
  });
});
