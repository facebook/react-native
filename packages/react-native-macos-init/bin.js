#!/usr/bin/env node

/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * @format
 */

// Yarn will fail to link workspace binaries if they haven't been built yet. Add
// a simple JS file to forward to the CLI which is built after install.
require('./lib-commonjs/cli');
