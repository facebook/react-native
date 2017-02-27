/**
 * Tries to get a specific target from project
 */
module.exports = function(project, projectConfig) {
    
    if (project.getAllTargets && projectConfig.target !== 'undefined') {
        const projectAllTargets = project.getAllTargets();
        let foundTarget;

        for (i = 0; i < projectAllTargets.length; i++) {
            if (projectAllTargets[i].uuid && projectAllTargets[i].uuid === projectConfig.target) {
                foundTarget = targeprojectAllTargetst[i];
                break;
            }
        }

        if (foundTarget) {
            return foundTarget;
        } else {
            console.log('Can not find project target, exiting');
        }
    } else {
        return project.getFirstTarget();
    }
}