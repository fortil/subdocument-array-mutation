module.exports = (db) => (req, res) => {
	// configure the data
	const arrayToUse = req.params.array;
	db.set('arrayToUse', arrayToUse).write();
	if (!db.has(arrayToUse).value()) {
		db.set(arrayToUse, []).write();
	}

	if (req.body) {
    const keys = Object.keys(req.body);
    // make sure that [arrayToUse] keyword is there
		if (keys.includes(arrayToUse) && req.body[arrayToUse].length) {
			let resps = {};
			for (let i = 0; i < req.body[arrayToUse].length; i++) {
        const data = req.body[arrayToUse][i];
        // if doesn’t have _id is because will be created
				if (!data.hasOwnProperty('_id')) {
					if (!resps['$add'] || !resps['$add'][arrayToUse]) {
						resps['$add'] = Object.assign({}, resps['$add'] || {}, { [arrayToUse]: [ db.get(arrayToUse).addData(data).value() ] });
					} else {
						resps['$add'][arrayToUse].push(db.get(arrayToUse).addData(data).value());
					}
				} else {
					const r = db.get(arrayToUse).updateOrDelete(data).value();
					// merge deep
					resps['$add'] = Object.assign({}, resps['$add'], r['$add']);
					resps['$remove'] = Object.assign({}, resps['$remove'], r['$remove']);
					resps['$update'] = Object.assign({}, resps['$update'], r['$update']);
				}
			}
			// clean the empty responses
			const keysResponse = Object.keys(resps);
			for (let e = 0; e < keysResponse.length; e++) {
				const k = keysResponse[e];
				if (!Object.keys(resps[k]).length) {
					delete resps[k];
				}
			}
			return res.json(resps);
		}
	}
	res.json({});
};
