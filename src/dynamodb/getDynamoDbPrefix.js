const getDynamoDbPrefix = async () => {
	// Maybe do random prefixes?
	// const charSource = 'abcdefghijklmnopqrstuvwxyz1234567890'
	// const randomArray = [...Array(3)].map(() => charSource[
	// 	Math.floor(Math.random() * charSource.length)
	// ])
	// randomArray[0] = randomArray[0].toLocaleUpperCase()
	// return `Gyl_${randomArray.join('')}_`
	return `Gyl_`;
};

module.exports = getDynamoDbPrefix;
