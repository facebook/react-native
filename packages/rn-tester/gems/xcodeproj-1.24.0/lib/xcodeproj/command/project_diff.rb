module Xcodeproj
  class Command
    class ProjectDiff < Command
      self.summary = 'Shows the difference between two projects'

      self.description = summary + <<-EOS.gsub(/ {8}/, '')

        It shows the difference in a UUID agnostic fashion.

        To reduce the noise (and to simplify implementation) differences in the
        order of arrays are ignored.
      EOS

      def self.options
        [
          ['--ignore=KEY', 'A key to ignore in the comparison. Can be specified multiple times.'],
        ].concat(super)
      end

      self.arguments = [
        CLAide::Argument.new('PROJECT1', true),
        CLAide::Argument.new('PROJECT2', true),
      ]

      def initialize(argv)
        @path_project1  = argv.shift_argument
        @path_project2  = argv.shift_argument
        @keys_to_ignore = argv.all_options('ignore')
        super
      end

      def validate!
        super
        @project1, @project2 = open_project!(@path_project1, @path_project2)
      end

      def run
        hash_1 = @project1.to_tree_hash.dup
        hash_2 = @project2.to_tree_hash.dup
        @keys_to_ignore.each do |key|
          Differ.clean_hash!(hash_1, key)
          Differ.clean_hash!(hash_2, key)
        end

        diff = Differ.project_diff(hash_1, hash_2, @path_project1, @path_project2)

        require 'yaml'
        yaml = diff.to_yaml
        yaml.gsub!(@path_project1, @path_project1.cyan)
        yaml.gsub!(@path_project2, @path_project2.magenta)
        yaml.gsub!(':diff:', 'diff:'.yellow)
        puts yaml
      end
    end
  end
end
