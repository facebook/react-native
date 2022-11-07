# The React Native Ecosystem

We aim to build a vibrant and inclusive ecosystem of partners, core contributors, and community that goes beyond the main React Native GitHub repository. This document explains the roles and responsibilities of various stakeholders and provides guidelines for the community organization. The structure outlined in this document has been in place for a while but had not been written down before.

There are three types of stakeholders:

* **Partners:** Companies significantly invested in React Native and take responsibility for the React Native vision and community.
* **Core Contributors:** Individual people who contribute to the React Native project.
* **Community Contributors:** Individuals who support projects in the [react-native-community](https://github.com/react-native-community) organization.

## Partners

Partners are companies that are significantly invested in React Native and demonstrate ownership. Informed by their use of React Native, they push for improvements of the core and/or the ecosystem around it. Examples of this may include large scale contributions to `react-native` or owning essential tools or libraries.

Partners think of React Native as a product; they understand the trade offs that the project makes as well as future plans and goals. Together we shape the vision for React Native to make it the best way to build applications.

Baseline responsibilities of partners include:
* Attending monthly meeting
* Contributing to the release process. Examples include being a [community releaser](https://reactnative.dev/contributing/release-roles-responsibilities#release-role-2-community-releaser), testing new releases, technical support for release issues.
* Engage on the core contributor Discord

Our current partners and other areas of ownership:
* **[Coinbase](https://www.coinbase.com/):** Publishes [posts](https://blog.coinbase.com/tagged/react-native) advocating React Native usage. Supports `@react-native-community/datetimepicker` and other community modules to migrate to the new architecture. Supports releases in testing and feedback.
* **[Callstack](https://callstack.com/):** Maintains the [React Native CLI](https://github.com/react-native-community/react-native-cli) and [other community libraries](https://github.com/callstack), organizes [React Native EU](https://react-native.eu/) and hosts [The React Native Show podcast](https://www.callstack.com/podcast-react-native-show)
* **[Expo](https://expo.dev/):** Builds [Expo Go and SDK](https://github.com/expo/expo), [Snack](https://snack.expo.dev/), and [Expo Application Services](https://expo.dev/eas). Maintains [React Native Directory](https://reactnative.directory/), stewards [React Navigation](https://reactnavigation.org/) along with other partners.
* **[Infinite Red](https://infinite.red/):** Maintains the [ignite cli/boilerplate](https://github.com/infinitered/ignite), organizes [Chain React Conf](https://cr.infinite.red/), hosts the [React Native Radio podcast](https://reactnativeradio.com), publishes the [React Native Newsletter](https://reactnativenewsletter.com)
* **[Meta](https://opensource.fb.com/):** Oversees the React Native product and maintains the [React Native core repo](https://reactnative.dev/) 
* **[Microsoft](https://twitter.com/ReactNativeMSFT):** Develops [React Native Windows](https://github.com/Microsoft/react-native-windows) and [React Native macOS](https://github.com/microsoft/react-native-macos) for building apps that target Windows and macOS; maintains [rnx-kit](https://github.com/microsoft/rnx-kit), [react-native-test-app](https://github.com/microsoft/react-native-test-app) and coordinates cross-companies efforts such as the [bundle working group](https://github.com/microsoft/rnx-kit/discussions/categories/bundle-working-group).
* **[Shopify](https://www.shopify.com/):** Maintains React Native open source libraries such as [flash-list](https://github.com/Shopify/flash-list) or [@shopify/react-native-skia](https://github.com/Shopify/react-native-skia) and sponsors Software Mansion.
* **[Software Mansion](https://swmansion.com/):** Maintain core infrastructure including JSC, Animated, and other popular third-party plugins and organizes [App.js Conf](https://appjs.co/)
* **[Wix.com](https://wix.engineering/open-source):** Maintains a variety of React Native open source projects ([see all](https://github.com/orgs/wix/repositories?q=react-native)), including:  [Detox](https://wix.github.io/Detox/) end-to-end testing library for React Native apps, [RN UILib](https://wix.github.io/react-native-ui-lib/), [RN Navigation](https://wix.github.io/react-native-navigation/), [RN Calendars](https://wix.github.io/react-native-calendars/) and [RN Notifications](https://github.com/wix/react-native-notifications).

This list may fluctuate in response to newcomers who meet our partner definition. In terms of open source work, pull requests from partners are commonly prioritized. When you are contributing to React Native, you'll most likely meet somebody who works at one of the partner companies and who is a core contributor:

## Core Contributors

Core contributors are individuals who contribute to the React Native project. A core contributor is somebody who displayed a lasting commitment to the evolution and maintenance of React Native. The work done by core contributors includes responsibilities mentioned in the “Partners” section above, and concretely means that they:

* Consistently contribute high quality changes, fixes and improvements
* Actively review changes and provide quality feedback to contributors
* Manage the release process of React Native by maintaining release branches, communicating changes to users and publishing releases
* Love to help out other users with issues on GitHub
* Mentor and encourage first time contributors
* Identify React Native community members who could be effective core contributors
* Help build an inclusive community with people from all backgrounds
* Are great at communicating with other contributors and the community in general

These are behaviors we have observed in our existing core contributors. They aren't strict rules but rather outline their usual responsibilities. We do not expect every core contributor to do all of the above things all the time. Most importantly, we want to create a supportive and friendly environment that fosters collaboration. Above all else, **we are always polite and friendly.**

Core contributor status is attained after consistently contributing and taking on the responsibilities outlined above and granted by other core contributors. Similarly, after a long period of inactivity (~6 months or more), a core contributor may be contacted to understand if they’re still interested in being part of the program.

You can use this [form](https://forms.gle/4jpA4QeNUvAUDnNe8) to either:
* Apply yourself to become a Core Contributor. Make sure to include a list of valuable contributions you did to the React Native repository and ecosystem.
* Nominate someone to become a Core Contributor.

As a core contributor, you will have access to the core contributor Discord which is used for light-weight coordination and discussion.

**We aim to make contributing to React Native as easy and transparent as possible.** We have discussion groups dedicated to the [new architecture rollout](https://github.com/reactwg/react-native-new-architecture), [releases](https://github.com/reactwg/react-native-releases), and [general questions and proposals](https://github.com/react-native-community/discussions-and-proposals). We are always looking for active, enthusiastic members of the React Native community to become core contributors.

## Community Contributors

Community contributors are individuals who support projects in the [react-native-community](https://github.com/react-native-community) organization. This organization exists as an incubator for high quality components that extend the capabilities of React Native with functionality that many but not all applications require. Meta engineers will provide guidance to help build a vibrant community of people and components that make React Native better.

This structure has multiple benefits:

* Keep the core of React Native small, which improves performance and reduces the surface area
* Provide visibility to projects through shared representation, for example on the React Native website or on Twitter
* Ensure a consistent and high standard for code, documentation, user experience, stability and contributions for third-party components
* Upgrade the most important components right away when we make breaking changes and move the ecosystem forward at a fast pace
* Find new maintainers for projects that are important but were abandoned by previous owners

Additionally, some companies may choose to sponsor the development of one or many of the packages that are part of the community organization. They will commit to maintain projects, triage issues, fix bugs and develop features. In turn, they will be able to gain visibility for their work, for example through a mention of active maintainers in the README of individual projects after a consistent period of contributions. Such a mention may be removed if maintainers abandon the project.

If you are working on a popular component and would like to move it to the React Native community, please create an issue on the [discussions-and-proposals repository](https://github.com/react-native-community/discussions-and-proposals).
