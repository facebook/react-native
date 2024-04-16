# frozen_string_literal: true

require "fileutils"

class File
  # Write to a file atomically. Useful for situations where you don't
  # want other processes or threads to see half-written files.
  #
  #   File.atomic_write('important.file') do |file|
  #     file.write('hello')
  #   end
  #
  # This method needs to create a temporary file. By default it will create it
  # in the same directory as the destination file. If you don't like this
  # behavior you can provide a different directory but it must be on the
  # same physical filesystem as the file you're trying to write.
  #
  #   File.atomic_write('/data/something.important', '/data/tmp') do |file|
  #     file.write('hello')
  #   end
  def self.atomic_write(file_name, temp_dir = dirname(file_name))
    require "tempfile" unless defined?(Tempfile)

    Tempfile.open(".#{basename(file_name)}", temp_dir) do |temp_file|
      temp_file.binmode
      return_val = yield temp_file
      temp_file.close

      old_stat = if exist?(file_name)
        # Get original file permissions
        stat(file_name)
      else
        # If not possible, probe which are the default permissions in the
        # destination directory.
        probe_stat_in(dirname(file_name))
      end

      if old_stat
        # Set correct permissions on new file
        begin
          chown(old_stat.uid, old_stat.gid, temp_file.path)
          # This operation will affect filesystem ACL's
          chmod(old_stat.mode, temp_file.path)
        rescue Errno::EPERM, Errno::EACCES
          # Changing file ownership failed, moving on.
        end
      end

      # Overwrite original file with temp file
      rename(temp_file.path, file_name)
      return_val
    end
  end

  # Private utility method.
  def self.probe_stat_in(dir) # :nodoc:
    basename = [
      ".permissions_check",
      Thread.current.object_id,
      Process.pid,
      rand(1000000)
    ].join(".")

    file_name = join(dir, basename)
    FileUtils.touch(file_name)
    stat(file_name)
  rescue Errno::ENOENT
    file_name = nil
  ensure
    FileUtils.rm_f(file_name) if file_name
  end
end
