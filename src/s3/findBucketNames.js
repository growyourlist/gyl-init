const Logger = require('../Logger')

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
		Logger.info('No buckets found to delete')
		return []
	}
	const bucketNameRegex = new RegExp(
		`^${escapeRegExp(startsWith)}[a-z0-9]{16}$`
	);
	const allMatchingBuckets = [];
	for (let i = 0; i < Buckets.length; i++) {
		if (bucketNameRegex.test(Buckets[i].Name)) {
			allMatchingBuckets.push(Buckets[i].Name);
		}
	}
	return allMatchingBuckets;
};

module.exports = findBucketNames;
