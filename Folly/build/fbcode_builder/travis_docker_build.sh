#!/bin/bash -uex
# .travis.yml in the top-level dir explains why this is a separate script.
# Read the docs: ./make_docker_context.py --help

os_image=${os_image?Must be set by Travis}
gcc_version=${gcc_version?Must be set by Travis}
make_parallelism=${make_parallelism:-4}
# ccache is off unless requested
travis_cache_dir=${travis_cache_dir:-}
# The docker build never times out, unless specified
docker_build_timeout=${docker_build_timeout:-}

cur_dir="$(readlink -f "$(dirname "$0")")"

if [[ "$travis_cache_dir" == "" ]]; then
  echo "ccache disabled, enable by setting env. var. travis_cache_dir"
  ccache_tgz=""
elif [[ -e "$travis_cache_dir/ccache.tgz" ]]; then
  ccache_tgz="$travis_cache_dir/ccache.tgz"
else
  echo "$travis_cache_dir/ccache.tgz does not exist, starting with empty cache"
  ccache_tgz=$(mktemp)
  tar -T /dev/null -czf "$ccache_tgz"
fi

docker_context_dir=$(
  cd "$cur_dir/.."  # Let the script find our fbcode_builder_config.py
  "$cur_dir/make_docker_context.py" \
    --os-image "$os_image" \
    --gcc-version "$gcc_version" \
    --make-parallelism "$make_parallelism" \
    --local-repo-dir "$cur_dir/../.." \
    --ccache-tgz "$ccache_tgz"
)
cd "${docker_context_dir?Failed to make Docker context directory}"

# Make it safe to iterate on the .sh in the tree while the script runs.
cp "$cur_dir/docker_build_with_ccache.sh" .
exec ./docker_build_with_ccache.sh \
  --build-timeout "$docker_build_timeout" \
  "$travis_cache_dir"
