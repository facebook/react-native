/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * This script runs instrumentation tests one by one with retries
 * Instrumentation tests tend to be flaky, so rerunning them individually increases
 * chances for success and reduces total average execution time.
 *
 * We assume that all instrumentation tests are flat in one folder
 * Available arguments:
 * --path - path to all .java files with tests
 * --package - com.facebook.react.tests
 * --retries [num] - how many times to retry possible flaky commands: npm install and running tests, default 1
 */
/*eslint-disable no-undef */

const argv = require('yargs').argv;
const async = require('async');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const test_opts = {
    FILTER: new RegExp(argv.filter || '.*', 'i'),
    PACKAGE: argv.package || 'com.facebook.react.tests',
    PATH: argv.path || './ReactAndroid/src/androidTest/java/com/facebook/react/tests',
    RETRIES: parseInt(argv.retries || 2, 10),

    OFFSET: argv.offset,
    COUNT: argv.count
}

let testClasses = fs.readdirSync(path.resolve(process.cwd(), test_opts.PATH))
    .filter((file) => {
        return file.endsWith('.java');
    }).map((clazz) => {
        return path.basename(clazz, '.java');
    }).map((clazz) => {
        return test_opts.PACKAGE + '.' + clazz;
    }).filter((clazz) => {
        return test_opts.FILTER.test(clazz);
    });

// only process subset of the tests at corresponding offset and count if args provided
if (test_opts.COUNT != null && test_opts.OFFSET != null) {
    const testCount = testClasses.length;
    const start = test_opts.COUNT * test_opts.OFFSET;
    const end = start + test_opts.COUNT;

    if (start >= testClasses.length) {
        testClasses = [];
    } else if (end >= testClasses.length) {
        testClasses = testClasses.slice(start);
    } else {
        testClasses = testClasses.slice(start, end);
    }
}

return async.eachSeries(testClasses, (clazz, callback) => {
    return async.retry(test_opts.RETRIES, (retryCb) => {
        return child_process.spawn('./scripts/run-instrumentation-tests-via-adb-shell.sh', [test_opts.PACKAGE, clazz], {
            stdio: 'inherit'
        }).on('error', retryCb).on('exit', (code) => {
            if(code !== 0) {
                return retryCb(new Error(`Process exited with code: ${code}`));
            }

            return retryCb();
        });
    }, callback);
}, (err) => {
    if (err) {
        console.error(err);
        return process.exit(1);
    }

    return process.exit(0);
});

/*eslint-enable no-undef */
