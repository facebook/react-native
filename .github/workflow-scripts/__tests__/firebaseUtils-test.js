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
  FirebaseClient,
  compareResults,
  getYesterdayDate,
  getTodayDate,
} = require('../firebaseUtils');

describe('FirebaseClient', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    global.fetch = jest.fn();
    process.env = {
      ...originalEnv,
      FIREBASE_APP_EMAIL: 'test@example.com',
      FIREBASE_APP_PASS: 'testpassword',
      FIREBASE_APP_APIKEY: 'test-api-key',
      FIREBASE_APP_PROJECTNAME: 'test-project',
    };
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      const client = new FirebaseClient();
      expect(client.email).toBe('test@example.com');
      expect(client.password).toBe('testpassword');
      expect(client.apiKey).toBe('test-api-key');
      expect(client.projectId).toBe('test-project');
      expect(client.databaseUrl).toBe('test-project.firebaseio.com');
      expect(client.idToken).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      const mockResponse = {
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResponse)),
      });

      const client = new FirebaseClient();
      await client.authenticate();

      expect(client.idToken).toBe('mock-id-token');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'testpassword',
            returnSecureToken: true,
          }),
        },
      );
    });

    it('should throw error when email is missing', async () => {
      delete process.env.FIREBASE_APP_EMAIL;
      const client = new FirebaseClient();

      await expect(client.authenticate()).rejects.toThrow(
        'Firebase credentials not found in environment variables',
      );
    });

    it('should throw error when password is missing', async () => {
      delete process.env.FIREBASE_APP_PASS;
      const client = new FirebaseClient();

      await expect(client.authenticate()).rejects.toThrow(
        'Firebase credentials not found in environment variables',
      );
    });

    it('should handle authentication failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValueOnce(
          JSON.stringify({
            error: {message: 'Invalid credentials'},
          }),
        ),
      });

      const client = new FirebaseClient();

      await expect(client.authenticate()).rejects.toThrow(
        'HTTP 400: Invalid credentials',
      );
    });
  });

  describe('makeRequest', () => {
    it('should make successful GET request', async () => {
      const mockData = {test: 'data'};
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
      });

      const client = new FirebaseClient();
      const result = await client.makeRequest('example.com', '/test', 'GET');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should make successful POST request with data', async () => {
      const mockData = {success: true};
      const postData = {test: 'post data'};

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
      });

      const client = new FirebaseClient();
      const result = await client.makeRequest(
        'example.com',
        '/test',
        'POST',
        postData,
      );

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
    });

    it('should handle non-JSON response', async () => {
      const textResponse = 'plain text response';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(textResponse),
      });

      const client = new FirebaseClient();
      const result = await client.makeRequest('example.com', '/test', 'GET');

      expect(result).toBe(textResponse);
    });

    it('should handle HTTP error with JSON error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValueOnce(
          JSON.stringify({
            error: {message: 'Not found'},
          }),
        ),
      });

      const client = new FirebaseClient();

      await expect(
        client.makeRequest('example.com', '/test', 'GET'),
      ).rejects.toThrow('HTTP 404: Not found');
    });

    it('should handle HTTP error with plain text error message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error'),
      });

      const client = new FirebaseClient();

      await expect(
        client.makeRequest('example.com', '/test', 'GET'),
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('makeDatabaseRequest', () => {
    it('should make database request with existing token', async () => {
      const mockData = {test: 'data'};
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.makeDatabaseRequest('2023-12-01', 'GET');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-project.firebaseio.com/nightly-results/2023-12-01.json?auth=existing-token',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should authenticate before making request if no token exists', async () => {
      const authResponse = {idToken: 'new-token'};
      const dataResponse = {test: 'data'};

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(authResponse)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(dataResponse)),
        });

      const client = new FirebaseClient();
      const result = await client.makeDatabaseRequest('2023-12-01', 'GET');

      expect(result).toEqual(dataResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(client.idToken).toBe('new-token');
    });

    it('should make PUT request with data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce('null'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';
      const testData = [{library: 'test', status: 'success'}];

      await client.makeDatabaseRequest('2023-12-01', 'PUT', testData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-project.firebaseio.com/nightly-results/2023-12-01.json?auth=existing-token',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        },
      );
    });
  });

  describe('storeResults', () => {
    it('should store results successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce('null'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';
      const results = [{library: 'test', status: 'success'}];

      await client.storeResults('2023-12-01', results);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-project.firebaseio.com/nightly-results/2023-12-01.json?auth=existing-token',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(results),
        },
      );
      expect(console.log).toHaveBeenCalledWith(
        'Successfully stored results for 2023-12-01',
      );
    });
  });

  describe('getResults', () => {
    it('should retrieve results successfully', async () => {
      const mockResults = [{library: 'test', status: 'success'}];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const results = await client.getResults('2023-12-01');

      expect(results).toEqual(mockResults);
    });

    it('should return null for 404 errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValueOnce('Not Found'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const results = await client.getResults('2023-12-01');

      expect(results).toBeNull();
    });

    it('should throw error for non-404 HTTP errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      await expect(client.getResults('2023-12-01')).rejects.toThrow(
        'HTTP 500: Internal Server Error',
      );
    });
  });

  describe('getLatestResults', () => {
    it('should authenticate before making requests if no token exists', async () => {
      const authResponse = {idToken: 'new-token'};
      const mockResults = [{library: 'test', status: 'success'}];

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(authResponse)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
        });

      const client = new FirebaseClient();
      const result = await client.getLatestResults('2023-12-15', 1);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-14',
      });
      expect(client.idToken).toBe('new-token');
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-14 (1 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Found results from 2023-12-14 (1 days back)',
      );
    });

    it('should find results from the previous day', async () => {
      const mockResults = [{library: 'test', status: 'success'}];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 7);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-14',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-14 (1 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Found results from 2023-12-14 (1 days back)',
      );
    });

    it('should find results from several days back', async () => {
      const mockResults = [{library: 'test', status: 'success'}];

      // Mock 404 responses for first 2 days, then success on 3rd day
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: jest.fn().mockResolvedValueOnce('Not Found'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: jest.fn().mockResolvedValueOnce('Not Found'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
        });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 7);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-12',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-14 (1 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-13 (2 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-12 (3 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Found results from 2023-12-12 (3 days back)',
      );
    });

    it('should skip empty results and continue searching', async () => {
      const mockResults = [{library: 'test', status: 'success'}];

      // Mock empty array for first day, then valid results on second day
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify([])),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
        });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 7);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-13',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-14 (1 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-13 (2 days back)...',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Found results from 2023-12-13 (2 days back)',
      );
    });

    it('should return null when no results found within maxDaysBack', async () => {
      // Mock 404 responses for all days
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 3);

      expect(result).toEqual({
        results: null,
        date: null,
      });
      expect(console.log).toHaveBeenCalledWith(
        'No previous results found within the last 3 days',
      );
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should use default maxDaysBack of 7 when not specified', async () => {
      // Mock 404 responses for all days
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15');

      expect(result).toEqual({
        results: null,
        date: null,
      });
      expect(console.log).toHaveBeenCalledWith(
        'No previous results found within the last 7 days',
      );
      expect(global.fetch).toHaveBeenCalledTimes(7);
    });

    it('should handle non-404 errors and continue searching', async () => {
      const mockResults = [{library: 'test', status: 'success'}];

      // Mock 500 error for first day, then success on second day
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: jest.fn().mockResolvedValueOnce('Internal Server Error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
        });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 7);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-13',
      });
      expect(console.log).toHaveBeenCalledWith(
        'No results found for 2023-12-14: HTTP 500: Internal Server Error',
      );
      expect(console.log).toHaveBeenCalledWith(
        'Found results from 2023-12-13 (2 days back)',
      );
    });

    it('should handle date boundaries correctly', async () => {
      const mockResults = [{library: 'test', status: 'success'}];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      // Test month boundary
      const result = await client.getLatestResults('2023-12-01', 1);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-11-30',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-11-30 (1 days back)...',
      );
    });

    it('should handle year boundary correctly', async () => {
      const mockResults = [{library: 'test', status: 'success'}];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
      });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      // Test year boundary
      const result = await client.getLatestResults('2024-01-01', 1);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-31',
      });
      expect(console.log).toHaveBeenCalledWith(
        'Checking for results on 2023-12-31 (1 days back)...',
      );
    });

    it('should handle null results and continue searching', async () => {
      const mockResults = [{library: 'test', status: 'success'}];

      // Mock null for first day, then valid results on second day
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce('null'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockResults)),
        });

      const client = new FirebaseClient();
      client.idToken = 'existing-token';

      const result = await client.getLatestResults('2023-12-15', 7);

      expect(result).toEqual({
        results: mockResults,
        date: '2023-12-13',
      });
    });
  });
});

