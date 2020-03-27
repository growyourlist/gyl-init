const readline = require('readline');

const getPostalAddress = async () => {

	if (process.env.POSTAL_ADDRESS) {
		return process.env.POSTAL_ADDRESS;
	}

	const askForAddress = async () => {
		let footerAddress = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			footerAddress = await new Promise(resolve => {
				rl.question(
					"Enter your postal address ['c' to cancel setup]: ",
					result => {
						resolve(result);
					}
				);
			});
		} while (!footerAddress);
		rl.close();
		if (footerAddress === 'c') {
			process.exit();
		}
		return footerAddress;
	};

	console.log(
		"\n## Set Postal Address ##\n" +
		"Enter the address where you are physically located so it can be " +
		"included in the footer of all emails you send. Telling recipients of " +
		"your emails where you are located is a legal requirement around the " +
		"world; for example, in the US's CAN-SPAM Act."
	);
	console.log("For example: 123 Example Ave. Mytown, VT 12345, USA");
	const email = await askForAddress();
	return email.trim();
};

module.exports = getPostalAddress;
