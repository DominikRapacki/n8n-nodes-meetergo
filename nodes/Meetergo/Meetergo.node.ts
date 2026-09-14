import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { apiRequest, getMany } from './api';
import { properties } from './properties';
export class Meetergo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'meetergo',
		name: 'meetergo',
		icon: { light: 'file:meetergo.svg', dark: 'file:meetergo.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage meetergo appointments, availability, meeting types and contacts',
		defaults: { name: 'meetergo' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'meetergoApi', required: true }],
		properties,
	};
	methods = {
		loadOptions: {
			async getMeetingTypes(this: ILoadOptionsFunctions) {
				const records = (await apiRequest(this, 'GET', '/v4/meeting-type')) as IDataObject[];
				return records.map((record) => ({
					name: String((record.meetingInfo as IDataObject | undefined)?.name || record.id),
					value: String(record.id),
				}));
			},
		},
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const output: INodeExecutionData[] = [];
		for (let i = 0; i < this.getInputData().length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const operations: Record<string, string[]> = {
					appointment: ['get', 'getAll', 'create', 'reschedule', 'cancel'],
					availability: ['get'],
					contact: ['get', 'getAll', 'create', 'update'],
					meetingType: ['get', 'getAll'],
				};
				if (!operations[resource]?.includes(operation))
					throw new NodeOperationError(this.getNode(), 'Unsupported resource or operation', {
						itemIndex: i,
					});
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				let response: IDataObject | IDataObject[] | undefined;
				const id = () => encodeURIComponent(this.getNodeParameter('id', i) as string);
				if (operation === 'getAll' && (resource === 'appointment' || resource === 'contact')) {
					const limit = this.getNodeParameter('returnAll', i)
						? Infinity
						: (this.getNodeParameter('limit', i) as number);
					response = await getMany(this, resource, limit, options);
				} else if (resource === 'meetingType') {
					response = await apiRequest(
						this,
						'GET',
						operation === 'get' ? `/v4/meeting-type/${id()}` : '/v4/meeting-type',
					);
					if (
						operation === 'getAll' &&
						Array.isArray(response) &&
						!this.getNodeParameter('returnAll', i)
					)
						response = response.slice(0, this.getNodeParameter('limit', i) as number);
				} else if (resource === 'availability') {
					response = await apiRequest(this, 'GET', '/v4/booking-availability', undefined, {
						...options,
						meetingTypeId: this.getNodeParameter('meetingTypeId', i) as string,
						start: this.getNodeParameter('start', i) as string,
						end: this.getNodeParameter('end', i) as string,
					});
				} else if (resource === 'appointment') {
					if (operation === 'get')
						response = await apiRequest(this, 'GET', `/v4/appointment/${id()}`);
					else if (operation === 'create') {
						const hostIds = String(options.hostIds || '')
							.split(',')
							.map((s) => s.trim())
							.filter(Boolean);
						const queueId = String(options.queueId || '').trim();
						if (!hostIds.length && !queueId)
							throw new NodeOperationError(
								this.getNode(),
								'Provide host IDs or a queue ID from the meeting type',
								{ itemIndex: i },
							);
						response = await apiRequest(this, 'POST', '/v4/booking', {
							meetingTypeId: this.getNodeParameter('meetingTypeId', i) as string,
							start: this.getNodeParameter('start', i) as string,
							...(hostIds.length ? { hostIds } : {}),
							...(queueId ? { queueId } : {}),
							...(options.duration ? { duration: options.duration } : {}),
							attendee: {
								email: this.getNodeParameter('email', i) as string,
								fullname: this.getNodeParameter('fullName', i) as string,
								receiveReminders: options.receiveReminders ?? true,
								notes: {},
								...(options.timezone ? { timezone: options.timezone } : {}),
							},
						});
					} else if (operation === 'reschedule') {
						response = await apiRequest(this, 'POST', `/v4/appointment/${id()}/reschedule`, {
							start: this.getNodeParameter('start', i) as string,
						});
					} else if (operation === 'cancel') {
						response = await apiRequest(this, 'POST', `/v4/appointment/${id()}/cancel`, options);
					}
				} else if (resource === 'contact') {
					if (operation === 'get') {
						const data = (await apiRequest(this, 'GET', '/crm/details', undefined, {
							contactId: this.getNodeParameter('id', i) as string,
						})) as IDataObject;
						response = data.item as IDataObject;
					} else if (operation === 'create') {
						const data = (await apiRequest(this, 'POST', '/crm', {
							...options,
							email: this.getNodeParameter('email', i) as string,
						})) as IDataObject;
						response = data.item as IDataObject;
					} else if (operation === 'update') {
						if (!Object.keys(options).length)
							throw new NodeOperationError(this.getNode(), 'Select at least one field to update', {
								itemIndex: i,
							});
						response = await apiRequest(this, 'PATCH', `/crm/${id()}`, options);
					}
				}
				if (response === undefined) response = { success: true };
				for (const json of Array.isArray(response) ? response : [response])
					output.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [output];
	}
}
