const requiredPackages = [
  'Node',
  'Yarn',
  'npm',
  'Watchman',
  'CocoaPods',
  'Java',
  '@react-native-community/cli',
  'react',
  'react-native',
  'react-native-macos'
];

const messages = {
  title: '## Missing Versions',
  missing: 'Found the following packages mentioned in the issue but versions are not found.',
  notFound: 'Following packages are not found in the issue but they are required.'
};

module.exports = async (github, context) => {
  try {
    const notFound = [];
    const missing = [];
    const issueParams = {
      issue_number: context.payload.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    };
    const issue = await github.rest.issues.get(issueParams);
    
    requiredPackages.forEach((packageName) => {
      const regexPattern = new RegExp(`${packageName.replace('/', '\\/')}:\\s*(\\d+(\\.\\d+)*|Not Found)`);
      const match = issue.data.body.match(regexPattern);
      if (match?.[0] && match[0].includes('Not Found')) notFound.push(match[0]);
      else if (!match?.[0]) missing.push(packageName);
    });
    
    let missingMsg = '';
    let notFoundMsg = '';
    
    if(missing.length > 0){
      missingMsg = `${messages.missing}\n${missing.map(item => `**${item}**`).join('\n')}`;
    }
    
    if(notFound.length > 0){
      notFoundMsg = `${messages.notFound}\n${notFound.map(item => `**${item}**`).join('\n')}`;
    }
    
    const issueComments = await github.rest.issues.listComments(issueParams);
    const versionComment = issueComments.data.find(comment =>
      comment.body.includes(messages.title),
    );
    
    if(versionComment){
      await github.rest.issues.deleteComment({
        ...issueParams,
        comment_id: versionComment.id,
      });
    }
    
    if(missingMsg.length > 0 || notFoundMsg.length > 0){
      await github.rest.issues.createComment({
        ...issueParams,
        body: `${messages.title}\n\n${missingMsg}\n${notFoundMsg}`,
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};
