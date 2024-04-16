module Pod
  class TrySettings
    attr_accessor :pre_install_commands, :project_path

    # Creates a TrySettings instance based on a folder path
    #
    def self.settings_from_folder(path)
      settings_path = Pathname.new(path) + '.cocoapods.yml'
      return TrySettings.new unless File.exist? settings_path

      settings = YAMLHelper.load_file(settings_path)
      try_settings = TrySettings.new
      return try_settings unless settings['try']

      if settings['try']['install']
        try_settings.pre_install_commands = Array(settings['try']['install']['pre'])
      end

      if settings['try']['project']
        try_settings.project_path = Pathname.new(path) + settings['try']['project']
      end

      try_settings
    end

    # If we need to run commands from pod-try we should let the users know
    # what is going to be running on their device.
    #
    def prompt_for_permission
      UI.titled_section 'Running Pre-Install Commands' do
        commands = pre_install_commands.length > 1 ? 'commands' : 'command'
        UI.puts "In order to try this pod, CocoaPods-Try needs to run the following #{commands}:"
        pre_install_commands.each { |command| UI.puts " - #{command}" }
        UI.puts "\nPress return to run these #{commands}, or press `ctrl + c` to stop trying this pod."
      end

      # Give an elegant exit point.
      UI.gets.chomp
    end

    # Runs the pre_install_commands from
    #
    # @param  [Bool] prompt
    #         Should CocoaPods-Try show a prompt with the commands to the user.
    #
    def run_pre_install_commands(prompt)
      if pre_install_commands
        prompt_for_permission if prompt
        pre_install_commands.each { |command| Executable.execute_command('bash', ['-ec', command], true) }
      end
    end
  end
end
