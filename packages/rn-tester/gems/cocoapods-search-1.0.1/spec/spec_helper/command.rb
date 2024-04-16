module SpecHelper
  module Command
    def argv(*argv)
      CLAide::ARGV.new(argv)
    end

    def command(*argv)
      argv += ['--no-ansi', '--no-pager']
      Pod::Command.parse(argv)
    end

    def run_command(*args)
      Dir.chdir(SpecHelper.temporary_directory) do
        Pod::UI.output = ''
        # @todo Remove this once all cocoapods has
        # been converted to use the UI.puts
        config_silent = config.silent?
        config.silent = false
        cmd = command(*args)
        cmd.validate!
        cmd.run
        config.silent = config_silent
        Pod::UI.output
      end
    end
  end
end
