/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// We connect to firebase using a plain HTTP request because we don't want to
// add yet another devDependency to the react-native monorepo.
class FirebaseClient {
  constructor() {
    this.email = process.env.FIREBASE_APP_EMAIL;
    this.password = process.env.FIREBASE_APP_PASS;
    this.apiKey = process.env.FIREBASE_APP_APIKEY;
    this.projectId = process.env.FIREBASE_APP_PROJECTNAME;
    this.databaseUrl = `${this.projectId}.firebaseio.com`;
    this.idToken = null;
  }

  async authenticate() {
    if (!this.email || !this.password) {
      throw new Error(
        'Firebase credentials not found in environment variables',
      );
    }

    const authData = {
      email: this.email,
      password: this.password,
      returnSecureToken: true,
    };

    const response = await this.makeRequest(
      'identitytoolkit.googleapis.com',
      `/v1/accounts:signInWithPassword?key=${this.apiKey}`,
      'POST',
      authData,
    );

    this.idToken = response.idToken;
    return;
  }

  /**
   * Make a database request for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} method - HTTP method
   * @param {*} data - Data to send (optional)
   * @returns {Promise<*>} - Response data
   */
  async makeDatabaseRequest(date, method, data = null) {
    if (!this.idToken) {
      await this.authenticate();
    }

    const path = `/nightly-results/${date}.json?auth=${this.idToken}`;
    return this.makeRequest(this.databaseUrl, path, method, data);
  }

  /**
   * Store test results for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Array<Object>} results - Array of test results
   * @returns {Promise<void>}
   */
  async storeResults(date, results) {
    await this.makeDatabaseRequest(date, 'PUT', results);
    console.log(`Successfully stored results for ${date}`);
  }

  /**
   * Retrieve test results for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>|null>} - Array of test results or null if not found
   */
  async getResults(date) {
    try {
      return await this.makeDatabaseRequest(date, 'GET');
    } catch (error) {
      if (error.message.includes('404')) {
        return null; // No results found for this specific date.
      }
      throw error;
    }
  }

  /**
   * Find the most recent available job results before the given date
   * @param {string} currentDate - Current date in YYYY-MM-DD format
   * @param {number} maxDaysBack - Maximum number of days to look back (default: 7)
   * @returns {Promise<{results: Array<Object>|null, date: string|null}>} - Most recent results and their date
   */
  async getLatestResults(currentDate, maxDaysBack = 7) {
    if (!this.idToken) {
      await this.authenticate();
    }

    const currentDateObj = new Date(currentDate);

    for (let daysBack = 1; daysBack <= maxDaysBack; daysBack++) {
      const checkDate = new Date(currentDateObj);
      checkDate.setDate(checkDate.getDate() - daysBack);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      console.log(
        `Checking for results on ${checkDateStr} (${daysBack} days back)...`,
      );

      try {
        const results = await this.getResults(checkDateStr);
        if (results && results.length > 0) {
          console.log(
            `Found results from ${checkDateStr} (${daysBack} days back)`,
          );
          return {results, date: checkDateStr};
        }
      } catch (error) {
        console.log(`No results found for ${checkDateStr}: ${error.message}`);
        continue;
      }
    }

    console.log(
      `No previous results found within the last ${maxDaysBack} days`,
    );
    return {results: null, date: null};
  }

  async makeRequest(hostname, path, method, data = null) {
    const url = `https://${hostname}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage;
      try {
        const parsedError = JSON.parse(responseText);
        errorMessage = parsedError.error?.message || responseText;
      } catch {
        errorMessage = responseText;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  }
}

/**
 * Compare current results with previous day's results
 * @param {Array<Object>} currentResults - Today's test results
 * @param {Array<Object>} previousResults - Yesterday's test results
 * @returns {Object} - Object containing broken and recovered tests
 */
function compareResults(currentResults, previousResults) {
  if (!previousResults) {
    return {
      broken: [],
      recovered: [],
      newFailures: currentResults.filter(result => result.status !== 'success'),
    };
  }

  // Create maps for easier lookup
  const currentMap = new Map();
  const previousMap = new Map();

  currentResults.forEach(result => {
    const key = `${result.library}-${result.platform}`;
    currentMap.set(key, result);
  });

  previousResults.forEach(result => {
    const key = `${result.library}-${result.platform}`;
    previousMap.set(key, result);
  });

  const broken = [];
  const recovered = [];

  // Check for broken tests (was success, now failed)
  for (const [key, currentResult] of currentMap) {
    const previousResult = previousMap.get(key);
    if (previousResult) {
      if (
        previousResult.status === 'success' &&
        currentResult.status !== 'success'
      ) {
        broken.push({
          library: currentResult.library,
          platform: currentResult.platform,
          previousStatus: previousResult.status,
          currentStatus: currentResult.status,
        });
      }
    }
  }

  // Check for recovered tests (was failed, now success)
  for (const [key, currentResult] of currentMap) {
    const previousResult = previousMap.get(key);
    if (previousResult) {
      if (
        previousResult.status !== 'success' &&
        currentResult.status === 'success'
      ) {
        recovered.push({
          library: currentResult.library,
          platform: currentResult.platform,
          previousStatus: previousResult.status,
          currentStatus: currentResult.status,
        });
      }
    }
  }

  return {broken, recovered};
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 * @returns {string} - Yesterday's date
 */
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} - Today's date
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

module.exports = {
  FirebaseClient,
  compareResults,
  getYesterdayDate,
  getTodayDate,
};
