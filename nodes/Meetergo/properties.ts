import type { INodeProperties } from 'n8n-workflow';

export const properties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		default: 'appointment',
		noDataExpression: true,
		options: [
			{
				name: 'Appointment',
				value: 'appointment',
			},
			{
				name: 'Availability',
				value: 'availability',
			},
			{
				name: 'Contact',
				value: 'contact',
			},
			{
				name: 'Meeting Type',
				value: 'meetingType',
			},
		],
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getAll',
		noDataExpression: true,
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel an appointment',
				description: 'Cancel an appointment',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an appointment',
				description: 'Create an appointment',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an appointment',
				description: 'Get an appointment',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many appointments',
				description: 'Get many appointments',
			},
			{
				name: 'Reschedule',
				value: 'reschedule',
				action: 'Reschedule an appointment',
				description: 'Reschedule an appointment',
			},
		],
		displayOptions: {
			show: {
				resource: ['appointment'],
			},
		},
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'get',
		noDataExpression: true,
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get available time slots',
				description: 'Get available time slots',
			},
		],
		displayOptions: {
			show: {
				resource: ['availability'],
			},
		},
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getAll',
		noDataExpression: true,
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a contact',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact',
				description: 'Get a contact',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many contacts',
				description: 'Get many contacts',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: 'Update a contact',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getAll',
		noDataExpression: true,
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a meeting type',
				description: 'Get a meeting type',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many meeting types',
				description: 'Get many meeting types',
			},
		],
		displayOptions: {
			show: {
				resource: ['meetingType'],
			},
		},
	},
	{
		displayName: 'Appointment ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['get', 'cancel', 'reschedule'],
			},
		},
	},
	{
		displayName: 'Contact ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'update'],
			},
		},
	},
	{
		displayName: 'Meeting Type ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['meetingType'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Meeting Type Name or ID',
		name: 'meetingTypeId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getMeetingTypes',
		},
		description: 'Choose from the list, or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Meeting Type Name or ID',
		name: 'meetingTypeId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getMeetingTypes',
		},
		description: 'Choose from the list, or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['availability'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'ISO 8601 time with a timezone offset',
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create', 'reschedule'],
			},
		},
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'ISO 8601 time with a timezone offset',
		displayOptions: {
			show: {
				resource: ['availability'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'End',
		name: 'end',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'End of the availability search window',
		displayOptions: {
			show: {
				resource: ['availability'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@example.com',
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@example.com',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['appointment', 'contact', 'meetingType'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['appointment', 'contact', 'meetingType'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Meeting Type ID',
				name: 'meetingTypeId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 30,
				typeOptions: {
					minValue: 1,
				},
				description: 'Duration in minutes allowed by the meeting type',
			},
			{
				displayName: 'Host IDs',
				name: 'hostIds',
				type: 'string',
				default: '',
				description: 'Comma-separated host IDs. Required unless a queue ID is supplied.',
			},
			{
				displayName: 'Queue ID',
				name: 'queueId',
				type: 'string',
				default: '',
				description: 'Queue ID for round-robin or collective meeting types',
			},
			{
				displayName: 'Receive Reminders',
				name: 'receiveReminders',
				type: 'boolean',
				default: true,
				description: 'Whether the attendee receives booking reminders',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'Europe/Berlin',
			},
		],
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'Attendee ID',
				name: 'attendeeId',
				type: 'string',
				default: '',
				description: 'For group bookings, cancel only this attendee',
			},
			{
				displayName: 'Cancel All Attendees',
				name: 'cancelAll',
				type: 'boolean',
				default: false,
				description:
					'Whether to cancel the entire group booking. Otherwise an attendee ID is required for group bookings.',
			},
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['cancel'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'Duration',
				name: 'meetingDuration',
				type: 'number',
				default: 30,
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Host IDs',
				name: 'hostIds',
				type: 'string',
				default: '',
				description: 'Comma-separated host IDs',
			},
			{
				displayName: 'Queue ID',
				name: 'queueId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'Europe/Berlin',
			},
		],
		displayOptions: {
			show: {
				resource: ['availability'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'Search',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description: 'Search contact names, email addresses or phone numbers',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'Add Option',
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@example.com',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
			},
		],
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
	},
];
