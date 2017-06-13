'use strict';

const q = require('q');
const reddit = require('./modules/reddit');
const datumbox = require('./modules/datumbox');

const subredditList = ['popular', 'politics', 'askscience', 'unitedkingdom', 'aww'];
const analyzers = ['SentimentAnalysis', 'TopicClassification'];

subredditList.forEach(sub => reddit.getPostsFromSubreddit(sub)
  .then(posts => q.all(posts.map(post => reddit.getTopComments(post))))
  .then(postsComments => q.all(postsComments
    .reduce((acc, comments) => [...acc, ...comments], [])
    .map(comment => datumbox.analyze(comment, analyzers))
  ))
  .then(results => {
    console.log(`Subreddit: ${sub}`);
    const totalScore = results.reduce((acc, result) => acc += result.score, 0);
    const aggregate = results.reduce((acc, result) => {
      analyzers.forEach(analyzer => {
        if (!acc[analyzer]) {
          acc[analyzer] = [];
        }

        const index = acc[analyzer].findIndex(el => el.class === result[analyzer]);
        if (index === -1) {
          acc[analyzer].push({ class: result[analyzer], score: result.score })
        } else {
          acc[analyzer][index].score += result.score;
        }
      });
      return acc;
    }, {});

    analyzers.forEach(analyzer => {
      const results = aggregate[analyzer]
        .sort((a, b) => b.score - a.score)
        .map(result => {
          result.score = Math.round((result.score * 100 / totalScore) * 100) / 100;
          return result;
        });
      console.log(analyzer, results);
    });

  })
  .catch(err => console.log(err))
);
