module.exports = async (github, context, label) => {

    const closeIssue = async () => {
        await github.rest.issues.update({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            state: "closed",
        });
    }

    const addComment = async (comment) => {
        await github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment,
        });
    }

    const requestAuthorFeedback = async () => {
        // Remove the triage label if it exists (ignore the 404 if not; it's not expected to always be there)
        try {
            await github.rest.issues.removeLabel({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                name: "Needs: Triage :mag:"
            });
        } catch {}

        await github.rest.issues.addLabels({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            labels: ['Needs: Author Feedback']
        });
    }

    switch(label){
        case "Type: Invalid":
            await closeIssue();
            return;
        case "Type: Question":
            await addComment(`We are using GitHub issues exclusively to track bugs in React Native. GitHub may not be the ideal place to ask a question, but you can try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native), or on [Reactiflux](https://www.reactiflux.com/).`);
            await closeIssue();
            return;
        case "Type: Docs":
            await addComment(`Please report documentation issues in the [react-native-website](https://github.com/facebook/react-native-website/issues) repository.`);
            await closeIssue();
            return;
        case "Resolution: For Stack Overflow":
            await addComment(`We are using GitHub issues exclusively to track bugs in the core React Native library. Please try asking over on [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native) as it is better suited for this type of question.`);
            await closeIssue();
            return;
        case "Type: Expo":
            await addComment(`It looks like your issue is related to Expo and not React Native core. Please open your issue in [Expo's repository](https://github.com/expo/expo/issues/new). If you are able to create a repro that showcases that this issue is also happening in React Native vanilla, we will be happy to re-open.`);
            await closeIssue();
            return;
        case "Needs: Issue Template":
            await addComment(`| :warning: | Missing Required Fields |\n`+
              `| --- | --- |\n`+
              `| :information_source: | It looks like your issue may be missing some necessary information. GitHub provides an example template whenever a [new issue is created](https://github.com/facebook/react-native/issues/new?template=bug_report.md). Could you go back and make sure to fill out the template? You may edit this issue, or close it and open a new one. |`);
            await requestAuthorFeedback();
            return;
        case "Needs: Environment Info":
            await addComment(`| :warning: | Missing Environment Information |\n`+
            `| --- | --- |\n`+
            `| :information_source: | Your issue may be missing information about your development environment. You can obtain the missing information by running <code>react-native info</code> in a console. |`);
            await requestAuthorFeedback();
            return;
        case "Needs: Verify on Latest Version":
            await addComment(`| :warning: | Using Old Version |\n`+
            `| --- | --- |\n`+
            `| :information_source: | It looks like you are using an older version of React Native. Please [upgrade](https://reactnative.dev/docs/upgrading) to the latest version, and verify if the issue persists. If it does not, please let us know so we can close out this issue. This helps us ensure we are looking at issues that still exist in the current release. |`);
            await requestAuthorFeedback();
            return;
        case "Needs: Version Info":
            await addComment(`| :warning: | Update Version Info |\n`+
            `| --- | --- |\n`+
            `| :information_source: | We could not find or parse the version number of React Native in your issue report. Please use the template, and report your version including major, minor, and patch numbers - e.g. 0.70.2 |`);
            await requestAuthorFeedback();
            return;
        case "Needs: Repro":
            await addComment(`| :warning: | Missing Reproducible Example |\n`+
            `| --- | --- |\n`+
            `| :information_source: | It looks like your issue is missing a reproducible example. Please provide a [Snack](https://snack.expo.dev) or a repository that demonstrates the issue you are reporting in a [minimal, complete, and reproducible](https://stackoverflow.com/help/minimal-reproducible-example) manner. |`);
            await requestAuthorFeedback();
            return;
        case "Type: Unsupported Version":
            await addComment(`It looks like your issue or the example you provided uses an [unsupported version of React Native](https://github.com/reactwg/react-native-releases/blob/main/README.md#releases-support-policy). Due to the amount of issues we receive, we're currently accepting only new issues against one of the supported versions. Please open your issue on [StackOverflow](https://stackoverflow.com/questions/tagged/react-native) to get further community support.`);
            await requestAuthorFeedback();
            return;
    }
};
