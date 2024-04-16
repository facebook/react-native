require 'cocoapods/user_interface/error_report'

module Pod
  class Command
    class Env < Command
      self.summary = 'Display pod environment'
      self.description = 'Display pod environment.'

      def self.options
        options = []
        options.concat(super.reject { |option, _| option == '--silent' })
      end

      def initialize(argv)
        super
        config.silent = false
      end

      def run
        UI.puts report
      end

      def report
        <<-EOS

#{stack}
#{executable_path}
### Plugins

```
#{plugins_string}
```
#{markdown_podfile}
EOS
      end

      def stack
        UI::ErrorReport.stack
      end

      def markdown_podfile
        UI::ErrorReport.markdown_podfile
      end

      def plugins_string
        UI::ErrorReport.plugins_string
      end

      private

      def executable_path
        <<-EOS
### Installation Source

```
Executable Path: #{actual_path}
```
EOS
      end

      def actual_path
        $PROGRAM_NAME
      end
    end
  end
end
