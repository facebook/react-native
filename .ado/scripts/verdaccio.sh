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
    yarn set-version 1000.0.0-pr
    git commit --all --message 'bump' --no-verify
    packages=()
    for json in $(yarn workspaces list --no-private --json); do
      packages+=(--package $(node --print "JSON.parse('$json').name"))
    done
    npx beachball change --no-fetch --type patch --message 'bump for testing purposes' ${packages[@]}
    npx beachball $* --no-push --registry $NPM_REGISTRY --yes --access public --no-generate-changelog
    git reset --hard $checkpoint
    ;;
esac
