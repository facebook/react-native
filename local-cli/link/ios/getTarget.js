/**
 * Tries to get a specific target from project
 */
module.exports = function(project, projectConfig) {
    if (project.getAllTargets && projectConfig.target) {

        const projectAllTargets = project.getAllTargets();
        let foundTarget;

        for (var i = 0; i < projectAllTargets.length; i++) {
            if (projectAllTargets[i].name && projectAllTargets[i].name === projectConfig.target) {
                foundTarget = projectAllTargets[i];
                break;
            }
        }

        if (foundTarget) {
            return foundTarget;
        } else {
            console.log('Can not find project target "' + projectConfig.target + '", exiting');
            return;
        }
    } else {
        return project.getFirstTarget();
    }
}