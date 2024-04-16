# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Http::Head do
  let(:easy) { Ethon::Easy.new }
  let(:url) { "http://localhost:3001/" }
  let(:params) { nil }
  let(:form) { nil }
  let(:head) { described_class.new(url, {:params => params, :body => form}) }

  describe "#setup" do
    context "when nothing" do
      it "sets nobody" do
        expect(easy).to receive(:nobody=).with(true)
        head.setup(easy)
      end

      it "sets url" do
        head.setup(easy)
        expect(easy.url).to eq(url)
      end
    end

    context "when params" do
      let(:params) { {:a => "1&b=2"} }

      it "sets nobody" do
        expect(easy).to receive(:nobody=).with(true)
        head.setup(easy)
      end

      it "attaches escaped to url" do
        head.setup(easy)
        expect(easy.url).to eq("#{url}?a=1%26b%3D2")
      end

      context "when requesting" do
        before do
          head.setup(easy)
          easy.perform
        end

        it "returns ok" do
          expect(easy.return_code).to eq(:ok)
        end

        it "has no body" do
          expect(easy.response_body).to be_empty
        end

        it "requests parameterized url" do
          expect(easy.effective_url).to eq("http://localhost:3001/?a=1%26b%3D2")
        end

        context "when url already contains params" do
          let(:url) { "http://localhost:3001/?query=here" }

          it "requests parameterized url" do
            expect(easy.effective_url).to eq("http://localhost:3001/?query=here&a=1%26b%3D2")
          end
        end
      end
    end

    context "when body" do
      let(:form) { {:a => 1} }

      context "when requesting" do
        before do
          head.setup(easy)
          easy.perform
        end

        it "returns ok" do
          expect(easy.return_code).to eq(:ok)
        end
      end
    end
  end
end
