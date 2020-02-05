const readline = require('readline');
const bcrypt = require('bcrypt');

const hashKeyCli = async () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const authKey = await new Promise(resolve => {
		rl.question(
			'Enter the API Auth Key (a long, random value) to hash: ',
			result => {
				rl.close();
				resolve(result);
			}
		);
	});
	if (!authKey || !authKey.trim()) {
		console.log('');
		return;
	}
	const hash = await bcrypt.hash(authKey.trim(), 10);
	console.log(hash);
	console.log(
		'Use the API Auth Key you entered to authorise your requests when ' +
			'interacting with the GrowYourList API.'
	);
	console.log(
		'Copy the hash value returned above to the ApiAuthKeyHash environment ' +
			'variable value in the AWS > Lambda > GylApiAuthorizer lambda function ' +
			'to validate requests with your newly created API Auth Key.'
	);
};

hashKeyCli();
