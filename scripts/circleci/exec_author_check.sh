#!/bin/bash
<<<<<<< HEAD

=======
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
>>>>>>> v0.58.6
# This is meant to be used to keep failing tests from
# running for regular contributors, while still letting
# them run on PRs submitted by core contributors.
# Useful when working to bring a failing step back to green.

# Add yourself here if you'd like to pass the whitelist.
# Once N > 1 we should change this into an array check.
<<<<<<< HEAD
echo "Skipping" "$@" ", branch is stable"
=======
if [ "$CIRCLE_USERNAME" == "hramos" ]; then
  # execute command
  "$@"
else
  echo "Skipping" "$@" ", user is not whitelisted"
fi
>>>>>>> v0.58.6
