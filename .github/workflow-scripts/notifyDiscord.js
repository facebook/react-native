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
 * Sorts jobs by platform first, then by library name.
 * @param {Array<Object>} jobs - Array of jobs with platform and library properties
 * @returns {Array<Object>} - Sorted array of jobs
 */
function sortResultsByPlatformAndLibrary(jobs) {
  return [...jobs].sort((a, b) => {
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
  const sortedFailures = sortResultsByPlatformAndLibrary(failures);

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

/**
 * Prepares a formatted Discord message payload for broken and recovered nightly jobs.
 * @param {Array<Object>} broken - List of newly broken jobs
 * @param {Array<Object>} recovered - List of recovered jobs
 * @returns {Object} - The formatted Discord message payload
 */
function prepareComparisonPayload(broken, recovered) {
  let content = '📊 **React Native Nightly Integration Status Update** 📊\n\n';

  if (broken.length === 0 && recovered.length === 0) {
    content +=
      'No changes from yesterday - all nightly jobs maintained their previous status.';
  } else {
    if (broken.length > 0) {
      content += '🔴 **Newly Broken Jobs:**\n';
      const sortedBroken = sortResultsByPlatformAndLibrary(broken);

      sortedBroken.forEach(job => {
        content += `❌ [${job.platform}] ${job.library} (was ${job.previousStatus}, now ${job.currentStatus})\n`;
      });
      content += '\n';
    }

    if (recovered.length > 0) {
      content += '🟢 **Recovered Jobs:**\n';
      const sortedRecovered = sortResultsByPlatformAndLibrary(recovered);

      sortedRecovered.forEach(job => {
        content += `✅ [${job.platform}] ${job.library} (was ${job.previousStatus}, now ${job.currentStatus})\n`;
      });
    }
  }

  return {content};
}

// Export the functions using CommonJS syntax
module.exports = {
  prepareFailurePayload,
  prepareComparisonPayload,
  sendMessageToDiscord,
};
