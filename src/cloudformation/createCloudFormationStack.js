const fs = require('fs');
const path = require('path');
const getAWS = require('../getAWS');
const AWS = getAWS();
const Logger = require('../Logger');
const { GylEc2MainKeyName } = require('../common/resourceNames');
const { GylVersion } = require('../GylVersion');

const StackName = 'GrowYourList';

const createCloudFormationStack = async params => {
	const cloudFormation = new AWS.CloudFormation();
	const s3 = new AWS.S3();
	const {
		LambdaBucketName,
		ApiAuthKeyHash,
		DbTablePrefix,
		SesSourceEmail,
		QueueUser,
		BroadcastUser,
		AdminEmail,
	} = params;
	Logger.info('Uploading CloudFormation template to bucket');
	await s3
		.putObject({
			Bucket: LambdaBucketName,
			Key: 'gyl-template.yaml',
			ContentType: 'application/x-yaml',
			Body: fs.readFileSync(path.join(__dirname, 'gyl-template.yaml')),
		})
		.promise();
	Logger.log(
		`Creating CloudFormation stack ${StackName}. This process can ` +
			'take several minutes...'
	);
	await cloudFormation
		.validateTemplate({
			TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
		})
		.promise();
	await cloudFormation
		.createStack({
			StackName,
			TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
			Parameters: [
				{ ParameterKey: 'KeyName', ParameterValue: GylEc2MainKeyName },
				{ ParameterKey: 'GylVersion', ParameterValue: GylVersion },
				{ ParameterKey: 'LambdaBucketName', ParameterValue: LambdaBucketName },
				{ ParameterKey: 'ApiAuthKeyHash', ParameterValue: ApiAuthKeyHash },
				{ ParameterKey: 'DbTablePrefix', ParameterValue: DbTablePrefix },
				{ ParameterKey: 'AdminEmail', ParameterValue: AdminEmail },
				{ ParameterKey: 'SesSourceEmail', ParameterValue: SesSourceEmail },
				{
					ParameterKey: 'QueueUserAccessKeyId',
					ParameterValue: QueueUser.accessKeyId,
				},
				{
					ParameterKey: 'QueueUserSecretAccessKey',
					ParameterValue: QueueUser.secretAccessKey,
				},
				{
					ParameterKey: 'BroadcastUserAccessKeyId',
					ParameterValue: BroadcastUser.accessKeyId,
				},
				{
					ParameterKey: 'BroadcastUserSecretAccessKey',
					ParameterValue: BroadcastUser.secretAccessKey,
				},
			],
			Capabilities: ['CAPABILITY_IAM'],
		})
		.promise();

	try {
		const stackCreateCompleteResponse = await cloudFormation
			.waitFor('stackCreateComplete', { StackName })
			.promise();
		Logger.info(`CloudFormation stack ${StackName} created`);
		const stack = stackCreateCompleteResponse.Stacks[0];
		const outputs = {};
		const outputKeys = [
			'GylSesConfigurationSet',
			'GylOpenAndClickTopic',
			'GylUnsubscribeEventTopic',
			'GylSesFailureEventTopic',
		];
		for (let i = 0; i < stack.Outputs.length; i++) {
			const output = stack.Outputs[i];
			if ('GYL API Stage' === output.Description) {
				continue; // This is used in conjunction with
			} else if (outputKeys.indexOf(output.Description) >= 0) {
				// These details are returned as they are used in further processing
				outputs[output.Description] = output.OutputValue;
			} else if (output.Description === 'GYL API Url') {
				Logger.log(
					`${output.Description}: ${output.OutputValue}${
						(
							stack.Outputs.find(i => i.Description === 'GYL API Stage') || {
								OutputValue: '',
							}
						).OutputValue
					}`
				);
			} else if (output.Description === 'GYL API Key') {
				const apiGateway = new AWS.APIGateway();
				const apiKeyResponse = await apiGateway
					.getApiKey({ apiKey: output.OutputValue, includeValue: true })
					.promise();
				Logger.log(`GYL API Key: ${apiKeyResponse.value}`);
			} else {
				Logger.log(`${output.Description}: ${output.OutputValue}`);
			}
		}
		return outputs;
	} catch (err) {
		if (err.code === 'ResourceNotReady') {
			console.error(
				`Error: It seems the stack ${StackName} could not be ` +
					'created. Please investigate the error online in AWS Console > ' +
					'CloudFormation.'
			);
		}
		throw err;
	}
};

module.exports = createCloudFormationStack;
