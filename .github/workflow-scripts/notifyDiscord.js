/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Sends a message to Discord using the webhook URL.
 * @param {string} webHook - The Discord webhook URL
 * @param {Object} message - The message to send
 * @returns {Promise<void>} - A promise that resolves when the message is sent
 */
async function sendMessageToDiscord(webHook, message) {
  if (!webHook) {
    throw new Error('Discord webhook URL is missing');
  }

  // Send the request using fetch
  const response = await fetch(webHook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  // Handle the response
  if (response.ok) {
    console.log('Successfully sent message to Discord');
    return;
  } else {
    const errorText = await response.text();
    console.error(
      `Failed to send message to Discord: ${response.status} ${errorText}`,
    );
    throw new Error(`HTTP status code: ${response.status}`);
  }
}

/**
 * Prepares a formatted Discord message payload from a list of failures.
 * @param {Array<Object>} failures - List of failures to format
 * @returns {Object} - The formatted Discord message payload
 */
function prepareFailurePayload(failures) {
  if (!failures || failures.length === 0) {
    return {
      content:
        '⚠️ **React Native Nightly Integration Failures** ⚠️\n\nNo failures to report.',
    };
  }

  // Sort failures by platform and then by library name
  const sortedFailures = [...failures].sort((a, b) => {
    // First sort by platform
    const platformA = a.platform || 'Unknown';
    const platformB = b.platform || 'Unknown';

    if (platformA !== platformB) {
      return platformA.localeCompare(platformB);
    }

    // Then sort by library name
    const libraryA = a.library || 'Unknown';
    const libraryB = b.library || 'Unknown';
    return libraryA.localeCompare(libraryB);
  });

  // Format the failures into a message
  const formattedFailures = sortedFailures
    .map(failure => {
      const library = failure.library || 'Unknown';
      const platform = failure.platform || 'Unknown';
      return `❌ [${platform}] ${library}`;
    })
    .join('\n');

  return {
    content: `⚠️ **React Native Nightly Integration Failures** ⚠️\n\nThe integration of libraries with React Native nightly failed for the following libraries:\n\n${formattedFailures}`,
  };
}

// Export the functions using CommonJS syntax
module.exports = {
  prepareFailurePayload,
  sendMessageToDiscord,
};
