const readline = require('readline');

const getFooterAddress = async () => {
	const askForFooterAddress = async () => {
		let address = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			address = await new Promise(resolve => {
				rl.question(
					"Enter physical address [e.g. 123 Sunshine Avenue, Blueberry State, 55555, Exampleland]: ",
					result => {
						resolve(result.trim());
					}
				);
			});
		} while (!address);
		rl.close();
		if (address === 'c') {
			process.exit();
		}
		return address;
	}

	const confirmFooterAddress = async (address) => {
		let confirm = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			confirm = await new Promise(resolve => {
				rl.question(
					`The following address will appear at the base of emails:
${address}
Correct? [y/n/c]: `,
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
			const newAddress = await askForFooterAddress();
			return await confirmFooterAddress(newAddress);
		}
		return address;
	}

	console.log(
		"\n## Set Physical Address ##\n" +
		"In accordance with laws around the world, you must provide a physical " +
			"address when sending emails. Please enter a physical address to be " +
			"inserted into the footer of emails sent by this account. You can " +
			"customize it later."
	);

	const footerAddress = await askForFooterAddress();
	const finalFooterAddress = await confirmFooterAddress(footerAddress);
	console.log(finalFooterAddress)
	process.exit();
}

module.exports = getFooterAddress;
