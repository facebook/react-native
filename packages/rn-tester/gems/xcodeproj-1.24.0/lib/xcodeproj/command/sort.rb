module Xcodeproj
  class Command
    class Sort < Command
      self.description = <<-eos
        Sorts the given project.

        If no `PROJECT' is specified then the current work directory is searched for one.
      eos

      self.summary = 'Sorts the given project.'

      def self.options
        [
          ['--group-option=[above|below]', 'The position of the groups when sorting. If no option is specified, sorting will interleave groups and files.'],
        ].concat(super)
      end

      self.arguments = [
        CLAide::Argument.new('PROJECT', false),
      ]

      def initialize(argv)
        self.xcodeproj_path = argv.shift_argument
        @group_option = argv.option('group-option')
        @group_option &&= @group_option.to_sym
        super
      end

      def validate!
        super
        unless [nil, :above, :below].include?(@group_option)
          help! "Unknown format `#{@group_option}`"
        end
        open_project!
      end

      def run
        xcodeproj.sort(:groups_position => @group_option)
        xcodeproj.save
        puts "The `#{File.basename(xcodeproj_path)}` project was sorted"
      end
    end
  end
end
