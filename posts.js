module.exports = (db) => (req, res) => {
	if (req.body) {
    const keys = Object.keys(req.body);
    // make sure that posts keyword is there
		if (keys.includes('posts') && req.body.posts.length) {
			let resps = {};
			for (let i = 0; i < req.body.posts.length; i++) {
        const post = req.body.posts[i];
        // if doesn’t have _id is because will be created
				if (!post.hasOwnProperty('_id')) {
					if (!resps['$add'] || !resps['$add'].posts) {
						resps['$add'] = Object.assign({}, resps['$add'] || {}, { posts: [ db.get('posts').addPost(post).value() ] });
					} else {
						resps['$add'].posts.push(db.get('posts').addPost(post).value());
					}
				} else {
					const r = db.get('posts').updateOrDelete(post).value();
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
