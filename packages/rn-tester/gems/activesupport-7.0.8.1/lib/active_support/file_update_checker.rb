# frozen_string_literal: true

require "active_support/core_ext/time/calculations"

module ActiveSupport
  # FileUpdateChecker specifies the API used by Rails to watch files
  # and control reloading. The API depends on four methods:
  #
  # * +initialize+ which expects two parameters and one block as
  #   described below.
  #
  # * +updated?+ which returns a boolean if there were updates in
  #   the filesystem or not.
  #
  # * +execute+ which executes the given block on initialization
  #   and updates the latest watched files and timestamp.
  #
  # * +execute_if_updated+ which just executes the block if it was updated.
  #
  # After initialization, a call to +execute_if_updated+ must execute
  # the block only if there was really a change in the filesystem.
  #
  # This class is used by Rails to reload the I18n framework whenever
  # they are changed upon a new request.
  #
  #   i18n_reloader = ActiveSupport::FileUpdateChecker.new(paths) do
  #     I18n.reload!
  #   end
  #
  #   ActiveSupport::Reloader.to_prepare do
  #     i18n_reloader.execute_if_updated
  #   end
  class FileUpdateChecker
    # It accepts two parameters on initialization. The first is an array
    # of files and the second is an optional hash of directories. The hash must
    # have directories as keys and the value is an array of extensions to be
    # watched under that directory.
    #
    # This method must also receive a block that will be called once a path
    # changes. The array of files and list of directories cannot be changed
    # after FileUpdateChecker has been initialized.
    def initialize(files, dirs = {}, &block)
      unless block
        raise ArgumentError, "A block is required to initialize a FileUpdateChecker"
      end

      @files = files.freeze
      @glob  = compile_glob(dirs)
      @block = block

      @watched    = nil
      @updated_at = nil

      @last_watched   = watched
      @last_update_at = updated_at(@last_watched)
    end

    # Check if any of the entries were updated. If so, the watched and/or
    # updated_at values are cached until the block is executed via +execute+
    # or +execute_if_updated+.
    def updated?
      current_watched = watched
      if @last_watched.size != current_watched.size
        @watched = current_watched
        true
      else
        current_updated_at = updated_at(current_watched)
        if @last_update_at < current_updated_at
          @watched    = current_watched
          @updated_at = current_updated_at
          true
        else
          false
        end
      end
    end

    # Executes the given block and updates the latest watched files and
    # timestamp.
    def execute
      @last_watched   = watched
      @last_update_at = updated_at(@last_watched)
      @block.call
    ensure
      @watched = nil
      @updated_at = nil
    end

    # Execute the block given if updated.
    def execute_if_updated
      if updated?
        yield if block_given?
        execute
        true
      else
        false
      end
    end

    private
      def watched
        @watched || begin
          all = @files.select { |f| File.exist?(f) }
          all.concat(Dir[@glob]) if @glob
          all
        end
      end

      def updated_at(paths)
        @updated_at || max_mtime(paths) || Time.at(0)
      end

      # This method returns the maximum mtime of the files in +paths+, or +nil+
      # if the array is empty.
      #
      # Files with a mtime in the future are ignored. Such abnormal situation
      # can happen for example if the user changes the clock by hand. It is
      # healthy to consider this edge case because with mtimes in the future
      # reloading is not triggered.
      def max_mtime(paths)
        time_now = Time.now
        max_mtime = nil

        # Time comparisons are performed with #compare_without_coercion because
        # AS redefines these operators in a way that is much slower and does not
        # bring any benefit in this particular code.
        #
        # Read t1.compare_without_coercion(t2) < 0 as t1 < t2.
        paths.each do |path|
          mtime = File.mtime(path)

          next if time_now.compare_without_coercion(mtime) < 0

          if max_mtime.nil? || max_mtime.compare_without_coercion(mtime) < 0
            max_mtime = mtime
          end
        end

        max_mtime
      end

      def compile_glob(hash)
        hash.freeze # Freeze so changes aren't accidentally pushed
        return if hash.empty?

        globs = hash.map do |key, value|
          "#{escape(key)}/**/*#{compile_ext(value)}"
        end
        "{#{globs.join(",")}}"
      end

      def escape(key)
        key.gsub(",", '\,')
      end

      def compile_ext(array)
        array = Array(array)
        return if array.empty?
        ".{#{array.join(",")}}"
      end
  end
end
