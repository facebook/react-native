THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

source "$THIS_DIR/.packager.env"
cd $PROJECT_ROOT
$REACT_NATIVE_PATH/cli.js start

if [[ -z "$CI" ]]; then
  echo "Process terminated. Press <enter> to close the window"
  read -r
fi
