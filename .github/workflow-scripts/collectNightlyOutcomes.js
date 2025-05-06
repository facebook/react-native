/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const path = require('path');
const {
  prepareFailurePayload,
  sendMessageToDiscord,
} = require('./notifyDiscord');

function readOutcomes() {
  const baseDir = '/tmp';
  let outcomes = [];
  fs.readdirSync(baseDir).forEach(file => {
    const fullPath = path.join(baseDir, file);
    if (fullPath.endsWith('outcome') && fs.statSync(fullPath).isDirectory) {
      fs.readdirSync(fullPath).forEach(subFile => {
        const subFullPath = path.join(fullPath, subFile);
        if (subFullPath.endsWith('outcome')) {
          const [library, status] = String(fs.readFileSync(subFullPath, 'utf8'))
            .trim()
            .split(':');
          const platform = subFile.includes('android') ? 'Android' : 'iOS';
          console.log(
            `[${platform}] ${library} completed with status ${status}`,
          );
          outcomes.push({
            library: library.trim(),
            platform,
            status: status.trim(),
          });
        }
      });
    } else if (fullPath.endsWith('outcome')) {
      const [library, status] = String(fs.readFileSync(fullPath, 'utf8'))
        .trim()
        .split(':');
      const platform = file.includes('android') ? 'Android' : 'iOS';
      console.log(`[${platform}] ${library} completed with status ${status}`);
      outcomes.push({
        library: library.trim(),
        platform,
        status: status.trim(),
      });
    }
  });
  return outcomes;
}

function printFailures(outcomes) {
  console.log('Printing failures...');
  let failedLibraries = [];
  outcomes.forEach(entry => {
    if (entry.status !== 'success') {
      console.log(
        `❌ [${entry.platform}] ${entry.library} failed with status ${entry.status}`,
      );
      failedLibraries.push({
        library: entry.library,
        platform: entry.platform,
      });
    }
  });
  return failedLibraries;
}

/**
 * Sends a message to Discord with the list of failures.
 * @param {string} webHook - The Discord webhook URL
 * @param {Array<Object>} failures - List of failures to report
 * @returns {Promise<void>} - A promise that resolves when the message is sent
 */
async function notifyDiscord(webHook, failures) {
  if (!webHook) {
    console.error('Discord webhook URL is missing');
    return;
  }

  if (!failures || failures.length === 0) {
    console.log('No failures to report to Discord');
    return;
  }

  try {
    // Use the prepareFailurePayload function to format the message
    const message = prepareFailurePayload(failures);

    // Use the sendMessageToDiscord function to send the message
    await sendMessageToDiscord(webHook, message);
  } catch (error) {
    console.error('Error in notifyDiscord function:', error);
    throw error;
  }
}

async function collectResults(discordWebHook) {
  const outcomes = readOutcomes();
  const failures = printFailures(outcomes);

  if (failures.length > 0) {
    if (discordWebHook) {
      console.log('Sending to discord');
      await notifyDiscord(discordWebHook, failures);
    } else {
      console.log('Web hook not set');
    }
    process.exit(1);
  }
  console.log('✅ All tests passed!');
}

module.exports = {
  collectResults,
  notifyDiscord,
};
