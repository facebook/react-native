module Pod
  class Deintegrator
    include Config::Mixin

    FRAMEWORK_NAMES = /^(libPods.*\.a)|(Pods.*\.framework)$/i
    XCCONFIG_NAMES = /^Pods.*\.xcconfig$/i

    def deintegrate_project(project)
      UI.section("Deintegrating #{UI.path project.path}") do
        project.native_targets.each do |target|
          deintegrate_target(target)
        end
      end

      delete_pods_file_references(project)
      remove_sandbox

      UI.puts
      UI.puts('Project has been deintegrated. No traces of CocoaPods left in project.'.green)
      UI.puts('Note: The workspace referencing the Pods project still remains.')
    end

    def deintegrate_target(target)
      UI.section("Deintegrating target `#{target.name}`") do
        deintegrate_shell_script_phase(target, 'Copy Pods Resources')
        deintegrate_shell_script_phase(target, 'Check Pods Manifest.lock')
        deintegrate_shell_script_phase(target, 'Embed Pods Frameworks')
        deintegrate_user_shell_script_phases(target)
        deintegrate_pods_libraries(target)
        deintegrate_configuration_file_references(target)
      end
    end

    def remove_sandbox
      pods_directory = config.sandbox.root
      if pods_directory.exist?
        UI.puts("Removing #{UI.path pods_directory} directory.")
        pods_directory.rmtree
      end
    end

    def deintegrate_pods_libraries(target)
      # `frameworks_build_phases` returns but does not automatically create this build phase
      # when we are deinitegrating. Its a bit of a weird API but thats what Xcodeproj gives
      # us.
      frameworks_build_phase = target.frameworks_build_phases
      return if frameworks_build_phase.nil?

      pods_build_files = frameworks_build_phase.files.select do |build_file|
        build_file.display_name =~ FRAMEWORK_NAMES
      end

      unless pods_build_files.empty?
        UI.section('Removing Pod libraries from build phase:') do
          pods_build_files.each do |build_file|
            UI.puts("- #{build_file.display_name}")
            if build_file.file_ref.build_files.count == 1
              build_file.file_ref.remove_from_project
            end
            frameworks_build_phase.remove_build_file(build_file)
          end
        end
      end
    end

    def deintegrate_user_shell_script_phases(target)
      user_script_phases = target.shell_script_build_phases.select do |phase|
        next unless phase.name
        phase.name.start_with?('[CP-User] ')
      end

      unless user_script_phases.empty?
        user_script_phases.each do |phase|
          target.build_phases.delete(phase)
        end

        UI.puts("Deleted #{user_script_phases.count} user build phases.")
      end
    end

    def deintegrate_shell_script_phase(target, phase_name)
      phases = target.shell_script_build_phases.select do |phase|
        phase.name && phase.name =~ /#{Regexp.escape(phase_name)}\z$/
      end

      unless phases.empty?
        phases.each do |phase|
          target.build_phases.delete(phase)
        end

        UI.puts("Deleted #{phases.count} '#{phase_name}' build phases.")
      end
    end

    def delete_empty_group(project, group_name)
      groups = project.main_group.recursive_children_groups.select do |group|
        group.name == group_name && group.children.empty?
      end

      unless groups.empty?
        groups.each(&:remove_from_project)
        UI.puts "Deleted #{groups.count} empty `#{group_name}` groups from project."
      end
    end

    def deintegrate_configuration_file_references(target)
      config_files = target.build_configurations.map do |config|
        config_file = config.base_configuration_reference
        config_file if config_file && config_file.name =~ XCCONFIG_NAMES
      end.compact
      unless config_files.empty?
        UI.section('Deleting configuration file references') do
          config_files.each do |file_reference|
            UI.puts("- #{file_reference.name}")
            file_reference.remove_from_project
          end
        end
      end
    end

    def delete_pods_file_references(project)
      # The following implementation goes for files and empty groups so it
      # should catch cases where a user has changed the structure manually.

      groups = project.main_group.recursive_children_groups
      groups << project.main_group

      pod_files = groups.flat_map do |group|
        group.files.select do |obj|
          obj.name =~ XCCONFIG_NAMES ||
            obj.path =~ /^(libPods.*\.a)|(Pods_.*\.framework)$/i
        end
      end

      unless pod_files.empty?
        UI.section('Deleting Pod file references from project') do
          pod_files.each do |file_reference|
            UI.puts("- #{file_reference.name || file_reference.path}")
            file_reference.remove_from_project
          end
        end
      end

      # Delete empty `Pods` group if exists
      delete_empty_group(project, 'Pods')
      delete_empty_group(project, 'Frameworks')
    end
  end
end
