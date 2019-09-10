#!/bin/bash
set -e
set -u

exec buck query "filter('generated_objcpp_modules_tests_', '//xplat/js/...')" | xargs buck build
