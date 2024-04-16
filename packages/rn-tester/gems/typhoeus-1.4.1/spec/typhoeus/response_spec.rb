require 'spec_helper'

describe Typhoeus::Response do
  let(:response) { Typhoeus::Response.new(options) }
  let(:options) { {} }

  describe ".new" do
    context "when options" do
      context "when return_code" do
        let(:options) { {:return_code => 2} }

        it "stores" do
          expect(response.options[:return_code]).to be(2)
        end
      end

      context "when headers" do
        let(:options) { {:headers => {'A' => 'B'}} }

        it "stores unmodified" do
          expect(response.options[:headers]).to be(options[:headers])
        end

        it "sets @headers to a Typhoeus::Response::Header" do
          expect(response.instance_variable_get(:@headers)).to be_a(Typhoeus::Response::Header)
        end

        it "has key" do
          expect(response.headers['A']).to eq('B')
        end
      end
    end
  end

  describe "#mock" do
    context "when @mock" do
      before { response.mock = true }

      it "returns @mock" do
        expect(response.mock).to be_truthy
      end
    end

    context "when options[:mock]" do
      let(:options) { {:mock => true} }

      it "returns options[:mock]" do
        expect(response.mock).to be_truthy
      end
    end

    context "when @mock and options[:mock]" do
      let(:options) { {:mock => 1} }
      before { response.mock = 2 }

      it "returns @mock" do
        expect(response.mock).to be(2)
      end
    end
  end

  describe "#handled_response" do
    let(:handled_response) { Typhoeus::Response.new }

    context "when @handled_response" do
      before { response.handled_response = handled_response }

      it "returns @handled_response" do
        expect(response.handled_response).to be(handled_response)
      end
    end

    context "when @handled_response is nil" do
      before { response.handled_response = nil }

      it "returns response" do
        expect(response.handled_response).to be(response)
      end
    end
  end

  describe "#cached" do
    context "when @cached" do
      before { response.cached = true }

      it "returns cached status" do
        expect(response.cached?).to be_truthy
      end
    end

    context "when @cached is nil" do
      before { response.cached = nil }

      it "returns false" do
        expect(response.cached?).to be_falsey
      end
    end

  end
end
