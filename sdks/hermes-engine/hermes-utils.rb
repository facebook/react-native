# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'net/http'
require 'rexml/document'

# This function downloads the nightly prebuilt version of Hermes based on the passed version
# and save it in the node_module/react_native/sdks/downloads folder
# It then returns the path to the hermes tarball
#
# Parameters
# - react_native_path: the path to the React Native folder in node modules. It is used as root path to store the Hermes tarball
# - version: the version of React Native that requires the Hermes tarball
# Returns: the path to the downloaded Hermes tarball
def download_nightly_hermes(react_native_path, version)
    params = "r=snapshots\&g=com.facebook.react\&a=react-native-artifacts\&c=hermes-ios-debug\&e=tar.gz\&v=#{version}-SNAPSHOT"
    tarball_url = "http://oss.sonatype.org/service/local/artifact/maven/redirect\?#{params}"

    destination_folder = "#{react_native_path}/sdks/downloads"
    destination_path = "#{destination_folder}/hermes-ios.tar.gz"

    `mkdir -p "#{destination_folder}" && curl "#{tarball_url}" -Lo "#{destination_path}"`
    return destination_path
end
