const loadConfig = require('../loadConfig');
const getAWS = require('../getAWS');

const updateUsers = async (dbTablePrefix) => {
	await loadConfig();
	const region = process.env.AWS_REGION;
	const accountId = process.env.AWS_ACCOUNT_ID;

	const AWS = getAWS();
	const iam = new AWS.IAM();

	const ensureBroadcastQueueAccessForBroadcastUser = async () => {
		const PolicyArn = `arn:aws:iam::${accountId}:policy/GylBroadcastUserPolicy`;
		const GylBroadcastUserPolicy = await iam
			.getPolicy({
				PolicyArn,
			})
			.promise();
		// console.log(GylBroadcastUserPolicy);
		const latest = await iam
			.getPolicyVersion({
				PolicyArn,
				VersionId: GylBroadcastUserPolicy.Policy.DefaultVersionId,
			})
			.promise();
		const policyDoc = JSON.parse(
			decodeURIComponent(latest.PolicyVersion.Document)
		);
		const bqrArn = `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}BroadcastQueue`;
		const subscribersArn = `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Subscribers`;
		const broadcastQueuePolicy = policyDoc.Statement.find(
			(stmt) => stmt.Resource === bqrArn
		);
		if (!broadcastQueuePolicy) {
			policyDoc.Statement.push({
				Effect: 'Allow',
				Action: [
					'dynamodb:PutItem',
					'dynamodb:DeleteItem',
					'dynamodb:Query',
					'dynamodb:UpdateItem',
				],
				Resource: bqrArn,
			});
			const broadcastSubscribersPolicyIndex = policyDoc.Statement.findIndex(
				(stmt) => stmt.Resource === subscribersArn
			);
			policyDoc.Statement[broadcastSubscribersPolicyIndex] = Object.assign(
				{},
				policyDoc.Statement[broadcastSubscribersPolicyIndex],
				{
					Action: policyDoc.Statement[broadcastSubscribersPolicyIndex].concat(
						'dynamodb:UpdateItem'
					),
				}
			);

			await iam
				.createPolicyVersion({
					PolicyArn,
					PolicyDocument: JSON.stringify(policyDoc, null, 4),
					SetAsDefault: true,
				})
				.promise();
		}
	};

	await ensureBroadcastQueueAccessForBroadcastUser();
};

module.exports = updateUsers;
