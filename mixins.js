const { getNextId } = require('./utils');

module.exports = (db) => ({
	nextId: getNextId,
	addPost: (_, post) => {
		const postsInstance = db.get('posts');
		const _id = postsInstance.nextId().value();
		postsInstance.push({ _id, ...post }).write();
		// return Object.assign({}, post, { _id });
		return post;
	},
	updateOrDelete: (_, post) => {
    const id = post._id;
    // object to response
    const response = { $remove: {}, $update: {}, $add: {} };
    // get the post
		const originPost = db.get('posts').find({ _id: id });
		if (!originPost.value()) {
			return response;
		}
    const index = db.get('posts').findIndex((post) => post._id === id).value();
    if (index < 0) {
      return response;
    }

		const sourceMentions = db.get(`posts.${index}.mentions`);
		// _delete
		// check if the post will be deleted
		if (post._delete && post._delete === true) {
			response.$remove[`posts.${index}`] = true;
			db.get('posts').remove({ _id: id }).write();
			return response;
		}

		// check for mentions
		if (post.mentions && Array.isArray(post.mentions)) {
			for (let i = 0; i < post.mentions.length; i++) {
				const mention = post.mentions[i];
				// if doesn't exist
				if (!mention._id) {
					// keep it
					if (response.$add[`posts.${index}.mentions`]) {
						response.$add[`posts.${index}.mentions`].push(mention);
					} else {
						response.$add[`posts.${index}.mentions`] = [ mention ];
					}
					// save the data
					const srcMtnsValue = sourceMentions.value();
					if (Array.isArray(srcMtnsValue)) {
						sourceMentions.push({ ...mention, _id: getNextId(srcMtnsValue) }).write();
					} else {
						db.set(`posts.${index}.mentions`, [ { ...mention, _id: 1 } ]).write();
					}
					continue;
				}

				// if have a delete
				if (mention._delete && mention._delete === true) {
          const indexMention = sourceMentions.findIndex((m) => m._id === mention._id).value();
          if (indexMention > -1) {
            response.$remove[`posts.${index}.mentions.${indexMention}`] = true;
            sourceMentions.remove({ _id: mention._id }).write();
          }
					continue;
				}
				// if mention exist
				if (mention._id) {
					const indexMention = sourceMentions.findIndex((m) => m._id === mention._id).value();
					if (indexMention > -1) {
						response.$update[`posts.${index}.mentions.${indexMention}.text`] = mention.text;
						const mentions = (sourceMentions.value() || []).map((m) => (m._id === mention._id ? { ...m, text: mention.text } : m));
						db.get('posts').find({ _id: id }).assign({ mentions }).write();
					}
				}
			}
		}

		// just update the value
		if (post.value) {
			response.$update[`posts.${index}.value`] = post.value;
			originPost.assign({ value: post.value }).write();
		}
		return response;
	}
});
