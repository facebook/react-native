# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'net/http'
require 'rexml/document'

module ReactNativeDepsSourceType
    DOWNLOAD_PREBUILD_RELEASE_TARBALL = :download_prebuild_release_tarball
end

def rndeps_source_type(version, react_native_path)
    if release_artifact_exists(version)
        return ReactNativeDepsSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
    else
        abort "[ReactNativeDependencies] Could not find a prebuilt release tarball for version #{version}."
    end
end

def podspec_source(source_type, version, react_native_path)
    case source_type
    when ReactNativeDepsSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
        return podspec_source_download_prebuild_release_tarball(react_native_path, version)
    else
        abort "[ReactNativeDependencies] Unsupported or invalid source type provided: #{source_type}"
    end
end

def podspec_source_download_prebuild_release_tarball(react_native_path, version)
    url = release_tarball_url(version, :debug)
    rndeps_log("Using tarball from URL: #{url}")
    download_stable_rndeps(react_native_path, version, :debug)
    download_stable_rndeps(react_native_path, version, :release)
    return {:http => url}
end

def release_tarball_url(version, build_type)
    maven_repo_url = "https://repo1.maven.org/maven2"
    namespace = "com/facebook/react"
    # Sample url from Maven:
    # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.79.0-rc.0/react-native-artifacts-0.79.0-rc.0-reactnative-dependencies-debug.tar.gz
    return "#{maven_repo_url}/#{namespace}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-dependencies-#{build_type.to_s}.tar.gz"
end

def download_stable_rndeps(react_native_path, version, configuration)
    tarball_url = release_tarball_url(version, configuration)
    download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
end

def download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
    destination_path = configuration == nil ?
        "#{artifacts_dir()}/rndeps-ios-#{version}.tar.gz" :
        "#{artifacts_dir()}/rndeps-ios-#{version}-#{configuration}.tar.gz"

    unless File.exist?(destination_path)
      # Download to a temporary file first so we don't cache incomplete downloads.
      tmp_file = "#{artifacts_dir()}/rndeps-ios.download"
      `mkdir -p "#{artifacts_dir()}" && curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
    end

    return destination_path
end

def release_artifact_exists(version)
    return artifact_exists(release_tarball_url(version, :debug))
end

def artifacts_dir()
    return File.join(Pod::Config.instance.project_pods_root, "ReactNativeDependencies-artifacts")
end

# This function checks that ReactNativeDependencies artifact exists.
# As of now it should check it on the Maven repo.
#
# Parameters
# - version: the version of React Native
# - build_type: debug or release
def artifact_exists(tarball_url)
    # -L is used to follow redirects, useful for the nightlies
    # I also needed to wrap the url in quotes to avoid escaping & and ?.
    return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
end

def rndeps_log(message, level = :warning)
    if !Object.const_defined?("Pod::UI")
        return
    end
    log_message = '[ReactNativeDependencies] ' + message
    case level
    when :info
        Pod::UI.puts log_message.green
    when :error
        Pod::UI.puts log_message.red
    else
        Pod::UI.puts log_message.yellow
    end
end