const getAWS = require('../getAWS');
const Logger = require('../Logger');

const createUsers = async dbTablePrefix => {

	const region = process.env.AWS_REGION;
	const accountId = process.env.AWS_ACCOUNT_ID;

	const AWS = getAWS();
	const iam = new AWS.IAM();

	const createUser = async (UserName, PolicyDocument) => {
		Logger.info(`Creating user: ${UserName}`);
		await iam.createUser({ UserName }).promise();
	
		// Create a the permissions policy for the user.
		const PolicyName = `${UserName}Policy`;
		Logger.info(`Creating policy: ${PolicyName}`);
		const policyResponse = await iam
			.createPolicy({
				PolicyName,
				Description:
					'A policy granting all required permissions to run the GYL queue',
				PolicyDocument,
			})
			.promise();
	
		// Attach the permissions policy to the user.
		Logger.info(`Attaching policy ${PolicyName} to ${UserName}`);
		await iam
			.attachUserPolicy({
				UserName,
				PolicyArn: policyResponse.Policy.Arn,
			})
			.promise();
	
		// Generate access keys for the user
		Logger.info(`Generating access keys for ${UserName}`);
		const response = await iam.createAccessKey({ UserName }).promise();
		return {
			accessKeyId: response.AccessKey.AccessKeyId,
			secretAccessKey: response.AccessKey.SecretAccessKey,
		};
	};
	
	Logger.log('Creating GYL AWS users...');
	dbTablePrefix = dbTablePrefix || '';
	const GylQueueUser = await createUser(
		'GylQueueUser',
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: [
						'dynamodb:DescribeTable',
						'dynamodb:BatchWriteItem',
						'dynamodb:Query',
						'dynamodb:DeleteItem',
						'dynamodb:PutItem',
					],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Queue`,
				},
				{
					Effect: 'Allow',
					Action: ['dynamodb:GetItem', 'dynamodb:PutItem'],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Settings`,
				},
				{
					Effect: 'Allow',
					Action: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Subscribers`,
				},
				{
					Effect: 'Allow',
					Action: ['ses:SendTemplatedEmail', 'ses:SendBulkTemplatedEmail', 'ses:SendEmail'],
					Resource: '*',
				},
			],
		})
	);
	const GylBroadcastUser = await createUser(
		'GylBroadcastUser',
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['dynamodb:BatchWriteItem', 'dynamodb:Query'],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Queue`,
				},
				{
					Effect: 'Allow',
					Action: [
						'dynamodb:GetItem',
						'dynamodb:PutItem',
						'dynamodb:DeleteItem',
					],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Settings`,
				},
				{
					Effect: 'Allow',
					Action: ['dynamodb:Scan'],
					Resource: `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Subscribers`,
				},
			],
		})
	);
	return {
		GylQueueUser,
		GylBroadcastUser,
	};
};

module.exports = createUsers;
