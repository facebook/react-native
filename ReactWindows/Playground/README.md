# Running the React Native UWP Playground App 

This guide contains instructions for building the UWP code for React Native

## Supported Operating Systems

This setup has only been tested on Windows 10 so far.  

## Prerequisites

Assuming you have [Visual Studio 2015 Enterprise](\\products\PUBLIC\Products\Developers) installed, you will also need to have Windows 10 SDK installed. 

Clone this repo onto your local machine.
```
git clone https://github.com/CatalystCode/react-native.git
cd react-native
git fetch
git checkout ReactWindows
```
Install all the node dependencies for the project and start the local-cli bundle server. The initial bundling can take up to one minute to package.
```
npm install
node local-cli\cli.js start
```

Build your environment :

- Open up ReactNative.sln solution file in Visual Studio 2015. The solution file can be found in .\react-native\ReactWindows\ReactNative.sln.
- If this is your first time using UWP, you will have to install the SDK. Right click on the solution file in the solution explorer and select the option labeled "Install Missing Components". You'll likely have to shutdown Visual Studio to continue the installation.
- You can start building the solution once all the packages are installed Build->Rebuild Solution. 

Run the Playground App:

- Set the Playground project as your StartUp project in Visual Studio.
- Run the app on your targeted device.

Change Application view
- You can edit the file .\react-native\ReactWindows\Playground\index.ios.js while the local-cli bundle server is running to get live changes to your app. 

## Troubleshooting

### The local-cli bundle server is returning an error response.

If you use Git on Windows and your default settings checkout files with Windows line endings, the node-haste dependency will mistakenly pick up dependencies in the comments sections of JavaScript files. There is an active pull request on the node haste repository (https://github.com/facebook/node-haste/pull/48) that addresses this issue. Until this pull request is merged, and the dependency is updated in the upstream repository, you'll have to make the same changes in .\react-native\node_modules\node-haste\lib\lib\extractRequires.js.

After you make the edits to the node-haste module, you'll need to re-run the local-cli bundle server with an option to reset the cache.
```
node local-cli\cli.js start --reset-cache
```
