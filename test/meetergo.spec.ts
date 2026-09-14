import { describe, expect, it } from 'vitest';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestOptions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { getMany } from '../nodes/Meetergo/api';
import { Meetergo } from '../nodes/Meetergo/Meetergo.node';
import { MeetergoTrigger } from '../nodes/Meetergo/MeetergoTrigger.node';

function context(
	params: IDataObject,
	responses: unknown[] = [],
	inputCount = 1,
	continueOnFail = false,
) {
	const requests: IHttpRequestOptions[] = [];
	const state: IDataObject = {};
	const ctx = {
		getNode: () => ({
			id: 'test-node',
			name: 'meetergo',
			type: 'meetergo',
			typeVersion: 1,
			position: [0, 0],
			parameters: params,
		}),
		getInputData: () => Array.from({ length: inputCount }, () => ({ json: {} })),
		getNodeParameter: (key: string, _index?: number, fallback?: unknown) => params[key] ?? fallback,
		continueOnFail: () => continueOnFail,
		getWorkflowStaticData: () => state,
		getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/unique-workflow-id',
		helpers: {
			httpRequestWithAuthentication: async (credential: string, options: IHttpRequestOptions) => {
				expect(credential).toBe('meetergoApi');
				requests.push(options);
				const value = responses.shift();
				if (value instanceof Error) throw value;
				return value;
			},
			returnJsonArray: (body: IDataObject) => [{ json: body }],
		},
	};
	return { ctx: ctx as unknown as IExecuteFunctions & IHookFunctions, requests, state };
}

describe('pagination', () => {
	it('keeps page size constant across appointment pages and returns the requested limit', async () => {
		const all = Array.from({ length: 200 }, (_, i) => ({ id: String(i) }));
		const { ctx, requests } = context({}, [
			{ appointments: all.slice(0, 100), total: 200 },
			{ appointments: all.slice(100), total: 200 },
		]);
		expect(await getMany(ctx, 'appointment', 150, {})).toEqual(all.slice(0, 150));
		expect(requests.map((r) => r.qs)).toEqual([
			{ page: 0, pageSize: 100 },
			{ page: 1, pageSize: 100 },
		]);
	});
	it('starts contacts at page one and returns records instead of wrappers', async () => {
		const { ctx, requests } = context({}, [
			{
				result: [{ item: { id: 'contact', email: 'fixture@example.com' }, appointments: [] }],
				total: 1,
			},
		]);
		expect(await getMany(ctx, 'contact', Infinity, { searchTerm: 'fixture' })).toEqual([
			{ id: 'contact', email: 'fixture@example.com' },
		]);
		expect(requests[0].qs).toEqual({ searchTerm: 'fixture', page: 1, limit: 100 });
	});
	it('returns no items for an empty search', async () => {
		const { ctx } = context({}, [{ result: [], total: 0 }]);
		expect(await getMany(ctx, 'contact', 50, {})).toEqual([]);
	});
	it('stops a server that repeats a full page', async () => {
		const records = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
		const { ctx, requests } = context({}, [{ appointments: records }, { appointments: records }]);
		await expect(getMany(ctx, 'appointment', Infinity, {})).rejects.toThrow('repeated a page');
		expect(requests).toHaveLength(2);
	});
	it('rejects malformed records instead of silently returning incomplete data', async () => {
		const { ctx } = context({}, [{ result: [{ item: { email: 'fixture@example.com' } }] }]);
		await expect(getMany(ctx, 'contact', 50, {})).rejects.toThrow('without an ID');
	});
});

describe('meeting type picker', () => {
	it('uses the name in the v4 API meetingInfo response', async () => {
		const { ctx } = context({}, [
			[
				{ id: 'intro', meetingInfo: { name: 'Intro call', duration: 30 } },
				{ id: 'unnamed', meetingInfo: {} },
			],
		]);
		expect(
			await new Meetergo().methods.loadOptions.getMeetingTypes.call(
				ctx as unknown as ILoadOptionsFunctions,
			),
		).toEqual([
			{ name: 'Intro call', value: 'intro' },
			{ name: 'unnamed', value: 'unnamed' },
		]);
	});
});

