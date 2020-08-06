require('dotenv').config();
const read = require('read');
const readline = require('readline');
const { promisify } = require('util');

const getAWS = require('./getAWS');
const Logger = require('./Logger');

const loadConfig = async () => {
	if (
		!(
			process.env.AWS_REGION &&
			process.env.AWS_ACCESS_KEY_ID &&
			process.env.AWS_SECRET_ACCESS_KEY &&
			process.env.AWS_ACCOUNT_ID
		)
	) {
		if (
			process.env.AWS_REGION ||
			process.env.AWS_ACCESS_KEY_ID ||
			process.env.AWS_SECRET_ACCESS_KEY ||
			process.env.AWS_ACCOUNT_ID
		) {
			throw new Error(
				'One of the environment variables are set but not all ' +
					'of them: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ' +
					'AWS_ACCOUNT_ID. Either set all of them in the .env file or none of ' +
					'them to enter them interactively.'
			);
		}
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		let userInput = '';

		console.log('\nSet your AWS config details');
		console.log(
			'Please enter the config details for the AWS account in ' +
				"which you would like to set up Grow Your List. Typing 'c' as an " +
				'answer will cancel the process.'
		);

		do {
			userInput = await new Promise((resolve) => {
				rl.question('AWS region [e.g. eu-west-1]: ', (answer) =>
					resolve(answer)
				);
			});
		} while (!userInput && userInput !== 'c');
		if (userInput === 'c') {
			process.exit();
		}
		process.env['AWS_REGION'] = userInput.trim();
		userInput = '';
		do {
			userInput = await new Promise((resolve) => {
				rl.question('AWS user access key id: ', (answer) => resolve(answer));
			});
		} while (!userInput && userInput !== 'c');
		if (userInput === 'c') {
			process.exit();
		}
		rl.close();
		process.env['AWS_ACCESS_KEY_ID'] = userInput.trim();
		userInput = '';
		do {
			userInput = await promisify(read)({
				prompt: 'AWS user secret access key: ',
				silent: true,
				replace: '*',
			});
		} while (!userInput && userInput !== 'c');
		if (userInput === 'c') {
			process.exit();
		}
		process.env['AWS_SECRET_ACCESS_KEY'] = userInput.trim();

		// Test the connection details and get the account id
		Logger.info('Testing AWS config details...');
		const AWS = getAWS();
		const iam = new AWS.IAM();
		const accessKeyResponse = await iam
			.getAccessKeyLastUsed({
				AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
			})
			.promise();
		const { UserName } = accessKeyResponse;
		const userResponse = await iam.getUser({ UserName }).promise();
		const { Arn } = userResponse.User;
		const arnParts = Arn.split(':');
		process.env['AWS_ACCOUNT_ID'] = arnParts[4];
		Logger.log('Successfully tested AWS config details.');
	} else {
		Logger.info('Detected AWS connection details set in .env file');
	}
};

module.exports = loadConfig;
