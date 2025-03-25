# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require 'net/http'
require 'rexml/document'

require_relative './utils.rb'

## There are two environment variables that is related to ReactNativeDependencies:
## - RCT_USE_RN_DEP: If set to 1, it will use the release tarball from Maven instead of building from source.
## - RCT_USE_LOCAL_RN_DEP: **TEST ONLY** If set, it will use a local tarball of ReactNativeDependencies if it exists.
## - RCT_DEPS_VERSION: **TEST ONLY** If set, it will override the version of ReactNativeDependencies to be used.

### Adds ReactNativeDependencies as a dependency to the given podspec if we're not
### building ReactNativeDependencies from source.
def add_rn_third_party_dependencies(s)
    current_pod_target_xcconfig = s.to_hash["pod_target_xcconfig"] || {}
    current_pod_target_xcconfig = current_pod_target_xcconfig.to_h unless current_pod_target_xcconfig.is_a?(Hash)

    if ReactNativeDependenciesUtils.build_react_native_deps_from_source()
        s.dependency "glog"
        s.dependency "boost"
        s.dependency "DoubleConversion"
        s.dependency "fast_float"
        s.dependency "fmt"
        s.dependency "RCT-Folly"
        s.dependency "SocketRocket"

        if ENV["RCT_NEW_ARCH_ENABLED"]
            s.dependency "RCT-Folly/Fabric"
        end

        header_search_paths = current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] || []

        if header_search_paths.is_a?(String)
            header_search_paths = header_search_paths.split(" ")
        end

        header_search_paths << "$(PODS_ROOT)/glog"
        header_search_paths << "$(PODS_ROOT)/boost"
        header_search_paths << "$(PODS_ROOT)/DoubleConversion"
        header_search_paths << "$(PODS_ROOT)/fast_float/include"
        header_search_paths << "$(PODS_ROOT)/fmt/include"
        header_search_paths << "$(PODS_ROOT)/SocketRocket"
        header_search_paths << "$(PODS_ROOT)/RCT-Folly"

        current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] = header_search_paths
    else
        s.dependency "ReactNativeDependencies"
        current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] ||= [] << "$(PODS_ROOT)/ReactNativeDependencies"
    end

    s.pod_target_xcconfig = current_pod_target_xcconfig
end

