# n8n-nodes-meetergo

Connect meetergo scheduling and contacts to n8n workflows.

## Status

Initial release candidate. npm publication and n8n verification are pending.
Do not claim n8n Cloud availability until the Creator Portal approves the package.

## Installation

After publication, self-hosted n8n administrators can install
`n8n-nodes-meetergo` under **Settings > Community nodes**.
For local review, run `npm ci`, `npm run build`, then `npm run dev`.

## Credentials

Create a personal access token in your meetergo API settings, then paste it
into the **Meetergo API** credential in n8n. The credential test reads your
meeting types via `GET /v4/meeting-type` and requires Scheduling permission.

A personal access token acts as its owner. The owner's role, workspace and
plan determine which records and features the workflow can access.
Never paste the token into a node parameter, workflow JSON or request URL.

[Personal access token documentation](https://developer.meetergo.com/developer-docs/personal-access-tokens)

## Operations

| Resource     | Operations                                |
| ------------ | ----------------------------------------- |
| Appointment  | Get, Get Many, Create, Reschedule, Cancel |
| Availability | Get                                       |
| Contact      | Get, Get Many, Create, Update             |
| Meeting Type | Get, Get Many                             |

**Get Many** supports Return All or a maximum number of records.
Appointments and contacts use their respective API pagination conventions.
Contact operations return contact records, without the API's appointment wrapper.

To create a booking, choose a meeting type, start time, attendee and host IDs
or a routing queue ID from the meeting type. Date values must include their
timezone. Availability checks stay enabled.

Creating, rescheduling and cancelling bookings can update connected calendars
and send meetergo notifications. For a group booking, select the attendee ID
to cancel only that attendee, or explicitly select Cancel All.

Contact updates only change fields selected in Options. The node does not
delete contacts.

## Booking event trigger

Choose Booking Created, Booking Cancelled and/or Booking Rescheduled.
An active trigger creates one webhook endpoint. Deactivating the workflow
removes that endpoint after checking its ID and URL. Other workflows'
endpoints are preserved.

Your meetergo plan must permit webhooks. Each active trigger uses one of
the six webhook slots available per workspace. Your n8n public webhook
URL must use HTTPS; configure WEBHOOK_URL when running behind a reverse proxy.

The API does not currently sign webhook payloads. Treat the generated webhook
URL as a secret, and retrieve the appointment through the authenticated
Appointment Get operation before taking actions that depend on its details.

## Example workflows

- Booking Created > Appointment Get > your CRM or spreadsheet.
- Schedule Trigger > Appointment Get Many > an internal daily agenda.
- Form submission > Contact Create.
- Appointment lookup > Availability Get > Appointment Reschedule.

Use a dedicated review workspace and synthetic attendees when testing mutations.

## Development

Use Node.js 24 and npm 11 for the development toolchain.

```sh
npm ci
npm test
npm run typecheck
npm run lint
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

This package has no runtime dependencies. It uses n8n's credential and HTTP
helpers. Programmatic nodes handle dependent pagination requests, differing
response envelopes and webhook lifecycle cleanup. Requests target only
`https://api.meetergo.com`; failed mutations are not retried automatically.

Publish version tags through GitHub Actions with npm provenance.
See [RELEASE.md](RELEASE.md) for the remaining release gates.

## Support

[API documentation](https://developer.meetergo.com) ·
[Help center](https://help.meetergo.com) · support@meetergo.com

## License

MIT

### Limited token permissions

The connection test reads your meeting types and requires Scheduling permission.
Contact operations also require CRM permission. Booking event triggers require
Account permission to register and remove their own webhooks. Grant only the
areas used by your workflows. A token acts with its owner's permissions.
