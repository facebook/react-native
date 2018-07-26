/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

const argv = require('yargs').argv;
const async = require('async');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
};

const test_opts = {
    FILTER: new RegExp(argv.filter || '.*', 'i'),
    IGNORE: argv.ignore || null,
    PACKAGE: argv.package || 'com.facebook.react.tests',
    PATH: argv.path || './ReactAndroid/src/androidTest/java/com/facebook/react/tests',
    RETRIES: parseInt(argv.retries || 2, 10),

    TEST_TIMEOUT: parseInt(argv['test-timeout'] || 1000 * 60 * 10),

    OFFSET: argv.offset,
    COUNT: argv.count,
};

let max_test_class_length = Number.NEGATIVE_INFINITY;

let testClasses = fs.readdirSync(path.resolve(process.cwd(), test_opts.PATH))
    .filter((file) => {
        return file.endsWith('.java');
    }).map((clazz) => {
        return path.basename(clazz, '.java');
    });

if (test_opts.IGNORE) {
    test_opts.IGNORE = new RegExp(test_opts.IGNORE, 'i');
    testClasses = testClasses.filter(className => {
        return !test_opts.IGNORE.test(className);
    });
}

testClasses = testClasses.map((clazz) => {
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

return async.mapSeries(testClasses, (clazz, callback) => {
    if (clazz.length > max_test_class_length) {
        max_test_class_length = clazz.length;
    }

    return async.retry(test_opts.RETRIES, (retryCb) => {
        const test_process = child_process.spawn('./ContainerShip/scripts/run-instrumentation-tests-via-adb-shell.sh', [test_opts.PACKAGE, clazz], {
            stdio: 'inherit',
        });

        const timeout = setTimeout(() => {
            test_process.kill();
        }, test_opts.TEST_TIMEOUT);

        test_process.on('error', (err) => {
            clearTimeout(timeout);
            retryCb(err);
        });

        test_process.on('exit', (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
                return retryCb(new Error(`Process exited with code: ${code}`));
            }

            return retryCb();
        });
    }, (err) => {
        return callback(null, {
            name: clazz,
            status: err ? 'failure' : 'success',
        });
    });
}, (err, results) => {
    print_test_suite_results(results);

    const failures = results.filter((test) => {
        return test.status === 'failure';
    });

    return failures.length === 0 ? process.exit(0) : process.exit(1);
});

function print_test_suite_results(results) {
    console.log('\n\nTest Suite Results:\n');

    let color;
    let failing_suites = 0;
    let passing_suites = 0;

    function pad_output(num_chars) {
        let i = 0;

        while (i < num_chars) {
            process.stdout.write(' ');
            i++;
        }
    }
    results.forEach((test) => {
        if (test.status === 'success') {
            color = colors.GREEN;
            passing_suites++;
        } else if (test.status === 'failure') {
            color = colors.RED;
            failing_suites++;
        }

        process.stdout.write(color);
        process.stdout.write(test.name);
        pad_output((max_test_class_length - test.name.length) + 8);
        process.stdout.write(test.status);
        process.stdout.write(`${colors.RESET}\n`);
    });

    console.log(`\n${passing_suites} passing, ${failing_suites} failing!`);
}
