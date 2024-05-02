# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

module PrivacyManifestUtils
    def self.add_aggregated_privacy_manifest(installer)
        user_project = get_user_project_from(installer)
        targets = get_application_targets(user_project)
        file_path = get_privacyinfo_file_path(user_project, targets)

        privacy_info = read_privacyinfo_file(file_path) || {
            "NSPrivacyCollectedDataTypes" => [],
            "NSPrivacyTracking" => false
        }

        # Get all required reason APIs defined in current pods
        required_reason_apis = get_used_required_reason_apis(installer)

        # Add the Required Reason APIs from React Native core
        get_core_accessed_apis.each do |accessed_api|
            api_type = accessed_api["NSPrivacyAccessedAPIType"]
            reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
            required_reason_apis[api_type] ||= []
            required_reason_apis[api_type] += reasons
        end

        # Merge the Required Reason APIs from pods with the ones from the existing PrivacyInfo file
        (privacy_info["NSPrivacyAccessedAPITypes"] || []).each do |accessed_api|
            api_type = accessed_api["NSPrivacyAccessedAPIType"]
            reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
            # Add reasons from existing PrivacyInfo file to the ones from pods
            required_reason_apis[api_type] ||= []
            required_reason_apis[api_type] += reasons
        end

        # Update the existing PrivacyInfo file with the new aggregated data
        privacy_info["NSPrivacyAccessedAPITypes"] = required_reason_apis.map { |api_type, reasons|
            {
            "NSPrivacyAccessedAPIType" => api_type,
            "NSPrivacyAccessedAPITypeReasons" => reasons.uniq
            }
        }

        Xcodeproj::Plist.write_to_path(privacy_info, file_path)

        targets.each do |target|
            ensure_reference(file_path, user_project, target)
        end
    end

    def self.get_application_targets(user_project)
        return user_project.targets.filter { |t| t.symbol_type == :application }
    end

    def self.read_privacyinfo_file(file_path)
        # Maybe add missing default NSPrivacyTracking, NSPrivacyTrackingDomains, NSPrivacyCollectedDataTypes, but this works without those keys
        source_data = nil
        # Try to read an existing PrivacyInfo.xcprivacy file
        begin
            source_data = Xcodeproj::Plist.read_from_path(file_path)
            Pod::UI.puts "[Privacy Manifest Aggregation] Appending aggregated reasons to existing PrivacyInfo.xcprivacy file."
        rescue => e
            Pod::UI.puts "[Privacy Manifest Aggregation] No existing PrivacyInfo.xcprivacy file found, creating a new one."
        end
        return source_data
    end

    def self.ensure_reference(file_path, user_project, target)
        reference_exists = target.resources_build_phase.files_references.any? { |file_ref| file_ref.path.end_with? "PrivacyInfo.xcprivacy" }
        unless reference_exists
            # We try to find the main group, but if it doesn't exist, we default to adding the file to the project root – both work
            file_root = user_project.root_object.main_group.children.find { |group|
                group.class == Xcodeproj::Project::Object::PBXGroup && (group.name == target.name || group.path == target.name)
            } || user_project
            file_ref = file_root.new_file(file_path)
            build_file = target.resources_build_phase.add_file_reference(file_ref, true)
        end
    end

    def self.get_privacyinfo_file_path(user_project, targets)
        file_refs = targets.flat_map { |target| target.resources_build_phase.files_references }
        existing_file = file_refs.find { |file_ref| file_ref.path.end_with? "PrivacyInfo.xcprivacy" }
        if existing_file
            return existing_file.real_path
        end

        # We try to find a file we know exists in the project to get the path to the main group directory
        info_plist_path = user_project.files.find { |file_ref| file_ref.name == "Info.plist" }
        if info_plist_path.nil?
            # return path that is sibling to .xcodeproj
            path = user_project.path
            return File.join(File.dirname(path), "PrivacyInfo.xcprivacy")
        end
        return File.join(File.dirname(info_plist_path.real_path),"PrivacyInfo.xcprivacy")
    end

    def self.get_used_required_reason_apis(installer)
        # A dictionary with keys of type string (NSPrivacyAccessedAPIType) and values of type string[] (NSPrivacyAccessedAPITypeReasons[])
        used_apis = {}
        Pod::UI.puts "[Privacy Manifest Aggregation] Reading .xcprivacy files to aggregate all used Required Reason APIs."
        installer.pod_targets.each do |pod_target|
            # puts pod_target
            pod_target.file_accessors.each do |file_accessor|
            file_accessor.resource_bundles.each do |bundle_name, bundle_files|
                bundle_files.each do |file_path|
                # This needs to be named like that due to apple requirements
                if File.basename(file_path) == 'PrivacyInfo.xcprivacy'
                    content = Xcodeproj::Plist.read_from_path(file_path)
                    accessed_api_types = content["NSPrivacyAccessedAPITypes"]
                    accessed_api_types.each do |accessed_api|
                    api_type = accessed_api["NSPrivacyAccessedAPIType"]
                    reasons = accessed_api["NSPrivacyAccessedAPITypeReasons"]
                    used_apis[api_type] ||= []
                    used_apis[api_type] += reasons
                    end
                end
                end
            end
            end
        end
        return used_apis
    end

    def self.get_privacy_manifest_paths_from(user_project)
        privacy_manifests = user_project
            .files
            .select { |p|
                p.path&.end_with?('PrivacyInfo.xcprivacy')
            }
        return privacy_manifests
    end

    def self.get_core_accessed_apis()
        file_timestamp_accessed_api = {
            "NSPrivacyAccessedAPIType" => "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons" => ["C617.1"],
        }
        user_defaults_accessed_api = {
            "NSPrivacyAccessedAPIType" => "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons" => ["CA92.1"],
        }
        boot_time_accessed_api = {
            "NSPrivacyAccessedAPIType" => "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons" => ["35F9.1"],
        }
        return [file_timestamp_accessed_api, user_defaults_accessed_api, boot_time_accessed_api]
    end


    def self.get_user_project_from(installer)
        user_project = installer.aggregate_targets
                    .map{ |t| t.user_project }
                    .first
        return user_project
    end

    def self.add_privacy_manifest_if_needed(installer)
        user_project = get_user_project_from(installer)
        privacy_manifest = self.get_privacy_manifest_paths_from(user_project).first
        if privacy_manifest.nil?
            privacy_manifest = {
                "NSPrivacyCollectedDataTypes" => [],
                "NSPrivacyTracking" => false,
                "NSPrivacyAccessedAPITypes" => get_core_accessed_apis
            }
            path = File.join(user_project.path.parent, "PrivacyInfo.xcprivacy")
            Xcodeproj::Plist.write_to_path(privacy_manifest, path)
            Pod::UI.puts "Your app does not have a privacy manifest! A template has been generated containing Required Reasons API usage in the core React Native library. Please add the PrivacyInfo.xcprivacy file to your project and complete data use, tracking and any additional required reasons your app is using according to Apple's guidance: https://developer.apple.com/documentation/bundleresources/privacy_manifest_files. Then, you will need to manually add this file to your project in Xcode.".red
        end
    end
end
