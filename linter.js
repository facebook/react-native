// Copyright 2012-present Facebook. All Rights Reserved.
'use strict';

var transformSource = require('./jestSupport/scriptPreprocess.js').transformSource;
var linterTransform = require('./lint/linterTransform');

linterTransform.setLinterTransform(transformSource);

// Run the original CLI
require('eslint/bin/eslint');
