# frozen_string_literal: true

require "active_support/core_ext/enumerable"

module ActiveSupport
  module Testing
    module Assertions
      UNTRACKED = Object.new # :nodoc:

      # Asserts that an expression is not truthy. Passes if <tt>object</tt> is
      # +nil+ or +false+. "Truthy" means "considered true in a conditional"
      # like <tt>if foo</tt>.
      #
      #   assert_not nil    # => true
      #   assert_not false  # => true
      #   assert_not 'foo'  # => Expected "foo" to be nil or false
      #
      # An error message can be specified.
      #
      #   assert_not foo, 'foo should be false'
      def assert_not(object, message = nil)
        message ||= "Expected #{mu_pp(object)} to be nil or false"
        assert !object, message
      end

      # Assertion that the block should not raise an exception.
      #
      # Passes if evaluated code in the yielded block raises no exception.
      #
      #   assert_nothing_raised do
      #     perform_service(param: 'no_exception')
      #   end
      def assert_nothing_raised
        yield
      rescue => error
        raise Minitest::UnexpectedError.new(error)
      end

      # Test numeric difference between the return value of an expression as a
      # result of what is evaluated in the yielded block.
      #
      #   assert_difference 'Article.count' do
      #     post :create, params: { article: {...} }
      #   end
      #
      # An arbitrary expression is passed in and evaluated.
      #
      #   assert_difference 'Article.last.comments(:reload).size' do
      #     post :create, params: { comment: {...} }
      #   end
      #
      # An arbitrary positive or negative difference can be specified.
      # The default is <tt>1</tt>.
      #
      #   assert_difference 'Article.count', -1 do
      #     post :delete, params: { id: ... }
      #   end
      #
      # An array of expressions can also be passed in and evaluated.
      #
      #   assert_difference [ 'Article.count', 'Post.count' ], 2 do
      #     post :create, params: { article: {...} }
      #   end
      #
      # A hash of expressions/numeric differences can also be passed in and evaluated.
      #
      #   assert_difference ->{ Article.count } => 1, ->{ Notification.count } => 2 do
      #     post :create, params: { article: {...} }
      #   end
      #
      # A lambda or a list of lambdas can be passed in and evaluated:
      #
      #   assert_difference ->{ Article.count }, 2 do
      #     post :create, params: { article: {...} }
      #   end
      #
      #   assert_difference [->{ Article.count }, ->{ Post.count }], 2 do
      #     post :create, params: { article: {...} }
      #   end
      #
      # An error message can be specified.
      #
      #   assert_difference 'Article.count', -1, 'An Article should be destroyed' do
      #     post :delete, params: { id: ... }
      #   end
      def assert_difference(expression, *args, &block)
        expressions =
          if expression.is_a?(Hash)
            message = args[0]
            expression
          else
            difference = args[0] || 1
            message = args[1]
            Array(expression).index_with(difference)
          end

        exps = expressions.keys.map { |e|
          e.respond_to?(:call) ? e : lambda { eval(e, block.binding) }
        }
        before = exps.map(&:call)

        retval = _assert_nothing_raised_or_warn("assert_difference", &block)

        expressions.zip(exps, before) do |(code, diff), exp, before_value|
          error  = "#{code.inspect} didn't change by #{diff}"
          error  = "#{message}.\n#{error}" if message
          assert_equal(before_value + diff, exp.call, error)
        end

        retval
      end

      # Assertion that the numeric result of evaluating an expression is not
      # changed before and after invoking the passed in block.
      #
      #   assert_no_difference 'Article.count' do
      #     post :create, params: { article: invalid_attributes }
      #   end
      #
      # A lambda can be passed in and evaluated.
      #
      #   assert_no_difference -> { Article.count } do
      #     post :create, params: { article: invalid_attributes }
      #   end
      #
      # An error message can be specified.
      #
      #   assert_no_difference 'Article.count', 'An Article should not be created' do
      #     post :create, params: { article: invalid_attributes }
      #   end
      #
      # An array of expressions can also be passed in and evaluated.
      #
      #   assert_no_difference [ 'Article.count', -> { Post.count } ] do
      #     post :create, params: { article: invalid_attributes }
      #   end
      def assert_no_difference(expression, message = nil, &block)
        assert_difference expression, 0, message, &block
      end

      # Assertion that the result of evaluating an expression is changed before
      # and after invoking the passed in block.
      #
      #   assert_changes 'Status.all_good?' do
      #     post :create, params: { status: { ok: false } }
      #   end
      #
      # You can pass the block as a string to be evaluated in the context of
      # the block. A lambda can be passed for the block as well.
      #
      #   assert_changes -> { Status.all_good? } do
      #     post :create, params: { status: { ok: false } }
      #   end
      #
      # The assertion is useful to test side effects. The passed block can be
      # anything that can be converted to string with #to_s.
      #
      #   assert_changes :@object do
      #     @object = 42
      #   end
      #
      # The keyword arguments +:from+ and +:to+ can be given to specify the
      # expected initial value and the expected value after the block was
      # executed.
      #
      #   assert_changes :@object, from: nil, to: :foo do
      #     @object = :foo
      #   end
      #
      # An error message can be specified.
      #
      #   assert_changes -> { Status.all_good? }, 'Expected the status to be bad' do
      #     post :create, params: { status: { incident: true } }
      #   end
      def assert_changes(expression, message = nil, from: UNTRACKED, to: UNTRACKED, &block)
        exp = expression.respond_to?(:call) ? expression : -> { eval(expression.to_s, block.binding) }

        before = exp.call
        retval = _assert_nothing_raised_or_warn("assert_changes", &block)

        unless from == UNTRACKED
          error = "Expected change from #{from.inspect}"
          error = "#{message}.\n#{error}" if message
          assert from === before, error
        end

        after = exp.call

        error = "#{expression.inspect} didn't change"
        error = "#{error}. It was already #{to}" if before == to
        error = "#{message}.\n#{error}" if message
        refute_equal before, after, error

        unless to == UNTRACKED
          error = "Expected change to #{to}\n"
          error = "#{message}.\n#{error}" if message
          assert to === after, error
        end

        retval
      end

      # Assertion that the result of evaluating an expression is not changed before
      # and after invoking the passed in block.
      #
      #   assert_no_changes 'Status.all_good?' do
      #     post :create, params: { status: { ok: true } }
      #   end
      #
      # Provide the optional keyword argument :from to specify the expected
      # initial value.
      #
      #   assert_no_changes -> { Status.all_good? }, from: true do
      #     post :create, params: { status: { ok: true } }
      #   end
      #
      # An error message can be specified.
      #
      #   assert_no_changes -> { Status.all_good? }, 'Expected the status to be good' do
      #     post :create, params: { status: { ok: false } }
      #   end
      def assert_no_changes(expression, message = nil, from: UNTRACKED, &block)
        exp = expression.respond_to?(:call) ? expression : -> { eval(expression.to_s, block.binding) }

        before = exp.call
        retval = _assert_nothing_raised_or_warn("assert_no_changes", &block)

        unless from == UNTRACKED
          error = "Expected initial value of #{from.inspect}"
          error = "#{message}.\n#{error}" if message
          assert from === before, error
        end

        after = exp.call

        error = "#{expression.inspect} changed"
        error = "#{message}.\n#{error}" if message

        if before.nil?
          assert_nil after, error
        else
          assert_equal before, after, error
        end

        retval
      end

      private
        def _assert_nothing_raised_or_warn(assertion, &block)
          assert_nothing_raised(&block)
        rescue Minitest::UnexpectedError => e
          if tagged_logger && tagged_logger.warn?
            warning = <<~MSG
              #{self.class} - #{name}: #{e.error.class} raised.
              If you expected this exception, use `assert_raises` as near to the code that raises as possible.
              Other block based assertions (e.g. `#{assertion}`) can be used, as long as `assert_raises` is inside their block.
            MSG
            tagged_logger.warn warning
          end

          raise
        end
    end
  end
end
