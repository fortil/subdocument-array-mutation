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
    
		it('Add new mentions', () => {
      const mention = { text: 'second mention' };
      const newMention = { text: 'new post mention added' };
			const data = {
				posts: [ { _id: 1, mentions: [ mention ] }, { _id: 2, mentions: [ newMention ] } ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
        assert.deepEqual(response.body.$add, { 'posts.0.mentions': [mention], 'posts.1.mentions': [newMention] });
			});
		});
    
		it('Update a mention, delete a mention and create new post', () => {
      const mention = { text: '2nd mention updated' };
      const newPost = { value: 'Other new post created' };
			const data = {
				posts: [ { _id: 1, mentions: [ { ...mention, _id: 2 } ] }, { _id: 2, mentions: [ { _id: 1, _delete: true } ] }, newPost ]
			};

			return request(server).post('/api/v1/posts').send(data).expect('Content-Type', 'application/json; charset=utf-8').expect(200).then((response) => {
        assert.deepEqual(response.body.$add, { posts: [newPost] });
        assert.deepEqual(response.body.$update, { 'posts.0.mentions.1.text': mention.text });
        assert.deepEqual(response.body.$remove, { 'posts.1.mentions.0': true });
			});
		});
	});
});
