# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

desired_soft_limit=2048

try_set_soft_limit() {
  if ! ulimit -Sn $desired_soft_limit; then
    # This is an unlikely error case, because we already know that the hard limit is higher than
    # the desired soft limit
    echo "ERROR: Could not set your max file limit, which means that the packager may not work."
    exit 1
  fi
}

hard_limit=$(ulimit -Hn)

if [ "$hard_limit" = 'unlimited' ]; then
  try_set_soft_limit
elif [ "$hard_limit" -ge $desired_soft_limit ]; then
   try_set_soft_limit
else
  echo "WARNING: Your max file limit is too low, and was likely previously set for this shell session." \
  "If not running as a superuser, the packager may not work." \
  "Run ulimit -Hn to see your hard file limit. Often, it will have been set in /etc/profile or your user profile" \
  "(~/.profile, ~/.bash_profile, ~/.zprofile, ~/.bashrc, etc)"
  ulimit -n $desired_soft_limit
fi
