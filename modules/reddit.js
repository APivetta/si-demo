'use strict';

const request = require('request');
const q = require('q');


const flatten = comments => comments
  .filter(comment => comment.kind === 't1')
  .reduce((acc, comment) => {
    if (comment.data.replies) {
      return [...acc, ...flatten(comment.data.replies.data.children), { score: comment.data.score, body: comment.data.body }];
    } else {
      return [...acc, { score: comment.data.score, body: comment.data.body }];
    }
  }, [])

const getPostsFromSubreddit = (sub, limit = 10) => {
  const deferred = q.defer();

  const options = {
    uri: `https://www.reddit.com/r/${sub}/top.json?limit=${limit}`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  request(options, (err, httpResponse, body) => {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(body.data.children.map(post => `https://www.reddit.com${post.data.permalink}.json`));
    }
  });

  return deferred.promise;
}

const getTopComments = (post, limit = 5) => {
  const deferred = q.defer();

  const options = {
    uri: post,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  request(options, (err, httpResponse, body) => {
    if (err) {
      deferred.reject(err);
    } else {
      const results = flatten(body[1].data.children).sort((a, b) => b.score - a.score).slice(0, limit);
      deferred.resolve(results);
    }
  });

  return deferred.promise;
}

module.exports = {
  getPostsFromSubreddit,
  getTopComments
}
