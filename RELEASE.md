# Release gates

- Build, lint, typecheck and fixture tests must pass.
- Test each operation and credential failure in a dedicated live review workspace.
- Install the package in an isolated n8n instance and verify node and credential icons.
- Create the public DominikRapacki/n8n-nodes-meetergo GitHub repository with publisher access.
- Configure npm publication in GitHub Actions. For the first release, use a granular
  npm token restricted to package publication as the NPM_TOKEN repository secret.
  After the package exists, configure its npm trusted publisher for this repository
  and publish.yml, then remove the token.
- Push the reviewed source, wait for CI, then push the matching v0.1.0 tag.
- Verify the npm tarball and provenance.
- Submit the published package at the n8n Creator Portal for verification.
- Record the resulting review status and directory URL. npm availability alone
  does not establish verified n8n Cloud availability.

Current local checks use HTTP fixtures, not a live authenticated meetergo workspace.
No release tag, npm publication or directory submission has occurred.
