const readline = require('readline');

const getUserInput = async (question = '') => {
	let input = '';
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	input = await new Promise((resolve) => {
		rl.question(question, (result) => resolve(result));
	});
	rl.close();
	return input;
};

module.exports = getUserInput;
