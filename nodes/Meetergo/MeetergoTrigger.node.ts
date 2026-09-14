import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { apiRequest } from './api';

export class MeetergoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'meetergo Trigger',
		name: 'meetergoTrigger',
		icon: { light: 'file:meetergo.svg', dark: 'file:meetergo.dark.svg' },
		subtitle: '={{$parameter["events"].join(", ")}}',
		group: ['trigger'],
		version: 1,
		description: 'Start a workflow when a meetergo booking changes',
		defaults: { name: 'meetergo Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'meetergoApi', required: true }],
		webhooks: [
			{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' },
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['booking_created'],
				options: [
					{ name: 'Booking Cancelled', value: 'booking_cancelled' },
					{ name: 'Booking Created', value: 'booking_created' },
					{ name: 'Booking Rescheduled', value: 'booking_rescheduled' },
				],
			},
			{
				displayName:
					'Your meetergo plan must include webhooks. Each active trigger uses one of the six webhook slots available per workspace.',
				name: 'webhookNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				if (!state.webhookId) return false;
				const hooks = (await apiRequest(this, 'GET', '/webhooks')) as IDataObject[];
				const events = this.getNodeParameter('events') as string[];
				return hooks.some(
					(h) =>
						String(h.id) === String(state.webhookId) &&
						h.endpoint === this.getNodeWebhookUrl('default') &&
						Array.isArray(h.eventTypes) &&
						h.eventTypes.length === events.length &&
						events.every((e) => (h.eventTypes as string[]).includes(e)),
				);
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				const endpoint = this.getNodeWebhookUrl('default');
				if (!endpoint?.startsWith('https://'))
					throw new NodeOperationError(
						this.getNode(),
						'meetergo requires an HTTPS webhook URL. Configure the public n8n webhook URL first.',
					);
				const events = this.getNodeParameter('events') as string[];
				if (!events.length)
					throw new NodeOperationError(this.getNode(), 'Select at least one booking event');
				if (state.webhookId) {
					const hooks = (await apiRequest(this, 'GET', '/webhooks')) as IDataObject[];
					if (hooks.some((h) => String(h.id) === String(state.webhookId) && h.endpoint === state.webhookUrl)) {
						await apiRequest(
							this,
							'DELETE',
							`/webhooks/${encodeURIComponent(String(state.webhookId))}`,
						);
					}
					delete state.webhookId;
					delete state.webhookUrl;
				}
				const hook = (await apiRequest(this, 'POST', '/webhooks', {
					endpoint,
					eventTypes: events,
					description: 'n8n meetergo Trigger',
				})) as IDataObject;
				if (
					!(typeof hook.id === 'string' && hook.id.trim()) &&
					!(typeof hook.id === 'number' && Number.isSafeInteger(hook.id) && hook.id > 0)
				)
					throw new NodeOperationError(this.getNode(), 'meetergo did not return a webhook ID');
				state.webhookId = String(hook.id);
				state.webhookUrl = endpoint;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const state = this.getWorkflowStaticData('node');
				if (!state.webhookId) return true;
				const hooks = (await apiRequest(this, 'GET', '/webhooks')) as IDataObject[];
				if (hooks.some((h) => String(h.id) === String(state.webhookId) && h.endpoint === state.webhookUrl)) {
					await apiRequest(
						this,
						'DELETE',
						`/webhooks/${encodeURIComponent(String(state.webhookId))}`,
					);
				}
				delete state.webhookId;
				delete state.webhookUrl;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const events = this.getNodeParameter('events') as string[];
		if (typeof body.webhookType !== 'string' || !events.includes(body.webhookType)) return {};
		return { workflowData: [this.helpers.returnJsonArray(body)] };
	}
}