describe('operations', () => {
	it.each(['', null, undefined])('returns valid workflow JSON after an empty update response %s', async (response) => {
		const { ctx } = context({ resource: 'contact', operation: 'update', id: 'fixture', options: { notes: 'updated' } }, [response]);
		expect(await new Meetergo().execute.call(ctx)).toEqual([[{ json: { success: true }, pairedItem: { item: 0 } }]]);
	});
	it('preserves item pairing across inputs', async () => {
		const { ctx } = context(
			{ resource: 'appointment', operation: 'get', id: 'booking' },
			[{ id: 'first' }, { id: 'second' }],
			2,
		);
		expect(await new Meetergo().execute.call(ctx)).toEqual([
			[
				{ json: { id: 'first' }, pairedItem: { item: 0 } },
				{ json: { id: 'second' }, pairedItem: { item: 1 } },
			],
		]);
	});
	it('creates bookings with explicit attendees without bypassing availability', async () => {
		const { ctx, requests } = context(
			{
				resource: 'appointment',
				operation: 'create',
				meetingTypeId: 'type',
				start: '2026-10-01T10:00:00Z',
				email: 'fixture@example.com',
				fullName: 'Review Fixture',
				options: { hostIds: ' host-a, host-b ', receiveReminders: false },
			},
			[{ appointmentId: 'booking' }],
		);
		await new Meetergo().execute.call(ctx);
		expect(requests[0].body).toEqual({
			meetingTypeId: 'type',
			start: '2026-10-01T10:00:00Z',
			hostIds: ['host-a', 'host-b'],
			attendee: {
				email: 'fixture@example.com',
				fullname: 'Review Fixture',
				receiveReminders: false,
				notes: {},
			},
		});
	});
	it('does not send a booking without a host or queue', async () => {
		const { ctx, requests } = context({
			resource: 'appointment',
			operation: 'create',
			options: {},
		});
		await expect(new Meetergo().execute.call(ctx)).rejects.toThrow('host IDs or a queue ID');
		expect(requests).toHaveLength(0);
	});
	it('cancels only the selected attendee unless explicitly instructed otherwise', async () => {
		const { ctx, requests } = context(
			{
				resource: 'appointment',
				operation: 'cancel',
				id: 'a/b',
				options: { attendeeId: 'attendee' },
			},
			[undefined],
		);
		const result = await new Meetergo().execute.call(ctx);
		expect(requests[0].url).toBe('https://api.meetergo.com/v4/appointment/a%2Fb/cancel');
		expect(requests[0].body).toEqual({ attendeeId: 'attendee' });
		expect(result[0][0].json).toEqual({ success: true });
	});
	it('does not retry a failed mutation and honors continue-on-fail', async () => {
		const { ctx, requests } = context(
			{
				resource: 'contact',
				operation: 'update',
				id: 'contact',
				options: { firstName: 'Fixture' },
			},
			[new Error('Unauthorized')],
			1,
			true,
		);
		expect(await new Meetergo().execute.call(ctx)).toEqual([
			[{ json: { error: 'Unauthorized' }, pairedItem: { item: 0 } }],
		]);
		expect(requests).toHaveLength(1);
	});
	it('rejects empty contact updates', async () => {
		const { ctx, requests } = context({
			resource: 'contact',
			operation: 'update',
			id: 'contact',
			options: {},
		});
		await expect(new Meetergo().execute.call(ctx)).rejects.toThrow('at least one field');
		expect(requests).toHaveLength(0);
	});
});

