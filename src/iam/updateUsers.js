const getAWS = require('../getAWS');
const Logger = require('../Logger');

const updateUsers = async (dbTablePrefix) => {
	const region = process.env.AWS_REGION;
	const accountId = process.env.AWS_ACCOUNT_ID;

	const AWS = getAWS();
	const iam = new AWS.IAM();

	async function updateBroadcastUser() {
		const PolicyArn = `arn:aws:iam::${accountId}:policy/GylBroadcastUserPolicy`;

		let _cachedPolicyDoc;

		async function getBroadcastUserPolicyDoc() {
			if (_cachedPolicyDoc) {
				return _cachedPolicyDoc;
			}
			const GylBroadcastUserPolicy = await iam.getPolicy({ PolicyArn }).promise();
			const latest = await iam
				.getPolicyVersion({
					PolicyArn,
					VersionId: GylBroadcastUserPolicy.Policy.DefaultVersionId,
				})
				.promise();
			_cachedPolicyDoc = JSON.parse(
				decodeURIComponent(latest.PolicyVersion.Document)
			);
			return _cachedPolicyDoc;
		}

		async function updateBroadcastUserPolicyDoc(policyDoc) {
			const versionsResponse = await iam.listPolicyVersions({
				PolicyArn
			}).promise();
			if (versionsResponse.Versions.length >= 5) {
				const versions = versionsResponse.Versions.slice();
				versions.sort((a, b) => Date.parse(a.CreateDate) - Date.parse(b.CreateDate))
				const oldestVersion = versions[0];
				if (!oldestVersion) {
					throw new Error(`Unable to find oldest version of ${PolicyArn}`);
				}
				if (!oldestVersion.VersionId) {
					throw new Error(`Oldest policy version does not have a version id`);
				}
				await iam.deletePolicyVersion({
					PolicyArn,
					VersionId: oldestVersion.VersionId,
				}).promise();
			}
			await iam
				.createPolicyVersion({
					PolicyArn,
					PolicyDocument: JSON.stringify(policyDoc, null, 4),
					SetAsDefault: true,
				})
				.promise();
		}

		async function ensureBroadcastQueueAccessForBroadcastUser() {
			const policyDoc = await getBroadcastUserPolicyDoc();
			const bqrArn = `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}BroadcastQueue`;
			const subscribersArn = `arn:aws:dynamodb:${region}:${accountId}:table/${dbTablePrefix}Subscribers`;
			const broadcastQueuePolicy = policyDoc.Statement.find(
				(stmt) => stmt.Resource === bqrArn
			);
			if (!broadcastQueuePolicy) {
				Logger.log('Updating GylBroadcastUserPolicy...')
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
					(stmt) => ((stmt.Resource === subscribersArn) || (Array.isArray(stmt.Resource) && stmt.Resource.indexOf(subscribersArn) >= 0))
				);
				if (broadcastSubscribersPolicyIndex >= 0) {
					policyDoc.Statement[broadcastSubscribersPolicyIndex] = Object.assign(
						{},
						policyDoc.Statement[broadcastSubscribersPolicyIndex],
						{
							Action: policyDoc.Statement[broadcastSubscribersPolicyIndex].concat(
								'dynamodb:UpdateItem'
							),
						}
					);
				}
				else {
					policyDoc.Statement.push({
						Effect: 'Allow',
						Action: [
							'dynamodb:UpdateItem',
						],
						Resource: subscribersArn,
					})
				}
				await updateBroadcastUserPolicyDoc(policyDoc)
			}
		}

		// GYL Version 0.4.4
		async function ensureTemplateGetAndCreateAccessForBroadcastUser() {
			const policyDoc = await getBroadcastUserPolicyDoc();
			const currentGetTemplatePermission = policyDoc.Statement.find(
				(stmt) => (
					Array.isArray(stmt.Action) && stmt.Action[0] === 'ses:GetTemplate'
				)
			);
			if (!currentGetTemplatePermission) {
				policyDoc.Statement.push({
					Action: [ "ses:GetTemplate" ],
					Resource: "*",
					Effect: "Allow"
				})
			}
			const currentCreateTemplatePermission = policyDoc.Statement.find(
				(stmt) => (
					Array.isArray(stmt.Action) && stmt.Action[0] === 'ses:CreateTemplate'
				)
			);
			if (!currentCreateTemplatePermission) {
				policyDoc.Statement.push({
					Action: ["ses:CreateTemplate"],
					Resource: "*",
					Effect: "Allow"
				})
			}
			await updateBroadcastUserPolicyDoc(policyDoc);
		}

		await ensureBroadcastQueueAccessForBroadcastUser();
		await ensureTemplateGetAndCreateAccessForBroadcastUser();
	}

	await updateBroadcastUser();
};

module.exports = updateUsers;
