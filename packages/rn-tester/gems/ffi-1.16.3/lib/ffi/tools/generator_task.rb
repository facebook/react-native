require 'ffi/tools/generator'
require 'rake'
require 'rake/tasklib'

##
# Add Rake tasks that generate files with C structs for FFI::Struct and C constants.
#
# @example a simple example for your Rakefile
#   require "ffi/tools/generator_task"
#   # Add a task to generate my_object.rb out of my_object.rb.ffi
#   FFI::Generator::Task.new ["my_object.rb"], cflags: "-I/usr/local/mylibrary"
#
# The generated files are also added to the 'clear' task.
#
# @see FFI::Generator for a description of the file content
class FFI::Generator::Task < Rake::TaskLib

  def initialize(rb_names, options={})
    task :clean do rm_f rb_names end

    rb_names.each do |rb_name|
      ffi_name = "#{rb_name}.ffi"

      file rb_name => ffi_name do |t|
        puts "Generating #{rb_name}..." if Rake.application.options.trace

        FFI::Generator.new ffi_name, rb_name, options
      end
    end
  end

end
