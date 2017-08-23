#!/bin/bash

set -e

cachedir="$HOME/.rncache"
mkdir -p "$cachedir"

function fetch_and_unpack () {
    file=$1
    url=$2
    cmd=$3

    if [ ! -f "$cachedir/$file" ]; then
        (cd "$cachedir"; curl -J -L -O "$url")
    fi

    dir=$(basename "$file" .tar.gz)
    if [ ! -d "third-party/$dir" ]; then
        (cd third-party;
         echo Unpacking "$cachedir/$file"...
         if ! tar zxf "$cachedir/$file"; then
             echo "Unpacking '$cachedir/$file' failed.  Debug info:" 2>&1
             ls -l "$cachedir/$file" 2>&1
             shasum ~/.rncache/boost_1_63_0.tar.gz 2>&1
             exit 1
         fi
         cd "$dir"
         eval "${cmd:-true}")
    fi
}

mkdir -p third-party

SCRIPTDIR=$(dirname "$0")

fetch_and_unpack glog-0.3.4.tar.gz https://github.com/google/glog/archive/v0.3.4.tar.gz "\"$SCRIPTDIR/ios-configure-glog.sh\""
fetch_and_unpack double-conversion-1.1.5.tar.gz https://github.com/google/double-conversion/archive/v1.1.5.tar.gz
fetch_and_unpack boost_1_63_0.tar.gz https://github.com/react-native-community/boost-for-react-native/releases/download/v1.63.0-0/boost_1_63_0.tar.gz
fetch_and_unpack folly-2016.09.26.00.tar.gz https://github.com/facebook/folly/archive/v2016.09.26.00.tar.gz
