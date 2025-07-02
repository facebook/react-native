# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'net/http'
require 'rexml/document'
require 'open3' # [macOS]
require 'json' # [macOS]
require 'tmpdir' # [macOS]

HERMES_GITHUB_URL = "https://github.com/facebook/hermes.git"
ENV_BUILD_FROM_SOURCE = "RCT_BUILD_HERMES_FROM_SOURCE"

module HermesEngineSourceType
    LOCAL_PREBUILT_TARBALL = :local_prebuilt_tarball
    DOWNLOAD_PREBUILD_RELEASE_TARBALL = :download_prebuild_release_tarball
    DOWNLOAD_PREBUILT_NIGHTLY_TARBALL = :download_prebuilt_nightly_tarball
    BUILD_FROM_GITHUB_COMMIT = :build_from_github_commit
    BUILD_FROM_GITHUB_TAG = :build_from_github_tag
    BUILD_FROM_GITHUB_MAIN = :build_from_github_main
    BUILD_FROM_LOCAL_SOURCE_DIR = :build_from_local_source_dir

    def HermesEngineSourceType.isPrebuilt(source_type)
        return source_type == LOCAL_PREBUILT_TARBALL || source_type == DOWNLOAD_PREBUILD_RELEASE_TARBALL || source_type == DOWNLOAD_PREBUILT_NIGHTLY_TARBALL
    end

    def HermesEngineSourceType.isFromSource(source_type)
        return source_type == BUILD_FROM_GITHUB_COMMIT || source_type == BUILD_FROM_GITHUB_TAG || source_type == BUILD_FROM_GITHUB_MAIN || source_type == BUILD_FROM_LOCAL_SOURCE_DIR
    end
end

# Computes the hermes-engine.podspec's source type.
# - To use a specific tarball, install the dependencies with:
# `HERMES_ENGINE_TARBALL_PATH=<path_to_tarball> bundle exec pod install`
# - To force a build from source, install the dependencies with:
# `RCT_BUILD_HERMES_FROM_SOURCE=true bundle exec pod install`
# If none of the two are provided, Cocoapods will check whether there is a tarball for the current version
# (either release or nightly). If not, it will fall back to building from source (the latest commit on main).
#
# Parameters:
# - version: current version of the pod
# - react_native_path: path to react native
#

# Returns: hermes-engine source type
def hermes_source_type(version, react_native_path)
    if override_hermes_dir_envvar_defined()
        return HermesEngineSourceType::BUILD_FROM_LOCAL_SOURCE_DIR
    end

    if hermes_engine_tarball_envvar_defined()
        return HermesEngineSourceType::LOCAL_PREBUILT_TARBALL
    end

    if hermes_commit_envvar_defined()
        return HermesEngineSourceType::BUILD_FROM_GITHUB_COMMIT
    end

    if force_build_from_tag(react_native_path)
        return HermesEngineSourceType::BUILD_FROM_GITHUB_TAG
    end

    if force_build_from_main(react_native_path)
        return HermesEngineSourceType::BUILD_FROM_GITHUB_MAIN
    end

    if release_artifact_exists(version)
        return HermesEngineSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
    end

    if nightly_artifact_exists(version)
        return HermesEngineSourceType::DOWNLOAD_PREBUILT_NIGHTLY_TARBALL
    end

    return HermesEngineSourceType::BUILD_FROM_GITHUB_MAIN
end

def override_hermes_dir_envvar_defined()
    return ENV.has_key?('REACT_NATIVE_OVERRIDE_HERMES_DIR')
end

def hermes_engine_tarball_envvar_defined()
    return ENV.has_key?('HERMES_ENGINE_TARBALL_PATH')
end

def hermes_commit_envvar_defined()
    return ENV.has_key?('HERMES_COMMIT')
end

def force_build_from_tag(react_native_path)
    return ENV[ENV_BUILD_FROM_SOURCE] === 'true' && File.exist?(hermestag_file(react_native_path))
end

def force_build_from_main(react_native_path)
    return ENV[ENV_BUILD_FROM_SOURCE] === 'true' && !File.exist?(hermestag_file(react_native_path))
end

def release_artifact_exists(version)
    return hermes_artifact_exists(release_tarball_url(version, :debug))
end

def nightly_artifact_exists(version)
    return hermes_artifact_exists(nightly_tarball_url(version).gsub("\\", ""))
end

