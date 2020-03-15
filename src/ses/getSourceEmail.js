const readline = require('readline');
// const getAWS = require('../getAWS');

const getSourceEmail = async () => {
	// const AWS = getAWS();
	// const ses = new AWS.SES();

	const askForEmail = async () => {
		let email = '';
		let name = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			name = await new Promise(resolve => {
				rl.question(
					"Enter the name you are sending emails from [e.g. Company XYZ]: ",
					result => {
						resolve(result.trim());
					}
				);
			});
		} while (!name);
		if (name === 'c') {
			rl.close();
			process.exit();
		}
		do {
			email = await new Promise(resolve => {
				rl.question(
					"Enter the email you are sending from [e.g. name@example.com]: ",
					result => {
						resolve(result.trim());
					}
				);
			});
		} while (!email);
		rl.close();
		if (email === 'c') {
			process.exit();
		}

		return {name, email};
	};

	const confirmEmail = async (fullEmail) => {
		let confirm = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			confirm = await new Promise(resolve => {
				rl.question(
					`This account will send emails from: "${fullEmail.name} <${fullEmail.email}>". Correct? [y/n/c]: `,
					result => {
						resolve(result.trim());
					}
				);
			});
		} while (!confirm && !(confirm === 'y' || confirm === 'n' || confirm === 'c'));
		rl.close();
		if (confirm === 'c') {
			process.exit();
		}
		if (confirm === 'n') {
			const newEmail = await askForEmail();
			return await confirmEmail(newEmail);
		}
		return fullEmail;
	}

	console.log(
		"\n## Set GYL Source Email ##\n" +
		"A source email is used as the 'from' address for all emails sent by " +
			'AWS SES and therefore GrowYourList. This email must be validated by ' +
			'clicking a link sent to it before it can be used.'
	);
	
	const emailParts = await askForEmail();
	const finalEmailParts = await confirmEmail(emailParts);
	const EmailAddress = `${finalEmailParts.name} <${finalEmailParts.email}>`;
	// await ses.verifyEmailAddress({ EmailAddress }).promise();
	console.log(`Check the inbox of "${EmailAddress}" for a validation link.`);
	return EmailAddress;
};

module.exports = getSourceEmail;
