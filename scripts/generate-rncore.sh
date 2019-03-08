find "$PWD/Libraries" -name "*Schema.js" | xargs yarn flow-node packages/react-native-codegen/buck_tests/combine-js-to-schema-cli.js schema-rncore.json
yarn flow-node packages/react-native-codegen/buck_tests/generate-tests.js schema-rncore.json rncore ReactCommon/fabric/components/rncore
