# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'net/http'
require 'rexml/document'

require_relative './utils.rb'

### Adds ReactNativeCore-prebuilt as a dependency to the given podspec if we're not
### building ReactNativeCore from source (then this function does nothing).
def add_rncore_dependency(s)
    if !ReactNativeCoreUtils.build_rncore_from_source()
        current_pod_target_xcconfig = s.to_hash["pod_target_xcconfig"] || {}
        current_pod_target_xcconfig = current_pod_target_xcconfig.to_h unless current_pod_target_xcconfig.is_a?(Hash)
        s.dependency "React-Core-prebuilt"
        current_pod_target_xcconfig["HEADER_SEARCH_PATHS"] ||= [] << "$(PODS_ROOT)/React-Core-prebuilt/React.xcframework/Headers"
        s.pod_target_xcconfig = current_pod_target_xcconfig
    end
end

## - RCT_USE_PREBUILT_RNCORE: If set to 1, it will use the release tarball from Maven instead of building from source.
## - RCT_TESTONLY_RNCORE_TARBALL_PATH: **TEST ONLY** If set, it will use a local tarball of RNCore if it exists.
## - RCT_TESTONLY_RNCORE_VERSION: **TEST ONLY** If set, it will override the version of RNCore to be used.

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
            @@react_native_version = ENV["RCT_TESTONLY_RNCORE_VERSION"] == nil ? react_native_version : ENV["RCT_TESTONLY_RNCORE_VERSION"]

            if @@react_native_version.include? "nightly"
                @@use_nightly = true
                if ENV["RCT_TESTONLY_RNCORE_VERSION"] == "nightly"
                    @@react_native_version = ReactNativeDependenciesUtils.get_nightly_npm_version()
                    rncore_log("Using nightly version from npm: #{@@react_native_version}")
                else
                    rncore_log("Using nightly build #{@@react_native_version}")
                end
            end

            if ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]
              abort_if_use_local_rncore_with_no_file()
            end

            use_local_xcframework = ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"] && File.exist?(ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"])
            artifacts_exists = ENV["RCT_USE_PREBUILT_RNCORE"] == "1" && (@@use_nightly ? nightly_artifact_exists(@@react_native_version) : release_artifact_exists(@@react_native_version))
            @@build_from_source = !use_local_xcframework && !artifacts_exists

            if @@build_from_source && ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"] && !use_local_xcframework
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
      if !File.exist?(ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"])
          abort("RCT_TESTONLY_RNCORE_TARBALL_PATH is set to #{ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]} but the file does not exist!")
      end
    end

    def self.build_rncore_from_source()
        return @@build_from_source
    end

    def self.resolve_podspec_source()
        if ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]
            abort_if_use_local_rncore_with_no_file()
            rncore_log("Using local xcframework at #{ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]}")
            return {:http => "file://#{ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]}" }
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
        if @@react_native_path == ""
            rncore_log("react_native_path is not set", :error)
            return
        end

        if @@react_native_version == ""
            rncore_log("react_native_version is not set", :error)
            return
        end

        if @@build_from_source
            return
        end

        url = stable_tarball_url(@@react_native_version, :debug)
        rncore_log("Using tarball from URL: #{url}")
        download_stable_rncore(@@react_native_path, @@react_native_version, :debug)
        download_stable_rncore(@@react_native_path, @@react_native_version, :release)
        return {:http => url}
    end

    def self.stable_tarball_url(version, build_type)
        ## You can use the `ENTERPRISE_REPOSITORY` ariable to customise the base url from which artifacts will be downloaded.
        ## The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
        maven_repo_url =
            ENV['ENTERPRISE_REPOSITORY'] != nil && ENV['ENTERPRISE_REPOSITORY'] != "" ?
            ENV['ENTERPRISE_REPOSITORY'] :
            "https://repo1.maven.org/maven2"
        group = "com/facebook/react"
        # Sample url from Maven:
        # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.81.0/react-native-artifacts-0.81.0-reactnative-core-debug.tar.gz
        return "#{maven_repo_url}/#{group}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-core-#{build_type.to_s}.tar.gz"
    end

    def self.nightly_tarball_url(version)
        artefact_coordinate = "react-native-artifacts"
        artefact_name = "reactnative-core-debug.tar.gz"
        xml_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artefact_coordinate}/#{version}-SNAPSHOT/maven-metadata.xml"

        response = Net::HTTP.get_response(URI(xml_url))
        if response.is_a?(Net::HTTPSuccess)
          xml = REXML::Document.new(response.body)
          timestamp = xml.elements['metadata/versioning/snapshot/timestamp'].text
          build_number = xml.elements['metadata/versioning/snapshot/buildNumber'].text
          full_version = "#{version}-#{timestamp}-#{build_number}"

          final_url = "https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/#{artefact_coordinate}/#{version}-SNAPSHOT/#{artefact_coordinate}-#{full_version}-#{artefact_name}"
          return final_url
        else
          return ""
        end
    end

    def self.download_stable_rncore(react_native_path, version, configuration)
        tarball_url = stable_tarball_url(version, configuration)
        download_rncore_tarball(react_native_path, tarball_url, version, configuration)
    end

    def self.podspec_source_download_prebuilt_nightly_tarball(version)
        url = nightly_tarball_url(version)
        rncore_log("Using nightly tarball from URL: #{url}")
        return {:http => url}
    end

    def self.download_rncore_tarball(react_native_path, tarball_url, version, configuration)
        filename = configuration == nil ?
            "reactnative-core-#{version}.tar.gz" :
            "reactnative-core-#{version}-#{configuration}.tar.gz"
        destination_path = "#{artifacts_dir()}/#{filename}"

        if File.exist?(destination_path)
          rncore_log("Tarball #{filename} already exists in Pods. Skipping download.")
          return destination_path
        end

        `mkdir -p "#{artifacts_dir()}"`

        cached_path = File.join(ReactNativePodsUtils.shared_cache_dir(), filename)
        if File.exist?(cached_path)
          rncore_log("Verifying checksum for cached #{filename}...")
          if ReactNativePodsUtils.validate_tarball(cached_path, tarball_url)
            rncore_log("Cache hit: copying #{filename} from shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
            FileUtils.cp(cached_path, destination_path)
          else
            rncore_log("Shared cache file #{filename} failed SHA verification. Re-downloading.")
            tmp_file = "#{artifacts_dir()}/reactnative-core.download"
            `curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
            rncore_log("Verifying checksum for downloaded #{filename}...")
            if ReactNativePodsUtils.validate_tarball(destination_path, tarball_url)
              FileUtils.cp(destination_path, cached_path)
              rncore_log("Saved #{filename} to shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
            else
              rncore_log("Downloaded file #{filename} failed SHA verification!", :error)
            end
          end
        else
          rncore_log("Cache miss: downloading #{filename} from #{tarball_url}")
          tmp_file = "#{artifacts_dir()}/reactnative-core.download"
          `curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
          rncore_log("Verifying checksum for downloaded #{filename}...")
          if ReactNativePodsUtils.validate_tarball(destination_path, tarball_url)
            `mkdir -p "#{ReactNativePodsUtils.shared_cache_dir()}"`
            FileUtils.cp(destination_path, cached_path)
            rncore_log("Saved #{filename} to shared cache (#{ReactNativePodsUtils.shared_cache_dir()})")
          else
            rncore_log("Downloaded file #{filename} failed SHA verification!", :error)
          end
        end

        return destination_path
    end

    def self.release_artifact_exists(version)
        return artifact_exists(stable_tarball_url(version, :debug))
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
