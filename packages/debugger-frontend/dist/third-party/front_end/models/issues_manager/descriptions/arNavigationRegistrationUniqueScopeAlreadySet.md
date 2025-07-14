# Ensure that multiple sources associated with the same navigation have the same attribution scopes

The page tried to register a source using Attribution Reporting API, but the
source was rejected because a previous source associated with the same
navigation and reporting origin used a different set of attribution scopes.
