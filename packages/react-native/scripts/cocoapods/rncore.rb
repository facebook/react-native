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
## - RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS: If set to 1, it will download the dSYMs for the prebuilt RNCore frameworks and install these in the framework folders

class ReactNativeCoreUtils
    @@build_from_source = true
    @@react_native_path = ""
    @@react_native_version = ""
    @@use_nightly = false
    @@download_dsyms = false

    ## Sets up wether ReactNative Core should be built from source or not.
    ## If RCT_USE_PREBUILT_RNCORE is set to 1 and the artifacts exists on Maven, it will
    ## not build from source. Otherwise, it will build from source.
    def self.setup_rncore(react_native_path, react_native_version)
        # We don't want setup to be called multiple times, so we check if the variables are already set.
        if @@react_native_version == ""
            rncore_log("Setting up ReactNativeCore...")
            @@react_native_path = react_native_path
            @@react_native_version = ENV["RCT_TESTONLY_RNCORE_VERSION"] == nil ? react_native_version : ENV["RCT_TESTONLY_RNCORE_VERSION"]
            @@download_dsyms = ENV["RCT_SYMBOLICATE_PREBUILT_FRAMEWORKS"] == "1"

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
                begin
                    return self.podspec_source_download_prebuilt_nightly_tarball()
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

        destinationDebug = download_stable_rncore(@@react_native_path, @@react_native_version, :debug)
        destinationRelease = download_stable_rncore(@@react_native_path, @@react_native_version, :release)

        if @@download_dsyms
            dSymsDebug = download_stable_rncore(@@react_native_path, @@react_native_version, :debug, true)
            dSymsRelease = download_stable_rncore(@@react_native_path, @@react_native_version, :release, true)
            rncore_log("Resolved stable dSYMs")
            rncore_log("  #{Pathname.new(dSymsDebug).relative_path_from(Pathname.pwd).to_s}")
            rncore_log("  #{Pathname.new(dSymsRelease).relative_path_from(Pathname.pwd).to_s}")

            # Make sure that the dSYMs are processed
            process_dsyms(destinationDebug, dSymsDebug)
            process_dsyms(destinationRelease, dSymsRelease)
        end

        rncore_log("Resolved stable ReactNativeCore-prebuilt version:")
        rncore_log("  #{Pathname.new(destinationDebug).relative_path_from(Pathname.pwd).to_s}")
        rncore_log("  #{Pathname.new(destinationRelease).relative_path_from(Pathname.pwd).to_s}")

        return {:http => URI::File.build(path: destinationDebug).to_s }
    end

    def self.podspec_source_download_prebuilt_nightly_tarball()
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

        destinationDebug = download_nightly_rncore(@@react_native_path, @@react_native_version, :debug)
        destinationRelease = download_nightly_rncore(@@react_native_path, @@react_native_version, :release)

        if @@download_dsyms
            dSymsDebug = download_nightly_rncore(@@react_native_path, @@react_native_version, :debug, true)
            dSymsRelease = download_nightly_rncore(@@react_native_path, @@react_native_version, :release, true)
            rncore_log("Resolved nightly dSYMs")
            rncore_log("  #{Pathname.new(dSymsDebug).relative_path_from(Pathname.pwd).to_s}")
            rncore_log("  #{Pathname.new(dSymsRelease).relative_path_from(Pathname.pwd).to_s}")

            # Make sure that the dSYMs are processed
            process_dsyms(destinationDebug, dSymsDebug)
            process_dsyms(destinationRelease, dSymsRelease)
        end

        rncore_log("Resolved nightly ReactNativeCore-prebuilt version:")
        rncore_log("  #{Pathname.new(destinationDebug).relative_path_from(Pathname.pwd).to_s}")
        rncore_log("  #{Pathname.new(destinationRelease).relative_path_from(Pathname.pwd).to_s}")
        return {:http => URI::File.build(path: destinationDebug).to_s }
    end

    def self.process_dsyms(frameworkTarball, dSymsTarball)
        if !@@download_dsyms
            return
        end

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

        # gunzip the dSymsTarball and the frameworkTarball into a temporary folder
        # and then copy the dSYMs into the framework folder and then tar/gz the framework folder again
        # into the same location as the original frameworkTarball

        rncore_log("Adding symbols #{Pathname.new(dSymsTarball).relative_path_from(Pathname.pwd).to_s} to framework tarball #{Pathname.new(frameworkTarball).relative_path_from(Pathname.pwd).to_s}")

        FileUtils.mkdir_p(File.dirname(frameworkTarball))
        FileUtils.cp(frameworkTarball, "#{frameworkTarball}.orig")

        rncore_log("  Backed up original tarballs")

        begin
            # Now let's gunzip the framework tarball into a .tar file
            # Get filename and foldername from the tarball path
            frameworkFolder = File.dirname(frameworkTarball)
            frameworkFilename = File.basename(frameworkTarball, ".tar.gz")
            frameworkTarPath = File.join(frameworkFolder, frameworkFilename + ".tar")

            # Now gunzip the tarball into the frameworkFolder - this will remove the .gz file and leave us with a .tar file
            rncore_log("  Unpacking framework tarball")
            `gunzip "#{frameworkTarball}"`

            # Now let's untar the dSyms tarball into a temporary folder / dSYMs subfolder
            dsyms_tmp_dir = "#{artifacts_dir}/dSYMs"
            rncore_log("  Unpacking dSYMs to temporary folder")
            `mkdir -p "#{dsyms_tmp_dir}" && tar -xzf "#{dSymsTarball}" -C "#{dsyms_tmp_dir}"`

            # Now we need to remap the symbol files to be relative to the framework folder
            remap_sourcemaps_for_symbols(dsyms_tmp_dir)

            # Add the dSYMs folder to the framework folder
            rncore_log("  Adding dSYMs to framework tarball")

            # Move symbol bundles into each of the slices in the xcframework
            # Example:
            # move dSYMs/ios-arm64/. into React.xcframework/ios-arm64/React.framework/dSYMs/.
            Dir.glob(File.join(dsyms_tmp_dir, "*")).each do |dsym_path|
                slice_name = File.basename(dsym_path)
                slice_dsym_dest = File.join("React.xcframework", slice_name, "React.framework", "dSYMs")
                rncore_log("    Adding dSYM slice #{slice_name} into tarball at #{slice_dsym_dest}")
                `(cd "#{File.dirname(frameworkTarPath)}" && mkdir -p "#{slice_dsym_dest}" && cp -R "#{dsym_path}/." "#{slice_dsym_dest}" && tar -rf "#{frameworkTarPath}" "#{slice_dsym_dest}")`
            end

            # Now gzip the framework tarball again - remember to use the .tar file and not the .gz file
            rncore_log("  Packing #{Pathname.new(frameworkTarPath).relative_path_from(Pathname.pwd).to_s}")
            `gzip -1 "#{frameworkTarPath}"`

            # Clean up the temporary folder
            FileUtils.remove_entry(dsyms_tmp_dir)
            rncore_log("  Processed dSYMs into framework tarball #{Pathname.new(frameworkTarball).relative_path_from(Pathname.pwd).to_s}")

            # Remove backup of original tarballs
            FileUtils.rm_f("#{frameworkTarball}.orig")

            # Remove temp dSYMs folder and the temp Framework folder
            FileUtils.rm_rf(dsyms_tmp_dir)
            FileUtils.rm_rf(File.join(artifacts_dir, "React.xcframework"))

        rescue => e
            rncore_log("Failed to process dSYMs: #{e.message}", :error)
            # Restore the original tarballs
            FileUtils.mv("#{frameworkTarball}.orig", frameworkTarball) if File.exist?("#{frameworkTarball}.orig")
            rncore_log("Restored original tarballs", :error)
            abort "Couldn't process dSYMs: #{e.message}"
        end
    end

    def self.remap_sourcemaps_for_symbols(symbolsPath)
        rncore_log("  Remapping dSYMs to be relative to framework folder")

        # Find all .dSYM bundles in the symbols path
        dsym_bundles = []
        Dir.glob(File.join(symbolsPath, "**", "*.dSYM")).each do |path|
            if File.directory?(path)
                # Check if it's a valid dSYM bundle with Info.plist
                info_plist = File.join(path, 'Contents', 'Info.plist')
                dsym_bundles << path if File.exist?(info_plist)
            end
        end

        return if dsym_bundles.empty?

        # Define source path mappings - from absolute build paths to relative framework paths
        # Expand the path relative to the installation root (project root, parent of ios/)
        react_native_absolute_path = File.expand_path(@@react_native_path, Pod::Config.instance.installation_root)
        mappings = [
            ["/Users/runner/work/react-native/react-native/packages/react-native", react_native_absolute_path],
        ]

        dsym_bundles.each do |dsym_path| begin
            # Get UUIDs for this dSYM bundle
            uuid_output = `dwarfdump --uuid "#{dsym_path}" 2>/dev/null`
            uuids = uuid_output.scan(/UUID:\s+([0-9A-F-]{36})/i).flatten

            next if uuids.empty?

            # Create Resources directory if it doesn't exist
            resources_dir = File.join(dsym_path, 'Contents', 'Resources')
            FileUtils.mkdir_p(resources_dir)

            # Generate plist content with path mappings
            plist_content = generate_plist_content(mappings)

            # Write plist for each UUID
            uuids.each do |uuid|
                plist_path = File.join(resources_dir, "#{uuid}.plist")
                File.write(plist_path, plist_content)
            end

            rescue => e
            rncore_log("    Failed to process dSYM #{dsym_path}: #{e.message}", :error)
            end
        end

        rncore_log("    Completed dSYM remapping for #{dsym_bundles.length} bundles")
    end

    def self.generate_plist_content(mappings)
    # Generate the source path remapping entries
    remapping_entries = mappings.map do |from, to|
        "    <key>#{from}</key><string>#{to}</string>"
    end.join("\n")

    # Use the first mapping for legacy keys
    first_from, first_to = mappings.first

    return <<~PLIST
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
            <plist version="1.0">
            <dict>
            <key>DBGVersion</key><string>3</string>
            <key>DBGBuildSourcePath</key><string>#{first_from}</string>
            <key>DBGSourcePath</key><string>#{first_to}</string>
            <key>DBGSourcePathRemapping</key>
            <dict>
            #{remapping_entries}
            </dict>
            </dict>
            </plist>
        PLIST
    end

    def self.stable_tarball_url(version, build_type, dsyms = false)
        ## You can use the `ENTERPRISE_REPOSITORY` ariable to customise the base url from which artifacts will be downloaded.
        ## The mirror's structure must be the same of the Maven repo the react-native core team publishes on Maven Central.
        maven_repo_url =
            ENV['ENTERPRISE_REPOSITORY'] != nil && ENV['ENTERPRISE_REPOSITORY'] != "" ?
            ENV['ENTERPRISE_REPOSITORY'] :
            "https://repo1.maven.org/maven2"
        group = "com/facebook/react"
        # Sample url from Maven:
        # https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.81.0/react-native-artifacts-0.81.0-reactnative-core-debug.tar.gz
        return "#{maven_repo_url}/#{group}/react-native-artifacts/#{version}/react-native-artifacts-#{version}-reactnative-core-#{dsyms ? "dSYM-" : ""}#{build_type.to_s}.tar.gz"
    end

    def self.nightly_tarball_url(version, configuration, dsyms = false)
        artefact_coordinate = "react-native-artifacts"
        artefact_name = "reactnative-core-#{dsyms ? "dSYM-" : ""}#{configuration ? configuration : "debug"}.tar.gz"
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

    def self.download_stable_rncore(react_native_path, version, configuration, dsyms = false)
        tarball_url = stable_tarball_url(version, configuration, dsyms)
        download_rncore_tarball(react_native_path, tarball_url, version, configuration, dsyms)
    end

    def self.download_nightly_rncore(react_native_path, version, configuration, dsyms = false)
        tarball_url = nightly_tarball_url(version, configuration, dsyms)
        download_rncore_tarball(react_native_path, tarball_url, version, configuration, dsyms)
    end

    def self.download_rncore_tarball(react_native_path, tarball_url, version, configuration, dsyms = false)
        destination_path = configuration == nil ?
            "#{artifacts_dir()}/reactnative-core-#{version}#{dsyms ? "-dSYM" : ""}.tar.gz" :
            "#{artifacts_dir()}/reactnative-core-#{version}#{dsyms ? "-dSYM" : ""}-#{configuration}.tar.gz"

        unless File.exist?(destination_path)
          # Download to a temporary file first so we don't cache incomplete downloads.
          rncore_log("Downloading ReactNativeCore-prebuilt #{dsyms ? "dSYMs " : ""}#{configuration ? configuration.to_s : ""} tarball from #{tarball_url} to #{Pathname.new(destination_path).relative_path_from(Pathname.pwd).to_s}")
          tmp_file = "#{artifacts_dir()}/reactnative-core.download"
          `mkdir -p "#{artifacts_dir()}" && curl "#{tarball_url}" -Lo "#{tmp_file}" && mv "#{tmp_file}" "#{destination_path}"`
        else
          rncore_log("Using downloaded ReactNativeCore-prebuilt #{dsyms ? "dSYMs " : ""}#{configuration ? configuration.to_s : ""} tarball at #{Pathname.new(destination_path).relative_path_from(Pathname.pwd).to_s}")
        end

        return destination_path
    end

    def self.release_artifact_exists(version)
        return artifact_exists(stable_tarball_url(version, :debug))
    end

    def self.nightly_artifact_exists(version)
        return artifact_exists(nightly_tarball_url(version, :debug).gsub("\\", ""))
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
        log_message = '[ReactNativeCore] '
        case level
        when :info
            Pod::UI.puts log_message.green + message
        when :error
            Pod::UI.puts log_message.red + message
        else
            Pod::UI.puts log_message.yellow + message
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
