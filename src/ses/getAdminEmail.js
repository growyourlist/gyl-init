const readline = require('readline');

const getAdminEmail = async () => {

	if (process.env.GYL_ADMIN_EMAIL) {
		return process.env.GYL_ADMIN_EMAIL;
	}

	const askForEmail = async () => {
		let email = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			email = await new Promise(resolve => {
				rl.question(
					"Enter the source email ['c' to cancel setup]: ",
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
		"\n## Set GYL Admin Email ##\n" +
		"An admin email address will receive emails about errors and other " +
			"operating information. This email must also be validated by clicking " +
			"a link sent to it before it can be used."
	);
	const email = await askForEmail();
	console.log(`Check the inbox of "${email.trim()}" for a validation link.`);
	return email.trim();
};

module.exports = getAdminEmail;
