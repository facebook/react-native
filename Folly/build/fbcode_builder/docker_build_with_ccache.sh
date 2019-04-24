#!/bin/bash -uex
set -o pipefail  # Be sure to `|| :` commands that are allowed to fail.

#
# Future: port this to Python if you are making significant changes.
#

# Parse command-line arguments
build_timeout=""  # Default to no time-out
print_usage() {
  echo "Usage: $0 [--build-timeout TIMEOUT_VAL] SAVE-CCACHE-TO-DIR"
  echo "SAVE-CCACHE-TO-DIR is required. An empty string discards the ccache."
}
while [[ $# -gt 0 ]]; do
  case "$1" in
  --build-timeout)
    shift
    build_timeout="$1"
    if [[ "$build_timeout" != "" ]] ; then
      timeout "$build_timeout" true  # fail early on invalid timeouts
    fi
    ;;
  -h|--help)
    print_usage
    exit
    ;;
  *)
    break
    ;;
  esac
  shift
done
# There is one required argument, but an empty string is allowed.
if [[ "$#" != 1 ]] ; then
  print_usage
  exit 1
fi
save_ccache_to_dir="$1"
if [[ "$save_ccache_to_dir" != "" ]] ; then
  mkdir -p "$save_ccache_to_dir"  # fail early if there's nowhere to save
else
  echo "WARNING: Will not save /ccache from inside the Docker container"
fi

rand_guid() {
  echo "$(date +%s)_${RANDOM}_${RANDOM}_${RANDOM}_${RANDOM}"
}

id=fbcode_builder_image_id=$(rand_guid)
logfile=$(mktemp)

echo "


Running build with timeout '$build_timeout', label $id, and log in $logfile


"

if [[ "$build_timeout" != "" ]] ; then
  # Kill the container after $build_timeout. Using `/bin/timeout` would cause
  # Docker to destroy the most recent container and lose its cache.
  (
    sleep "$build_timeout"
    echo "Build timed out after $build_timeout" 1>&2
    while true; do
      maybe_container=$(
        egrep '^( ---> Running in [0-9a-f]+|FBCODE_BUILDER_EXIT)$' "$logfile" |
          tail -n 1 | awk '{print $NF}'
      )
      if [[ "$maybe_container" == "FBCODE_BUILDER_EXIT" ]] ; then
        echo "Time-out successfully terminated build" 1>&2
        break
      fi
      echo "Time-out: trying to kill $maybe_container" 1>&2
      # This kill fail if we get unlucky, try again soon.
      docker kill "$maybe_container" || sleep 5
    done
  ) &
fi

build_exit_code=0
# `docker build` is allowed to fail, and `pipefail` means we must check the
# failure explicitly.
if ! docker build --label="$id" . 2>&1 | tee "$logfile" ; then
  build_exit_code="${PIPESTATUS[0]}"
  # NB: We are going to deliberately forge ahead even if `tee` failed.
  # If it did, we have a problem with tempfile creation, and all is sad.
  echo "Build failed with code $build_exit_code, trying to save ccache" 1>&2
fi
# Stop trying to kill the container.
echo $'\nFBCODE_BUILDER_EXIT' >> "$logfile"

if [[ "$save_ccache_to_dir" == "" ]] ; then
  echo "Not inspecting Docker build, since saving the ccache wasn't requested."
  exit "$build_exit_code"
fi

img=$(docker images --filter "label=$id" -a -q)
if [[ "$img" == "" ]] ; then
  docker images -a
  echo "In the above list, failed to find most recent image with $id" 1>&2
  # Usually, the above `docker kill` will leave us with an up-to-the-second
  # container, from which we can extract the cache.  However, if that fails
  # for any reason, this loop will instead grab the latest available image.
  #
  # It's possible for this log search to get confused due to the output of
  # the build command itself, but since our builds aren't **trying** to
  # break cache, we probably won't randomly hit an ID from another build.
  img=$(
    egrep '^ ---> (Running in [0-9a-f]+|[0-9a-f]+)$' "$logfile" | tac |
      sed 's/Running in /container_/;s/ ---> //;' | (
        while read -r x ; do
          # Both docker commands below print an image ID to stdout on
          # success, so we just need to know when to stop.
          if [[ "$x" =~ container_.* ]] ; then
            if docker commit "${x#container_}" ; then
              break
            fi
          elif docker inspect --type image -f '{{.Id}}' "$x" ; then
            break
          fi
        done
      )
  )
  if [[ "$img" == "" ]] ; then
    echo "Failed to find valid container or image ID in log $logfile" 1>&2
    exit 1
  fi
