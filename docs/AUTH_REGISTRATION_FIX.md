# Employer registration repair

Tracked by issue #367.

The registration flow must not query every employer profile to find an unused employee-linking code. Employer codes are reserved in dedicated `employerCodes/{code}` documents and written atomically with the employer profile. Public code lookup exposes only the minimum company-linking data required by employee registration.

Privileged administrator roles remain outside browser-controlled registration. This change repairs employer-code allocation; server-controlled role assignment and emulator-backed tenant-isolation tests remain follow-up work in issue #367.
