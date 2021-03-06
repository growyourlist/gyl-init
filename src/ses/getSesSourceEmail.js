const readline = require('readline');
const getAWS = require('../getAWS');

const getSesSourceEmail = async (opts = {}) => {
	const currentValue = opts.currentValue || '';

	if (process.env.SES_SOURCE_EMAIL) {
		return process.env.SES_SOURCE_EMAIL;
	}

	const AWS = getAWS();
	const ses = new AWS.SES();

	const askForName = async () => {
		let name = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		name = await new Promise((resolve) => {
			rl.question(`  Enter the source name [e.g. Company XYZ]: `, (result) => {
				resolve(result);
			});
		});
		rl.close();
		return name;
	};

	const askForEmail = async (opts = {}) => {
		const allowBlank = opts.allowBlank || false;
		let email = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			email = await new Promise((resolve) => {
				rl.question(
					"  Enter the source email [e.g. test@example.com; 'c' to cancel setup]: ",
					(result) => {
						resolve(result);
					}
				);
			});
		} while (!allowBlank && !email);
		rl.close();
		if (email === 'c') {
			process.exit();
		}
		return email;
	};

	console.log(
		'\n## Set GYL Source Email ##\n' +
			"A source email is used as the 'from' address for all emails sent by " +
			'AWS SES and therefore GrowYourList. This email must be validated by ' +
			'clicking a link sent to it before it can be used. This email is set ' +
			'in two parts: 1. your name as it should appear in the from field and ' +
			'2. your email. The name can be blank but the email is required. ' +
			'The names are put together to send email like so: "Name <email>".'
	);
	if (currentValue) {
		console.log(
			`Leave both fields blank to keep the source email: "${currentValue}"`
		);
	}
	const name = await askForName();
	const emailInput = await askForEmail({ allowBlank: !!currentValue && !name });
	const email = emailInput || currentValue || '';
	if (email !== currentValue) {
		await ses.verifyEmailAddress({ EmailAddress: email.trim() }).promise();
		console.log(`Check the inbox of "${email.trim()}" for a validation link.`);
	}
	if (currentValue && !name && !email) {
		return currentValue;
	}
	if (name) {
		return `${name} <${email}>`;
	}
	return email;
};

module.exports = getSesSourceEmail;