elif [[ "$(echo "$img" | wc -l)" != 1 ]] ; then
  # Shouldn't really happen, but be explicit if it does.
  echo "Multiple images with label $id, taking the latest of:"
  echo "$img"
  img=$(echo "$img" | head -n 1)
fi

container_name="fbcode_builder_container_$(rand_guid)"
echo "Starting $container_name from latest image of the build with $id --"
echo "$img"

# ccache collection must be done outside of the Docker build steps because
# we need to be able to kill it on timeout.
#
# This step grows the max cache size to slightly exceed than the working set
# of a successful build.  This simple design persists the max size in the
# cache directory itself (the env var CCACHE_MAXSIZE does not even work with
# older ccaches like the one on 14.04).
#
# Future: copy this script into the Docker image via Dockerfile.
(
  # By default, fbcode_builder creates an unsigned image, so the `docker
  # run` below would fail if DOCKER_CONTENT_TRUST were set.  So we unset it
  # just for this one run.
  export DOCKER_CONTENT_TRUST=
  # CAUTION: The inner bash runs without -uex, so code accordingly.
  docker run --user root --name "$container_name" "$img" /bin/bash -c '
    build_exit_code='"$build_exit_code"'

    # Might be useful if debugging whether max cache size is too small?
    grep " Cleaning up cache directory " /tmp/ccache.log

    export CCACHE_DIR=/ccache
    ccache -s

    echo "Total bytes in /ccache:";
    total_bytes=$(du -sb /ccache | awk "{print \$1}")
    echo "$total_bytes"

    echo "Used bytes in /ccache:";
    used_bytes=$(
      du -sb $(find /ccache -type f -newermt @$(
        cat /FBCODE_BUILDER_CCACHE_START_TIME
      )) | awk "{t += \$1} END {print t}"
    )
    echo "$used_bytes"

    # Goal: set the max cache to 750MB over 125% of the usage of a
    # successful build.  If this is too small, it takes too long to get a
    # cache fully warmed up.  Plus, ccache cleans 100-200MB before reaching
    # the max cache size, so a large margin is essential to prevent misses.
    desired_mb=$(( 750 + used_bytes / 800000 )) # 125% in decimal MB: 1e6/1.25
    if [[ "$build_exit_code" != "0" ]] ; then
      # For a bad build, disallow shrinking the max cache size. Instead of
      # the max cache size, we use on-disk size, which ccache keeps at least
      # 150MB under the actual max size, hence the 400MB safety margin.
      cur_max_mb=$(( 400 + total_bytes / 1000000 ))  # ccache uses decimal MB
      if [[ "$desired_mb" -le "$cur_max_mb" ]] ; then
        desired_mb=""
      fi
    fi

    if [[ "$desired_mb" != "" ]] ; then
      echo "Updating cache size to $desired_mb MB"
      ccache -M "${desired_mb}M"
      ccache -s
    fi

    # Subshell because `time` the binary may not be installed.
    if (time tar czf /ccache.tgz /ccache) ; then
      ls -l /ccache.tgz
    else
      # This `else` ensures we never overwrite the current cache with
      # partial data in case of error, even if somebody adds code below.
      rm /ccache.tgz
      exit 1
    fi
    '
)

echo "Updating $save_ccache_to_dir/ccache.tgz"
# This will not delete the existing cache if `docker run` didn't make one
docker cp "$container_name:/ccache.tgz" "$save_ccache_to_dir/"

# Future: it'd be nice if Travis allowed us to retry if the build timed out,
# since we'll make more progress thanks to the cache.  As-is, we have to
# wait for the next commit to land.
echo "Build exited with code $build_exit_code"
exit "$build_exit_code"
