module Xcodeproj
  require 'colored2'
  require 'claide'

  class Command < CLAide::Command
    require 'xcodeproj/command/config_dump'
    require 'xcodeproj/command/target_diff'
    require 'xcodeproj/command/project_diff'
    require 'xcodeproj/command/show'
    require 'xcodeproj/command/sort'

    self.abstract_command = true
    self.command = 'xcodeproj'
    self.version = VERSION
    self.description = 'Xcodeproj lets you create and modify Xcode projects from Ruby.'
    self.plugin_prefixes = %w(claide xcodeproj)

    def initialize(argv)
      super
      unless self.ansi_output?
        Colored2.disable!
        String.send(:define_method, :colorize) { |string, _| string }
      end
    end

    private

    def xcodeproj_path
      unless @xcodeproj_path
        projects = Dir.glob('*.xcodeproj')
        if projects.size == 1
          xcodeproj_path = projects.first
        elsif projects.size > 1
          raise Informative, 'There are more than one Xcode project documents ' \
                             'in the current working directory. Please specify ' \
                             'the project as the first argument, or specify ' \
                             'which to use with the --project option if using ' \
                             'target-diff.'
        else
          raise Informative, 'No Xcode project document found in the current ' \
                             'working directory. Please specify the project ' \
                             'as the first argument, or specify which to use ' \
                             'with the --project option if using target-diff.' \
        end
        @xcodeproj_path = Pathname.new(xcodeproj_path).expand_path
      end
      @xcodeproj_path
    end

    def open_project!(*paths)
      if paths.empty?
        [xcodeproj]
      else
        paths.map { |path| Project.open(path) }
      end
    end

    def xcodeproj_path=(path)
      @xcodeproj_path = path && Pathname.new(path).expand_path
    end

    def xcodeproj
      @xcodeproj ||= Project.open(xcodeproj_path)
    end
  end
end
