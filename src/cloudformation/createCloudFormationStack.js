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
	Logger.info(
		`Creating CloudFormation stack ${StackName}. This process can ` +
			'take several minutes...'
	);
	await cloudFormation
		.validateTemplate({
			TemplateBody: fs
				.readFileSync(path.join(__dirname, 'gyl-template.yaml'))
				.toString('utf8'),
		})
		.promise();

	const {
		LambdaBucketName,
		ApiAuthKeyHash,
		DbTablePrefix,
		SesSourceEmail,
	} = params;
	await cloudFormation
		.createStack({
			StackName,
			TemplateBody: fs
				.readFileSync(path.join(__dirname, 'gyl-template.yaml'))
				.toString('utf8'),
			Parameters: [
				{ ParameterKey: 'KeyName', ParameterValue: GylEc2MainKeyName },
				{ ParameterKey: 'GylVersion', ParameterValue: GylVersion },
				{ ParameterKey: 'LambdaBucketName', ParameterValue: LambdaBucketName },
				{ ParameterKey: 'ApiAuthKeyHash', ParameterValue: ApiAuthKeyHash },
				{ ParameterKey: 'DbTablePrefix', ParameterValue: DbTablePrefix },
				{ ParameterKey: 'SesSourceEmail', ParameterValue: SesSourceEmail },
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
		for (let i = 0; i < stack.Outputs.length; i++) {
			const output = stack.Outputs[i];
			if (output.Description === 'GYL API Stage') {
				continue; // Skip because it gets joined to the api url
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
