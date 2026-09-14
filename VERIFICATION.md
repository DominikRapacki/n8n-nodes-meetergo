# Verification

Checked 2026-09-14.

- n8n-node build: passed.
- n8n-node lint --fix: passed, zero lint errors or warnings.
- TypeScript typecheck: passed.
- Vitest 4.1.10: 18 tests passed.
- npm pack: 22 files; node JavaScript, metadata and both icon variants included.
- No runtime dependencies or embedded credentials.
- Tarball: /tmp/n8n-nodes-meetergo-0.1.0.tgz
- SHA-256: bf5290585103e3435e7ddf13fa7d3f924a393407877553e392b7faa9b1144ab3

Tests cover appointment page zero, contact page one, constant page sizes, limits,
empty results, malformed records, repeated pages, multi-item pairing, required
booking host selection, cancellation scope, failed mutations, webhook event
changes and endpoint ownership during cleanup.

n8n 2.38.7 started in the isolated container
meetergo-n8n-marketplace-review-20260914 on http://localhost:15678.
Health endpoint returned status ok. Owner setup is complete.
The meetergo node and Meetergo API credential are registered. The credential
screen renders, its input uses type=password, and its documentation link points
to the PAT guide. Saving a deliberately invalid token produced Unauthorized.

The packed tarball was installed through npm into the isolated n8n instance,
not just loaded from source. A workflow using n8n-nodes-meetergo.meetergo was
imported for package execution review. The installed node icon renders in the
browser. CLI execution reaches the packaged node and rejects missing credentials
with NodeOperationError; it does not silently execute without authentication.
No real user token was used.

The development bind mount became stale when the build recreated dist.
Restarting this task's isolated container restored the files and the node icon
returned HTTP 200. This was a development mount issue, not a missing tarball icon.

The node panel opens when double-clicking the actual canvas node. The resource,
operation, credential, Return All and Limit controls render correctly. Appointment
operations and the Create input form were inspected. Dynamic meeting-type loading
shows a visible error for the invalid review credential. No booking was submitted. Earlier
double-clicks on the text label did not open the panel. A logged injectNDVStore()
exception did not prevent this successful panel check, so it is not an outstanding
release blocker. Authenticated successful operations remain unverified.

npm CLI authentication is verified as dominikrapacki. GitHub CLI is signed in as
DominikRapacki, which is the selected public source repository owner. Creator
Portal account meetergo is verified and its node submission form is accessible.
The form requires the URL of an already published npm package.
Public repository https://github.com/DominikRapacki/n8n-nodes-meetergo is available.
Initial GitHub Actions verification passed. npm publication and directory review remain pending;
no release tag or npm version has been published.

This is a release candidate, not an npm release or verified directory listing.
