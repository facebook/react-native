require 'spec_helper'

describe Typhoeus::Expectation do
  let(:options) { {} }
  let(:base_url) { "www.example.com" }
  let(:expectation) { described_class.new(base_url, options) }

  describe ".new" do
    it "sets base_url" do
      expect(expectation.instance_variable_get(:@base_url)).to eq(base_url)
    end

    it "sets options" do
      expect(expectation.instance_variable_get(:@options)).to eq(options)
    end

    it "initializes response_counter" do
      expect(expectation.instance_variable_get(:@response_counter)).to eq(0)
    end
  end

  describe ".all" do
    context "when @expectations nil" do
      it "returns empty array" do
        expect(Typhoeus::Expectation.all).to eq([])
      end
    end

    context "when @expectations not nil" do
      let(:expectations) { [1] }

      it "returns @expectations" do
        Typhoeus::Expectation.instance_variable_set(:@expectations, expectations)
        expect(Typhoeus::Expectation.all).to be(expectations)
      end
    end
  end

  describe ".clear" do
    let(:expectations) { double(:clear) }

    it "clears all" do
      expect(expectations).to receive(:clear)
      Typhoeus::Expectation.instance_variable_set(:@expectations, expectations)
      Typhoeus::Expectation.clear
      Typhoeus::Expectation.instance_variable_set(:@expectations, nil)
    end
  end

  describe ".response_for" do
    let(:request) { Typhoeus::Request.new("") }
    let(:stubbed_response) { Typhoeus::Response.new }

    it "finds a matching expectation and returns its next response" do
      Typhoeus::Expectation.all << expectation
      expect(expectation).to receive(:matches?).with(request).and_return(true)
      expect(expectation).to receive(:response).with(request).and_return(stubbed_response)

      response = Typhoeus::Expectation.response_for(request)

      expect(response).to be(stubbed_response)
    end

    it "returns nil if no matching expectation is found" do
      response = Typhoeus::Expectation.response_for(request)
      expect(response).to be(nil)
    end
  end

  describe "#stubbed_from" do
    it "sets value" do
      expectation.stubbed_from(:webmock)
      expect(expectation.from).to eq(:webmock)
    end

    it "returns self" do
      expect(expectation.stubbed_from(:webmock)).to be(expectation)
    end
  end

  describe "#and_return" do
    context "when value" do
      it "adds to responses" do
        expectation.and_return(1)
        expect(expectation.responses).to eq([1])
      end
    end

    context "when array" do
      it "adds to responses" do
        expectation.and_return([1, 2])
        expect(expectation.responses).to eq([1, 2])
      end
    end

    context "when block" do
      it "adds to responses" do
        block = Proc.new {}
        expectation.and_return(&block)
        expect(expectation.responses).to eq([block])
      end
    end
  end

  describe "#responses" do
    it "returns responses" do
      expect(expectation.responses).to be_a(Array)
    end
  end

  describe "#response" do
    let(:request) { Typhoeus::Request.new("") }

    before { expectation.instance_variable_set(:@responses, responses) }

    context "when one response" do
      context "is pre-constructed" do
        let(:responses) { [Typhoeus::Response.new] }

        it "returns response" do
          expect(expectation.response(request)).to be(responses[0])
        end
      end

      context "is lazily-constructed" do
        def construct_response(request)
          @request_from_response_construction = request
          lazily_constructed_response
        end

        let(:lazily_constructed_response) { Typhoeus::Response.new }
        let(:responses) { [ Proc.new { |request| construct_response(request) } ] }

        it "returns response" do
          expect(expectation.response(request)).to be(lazily_constructed_response)
          expect(@request_from_response_construction).to be(request)
        end
      end
    end

    context "when multiple responses" do
      let(:responses) { [Typhoeus::Response.new, Typhoeus::Response.new, Typhoeus::Response.new] }

      it "returns one by one" do
        3.times do |i|
          expect(expectation.response(request)).to be(responses[i])
        end
      end
    end
  end

  describe "#matches?" do
    let(:request) { double(:base_url => nil) }

    it "calls url_match?" do
      expect(expectation).to receive(:url_match?)
      expectation.matches?(request)
    end

    it "calls options_match?" do
      expect(expectation).to receive(:url_match?).and_return(true)
      expect(expectation).to receive(:options_match?)
      expectation.matches?(request)
    end
  end

  describe "#url_match?" do
    let(:request_url) { "www.example.com" }
    let(:request) { Typhoeus::Request.new(request_url) }
    let(:url_match) { expectation.method(:url_match?).call(request.base_url) }

    context "when string" do
      context "when match" do
        it "returns true" do
          expect(url_match).to be_truthy
        end
      end

      context "when no match" do
        let(:base_url) { "no_match" }

        it "returns false" do
          expect(url_match).to be_falsey
        end
      end
    end

    context "when regexp" do
      context "when match" do
        let(:base_url) { /example/ }

        it "returns true" do
          expect(url_match).to be_truthy
        end
      end

      context "when no match" do
        let(:base_url) { /nomatch/ }

        it "returns false" do
          expect(url_match).to be_falsey
        end

        context "with nil request_url" do
          let(:request_url) { nil }

          it "returns false" do
            expect(url_match).to be_falsey
          end
        end
      end
    end

    context "when nil" do
      let(:base_url) { nil }

      it "returns true" do
        expect(url_match).to be_truthy
      end
    end

    context "when not string, regexp, nil" do
      let(:base_url) { 1 }

      it "returns false" do
        expect(url_match).to be_falsey
      end
    end
  end

  describe "options_match?" do
    let(:request_options) { {} }
    let(:request) { Typhoeus::Request.new(nil, request_options) }
    let(:options_match) { expectation.method(:options_match?).call(request) }

    context "when match" do
      let(:options) { { :a => 1 } }
      let(:request_options) { options }

      it "returns true" do
        expect(options_match).to be_truthy
      end
    end

    context "when options are a subset from request_options" do
      let(:options) { { :a => 1 } }
      let(:request_options) { { :a => 1, :b => 2 } }

      it "returns true" do
        expect(options_match).to be_truthy
      end
    end

    context "when options are nested" do
      let(:options) { { :a => { :b => 1 } } }
      let(:request_options) { options }

      it "returns true" do
        expect(options_match).to be_truthy
      end
    end

    context "when options contains an array" do
      let(:options) { { :a => [1, 2] } }
      let(:request_options) { options }

      it "returns true" do
        expect(options_match).to be_truthy
      end
    end

    context "when no match" do
      let(:options) { { :a => 1 } }

      it "returns false" do
        expect(options_match).to be_falsey
      end
    end
  end
end