def podspec_source(source_type, version, react_native_path)
    case source_type
    when HermesEngineSourceType::BUILD_FROM_LOCAL_SOURCE_DIR
        return podspec_source_build_from_local_source_dir(react_native_path)
    when HermesEngineSourceType::LOCAL_PREBUILT_TARBALL
        return podspec_source_local_prebuilt_tarball()
    when HermesEngineSourceType::BUILD_FROM_GITHUB_COMMIT
        return podspec_source_build_from_github_commit()
    when HermesEngineSourceType::BUILD_FROM_GITHUB_TAG
        return podspec_source_build_from_github_tag(react_native_path)
    when HermesEngineSourceType::BUILD_FROM_GITHUB_MAIN
        return podspec_source_build_from_github_main()
    when HermesEngineSourceType::DOWNLOAD_PREBUILD_RELEASE_TARBALL
        return podspec_source_download_prebuild_release_tarball(react_native_path, version)
    when HermesEngineSourceType::DOWNLOAD_PREBUILT_NIGHTLY_TARBALL
        return podspec_source_download_prebuilt_nightly_tarball(version)
    else
        abort "[Hermes] Unsupported or invalid source type provided: #{source_type}"
    end
end

def podspec_source_build_from_local_source_dir(react_native_path)
    source_dir_path = ENV['REACT_NATIVE_OVERRIDE_HERMES_DIR']
    if Dir.exist?(source_dir_path)
        hermes_log("Using source code from local path: #{source_dir_path}")
        tarball_path = File.join(artifacts_dir(), "hermes-engine-from-local-source-dir.tar.gz")
        exclude_paths = [
            "__tests__",
            "./external/flowtest",
            "./external/esprima/test_fixtures"
        ]
        .map {|path| "--exclude=#{path}"}
        .join(' ')
        tar_command = "tar #{exclude_paths} -czvf #{tarball_path} -C #{source_dir_path} . 2> /dev/null"
        success = system(tar_command)
        if !success
            abort "Failed to create a tarball with the contents of \"#{source_dir_path}\""
        end
        return {:http => "file://#{tarball_path}"}
    else
        abort <<-EOS
        [Hermes] REACT_NATIVE_OVERRIDE_HERMES_DIR is set, but points to a non-existing directory: \"#{source_dir_path}\"
        If you don't want to use local source, run `unset REACT_NATIVE_OVERRIDE_HERMES_DIR`
        EOS
    end
end

def podspec_source_local_prebuilt_tarball()
    tarball_path = ENV['HERMES_ENGINE_TARBALL_PATH']
    if File.exist?(tarball_path)
        hermes_log("Using pre-built binary from local path defined by HERMES_ENGINE_TARBALL_PATH envvar: #{tarball_path}")
        return {:http => "file://#{tarball_path}"}
    end
    abort <<-EOS
    [Hermes] HERMES_ENGINE_TARBALL_PATH is set, but points to a non-existing file: \"#{tarball_path}\"
    If you don't want to use tarball, run `unset HERMES_ENGINE_TARBALL_PATH`
    EOS
end

def podspec_source_build_from_github_commit()
    commit = ENV['HERMES_COMMIT']
    hermes_log("Using commit defined by HERMES_COMMIT envvar: #{commit}")
    return {:git => HERMES_GITHUB_URL, :commit => commit}
end

def podspec_source_build_from_github_tag(react_native_path)
    tag = File.read(hermestag_file(react_native_path)).strip
    hermes_log("Using tag difined in sdks/.hermesversion: #{tag}")
    return {:git => HERMES_GITHUB_URL, :tag => tag}
end

def podspec_source_build_from_github_main()
    # hermes_log("Using the latest commit from main.")
    # return {:git => HERMES_GITHUB_URL, :commit => `git ls-remote #{HERMES_GITHUB_URL} main | cut -f 1`.strip}

    # [macOS
    # The logic for this is a bit different on macOS.
    # Since react-native-macos lags slightly behind facebook/react-native, we can't always use
    # the latest Hermes commit because Hermes and JSI don't always guarantee backwards compatibility.
    # Instead, we take the commit hash of Hermes at the time of the merge base with facebook/react-native.
    commit = hermes_commit_at_merge_base()
    hermes_log("Using Hermes commit from the merge base with facebook/react-native: #{commit}")
    return {:git => HERMES_GITHUB_URL, :commit => commit}
    # macOS]
end

def podspec_source_download_prebuild_release_tarball(react_native_path, version)
    url = release_tarball_url(version, :debug)
    hermes_log("Using release tarball from URL: #{url}")
    download_stable_hermes(react_native_path, version, :debug)
    download_stable_hermes(react_native_path, version, :release)
    return {:http => url}
end

