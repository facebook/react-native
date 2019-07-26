#!/bin/bash

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$THIS_DIR/setup.sh"

buck test fbsource//xplat/hermes-inspector:chrome &&
  buck test fbsource//xplat/hermes-inspector:detail &&
  buck test fbsource//xplat/hermes-inspector:inspectorlib &&
  buck build fbsource//xplat/hermes-inspector:hermes-chrome-debug-server
