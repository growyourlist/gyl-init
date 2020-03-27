const Logger = require('../Logger');

const escapeRegExp = str => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const findBucketNames = async (s3, startsWith) => {
	if (typeof startsWith !== 'string' || startsWith.length < 1) {
		throw new Error('Must specify a filter for bucket names');
	}
	const bucketListResponse = await s3.listBuckets({}).promise();
	const Buckets = bucketListResponse.Buckets;
	if (!Array.isArray(Buckets) || Buckets.length < 1) {
		return [];
	}
	const bucketNameRegex = new RegExp(`^${escapeRegExp(startsWith)}[a-z0-9]+$`);
	const allMatchingBuckets = [];
	for (let i = 0; i < Buckets.length; i++) {
		if (bucketNameRegex.test(Buckets[i].Name)) {
			// Double check it looks like a valid bucket by checking it contains a
			// GYL item.
			try {
				await s3
					.getObject({
						Bucket: Buckets[i].Name,
						Key: 'gyl-admin-autoresponder-delete-dist.zip',
					})
					.promise();
				allMatchingBuckets.push(Buckets[i].Name);
			} catch (err) {
				if (err.code === 'NoSuchKey') {
					Logger.info(
						`Bucket ${Buckets[i].Name} was not deleted because it does not seem to have GrowYourList content.`
					);
				} else {
					throw err;
				}
			}
		}
	}
	return allMatchingBuckets;
};

module.exports = findBucketNames;
