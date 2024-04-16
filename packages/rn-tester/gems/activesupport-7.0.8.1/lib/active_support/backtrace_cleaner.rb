# frozen_string_literal: true

module ActiveSupport
  # Backtraces often include many lines that are not relevant for the context
  # under review. This makes it hard to find the signal amongst the backtrace
  # noise, and adds debugging time. With a BacktraceCleaner, filters and
  # silencers are used to remove the noisy lines, so that only the most relevant
  # lines remain.
  #
  # Filters are used to modify lines of data, while silencers are used to remove
  # lines entirely. The typical filter use case is to remove lengthy path
  # information from the start of each line, and view file paths relevant to the
  # app directory instead of the file system root. The typical silencer use case
  # is to exclude the output of a noisy library from the backtrace, so that you
  # can focus on the rest.
  #
  #   bc = ActiveSupport::BacktraceCleaner.new
  #   bc.add_filter   { |line| line.gsub(Rails.root.to_s, '') } # strip the Rails.root prefix
  #   bc.add_silencer { |line| /puma|rubygems/.match?(line) } # skip any lines from puma or rubygems
  #   bc.clean(exception.backtrace) # perform the cleanup
  #
  # To reconfigure an existing BacktraceCleaner (like the default one in Rails)
  # and show as much data as possible, you can always call
  # BacktraceCleaner#remove_silencers!, which will restore the
  # backtrace to a pristine state. If you need to reconfigure an existing
  # BacktraceCleaner so that it does not filter or modify the paths of any lines
  # of the backtrace, you can call BacktraceCleaner#remove_filters!
  # These two methods will give you a completely untouched backtrace.
  #
  # Inspired by the Quiet Backtrace gem by thoughtbot.
  class BacktraceCleaner
    def initialize
      @filters, @silencers = [], []
      add_gem_filter
      add_gem_silencer
      add_stdlib_silencer
    end

    # Returns the backtrace after all filters and silencers have been run
    # against it. Filters run first, then silencers.
    def clean(backtrace, kind = :silent)
      filtered = filter_backtrace(backtrace)

      case kind
      when :silent
        silence(filtered)
      when :noise
        noise(filtered)
      else
        filtered
      end
    end
    alias :filter :clean

    # Adds a filter from the block provided. Each line in the backtrace will be
    # mapped against this filter.
    #
    #   # Will turn "/my/rails/root/app/models/person.rb" into "/app/models/person.rb"
    #   backtrace_cleaner.add_filter { |line| line.gsub(Rails.root, '') }
    def add_filter(&block)
      @filters << block
    end

    # Adds a silencer from the block provided. If the silencer returns +true+
    # for a given line, it will be excluded from the clean backtrace.
    #
    #   # Will reject all lines that include the word "puma", like "/gems/puma/server.rb" or "/app/my_puma_server/rb"
    #   backtrace_cleaner.add_silencer { |line| /puma/.match?(line) }
    def add_silencer(&block)
      @silencers << block
    end

    # Removes all silencers, but leaves in the filters. Useful if your
    # context of debugging suddenly expands as you suspect a bug in one of
    # the libraries you use.
    def remove_silencers!
      @silencers = []
    end

    # Removes all filters, but leaves in the silencers. Useful if you suddenly
    # need to see entire filepaths in the backtrace that you had already
    # filtered out.
    def remove_filters!
      @filters = []
    end

    private
      FORMATTED_GEMS_PATTERN = /\A[^\/]+ \([\w.]+\) /

      def add_gem_filter
        gems_paths = (Gem.path | [Gem.default_dir]).map { |p| Regexp.escape(p) }
        return if gems_paths.empty?

        gems_regexp = %r{\A(#{gems_paths.join('|')})/(bundler/)?gems/([^/]+)-([\w.]+)/(.*)}
        gems_result = '\3 (\4) \5'
        add_filter { |line| line.sub(gems_regexp, gems_result) }
      end

      def add_gem_silencer
        add_silencer { |line| FORMATTED_GEMS_PATTERN.match?(line) }
      end

      def add_stdlib_silencer
        add_silencer { |line| line.start_with?(RbConfig::CONFIG["rubylibdir"]) }
      end

      def filter_backtrace(backtrace)
        @filters.each do |f|
          backtrace = backtrace.map { |line| f.call(line) }
        end

        backtrace
      end

      def silence(backtrace)
        @silencers.each do |s|
          backtrace = backtrace.reject { |line| s.call(line) }
        end

        backtrace
      end

      def noise(backtrace)
        backtrace.select do |line|
          @silencers.any? do |s|
            s.call(line)
          end
        end
      end
  end
end
