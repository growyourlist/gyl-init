const readline = require('readline');
const AWS = require('../getAWS')();
const ses = new AWS.SES();

const validateSourceEmail = async () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log(
		"A source email is used as the 'from' address for all emails sent by " +
			'AWS SES and therefore GrowYourList. This email must be validated by ' +
			'clicking a link sent to it before it can be used.'
	);
	const email = await new Promise((resolve) => {
		rl.question('Enter the source email (hit "Enter" to skip): ', result => {
			rl.close();
			resolve(result)
		})
	});
	if (!email || !email.trim()) {
		return ''
	}
	await ses.verifyEmailAddress({EmailAddress: email.trim()}).promise()
	console.log(`Check the inbox of "${email.trim()}" for a validation link.`)
	return email
};

module.exports = validateSourceEmail;
