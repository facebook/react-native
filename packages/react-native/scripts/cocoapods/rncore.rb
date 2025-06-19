# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
require 'net/http'
require 'rexml/document'

require_relative './utils.rb'

## - RCT_USE_PREBUILT_RNCORE: If set to 1, it will use the release tarball from Maven instead of building from source.
## - RCT_USE_LOCAL_RNCORE: **TEST ONLY** If set, it will use a local tarball of RNCore if it exists.
## - RCT_RNCORE_VERSION: **TEST ONLY** If set, it will override the version of RNCore to be used.

class ReactNativeCoreUtils
    @@build_from_source = true
    @@react_native_path = ""
    @@react_native_version = ""
    @@use_nightly = false

    ## Sets up wether ReactNative Core should be built from source or not.
    ## If RCT_USE_PREBUILT_RNCORE is set to 1 and the artifacts exists on Maven, it will
    ## not build from source. Otherwise, it will build from source.
    def self.setup_rncore(react_native_path, react_native_version)
        # We don't want setup to be called multiple times, so we check if the variables are already set.
        if @@react_native_version == ""
            rncore_log("Setting up ReactNativeCore...")
            @@react_native_path = react_native_path
            @@react_native_version = ENV["RCT_RNCORE_VERSION"] == nil ? react_native_version : ENV["RCT_RNCORE_VERSION"]

            if @@react_native_version.include? 'nightly'
                @@use_nightly = true
                if ENV["RCT_RNCORE_VERSION"] == "nightly"
                    @@react_native_version = ReactNativeDependenciesUtils.get_nightly_npm_version()
                    rncore_log("Using nightly version from npm: #{@@react_native_version}")
                else
                    rncore_log("Using nightly build #{@@react_native_version}")
                end
            end

            if ENV["RCT_USE_LOCAL_RNCORE"]
              abort_if_use_local_rncore_with_no_file()
            end

            use_local_xcframework = ENV["RCT_USE_LOCAL_RNCORE"] && File.exist?(ENV["RCT_USE_LOCAL_RNCORE"])
            artifacts_exists = ENV["RCT_USE_PREBUILT_RNCORE"] == "1" && (@@use_nightly ? nightly_artifact_exists(@@react_native_version) : release_artifact_exists(@@react_native_version))
            @@build_from_source = !use_local_xcframework && !artifacts_exists

            if @@build_from_source && ENV["RCT_USE_LOCAL_RNCORE"] && !use_local_xcframework
                rncore_log("No local xcframework found, reverting to building from source.")
            end
            if @@build_from_source && ENV["RCT_USE_PREBUILT_RNCORE"] && !artifacts_exists
                rncore_log("No prebuilt artifacts found, reverting to building from source.")
            end
            rncore_log("Building from source: #{@@build_from_source}")
            rncore_log("Source: #{self.resolve_podspec_source()}")
        end
    end

    def self.abort_if_use_local_rncore_with_no_file()
      if !File.exist?(ENV["RCT_USE_LOCAL_RNCORE"])
          abort("RCT_USE_LOCAL_RNCORE is set to #{ENV["RCT_USE_LOCAL_RNCORE"]} but the file does not exist!")
      end
    end

    def self.build_rncore_from_source()
        return @@build_from_source
    end

    def self.resolve_podspec_source()
        if ENV["RCT_USE_LOCAL_RNCORE"]
            abort_if_use_local_rncore_with_no_file()
            rncore_log("Using local xcframework at #{ENV["RCT_USE_LOCAL_RNCORE"]}")
            return {:http => "file://#{ENV["RCT_USE_LOCAL_RNCORE"]}" }
        end

        if ENV["RCT_USE_PREBUILT_RNCORE"] == "1"
            if @@use_nightly
                rncore_log("Using nightly tarball")
                begin
                    return self.podspec_source_download_prebuilt_nightly_tarball(@@react_native_version)
                rescue => e
                    rncore_log("Failed to download nightly tarball: #{e.message}", :error)
                    return
                end
            end

            begin
                return self.podspec_source_download_prebuild_stable_tarball()
            rescue => e
                rncore_log("Failed to download release tarball: #{e.message}", :error)
                return
            end
        end

    end

    def self.podspec_source_download_prebuild_stable_tarball()
        # Warn if @@react_native_path is not set
        if @@react_native_path == ""
            rncore_log("react_native_path is not set", :error)
            return
        end

        # Warn if @@react_native_version is not set
        if @@react_native_version == ""
            rncore_log("react_native_version is not set", :error)
            return
        end

        if @@build_from_source
            return
        end

        url = release_tarball_url(@@react_native_version, :debug)
        rncore_log("Using tarball from URL: #{url}")
        download_stable_rndeps(@@react_native_path, @@react_native_version, :debug)
        download_stable_rndeps(@@react_native_path, @@react_native_version, :release)
        return {:http => url}
    end

    def self.release_tarball_url(version, build_type)
        maven_repo_url = "https://repo1.maven.org/maven2"
        group = "com/facebook/react"
        # Sample url from Maven:
        return "#{maven_repo_url}/#{group}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-core-debug.tar.gz-#{build_type.to_s}.tar.gz"
    end

    def self.nightly_tarball_url(version)
        artefact_coordinate = "react-native-artifacts"
        artefact_name = "reactnative-core-debug.tar.gz"
        xml_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artefact_coordinate}/#{version}-SNAPSHOT/maven-metadata.xml"

        xml = REXML::Document.new(Net::HTTP.get(URI(xml_url)))
        timestamp = xml.elements['metadata/versioning/snapshot/timestamp'].text
        build_number = xml.elements['metadata/versioning/snapshot/buildNumber'].text
        full_version = "#{version}-#{timestamp}-#{build_number}"

        final_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artefact_coordinate}/#{version}-SNAPSHOT/#{artefact_coordinate}-#{full_version}-#{artefact_name}"
        return final_url
    end

    def self.download_stable_rndeps(react_native_path, version, configuration)
        tarball_url = release_tarball_url(version, configuration)
        download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
    end

    def self.podspec_source_download_prebuilt_nightly_tarball(version)
        url = nightly_tarball_url(version)
        rncore_log("Using nightly tarball from URL: #{url}")
        return {:http => url}
    end

    def self.download_rndeps_tarball(react_native_path, tarball_url, version, configuration)
        destination_path = configuration == nil ?
            "#{artifacts_dir()}/reactnative-core-debug.tar.gz-#{version}.tar.gz" :
            "#{artifacts_dir()}/reactnative-core-debug.tar.gz-#{version}-#{configuration}.tar.gz"

        unless File.exist?(destination_path)
          # Download to a temporary file first so we don't cache incomplete downloads.
          tmp_file = "#{artifacts_dir()}/reactnative-core-debug.tar.gz.download"
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
        return File.join(Pod::Config.instance.project_pods_root, "ReactNativeCore-artifacts")
    end

    # This function checks that ReactNativeCore artifact exists on the maven repo
    def self.artifact_exists(tarball_url)
        # -L is used to follow redirects, useful for the nightlies
        # I also needed to wrap the url in quotes to avoid escaping & and ?.
        return (`curl -o /dev/null --silent -Iw '%{http_code}' -L "#{tarball_url}"` == "200")
    end

    def self.resolve_url_redirects(url)
        return (`curl -Ls -o /dev/null -w %{url_effective} \"#{url}\"`)
    end

    def self.rncore_log(message, level = :info)
        if !Object.const_defined?("Pod::UI")
            return
        end
        log_message = '[ReactNativeCore] ' + message
        case level
        when :info
            Pod::UI.puts log_message.green
        when :error
            Pod::UI.puts log_message.red
        else
            Pod::UI.puts log_message.yellow
        end
    end

    def self.get_nightly_npm_version()
        uri = URI('https://registry.npmjs.org/react-native/nightly')
        response = Net::HTTP.get_response(uri)

        unless response.is_a?(Net::HTTPSuccess)
          raise "Couldn't get an answer from NPM: #{response.code} #{response.message}"
        end

        json = JSON.parse(response.body)
        latest_nightly = json['version']
        return latest_nightly
    end

end
