# Verification

Checked 2026-09-14.

- n8n 2.38.7, installed from the actual npm tarball in an isolated local container.
- n8n-node build, lint, and TypeScript typecheck passed.
- Vitest: 23 tests passed.
- Tarball: 22 files, no runtime dependencies or embedded credentials.
- Original 0.1.0 tarball SHA-256: e1110c8ce4615e36474584b33e22725eefe89f4b893ec14a3fc67b4b0b13e6b3

## Live API verification

All twelve resource operations have now run successfully through the installed
n8n package. Initial Get Many checks for meeting types, contacts and appointments
returned one item each with Limit=1. The initial owner's temporary token was
revoked after those reads.

Further checks used the existing isolated MCP Review workspace, accessed through
an audited staff view-as session. It has no connected calendar or workflows.
A temporary PAT was restricted to Scheduling, CRM and Account.

- Credential validation: Connection tested successfully.
- Meeting Type Get: correct review meeting type returned.
- Availability Get: time slots returned for September 16, Europe/Berlin.
- Contact Create, Get, Update, Get: the changed notes matched on read-back.
- Appointment Create and Get: start was 07:00 UTC.
- Appointment Reschedule and Get: start changed to 08:00 UTC.
- Appointment Cancel: cancellation returned successfully.

Only synthetic reviewer records and the owner's own review email were used.
Invitee reminders were disabled. The test booking was cancelled.

The live Contact Update response has an empty HTTP body. The helper now converts
empty bodies to an absent result so the node returns valid JSON {success: true}.
The rebuilt tarball was reinstalled, and Update followed by Get passed again.
Three regression cases cover empty string, null and undefined response bodies.

## Trigger coverage and limits

Fixture tests cover registration, numeric production IDs, serialized IDs, changed
events, endpoint ownership during cleanup, event filtering, cancellation scope,
pagination, repeated pages, malformed records and item pairing.

Live public HTTPS delivery was verified on 2026-09-14 using n8n 2.38.7 and the
0.1.1 trigger fix. The original 0.1.0 trigger rejected numeric webhook IDs from
the API. The patch accepts numeric IDs and compares persisted IDs consistently.

- Workflow activation registered webhook 1500.
- Execution 2: booking_created, success.
- Execution 3: booking_rescheduled, success.
- Execution 4: booking_cancelled, success.
- Deactivation removed its hook. API readback returned zero remaining hooks.
- Two orphaned hooks from the failed 0.1.0 activation attempts were removed.
- The synthetic booking was cancelled.

An actual AI Agent execution also passed using the meetergo node as a tool and
a local Ollama model. Execution 1 contains the tool call, live API result, and
agent response. No simulated model or fixture API was used for that execution.

## Publication

GitHub Actions performs tests, typecheck, lint, build, tag/version consistency
and npm publication with provenance. The first publication uses a temporary npm
bootstrap secret; remove it and switch to trusted publishing once the package
exists. Registry and Creator Portal statuses must be read back separately.
