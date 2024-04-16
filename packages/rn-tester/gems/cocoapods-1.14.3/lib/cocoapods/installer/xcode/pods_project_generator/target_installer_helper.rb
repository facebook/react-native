module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        module TargetInstallerHelper
          # @param [Generator] generator
          #        the generator to use for generating the content.
          #
          # @param [Pathname] path
          #        the pathname to save the content into.
          #
          # Saves the content the provided path unless the path exists and the contents are exactly the same.
          #
          def update_changed_file(generator, path)
            if path.exist?
              contents = generator.generate.to_s
              content_stream = StringIO.new(contents)
              identical = File.open(path, 'rb') { |f| FileUtils.compare_stream(f, content_stream) }
              return if identical

              File.open(path, 'w') { |f| f.write(contents) }
            else
              path.dirname.mkpath
              generator.save_as(path)
            end
          end

          # Creates the Info.plist file which sets public framework attributes
          #
          # @param  [Sandbox] sandbox @see #sandbox
          #         The sandbox where the generated Info.plist file should be saved.
          #
          # @param  [Pathname] path
          #         the path to save the generated Info.plist file.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the generated Info.plist file into.
          #
          # @param  [String] version
          #         the version to use for when generating this Info.plist file.
          #
          # @param  [Platform] platform
          #         the platform to use for when generating this Info.plist file.
          #
          # @param  [Symbol] bundle_package_type
          #         the CFBundlePackageType of the target this Info.plist file is for.
          #
          #  @param [Hash] additional_entries
          #         any additional entries to include in this Info.plist file.
          #
          # @param [String] build_setting_value
          #         an optional value to set for the `INFOPLIST_FILE` build setting on the
          #         native target. If none is specified then the value is calculated from the
          #         Info.plist path relative to the sandbox root.
          #
          # @return [void]
          #
          def create_info_plist_file_with_sandbox(sandbox, path, native_target, version, platform,
                                                  bundle_package_type = :fmwk, additional_entries: {},
                                                  build_setting_value: nil)
            UI.message "- Generating Info.plist file at #{UI.path(path)}" do
              generator = Generator::InfoPlistFile.new(version, platform, bundle_package_type, additional_entries)
              update_changed_file(generator, path)

              build_setting_value ||= path.relative_path_from(sandbox.root).to_s
              native_target.build_configurations.each do |c|
                c.build_settings['INFOPLIST_FILE'] = build_setting_value
              end
            end
          end

          # Creates a prefix header file which imports `UIKit` or `Cocoa` according
          # to the platform of the target. This file also include any prefix header
          # content reported by the specification of the pods.
          #
          # @param [Pathname] path
          #        the path to generate the prefix header for.
          #
          # @param [Array<Sandbox::FileAccessor>] file_accessors
          #        the file accessors to use for this prefix header that point to a path of a prefix header.
          #
          # @param [Platform] platform
          #        the platform to use for this prefix header.
          #
          # @param [PBXNativeTarget] native_target
          #        the native target on which the prefix header should be configured for.
          #
          # @param [Pathname] project_directory
          #        the directory containing the project of the target
          #
          # @return [void]
          #
          def create_prefix_header(path, file_accessors, platform, native_target, project_directory)
            generator = Generator::PrefixHeader.new(file_accessors, platform)
            update_changed_file(generator, path)

            relative_path = path.relative_path_from(project_directory).to_s
            native_target.build_configurations.each do |c|
              c.build_settings['GCC_PREFIX_HEADER'] = relative_path
            end
          end

          module_function :update_changed_file
          module_function :create_info_plist_file_with_sandbox
          module_function :create_prefix_header
        end
      end
    end
  end
end