describe('compareResults', () => {
  it('should handle null previous results', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const result = compareResults(currentResults, null);

    expect(result).toEqual({
      broken: [],
      recovered: [],
      newFailures: [{library: 'lib1', platform: 'iOS', status: 'failed'}],
    });
  });

  it('should handle undefined previous results', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
    ];

    const result = compareResults(currentResults, undefined);

    expect(result).toEqual({
      broken: [],
      recovered: [],
      newFailures: [{library: 'lib1', platform: 'iOS', status: 'failed'}],
    });
  });

  it('should identify broken tests', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([
      {
        library: 'lib1',
        platform: 'iOS',
        previousStatus: 'success',
        currentStatus: 'failed',
      },
    ]);
    expect(result.recovered).toEqual([]);
  });

  it('should identify recovered tests', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([]);
    expect(result.recovered).toEqual([
      {
        library: 'lib1',
        platform: 'iOS',
        previousStatus: 'failed',
        currentStatus: 'success',
      },
    ]);
  });

  it('should identify both broken and recovered tests', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
      {library: 'lib2', platform: 'Android', status: 'success'},
      {library: 'lib3', platform: 'iOS', status: 'success'},
    ];

    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
      {library: 'lib2', platform: 'Android', status: 'failed'},
      {library: 'lib3', platform: 'iOS', status: 'success'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([
      {
        library: 'lib1',
        platform: 'iOS',
        previousStatus: 'success',
        currentStatus: 'failed',
      },
    ]);
    expect(result.recovered).toEqual([
      {
        library: 'lib2',
        platform: 'Android',
        previousStatus: 'failed',
        currentStatus: 'success',
      },
    ]);
  });

  it('should handle tests that are not in previous results', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([
      {
        library: 'lib1',
        platform: 'iOS',
        previousStatus: 'success',
        currentStatus: 'failed',
      },
    ]);
    expect(result.recovered).toEqual([]);
  });

  it('should handle empty current results', () => {
    const currentResults = [];
    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([]);
    expect(result.recovered).toEqual([]);
  });

  it('should handle empty previous results', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'failed'},
    ];
    const previousResults = [];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([]);
    expect(result.recovered).toEqual([]);
    // When previousResults is an empty array (not null/undefined),
    // the function doesn't return newFailures property
    expect(result.newFailures).toBeUndefined();
  });

  it('should handle different status values', () => {
    const currentResults = [
      {library: 'lib1', platform: 'iOS', status: 'timeout'},
      {library: 'lib2', platform: 'Android', status: 'success'},
    ];

    const previousResults = [
      {library: 'lib1', platform: 'iOS', status: 'success'},
      {library: 'lib2', platform: 'Android', status: 'error'},
    ];

    const result = compareResults(currentResults, previousResults);

    expect(result.broken).toEqual([
      {
        library: 'lib1',
        platform: 'iOS',
        previousStatus: 'success',
        currentStatus: 'timeout',
      },
    ]);
    expect(result.recovered).toEqual([
      {
        library: 'lib2',
        platform: 'Android',
        previousStatus: 'error',
        currentStatus: 'success',
      },
    ]);
  });
});

describe('getYesterdayDate', () => {
  it("should return yesterday's date in YYYY-MM-DD format", () => {
    const mockDate = new Date('2023-12-15T10:30:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const result = getYesterdayDate();

    expect(result).toBe('2023-12-14');

    global.Date.mockRestore();
  });

  it('should handle month boundary correctly', () => {
    const mockDate = new Date('2023-12-01T10:30:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const result = getYesterdayDate();

    expect(result).toBe('2023-11-30');

    global.Date.mockRestore();
  });

  it('should handle year boundary correctly', () => {
    const mockDate = new Date('2024-01-01T10:30:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const result = getYesterdayDate();

    expect(result).toBe('2023-12-31');

    global.Date.mockRestore();
  });
});

describe('getTodayDate', () => {
  it("should return today's date in YYYY-MM-DD format", () => {
    const mockDate = new Date('2023-12-15T10:30:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const result = getTodayDate();

    expect(result).toBe('2023-12-15');

    global.Date.mockRestore();
  });

  it('should handle different times of day correctly', () => {
    const mockDate = new Date('2023-12-15T23:59:59Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const result = getTodayDate();

    expect(result).toBe('2023-12-15');

    global.Date.mockRestore();
  });
});