describe('booking webhook lifecycle', () => {
	const trigger = new MeetergoTrigger();
	const methods = trigger.webhookMethods.default;
	it('subscribes and records the created endpoint', async () => {
		const { ctx, state, requests } = context({ events: ['booking_created'] }, [{ id: 'own-hook' }]);
		expect(await methods.create.call(ctx)).toBe(true);
		expect(state).toEqual({ webhookId: 'own-hook', webhookUrl: ctx.getNodeWebhookUrl('default') });
		expect(requests[0].body).toEqual({
			endpoint: ctx.getNodeWebhookUrl('default'),
			eventTypes: ['booking_created'],
			description: 'n8n meetergo Trigger',
		});
	});
	it('accepts numeric production webhook IDs throughout activation and cleanup', async () => {
		const endpoint = 'https://n8n.example.com/webhook/unique-workflow-id';
		const hook = { id: 1492, endpoint, eventTypes: ['booking_created'] };
		const { ctx, state, requests } = context({ events: ['booking_created'] }, [
			hook, [hook], [hook], undefined,
		]);
		expect(await methods.create.call(ctx)).toBe(true);
		expect(await methods.checkExists.call(ctx)).toBe(true);
		await methods.delete.call(ctx);
		expect(requests.filter((r) => r.method === 'DELETE').map((r) => r.url)).toEqual([
			'https://api.meetergo.com/webhooks/1492',
		]);
		expect(state).toEqual({});
	});
	it('matches numeric IDs after static data has been serialized as text', async () => {
		const endpoint = 'https://n8n.example.com/webhook/unique-workflow-id';
		const { ctx, state } = context({ events: ['booking_created'] }, [
			[{ id: 1492, endpoint, eventTypes: ['booking_created'] }],
		]);
		state.webhookId = '1492';
		expect(await methods.checkExists.call(ctx)).toBe(true);
	});
	it('detects event selection changes', async () => {
		const { ctx, state } = context({ events: ['booking_cancelled'] }, [
			[
				{
					id: 'own-hook',
					endpoint: 'https://n8n.example.com/webhook/unique-workflow-id',
					eventTypes: ['booking_created'],
				},
			],
		]);
		state.webhookId = 'own-hook';
		expect(await methods.checkExists.call(ctx)).toBe(false);
	});
	it('removes only its own matching endpoint', async () => {
		const { ctx, state, requests } = context({}, [
			[
				{ id: 'own-hook', endpoint: 'https://n8n.example.com/webhook/unique-workflow-id' },
				{ id: 'other-hook', endpoint: 'https://n8n.example.com/webhook/other' },
			],
			undefined,
		]);
		state.webhookId = 'own-hook';
		state.webhookUrl = ctx.getNodeWebhookUrl('default');
		expect(await methods.delete.call(ctx)).toBe(true);
		expect(requests.filter((r) => r.method === 'DELETE').map((r) => r.url)).toEqual([
			'https://api.meetergo.com/webhooks/own-hook',
		]);
		expect(state).toEqual({});
	});
	it('does not delete an endpoint with a different URL even when its ID matches', async () => {
		const { ctx, state, requests } = context({}, [
			[{ id: 'own-hook', endpoint: 'https://n8n.example.com/webhook/other' }],
		]);
		state.webhookId = 'own-hook';
		state.webhookUrl = ctx.getNodeWebhookUrl('default');
		await methods.delete.call(ctx);
		expect(requests.filter((r) => r.method === 'DELETE')).toHaveLength(0);
	});
	it('rejects activation without HTTPS before making an API call', async () => {
		const { ctx, requests } = context({ events: ['booking_created'] });
		ctx.getNodeWebhookUrl = () => 'http://localhost:5678/webhook/test';
		await expect(methods.create.call(ctx)).rejects.toThrow('HTTPS');
		expect(requests).toHaveLength(0);
	});
	it('emits selected events and ignores other event types', async () => {
		const { ctx } = context({ events: ['booking_created'] });
		const webhookCtx = {
			...ctx,
			getBodyData: () => ({ webhookType: 'booking_cancelled' }),
		} as unknown as IWebhookFunctions;
		expect(await trigger.webhook.call(webhookCtx)).toEqual({});
		webhookCtx.getBodyData = () => ({ webhookType: 'booking_created', appointmentId: 'booking' });
		expect(await trigger.webhook.call(webhookCtx)).toEqual({
			workflowData: [[{ json: { webhookType: 'booking_created', appointmentId: 'booking' } }]],
		});
	});
});
