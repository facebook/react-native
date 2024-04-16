module Xcodeproj
  class Command
    class TargetDiff < Command
      self.summary = 'Shows the difference between two targets'

      def self.options
        [
          ['--project PATH', 'The Xcode project document to use.'],
        ].concat(super)
      end

      self.arguments = [
        CLAide::Argument.new('TARGET1', true),
        CLAide::Argument.new('TARGET2', true),
      ]

      def initialize(argv)
        @target1 = argv.shift_argument
        @target2 = argv.shift_argument
        self.xcodeproj_path = argv.option('--project')
        super
      end

      def validate!
        super
        open_project!
      end

      def run
        require 'yaml'
        differ = Helper::TargetDiff.new(xcodeproj, @target1, @target2)
        files = differ.new_source_build_files.map do |build_file|
          {
            'Name' => build_file.file_ref.name,
            'Path' => build_file.file_ref.path,
            'Build settings' => build_file.settings,
          }
        end
        puts files.to_yaml
      end
    end
  end
end
