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
Start the local-cli bundle server. The initial bundling can take up to one minute to package.
```
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
