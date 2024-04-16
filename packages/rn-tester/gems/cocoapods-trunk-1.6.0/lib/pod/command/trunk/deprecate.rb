module Pod
  class Command
    class Trunk
      # @CocoaPods 1.0.0.beta.1
      #
      class Deprecate < Trunk
        self.summary = 'Deprecates a pod.'
        self.arguments = [
          CLAide::Argument.new('NAME', true),
        ]

        def self.options
          [
            ['--in-favor-of=OTHER_NAME', 'The pod to deprecate this pod in favor of.'],
          ].concat(super)
        end

        def initialize(argv)
          @name = argv.shift_argument
          @in_favor_of = argv.option('in-favor-of')
          super
        end

        def validate!
          super
          help! 'Please specify a pod name.' unless @name
        end

        def run
          json = deprecate
          print_messages(json['data_url'], json['messages'], nil, nil)
        end

        def deprecate
          body = {
            :in_favor_of => @in_favor_of,
          }.to_json
          response = request_path(:patch, "pods/#{@name}/deprecated", body, auth_headers)
          url = response.headers['location'].first
          json(request_url(:get, url, default_headers))
        rescue REST::Error => e
          raise Informative, 'There was an error deprecating the pod ' \
                                   "via trunk: #{e.message}"
        end
      end
    end
  end
end
