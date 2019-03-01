let request = require('request');

class AutoSync  {
    constructor(vsoRepoID, vsoApiUrl, myToken) {
        this.vsoRepoID = vsoRepoID;
        this.vsoApiUrl = vsoApiUrl;
        this.myHeaders = {
            'Authorization': 'Basic ' + new Buffer("" + ":" + myToken).toString('base64'),
            'Content-Type': 'application/json'
        };
    }

    // Create a new VSO PR
    createPr(branchName, pullRequestTitle, pullRequestDescription) {
        const url = this.vsoApiUrl + '/git/repositories/' + this.vsoRepoID + '/pullRequests?api-version=3.0';
        request.post({
            url: url,
            json: true,
            headers: this.myHeaders,
            body: {
                "sourceRefName": "refs/heads/" + branchName,
                "targetRefName": "refs/heads/master",
                "title": pullRequestTitle,
                "description": pullRequestDescription,
            }
        }, function (err, httpResponse, body) {
            if (err || body.errorCode) {
                throw new Error(err || body.errorCode);
            }
        });
    }

    // bypass VSO PR with auto-completion and not squash
    completePr(prId, commitId) {
        const url = this.vsoApiUrl + '/git/repositories/' + this.vsoRepoID + '/pullRequests/' + prId + '?api-version=3.0';
        request.patch({
            url: url,
            json: true,
            headers: this.myHeaders,
            body: {
                "status": "completed",
                "lastMergeSourceCommit": {
                    "commitId": commitId,
                },
                "completionOptions": {
                    "bypassPolicy": true,
                    "bypassReason": "auto-sync can bypass when all builds succeed",
                    "deleteSourceBranch": true,
                    "mergeCommitMessage": prId.title,
                    "squashMerge": false,
                    "triggeredByAutoComplete": false,
                },
            }
        }, function (err, httpResponse, body) {
            if (err || body.errorCode) {
                throw new Error(err || body.errorCode);
            }
        });
    }

    findBuildsAssociatedWithPr(prId, commitId) {
        const url = 'https://office.visualstudio.com/ISS/_apis/build/builds?api-version=3.0';
        request.get({
            url: url,
            json: true,
            headers: this.myHeaders
        }, function (err, httpResponse, body) {
            if (err || body.errorCode) {
                throw new Error(err || body.errorCode);
            }

            let succeededBuilds = new Set();
            for (let build of body.value) {
                if (build.sourceBranch === 'refs/pull/' + prId + '/merge' && build.result === 'succeeded') {
                    succeededBuilds.add(build.definition.name);
                }
            }

            if(succeededBuilds.size === 3) {
                console.log("All builds succeed, complete the pull request");
                this.completePr(prId, commitId);
            }
            else {
                console.log("some builds still running or failed, could not complete pull request now");
            }
        }.bind(this));
    }

    completePrWhenAllBuildsSuccess(pullRequestTitle) {
        const url = this.vsoApiUrl + '/git/repositories/' + this.vsoRepoID + '/pullRequests?status=Active&api-version=3.0';        
        request.get({
            url: url,
            json: true,
            headers: this.myHeaders
        }, function (err, httpResponse, body) {
            if (err || body.errorCode) {
                throw new Error(err || body.errorCode);
            }

            for (let pr of body.value) {
                if (pr.title === pullRequestTitle) {
                    this.findBuildsAssociatedWithPr(pr.pullRequestId, pr.lastMergeSourceCommit.commitId);
                    break;
                }
            }
        }.bind(this));
    }
}

module.exports = AutoSync;