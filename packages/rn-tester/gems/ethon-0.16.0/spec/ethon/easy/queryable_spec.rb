# encoding: utf-8
# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Queryable do
  let(:hash) { {} }
  let!(:easy) { Ethon::Easy.new }
  let(:params) { Ethon::Easy::Params.new(easy, hash) }

  describe "#to_s" do
    context "when query_pairs empty" do
      before { params.instance_variable_set(:@query_pairs, []) }

      it "returns empty string" do
        expect(params.to_s).to eq("")
      end
    end

    context "when query_pairs not empty" do
      context "when escape" do
        before do
          params.escape = true
        end

        {
          '!' => '%21', '*' => '%2A', "'" => '%27', '(' => '%28',
          ')'  => '%29', ';' => '%3B', ':' => '%3A', '@' => '%40',
          '&' => '%26', '=' => '%3D', '+' => '%2B', '$' => '%24',
          ',' => '%2C', '/' => '%2F', '?' => '%3F', '#' => '%23',
          '[' => '%5B', ']' => '%5D',

          '<' => '%3C', '>' => '%3E', '"' => '%22', '{' => '%7B',
          '}' => '%7D', '|' => '%7C', '\\' => '%5C', '`' => '%60',
          '^' => '%5E', '%' => '%25', ' ' => '%20', "\0" => '%00',

          'まつもと' => '%E3%81%BE%E3%81%A4%E3%82%82%E3%81%A8',
        }.each do |value, percent|
          it "turns #{value.inspect} into #{percent}" do
            params.instance_variable_set(:@query_pairs, [[:a, value]])
            expect(params.to_s).to eq("a=#{percent}")
          end
        end

        {
          '.' => '%2E', '-' => '%2D', '_' => '%5F', '~' => '%7E',
        }.each do |value, percent|
          it "leaves #{value.inspect} instead of turning into #{percent}" do
            params.instance_variable_set(:@query_pairs, [[:a, value]])
            expect(params.to_s).to eq("a=#{value}")
          end
        end
      end

      context "when no escape" do
        before { params.instance_variable_set(:@query_pairs, [[:a, 1], [:b, 2]]) }

        it "returns concatenated query string" do
          expect(params.to_s).to eq("a=1&b=2")
        end
      end
    end

    context "when query_pairs contains a string" do
      before { params.instance_variable_set(:@query_pairs, ["{a: 1}"]) }

      it "returns correct string" do
        expect(params.to_s).to eq("{a: 1}")
      end
    end
  end

  describe "#build_query_pairs" do
    let(:pairs) { params.method(:build_query_pairs).call(hash) }

    context "when params is empty" do
      it "returns empty array" do
        expect(pairs).to eq([])
      end
    end

    context "when params is string" do
      let(:hash) { "{a: 1}" }

      it "wraps it in an array" do
        expect(pairs).to eq([hash])
      end
    end

    context "when params is simple hash" do
      let(:hash) { {:a => 1, :b => 2} }

      it "transforms" do
        expect(pairs).to include([:a, 1])
        expect(pairs).to include([:b, 2])
      end
    end

    context "when params is a nested hash" do
      let(:hash) { {:a => 1, :b => {:c => 2}} }

      it "transforms" do
        expect(pairs).to include([:a, 1])
        expect(pairs).to include(["b[c]", 2])
      end
    end

    context "when params contains an array" do
      let(:hash) { {:a => 1, :b => [2, 3]} }

      context "by default" do
        it "transforms" do
          expect(pairs).to include([:a, 1])
          expect(pairs).to include(["b[0]", 2])
          expect(pairs).to include(["b[1]", 3])
        end
      end

      context "when params_encoding is :rack" do
        before { params.params_encoding = :rack }
        it "transforms without indexes" do
          expect(pairs).to include([:a, 1])
          expect(pairs).to include(["b[]", 2])
          expect(pairs).to include(["b[]", 3])
        end
      end

      context "when params_encoding is :none" do
        before { params.params_encoding = :none }
        it "does no transformation" do
          expect(pairs).to include([:a, 1])
          expect(pairs).to include([:b, [2, 3]])
        end
      end
    end

    context "when params contains something nested in an array" do
      context "when string" do
        let(:hash) { {:a => {:b => ["hello", "world"]}} }

        it "transforms" do
          expect(pairs).to eq([["a[b][0]", "hello"], ["a[b][1]", "world"]])
        end
      end

      context "when hash" do
        let(:hash) { {:a => {:b => [{:c =>1}, {:d => 2}]}} }

        it "transforms" do
          expect(pairs).to eq([["a[b][0][c]", 1], ["a[b][1][d]", 2]])
        end
      end

      context "when file" do
        let(:file) { File.open("spec/spec_helper.rb") }
        let(:file_info) { params.method(:file_info).call(file) }
        let(:hash) { {:a => {:b => [file]}} }
        let(:mime_type) { file_info[1] }

        it "transforms" do
          expect(pairs).to eq([["a[b][0]", file_info]])
        end

        context "when MIME" do
          if defined?(MIME)
            context "when mime type" do
              it "sets mime type to text" do
                expect(mime_type).to eq("application/x-ruby")
              end
            end
          end

          context "when no mime type" do
            let(:file) { Tempfile.new("fubar") }

            it "sets mime type to default application/octet-stream" do
              expect(mime_type).to eq("application/octet-stream")
            end
          end
        end

        context "when no MIME" do
          before { hide_const("MIME") }

          it "sets mime type to default application/octet-stream" do
            expect(mime_type).to eq("application/octet-stream")
          end
        end
      end
    end


    context "when params contains file" do
      let(:file) { Tempfile.new("fubar") }
      let(:file_info) { params.method(:file_info).call(file) }
      let(:hash) { {:a => 1, :b => file} }

      it "transforms" do
        expect(pairs).to include([:a, 1])
        expect(pairs).to include([:b, file_info])
      end
    end

    context "when params key contains a null byte" do
      let(:hash) { {:a => "1\0" } }

      it "preserves" do
        expect(pairs).to eq([[:a, "1\0"]])
      end
    end

    context "when params value contains a null byte" do
      let(:hash) { {"a\0" => 1 } }

      it "preserves" do
        expect(pairs).to eq([["a\0", 1]])
      end
    end
  end

  describe "#empty?" do
    context "when params empty" do
      it "returns true" do
        expect(params.empty?).to be_truthy
      end
    end

    context "when params not empty" do
      let(:hash) { {:a => 1} }

      it "returns false" do
        expect(params.empty?).to be_falsey
      end
    end
  end
end
