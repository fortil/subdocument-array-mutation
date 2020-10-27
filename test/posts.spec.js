const request = require('supertest');
const bootstrap = require('../src/bootstrap');
const assert = require('assert');
// reset the db
const fs = require('fs');
const { resolve } = require('path');
fs.writeFileSync(resolve(__dirname, '..', 'db.json'), '{}');

let server = null;
beforeEach(async () => {
	server = await bootstrap;
});

// const server = request(app);
describe('Testing server', () => {
	it('Testing /', () => {
		return request(server).get('/').expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
			assert.equal(response.body.data, 'Hello world');
		});
	});
	describe('Testing /api/v1/posts', () => {
		it('Add two posts', () => {
			const data = {
				posts: [ { value: 'first value' }, { value: 'second value' } ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
				assert.deepEqual(response.body.$add.posts, data.posts);
			});
    });
    
		it('Update the value in one and delete the other', () => {
      const value = 'first value updated';
			const data = {
				posts: [ { _id: 1, value }, { _id: 2, _delete: true } ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
        assert.deepEqual(response.body.$update, { 'posts.0.value': value });
        assert.deepEqual(response.body.$remove, { 'posts.1': true });
			});
    });
    
		it('Add one mention and add new post', () => {
      const mention = { text: 'test mention' };
      const newPost = { value: 'new post' };
			const data = {
				posts: [ { _id: 1, mentions: [ mention ] }, newPost ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
        assert.deepEqual(response.body.$add, { 'posts.0.mentions': [mention], posts: [newPost] });
			});
    });
    
		it('Update a mention and update a post', () => {
      const mention = { text: 'mention updated' };
      const newPost = { value: 'new post updated' };
			const data = {
				posts: [ { _id: 1, mentions: [ { ...mention, _id: 1 } ] }, { ...newPost, _id: 2 } ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
        assert.deepEqual(response.body.$update, { 'posts.0.mentions.0.text': mention.text, 'posts.1.value': newPost.value });
			});
		});
	});
});
// request(app);
