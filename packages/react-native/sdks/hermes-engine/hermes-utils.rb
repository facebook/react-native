# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'net/http'
require 'rexml/document'

# This function abort the build if the `HERMES_ENGINE_TARBALL_PATH` ENV variable is set with an invalid path
def abort_if_invalid_tarball_provided!()
    if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH') && !File.exist?(ENV['HERMES_ENGINE_TARBALL_PATH'])
        abort "[Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: \"#{ENV['HERMES_ENGINE_TARBALL_PATH']}\"\nIf you don't want to use tarball, run `unset HERMES_ENGINE_TARBALL_PATH`"
    end
end

# It computes the right value for the hermes-engine.podspec's source.
# - To use a specific tarball, install the dependencies with:
# `HERMES_ENGINE_TARBALL_PATH=<path_to_tarball> bundle exec pod install`
# - To force a build from source, install the dependencies with:
# `RCT_BUILD_HERMES_FROM_SOURCE=true bundle exec pod install`
# If none of the two are provided, Cocoapods will check whether there is a tarball for the current version
# (either release or nightly). If not, it will fall back building from source (the latest commit on main).
#
# Parameters:
# - build_from_source: boolean to force a build from source.
# - hermestag_file: path to the hermes tag file.
# - git: uri to the hermes repository
# - version: current version of the pod
# - build_type: build type of the hermes engine. It can be `:release` or `:debug`
# - react_native_path: path to react native
#
# Returns: a properly configured source object
def compute_hermes_source(build_from_source, hermestag_file, git, version, build_type, react_native_path)
    source = {}

    if ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
        use_tarball(source)
    elsif build_from_source
        if File.exist?(hermestag_file)
            build_from_tagfile(source, git, hermestag_file)
        else
            build_hermes_from_source(source, git)
        end
    elsif hermes_artifact_exists(release_tarball_url(version, build_type))
        use_release_tarball(source, version, build_type)
    elsif hermes_artifact_exists(nightly_tarball_url(version).gsub("\\", ""))
        use_nightly_tarball(source, react_native_path, version)
    else
        build_hermes_from_source(source, git)
    end

    return source
end

def use_tarball(source)
    tarball_path = ENV['HERMES_ENGINE_TARBALL_PATH']
    putsIfPodPresent("[Hermes] Using pre-built Hermes binaries from local path: #{tarball_path}")
    source[:http] = "file://#{tarball_path}"
end

def build_from_tagfile(source, git, hermestag_file)
    hermestag = File.read(hermestag_file).strip
    putsIfPodPresent("[Hermes] Building Hermes from source from tag #{hermestag}...")
    source[:git] = git
    source[:tag] = hermestag
end

def use_release_tarball(source, version, build_type)
    # Sample url from Maven:
    # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.71.0/react-native-artifacts-0.71.0-hermes-ios-debug.tar.gz
    putsIfPodPresent('[Hermes] Using the release tarball from Maven Central', 'info')
    source[:http] = release_tarball_url(version, build_type)
end

def release_tarball_url(version, build_type)
    return "https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/#{version}/react-native-artifacts-#{version}-hermes-ios-#{build_type.to_s}.tar.gz"
end

def use_nightly_tarball(source, react_native_path, version)
    putsIfPodPresent('[Hermes] Nightly version, download pre-built for Hermes')
    destination_path = download_nightly_hermes(react_native_path, version)
    # set tarball as hermes engine
    source[:http] = "file://#{destination_path}"
end

def putsIfPodPresent(message, level = 'warning')
    unless Object.const_defined?("Pod::UI")
        return
    end

    case level
    when 'info'
        Pod::UI.puts message.green
    when 'error'
        Pod::UI.puts message.red
    else
        Pod::UI.puts message.yellow
    end
end

# This function downloads the nightly prebuilt version of Hermes based on the passed version
# and save it in the node_module/react_native/sdks/downloads folder
# It then returns the path to the hermes tarball
#
# Parameters
# - react_native_path: the path to the React Native folder in node modules. It is used as root path to store the Hermes tarball
# - version: the version of React Native that requires the Hermes tarball
# Returns: the path to the downloaded Hermes tarball
def download_nightly_hermes(react_native_path, version)
    tarball_url = nightly_tarball_url(version)

    destination_folder = "#{react_native_path}/sdks/downloads"
    destination_path = "#{destination_folder}/hermes-ios-#{version}.tar.gz"

    unless File.exist?(destination_path)
      # Download to a temporary file first so we don't cache incomplete downloads.
      tmp_file = "#{destination_folder}/hermes-ios.download"
      `mkdir -p "#{destination_folder}" && curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
    end
    return destination_path
end

def nightly_tarball_url(version)
    params = "r=snapshots\&g=com.facebook.react\&a=react-native-artifacts\&c=hermes-ios-debug\&e=tar.gz\&v=#{version}-SNAPSHOT"
    return "http://oss.sonatype.org/service/local/artifact/maven/redirect\?#{params}"
end

def build_hermes_from_source(source, git)
    putsIfPodPresent('[Hermes] Installing hermes-engine may take slightly longer, building Hermes compiler from source...')
    source[:git] = git
    source[:commit] = `git ls-remote https://github.com/facebook/hermes main | cut -f 1`.strip
end

# This function checks that Hermes artifact exists.
# As of now it should check it on the Maven repo.
#
# Parameters
# - version: the version of React Native
# - build_type: debug or release
def hermes_artifact_exists(tarball_url)
    # -L is used to follow redirects, useful for the nightlies
    # I also needed to wrap the url in quotes to avoid escaping & and ?.
    return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
end
