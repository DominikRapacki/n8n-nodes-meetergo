import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
} from 'n8n-workflow';
export type ApiContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;
export async function apiRequest(
	context: ApiContext,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs: IDataObject = {},
): Promise<IDataObject | IDataObject[] | undefined> {
	const response: unknown = await context.helpers.httpRequestWithAuthentication.call(context, 'meetergoApi', {
		method,
		url: `https://api.meetergo.com${path}`,
		qs,
		...(body === undefined ? {} : { body }),
		json: true,
		timeout: 30000,
	});
	if (response === '' || response === null || response === undefined) return undefined;
	if (typeof response !== 'object') throw new Error('Unexpected meetergo API response');
	return response as IDataObject | IDataObject[];
}
export async function getMany(
	context: ApiContext,
	resource: 'appointment' | 'contact',
	limit: number,
	filters: IDataObject,
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let page = resource === 'appointment' ? 0 : 1;
	const path = resource === 'appointment' ? '/v4/appointment/paginated' : '/crm';
	const seen = new Set<string>();
	const pageSize = Math.min(100, limit);
	while (results.length < limit) {
		const response = (await apiRequest(context, 'GET', path, undefined, {
			...filters,
			page,
			[resource === 'appointment' ? 'pageSize' : 'limit']: pageSize,
		})) as IDataObject;
		const records = response[resource === 'appointment' ? 'appointments' : 'result'];
		if (!Array.isArray(records)) throw new Error('Unexpected meetergo pagination response');
		if (records.length === 0) break;
		let added = 0;
		for (const record of records as IDataObject[]) {
			const item = resource === 'contact' ? (record.item as IDataObject) : record;
			if (!item || typeof item.id !== 'string')
				throw new Error('meetergo returned a record without an ID');
			if (!seen.has(item.id)) {
				seen.add(item.id);
				results.push(item);
				added++;
			}
		}
		if (!added)
			throw new Error('meetergo repeated a page; stopped to avoid an endless request loop');
		if (
			records.length < pageSize ||
			(typeof response.total === 'number' && seen.size >= response.total)
		)
			break;
		page++;
	}
	return results.slice(0, limit);
}
