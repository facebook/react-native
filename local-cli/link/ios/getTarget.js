/**
 * Tries to get a specific target from project
 */
module.exports = function(project, projectConfig) {
    if (project.getAllTargets && projectConfig.target !== 'undefined') {
        const projectAllTargets = project.getAllTargets();
        let foundTarget;
        for (var i = 0; i < projectAllTargets.length; i++) {
            if (projectAllTargets[i].name && projectAllTargets[i].name === projectConfig.target) {
                foundTarget = projectAllTargets[i];
                break;
            }
        }
        if (foundTarget) {
            console.log('found custom target');
            return foundTarget;
        } else {
            console.log('Can not find project target, exiting');
        }
    } else {
        return project.getFirstTarget();
    }
}