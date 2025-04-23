# Ensure that navigation-source registrations are initiated by a user gesture

This page tried to register a navigation source using the Attribution Reporting
API but failed because the navigation was not initiated by a user gesture.
Compared to event sources, navigation sources can release more cross-site
information, and are therefore subject to this additional privacy control.
