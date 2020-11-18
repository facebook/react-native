#!/bin/bash
set -ex

# Script used by the Azure DevOps build agent to start the verdaccio npm proxy server

THIS_DIR=$PWD

COMMAND="$TMPDIR/launchVerdaccio.command"
echo "cd ${THIS_DIR}; verdaccio --config ./.ado/verdaccio/config.yaml &> ./.ado/verdaccio/console.log" > "$COMMAND"
chmod +x "$COMMAND"
open "$COMMAND"
