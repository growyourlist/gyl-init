const readline = require('readline');

const types = [
	't2.nano',
	't2.microFree',
	't2.small',
	't2.medium',
	't2.large',
	't2.xlarge',
	't2.2xlarge',
	't3a.nano',
	't3a.micro',
	't3a.small',
	't3a.medium',
	't3a.large',
	't3a.xlarge',
	't3a.2xlarge',
	't3.nano',
	't3.micro',
	't3.small',
	't3.medium',
	't3.large',
	't3.xlarge',
	't3.2xlarge',
	'm5ad.large',
	'm5ad.xlarge',
	'm5ad.2xlarge',
	'm5ad.4xlarge',
	'm5ad.12xlarge',
	'm5ad.24xlarge',
	'm5a.large',
	'm5a.xlarge',
	'm5a.2xlarge',
	'm5a.4xlarge',
	'm5a.8xlarge',
	'm5a.12xlarge',
	'm5a.16xlarge',
	'm5a.24xlarge',
	'm5d.large',
	'm5d.xlarge',
	'm5d.2xlarge',
	'm5d.4xlarge',
	'm5d.8xlarge',
	'm5d.12xlarge',
	'm5d.16xlarge',
	'm5d.24xlarge',
	'm5d.metal',
	'm5n.large',
	'm5n.xlarge',
	'm5n.2xlarge',
	'm5n.4xlarge',
	'm5n.8xlarge',
	'm5n.12xlarge',
	'm5n.16xlarge',
	'm5dn.large',
	'm5dn.xlarge',
	'm5dn.2xlarge',
	'm5dn.4xlarge',
	'm5dn.8xlarge',
	'm5dn.12xlarge',
	'm5dn.16xlarge',
	'm5n.24xlarge',
	'm5dn.24xlarge',
	'r5n.large',
	'r5n.xlarge',
	'r5n.2xlarge',
	'r5n.4xlarge',
	'r5n.8xlarge',
	'r5n.12xlarge',
	'r5n.16xlarge',
	'r5dn.large',
	'r5dn.xlarge',
	'r5dn.2xlarge',
	'r5dn.4xlarge',
	'r5dn.8xlarge',
	'r5dn.12xlarge',
	'r5dn.16xlarge',
	'r5n.24xlarge',
	'r5dn.24xlarge',
	'm5.large',
	'm5.xlarge',
	'm5.2xlarge',
	'm5.4xlarge',
	'm5.8xlarge',
	'm5.12xlarge',
	'm5.16xlarge',
	'm5.24xlarge',
	'm5.metal',
	'm4.large',
	'm4.xlarge',
	'm4.2xlarge',
	'm4.4xlarge',
	'm4.10xlarge',
	'm4.16xlarge',
	'a1.medium',
	'a1.large',
	'a1.xlarge',
	'a1.2xlarge',
	'a1.4xlarge',
	'a1.metal',
	'c5n.large',
	'c5n.xlarge',
	'c5n.2xlarge',
	'c5n.4xlarge',
	'c5n.9xlarge',
	'c5n.18xlarge',
	'c5n.metal',
	'c5d.large',
	'c5d.xlarge',
	'c5d.2xlarge',
	'c5d.4xlarge',
	'c5d.9xlarge',
	'c5d.12xlarge',
	'c5d.18xlarge',
	'c5d.24xlarge',
	'c5d.metal',
	'c5.large',
	'c5.xlarge',
	'c5.2xlarge',
	'c5.4xlarge',
	'c5.9xlarge',
	'c5.12xlarge',
	'c5.18xlarge',
	'c5.24xlarge',
	'c5.metal',
	'c4.large',
	'c4.xlarge',
	'c4.2xlarge',
	'c4.4xlarge',
	'c4.8xlarge',
	'f1.2xlarge',
	'f1.4xlarge',
	'f1.16xlarge',
	'g2.2xlarge',
	'g2.8xlarge',
	'g3s.xlarge',
	'g3.4xlarge',
	'g3.8xlarge',
	'g3.16xlarge',
	'g4dn.xlarge',
	'g4dn.2xlarge',
	'g4dn.4xlarge',
	'g4dn.8xlarge',
	'g4dn.12xlarge',
	'g4dn.16xlarge',
	'p2.xlarge',
	'p2.8xlarge',
	'p2.16xlarge',
	'p3.2xlarge',
	'p3.8xlarge',
	'p3.16xlarge',
	'p3dn.24xlarge',
	'inf1.xlarge',
	'inf1.2xlarge',
	'inf1.6xlarge',
	'inf1.24xlarge',
	'r5ad.large',
	'r5ad.xlarge',
	'r5ad.2xlarge',
	'r5ad.4xlarge',
	'r5ad.12xlarge',
	'r5ad.24xlarge',
	'r5a.large',
	'r5a.xlarge',
	'r5a.2xlarge',
	'r5a.4xlarge',
	'r5a.8xlarge',
	'r5a.12xlarge',
	'r5a.16xlarge',
	'r5a.24xlarge',
	'r5d.large',
	'r5d.xlarge',
	'r5d.2xlarge',
	'r5d.4xlarge',
	'r5d.8xlarge',
	'r5d.12xlarge',
	'r5d.16xlarge',
	'r5d.24xlarge',
	'r5d.metal',
	'r5.large',
	'r5.xlarge',
	'r5.2xlarge',
	'r5.4xlarge',
	'r5.8xlarge',
	'r5.12xlarge',
	'r5.16xlarge',
	'r5.24xlarge',
	'r5.metal',
	'r4.large',
	'r4.xlarge',
	'r4.2xlarge',
	'r4.4xlarge',
	'r4.8xlarge',
	'r4.16xlarge',
	'x1.16xlarge',
	'x1.32xlarge',
	'x1e.xlarge',
	'x1e.2xlarge',
	'x1e.4xlarge',
	'x1e.8xlarge',
	'x1e.16xlarge',
	'x1e.32xlarge',
	'z1d.large',
	'z1d.xlarge',
	'z1d.2xlarge',
	'z1d.3xlarge',
	'z1d.6xlarge',
	'z1d.12xlarge',
	'z1d.metal',
	'd2.xlarge',
	'd2.2xlarge',
	'd2.4xlarge',
	'd2.8xlarge',
	'i2.xlarge',
	'i2.2xlarge',
	'i2.4xlarge',
	'i2.8xlarge',
	'h1.2xlarge',
	'h1.4xlarge',
	'h1.8xlarge',
	'h1.16xlarge',
	'i3.large',
	'i3.xlarge',
	'i3.2xlarge',
	'i3.4xlarge',
	'i3.8xlarge',
	'i3.16xlarge',
	'i3.metal',
	'i3en.large',
	'i3en.xlarge',
	'i3en.2xlarge',
	'i3en.3xlarge',
	'i3en.6xlarge',
	'i3en.12xlarge',
	'i3en.24xlarge',
	'i3en.metal',
];

