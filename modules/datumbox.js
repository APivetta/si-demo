'use strict';

const request = require('request');
const zipObject = require('lodash.zipobject');
const sem = require('semaphore')(1);
const q = require('q');

const callAPI = (comment, analyzer) => {
  const deferred = q.defer();
  try {
    request.post({ url: `http://api.datumbox.com/1.0/${analyzer}.json`, form: { api_key: '476a630e51426288ba695c2ccaeedfe7', text: comment.body } },
      (err, httpResponse, body) => {
        const bodyParsed = JSON.parse(body);
        if (err) {
          deferred.reject(err);
        } else {
          if (bodyParsed.output.error) {
            deferred.reject(bodyParsed);
          } else {
            deferred.resolve(bodyParsed.output.result);
          }
        }
      });
  } catch (err) {
    deferred.resolve('error');
  }
  return deferred.promise;
}

const analyze = (comment, analyzers) => {
  const deferred = q.defer();

  sem.take(() => {
    q.all(analyzers.map(analyzer => callAPI(comment, analyzer)))
      .then(
        results => deferred.resolve(Object.assign({}, zipObject(analyzers, results), { score: comment.score })),
        err => deferred.reject(err))
      .finally(sem.leave);
  });

  return deferred.promise;
}

module.exports = {
  analyze
}
