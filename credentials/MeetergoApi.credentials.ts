import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
export class MeetergoApi implements ICredentialType {
	name = 'meetergoApi';
	displayName = 'Meetergo API';
	icon = {
		light: 'file:../nodes/Meetergo/meetergo.svg',
		dark: 'file:../nodes/Meetergo/meetergo.dark.svg',
	} as const;
	documentationUrl = 'https://developer.meetergo.com/developer-docs/personal-access-tokens';
	properties: INodeProperties[] = [
		{
			displayName: 'Personal Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create a personal access token in your meetergo API settings. Include Scheduling permission for connection testing, CRM for contact operations and Account for triggers. The token acts as its owner.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.accessToken}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://api.meetergo.com', url: '/v4/meeting-type', method: 'GET' },
	};
}