const getEc2InstanceType = async (opts = {}) => {
	const currentValue = opts.currentValue || '';

	if (process.env.GYL_EC2_INSTANCE_TYPE) {
		return process.env.GYL_EC2_INSTANCE_TYPE;
	}

	const askForType = async () => {
		let type = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		do {
			type = await new Promise((resolve) => {
				rl.question(
					`  Enter the EC2 instance type; e.g. t2.micro ['c' to cancel setup, 's' to show all types (there are lots)]: `,
					(result) => {
						resolve(result);
					}
				);
			});
		} while (
			!currentValue &&
			!type &&
			!type &&
			type !== 'c' &&
			type !== 's' &&
			types.indexOf(type) < 0
		);
		rl.close();
		if (type === 'c') {
			process.exit();
		}
		if (type === 's') {
			console.log(`\n${types.join(', ')}\n`);
			return await askForType();
		}
		return type;
	};

	console.log(
		'\n## Set GYL EC2 Instance Type ##\n' +
			'This is the size of the EC2 that will power your list. t2.micro is ' +
			"smallest and typically eligible for AWS's free tier."
	);
	if (currentValue) {
		console.log(
			`Leave field blank to keep the EC2 instance type: "${currentValue}"`
		);
	}
	const instanceTypeInput = (await askForType({ currentValue })).trim();
	const instanceType = instanceTypeInput || currentValue;
	return instanceType;
};

module.exports = getEc2InstanceType;
