# Deployment fingerprint audit

The live verification job stores its locally computed asset fingerprint in the uploaded test results before polling the deployed build. This keeps stale-build failures diagnosable without weakening the fingerprint check.

`googlea1b39620fd8849c7.html` is a required public build asset. It is included in `STACKFALL_BUILD_ASSETS` and the SHA-256 asset fingerprint, then fetched from the live root and compared byte-for-byte with the repository source. A deployment that omits or changes the ownership file must fail before browser smoke begins.