class ReactNativeDependenciesUtils
    @@build_from_source = true
    @@react_native_path = ""
    @@react_native_version = ""
    @@use_nightly = false

    def self.build_react_native_deps_from_source()
        return @@build_from_source
    end

    def self.resolve_podspec_source()
        if ENV["RCT_USE_RN_DEP"] && ENV["RCT_USE_RN_DEP"] == "1"
            if @@use_nightly
                rndeps_log("Using nightly tarball")
                return self.podspec_source_download_prebuilt_nightly_tarball(@@react_native_version)
            end

            rndeps_log("Using release tarball")
            return self.podspec_source_download_prebuild_release_tarball()
        end

        if ENV["RCT_USE_LOCAL_RN_DEP"] && File.exist?(ENV["RCT_USE_LOCAL_RN_DEP"])
            rndeps_log("Using local xcframework at #{ENV["RCT_USE_LOCAL_RN_DEP"]}")
            return {:http => "file://#{ENV["RCT_USE_LOCAL_RN_DEP"]}" }
        end
    end

    ## Sets up wether react-native-dependencies should be built from source or not.
    ## If RCT_USE_RN_DEP is set to 1 and the artifacts exists on Maven, it will
    ## not build from source. Otherwise, it will build from source.
    def self.setup_react_native_dependencies(react_native_path, react_native_version)
        @@react_native_path = react_native_path
        @@react_native_version = ENV["RCT_DEPS_VERSION"] == nil ? react_native_version : ENV["RCT_DEPS_VERSION"]

        if @@react_native_version.include? 'nightly'
            rndeps_log("Using nightly build")
            @@use_nightly = true
        end

        artifacts_exists = ENV["RCT_USE_RN_DEP"] == "1" && (@@use_nightly ? nightly_artifact_exists(@@react_native_version) : release_artifact_exists(@@react_native_version))
        use_local_xcframework = ENV["RCT_USE_LOCAL_RN_DEP"] && File.exist?(ENV["RCT_USE_LOCAL_RN_DEP"])

        if ENV["RCT_USE_LOCAL_RN_DEP"]
            if !File.exist?(ENV["RCT_USE_LOCAL_RN_DEP"])
                abort("RCT_USE_LOCAL_RN_DEP is set to #{ENV["RCT_USE_LOCAL_RN_DEP"]} but the file does not exist!")
            end
        end

        @@build_from_source = !use_local_xcframework && !artifacts_exists

        rndeps_log("Building from source: #{@@build_from_source}")
    end

    def self.podspec_source_download_prebuild_release_tarball()
        # Warn if @@react_native_path is not set
        if @@react_native_path == ""
            rndeps_log("react_native_path is not set", :error)
            return
        end

        # Warn if @@react_native_version is not set
        if @@react_native_version == ""
            rndeps_log("react_native_version is not set", :error)
            return
        end

        if @@build_from_source
            return
        end

        url = release_tarball_url(@@react_native_version, :debug)
        rndeps_log("Using tarball from URL: #{url}")
        download_stable_rndeps(@@react_native_path, @@react_native_version, :debug)
        download_stable_rndeps(@@react_native_path, @@react_native_version, :release)
        return {:http => url}
    end

    def self.release_tarball_url(version, build_type)
        maven_repo_url = "https://repo1.maven.org/maven2"
        group = "com/facebook/react"
        # Sample url from Maven:
        # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.79.0-rc.0/react-native-artifacts-0.79.0-rc.0-reactnative-dependencies-debug.tar.gz
        return "#{maven_repo_url}/#{group}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-dependencies-#{build_type.to_s}.tar.gz"
    end

    def self.nightly_tarball_url(version)
        params = "r=snapshots\&g=com.facebook.react\&a=react-native-artifacts\&c=reactnative-dependencies-debug\&e=tar.gz\&v=#{version}-SNAPSHOT"
        return resolve_url_redirects("http://oss.sonatype.org/service/local/artifact/maven/redirect\?#{params}")
    end

    def self.download_stable_rndeps(react_native_path, version, configuration)
        tarball_url = release_tarball_url(version, configuration)
        download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
    end

    def self.podspec_source_download_prebuilt_nightly_tarball(version)
        url = nightly_tarball_url(version)
        rndeps_log("Using nightly tarball from URL: #{url}")
        return {:http => url}
    end

    def self.download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
        destination_path = configuration == nil ?
            "#{artifacts_dir()}/reactnative-dependencies-#{version}.tar.gz" :
            "#{artifacts_dir()}/reactnative-dependencies-#{version}-#{configuration}.tar.gz"

        unless File.exist?(destination_path)
          # Download to a temporary file first so we don't cache incomplete downloads.
          tmp_file = "#{artifacts_dir()}/reactnative-dependencies.download"
          `mkdir -p "#{artifacts_dir()}" && curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
        end

        return destination_path
    end

    def self.release_artifact_exists(version)
        return artifact_exists(release_tarball_url(version, :debug))
    end

    def self.nightly_artifact_exists(version)
        return artifact_exists(nightly_tarball_url(version).gsub("\\", ""))
    end

    def self.artifacts_dir()
        return File.join(Pod::Config.instance.project_pods_root, "ReactNativeDependencies-artifacts")
    end

    # This function checks that ReactNativeDependencies artifact exists on the maven repo
    def self.artifact_exists(tarball_url)
        # -L is used to follow redirects, useful for the nightlies
        # I also needed to wrap the url in quotes to avoid escaping & and ?.
        return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
    end

    def self.rndeps_log(message, level = :warning)
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

    def self.resolve_url_redirects(url)
        return (`curl -Ls -o /dev/null -w %{url_effective} \"#{url}\"`)
    end
end
