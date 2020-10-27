const { getNextId } = require('./utils');

module.exports = (db) => ({
	nextId: getNextId,
	addData: (_, data) => {
		const arrayToUse = db.get('arrayToUse').value();
		const dataInstance = db.get(arrayToUse);
		const _id = dataInstance.nextId().value();
		dataInstance.push({ _id, ...data }).write();
		// return Object.assign({}, data, { _id });
		return data;
	},
	updateOrDelete: (_, data) => {
		const arrayToUse = db.get('arrayToUse').value();
    const id = data._id;
    // object to response
    const response = { $remove: {}, $update: {}, $add: {} };
    // get the data
		const originData = db.get(arrayToUse).find({ _id: id });
		if (!originData.value()) {
			return response;
		}
    const index = db.get(arrayToUse).findIndex((data) => data._id === id).value();
    if (index < 0) {
      return response;
    }

		const sourceMentions = db.get(`${arrayToUse}.${index}.mentions`);
		// _delete
		// check if the data will be deleted
		if (data._delete && data._delete === true) {
			response.$remove[`${arrayToUse}.${index}`] = true;
			db.get(arrayToUse).remove({ _id: id }).write();
			return response;
		}

		// check for mentions
		if (data.mentions && Array.isArray(data.mentions)) {
			for (let i = 0; i < data.mentions.length; i++) {
				const mention = data.mentions[i];
				// if doesn't exist
				if (!mention._id) {
					// keep it
					if (response.$add[`${arrayToUse}.${index}.mentions`]) {
						response.$add[`${arrayToUse}.${index}.mentions`].push(mention);
					} else {
						response.$add[`${arrayToUse}.${index}.mentions`] = [ mention ];
					}
					// save the data
					const srcMtnsValue = sourceMentions.value();
					if (Array.isArray(srcMtnsValue)) {
						sourceMentions.push({ ...mention, _id: getNextId(srcMtnsValue) }).write();
					} else {
						db.set(`${arrayToUse}.${index}.mentions`, [ { ...mention, _id: 1 } ]).write();
					}
					continue;
				}

				// if have a delete
				if (mention._delete && mention._delete === true) {
          const indexMention = sourceMentions.findIndex((m) => m._id === mention._id).value();
          if (indexMention > -1) {
            response.$remove[`${arrayToUse}.${index}.mentions.${indexMention}`] = true;
            sourceMentions.remove({ _id: mention._id }).write();
          }
					continue;
				}
				// if mention exist
				if (mention._id) {
					const indexMention = sourceMentions.findIndex((m) => m._id === mention._id).value();
					if (indexMention > -1) {
						response.$update[`${arrayToUse}.${index}.mentions.${indexMention}.text`] = mention.text;
						const mentions = (sourceMentions.value() || []).map((m) => (m._id === mention._id ? { ...m, text: mention.text } : m));
						db.get(arrayToUse).find({ _id: id }).assign({ mentions }).write();
					}
				}
			}
		}

		// just update the value
		if (data.value) {
			response.$update[`${arrayToUse}.${index}.value`] = data.value;
			originData.assign({ value: data.value }).write();
		}
		return response;
	}
});
