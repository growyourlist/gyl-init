const readline = require('readline');
const getAWS = require('../getAWS');

const removeSourceEmail = async () => {
	const AWS = getAWS();
	const ses = new AWS.SES();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const email = await new Promise((resolve) => {
		rl.question('Source email to remove (hit "Enter" to skip): ', result => {
			rl.close();
			resolve(result)
		})
	});
	if (!email || !email.trim()) {
		return ''
	}
	try {
		await ses.deleteIdentity({ Identity: email.trim() }).promise()
		console.log('Source email removed')
	}
	catch (err) {
		if (err.code === 'InvalidParameterValue') {
			console.warn(err.message)
			return await removeSourceEmail()
		}
	}
};

module.exports = removeSourceEmail;