def podspec_source_download_prebuilt_nightly_tarball(version)
    url = nightly_tarball_url(version)
    hermes_log("Using nightly tarball from URL: #{url}")
    return {:http => url}
end

# HELPERS

def artifacts_dir()
    return File.join(Pod::Config.instance.project_pods_root, "hermes-engine-artifacts")
end

# [macOS
def hermes_commit_at_merge_base()
    # We don't need ls-remote because react-native-macos is a fork of facebook/react-native
    fetch_result = `git fetch -q https://github.com/facebook/react-native.git`
    if $?.exitstatus != 0
        abort <<-EOS
        [Hermes] Failed to fetch facebook/react-native into the local repository.
        EOS
    end

    merge_base = `git merge-base FETCH_HEAD HEAD`.strip
    if merge_base.empty?
        abort <<-EOS
        [Hermes] Unable to find the merge base between our HEAD and upstream's HEAD.
        EOS
    end

    timestamp = `git show -s --format=%ci #{merge_base}`.strip
    if timestamp.empty?
        abort <<-EOS
        [Hermes] Unable to extract the timestamp for the merge base (#{merge_base}).
        EOS
    end

    commit = nil
    Dir.mktmpdir do |tmpdir|
        hermes_git_dir = File.join(tmpdir, "hermes.git")
        # Unfortunately we can't use git rev-list on HERMES_GITHUB_URL directly since we're not in that repo.
        # Instead, we create a shallow clone to avoid downloading the entire history.
        `git clone -q --bare --shallow-since="#{timestamp}" #{HERMES_GITHUB_URL} "#{hermes_git_dir}"`
        `git --git-dir="#{hermes_git_dir}" fetch -q --deepen=1`

        # If all goes well, this will be the commit hash of Hermes at the time of the merge base
        commit = `git --git-dir="#{hermes_git_dir}" rev-list -1 --before="#{timestamp}" HEAD`.strip
        if commit.empty?
            abort <<-EOS
            [Hermes] Unable to find the Hermes commit hash at time #{timestamp}.
            EOS
        end
    end

    return commit
end
# macOS]

def hermestag_file(react_native_path)
    return File.join(react_native_path, "sdks", ".hermesversion")
end

def release_tarball_url(version, build_type)
    # Sample url from Maven:
    # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.71.0/react-native-artifacts-0.71.0-hermes-ios-debug.tar.gz
    return "https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/#{version}/react-native-artifacts-#{version}-hermes-ios-#{build_type.to_s}.tar.gz"
end

def download_stable_hermes(react_native_path, version, configuration)
    tarball_url = release_tarball_url(version, configuration)
    download_hermes_tarball(react_native_path, tarball_url, version, configuration)
end

def download_hermes_tarball(react_native_path, tarball_url, version, configuration)
    destination_path = configuration == nil ?
        "#{artifacts_dir()}/hermes-ios-#{version}.tar.gz" :
        "#{artifacts_dir()}/hermes-ios-#{version}-#{configuration}.tar.gz"

    unless File.exist?(destination_path)
      # Download to a temporary file first so we don't cache incomplete downloads.
      tmp_file = "#{artifacts_dir()}/hermes-ios.download"
      `mkdir -p "#{artifacts_dir()}" && curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
    end
    return destination_path
end

def nightly_tarball_url(version)
    params = "r=snapshots\&g=com.facebook.react\&a=react-native-artifacts\&c=hermes-ios-debug\&e=tar.gz\&v=#{version}-SNAPSHOT"
    return resolve_url_redirects("http://oss.sonatype.org/service/local/artifact/maven/redirect\?#{params}")
end

def resolve_url_redirects(url)
    return (`curl -Ls -o /dev/null -w %{url_effective} \"#{url}\"`)
end

# [macOS
# Tries to find a suitable Hermes version for a given react-native-macos package.
# For stable branches, we prefer this to be specified as a peer dependency.
def findMatchingHermesVersion(package)
    if package['version'] == "1000.0.0"
        # The main branch builds from source, so skip this check
        return nil
    end

    if package['peerDependencies']
        return package['peerDependencies']['react-native']
    end

    hermes_log("No matching Hermes version found. Defaulting to main branch, which may be unreliable.")
end
# macOS]

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

def hermes_log(message, level = :warning)
    if !Object.const_defined?("Pod::UI")
        return
    end
    hermes_log_messgae = '[Hermes] ' + message
    case level
    when :info
        Pod::UI.puts hermes_log_messgae.green
    when :error
        Pod::UI.puts hermes_log_messgae.red
    else
        Pod::UI.puts hermes_log_messgae.yellow
    end
end
