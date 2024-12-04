#!/bin/sh

NPM_REGISTRY=http://localhost:4873

project_root=$(cd -P "$(dirname $0)" && pwd)

set -eox pipefail

case ${1-} in
  "configure")
    yarn config set npmRegistryServer $NPM_REGISTRY
    yarn config set unsafeHttpWhitelist --json '["localhost"]'
    ;;

  "init")
    npm set registry $NPM_REGISTRY
    npx verdaccio --config $project_root/.ado/verdaccio/config.yaml &
    node $project_root/.ado/waitForVerdaccio.js
    node $project_root/.ado/npmAddUser.js user pass mail@nomail.com $NPM_REGISTRY
    ;;

  "publish")
    checkpoint=$(git rev-parse HEAD)
    cp nx.test.json nx.json
    yarn nx release version 1000.0.0
    yarn nx release publish --registry $NPM_REGISTRY
    git reset --hard $checkpoint
    ;;
esac
