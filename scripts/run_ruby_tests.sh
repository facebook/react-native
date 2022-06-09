#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -f

basepath=$(dirname "${0}")

# shellcheck disable=SC2207
files=( $(find . -name '*-test.rb') )

test_suite="${basepath}/all_tests.rb"
touch "${test_suite}"

echo "require \"test/unit\"" > "${test_suite}"
echo "discovered the following files:"
for i in "${files[@]}"
do
    filename="${i#"${basepath}/"}"
    echo "${filename}"
    echo "require_relative \"${filename}\"" >> "${test_suite}"
done

ruby -Itest "${test_suite}"
RES=$?
rm "${test_suite}"
exit $RES
