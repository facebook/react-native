#!/bin/bash

cachedir="$HOME/.rncache"
mkdir -p "$cachedir"

function file_fail () {
    cachefile=$1
    msg=$2

    echo "$msg.  Debug info:" 2>&1
    ls -l "$cachefile" 2>&1
    shasum "$cachefile" 2>&1
    exit 1
}

function fetch_and_unpack () {
    file=$1
    url=$2
    hash=$3
    cmd=$4

    retries=4
    fetched=no

    while true; do
        if [ -f "$cachedir/$file" ]; then
           if shasum -p "$cachedir/$file" |
              awk -v hash="$hash" '{exit $1 != hash}'; then
               break
           else
               echo "Incorrect hash:" 2>&1
               shasum -p "$cachedir/$file" 2>&1
               echo "Retrying..." 2>&1
           fi
        fi

        (( retries = retries - 1 ))
        if (( retries < 0 )); then
            file_fail "$cachedir/$file" "Failed to successfully download '$file'"
        fi

        rm -f "$cachedir/$file"
        (cd "$cachedir"; curl -J -L -O "$url")
        fetched=yes
    done

    dir=$(basename "$file" .tar.gz)
    if [ "$fetched" = "yes" ] || [ ! -d "third-party/$dir" ]; then
        (cd third-party;
         rm -rf "$dir"
         echo Unpacking "$cachedir/$file"...
         if ! tar zxf "$cachedir/$file"; then
             file_fail "$cachedir/$file" "Unpacking '$cachedir/$file' failed"
         fi
         cd "$dir"
         eval "${cmd:-true}")
    fi
}

mkdir -p third-party

SCRIPTDIR=$(dirname "$0")

fetch_and_unpack glog-0.3.5.tar.gz https://github.com/google/glog/archive/v0.3.5.tar.gz 61067502c5f9769d111ea1ee3f74e6ddf0a5f9cc "\"$SCRIPTDIR/ios-configure-glog.sh\""
fetch_and_unpack double-conversion-1.1.6.tar.gz https://github.com/google/double-conversion/archive/v1.1.6.tar.gz 1c7d88afde3aaeb97bb652776c627b49e132e8e0
fetch_and_unpack boost_1_63_0.tar.gz https://github.com/react-native-community/boost-for-react-native/releases/download/v1.63.0-0/boost_1_63_0.tar.gz c3f57e1d22a995e608983effbb752b54b6eab741
fetch_and_unpack folly-2016.10.31.00.tar.gz https://github.com/facebook/folly/archive/v2016.10.31.00.tar.gz fb8cdf8962d8c9d0c20a150b6ec3b75d1fa50696
