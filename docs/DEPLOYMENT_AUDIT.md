# Deployment fingerprint audit

The live verification job stores its locally computed asset fingerprint in the uploaded test results before polling the deployed build. This keeps stale-build failures diagnosable without weakening the fingerprint check.
