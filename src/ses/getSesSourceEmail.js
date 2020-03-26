const readline = require('readline');
const getAWS = require('../getAWS');

const getSesSourceEmail = async () => {

	if (process.env.SES_SOURCE_EMAIL) {
		return process.env.SES_SOURCE_EMAIL;
	}

	const AWS = getAWS();
	const ses = new AWS.SES();

	const askForEmail = async () => {
		let email = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			email = await new Promise(resolve => {
				rl.question(
					"Enter the source email [e.g. test@example.com]: ",
					result => {
						resolve(result);
					}
				);
			});
		} while (!email);
		rl.close();
		if (email === 'c') {
			process.exit();
		}
		return email;
	};

	console.log(
		"\n## Set GYL Source Email ##\n" +
		"A source email is used as the 'from' address for all emails sent by " +
			'AWS SES and therefore GrowYourList. This email must be validated by ' +
			'clicking a link sent to it before it can be used.'
	);
	const email = await askForEmail();
	await ses.verifyEmailAddress({ EmailAddress: email.trim() }).promise();
	console.log(`Check the inbox of "${email.trim()}" for a validation link.`);
	return email;
};

module.exports = getSesSourceEmail;
