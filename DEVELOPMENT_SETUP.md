# React Native Development Setup

## ✅ Setup Complete

Your React Native fork is now set up and ready for development!

## 🛠 Available Commands

### Core Development
- `yarn test` - Run all JavaScript tests
- `yarn flow-check` - Run Flow type checking
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn build` - Build the project

### Testing & Validation
- `yarn test-ci` - Run tests in CI mode
- `yarn test-typescript` - Test TypeScript definitions
- `yarn test-ios` - Run iOS tests (requires Xcode)
- `yarn test-android` - Run Android tests (requires Android SDK)

### RN Tester App
- `yarn start` - Start Metro bundler for RN Tester
- `yarn android` - Run RN Tester on Android
- `yarn ios` - Run RN Tester on iOS

## 📁 Key Directories

- `packages/react-native/` - Main React Native package
- `packages/rn-tester/` - Test app for development
- `packages/react-native-codegen/` - Code generation tools
- `scripts/` - Build and release scripts

## 🔧 Development Workflow

1. **Find an Issue**: Look for "good first issue" labels on GitHub
2. **Create Branch**: `git checkout -b fix/issue-description`
3. **Make Changes**: Edit relevant files
4. **Test Changes**: Run `yarn test` and relevant platform tests
5. **Lint Code**: Run `yarn lint` and `yarn flow-check`
6. **Test RN Tester**: Verify changes work in the test app
7. **Submit PR**: Push branch and create pull request

## 🚀 Quick Start for Issues

### JavaScript/TypeScript Issues
1. Make changes in `packages/react-native/Libraries/`
2. Run `yarn test` to verify
3. Test in RN Tester app

### Native iOS Issues
1. Make changes in `packages/react-native/React/` or `packages/react-native/ReactCommon/`
2. Run `yarn test-ios`
3. Test in RN Tester iOS app

### Native Android Issues
1. Make changes in `packages/react-native/ReactAndroid/`
2. Run `yarn test-android`
3. Test in RN Tester Android app

## 📋 System Requirements Met

- ✅ Node.js v20.19.4
- ✅ npm v10.8.2
- ✅ Yarn v1.22.22
- ✅ Xcode (for iOS development)
- ⚠️  Java (needed for Android development)

## 🔗 Useful Links

- [Contributing Guide](https://reactnative.dev/docs/contributing)
- [Good First Issues](https://github.com/facebook/react-native/labels/good%20first%20issue)
- [React Native Website](https://reactnative.dev/)

## 🎯 Ready to Contribute!

Your environment is set up and all tests are passing. You can now start working on React Native issues!