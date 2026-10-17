import { backend } from './backendApi';

const normType = (t) => (t === 'webseries' ? 'tv' : t);

export const reviewService = {
  forTitle: (type, tmdbId) =>
    backend
      .get(`/titles/${normType(type)}/${tmdbId}/reviews`)
      .then((r) => r.data),

  save: ({ type, tmdbId, rating, headline, text, spoiler = false }) =>
    backend
      .put(`/titles/${normType(type)}/${tmdbId}/reviews`, {
        rating: Number(rating),
        headline,
        text,
        spoiler,
      })
      .then((r) => r.data.review),

  addCriticReview: ({
    type,
    tmdbId,
    rating,
    headline,
    text,
    criticName,
    publication,
    externalUrl,
    isFeatured = true,
  }) =>
    backend
      .post(`/titles/${normType(type)}/${tmdbId}/critic-reviews`, {
        rating: Number(rating),
        headline,
        text,
        criticName,
        publication,
        externalUrl,
        isFeatured,
      })
      .then((r) => r.data.review),

  toggleReviewLike: (id) =>
    backend.post(`/reviews/${id}/like`).then((r) => r.data),

  remove: (id) => backend.delete(`/reviews/${id}`),

  byUser: () =>
    backend.get('/users/me/reviews').then((r) => r.data.reviews || []),

  commentsForTitle: (type, tmdbId) =>
    backend
      .get(`/titles/${normType(type)}/${tmdbId}/comments`)
      .then((r) => r.data.comments || []),

  addComment: ({ type, tmdbId, body, parent = null, spoiler = false }) =>
    backend
      .post(`/titles/${normType(type)}/${tmdbId}/comments`, {
        body,
        parent,
        spoiler,
      })
      .then((r) => r.data.comment),

  deleteComment: (id) => backend.delete(`/comments/${id}`),

  toggleLike: (id) => backend.post(`/comments/${id}/like`).then((r) => r.data),

  watchlist: {
    list: (status) =>
      backend
        .get('/watchlist', { params: status ? { status } : {} })
        .then((r) => r.data.items || []),
    save: (type, tmdbId, status = 'planned') =>
      backend
        .put(`/watchlist/${normType(type)}/${tmdbId}`, { status })
        .then((r) => r.data),
    remove: (type, tmdbId) =>
      backend.delete(`/watchlist/${normType(type)}/${tmdbId}`),
  },

  admin: {
    stats: () => backend.get('/admin/stats').then((r) => r.data),
    reviews: (params = {}) =>
      backend.get('/admin/reviews', { params }).then((r) => r.data),
    moderateReview: (id, payload) =>
      backend.patch(`/admin/reviews/${id}`, payload).then((r) => r.data.review),
    deleteReview: (id) => backend.delete(`/admin/reviews/${id}`),
    comments: (params = {}) =>
      backend.get('/admin/comments', { params }).then((r) => r.data),
    moderateComment: (id, payload) =>
      backend
        .patch(`/admin/comments/${id}`, payload)
        .then((r) => r.data.comment),
    deleteComment: (id) => backend.delete(`/admin/comments/${id}`),
  },

  superadmin: {
    titles: (params = {}) =>
      backend.get('/superadmin/titles', { params }).then((r) => r.data),
    createTitle: (payload) =>
      backend.post('/superadmin/titles', payload).then((r) => r.data.title),
    updateTitle: (type, tmdbId, payload) =>
      backend
        .patch(`/superadmin/titles/${normType(type)}/${tmdbId}`, payload)
        .then((r) => r.data.title),
    syncTitle: (type, tmdbId) =>
      backend
        .post(`/superadmin/titles/${normType(type)}/${tmdbId}/sync`)
        .then((r) => r.data.title),
    deleteTitle: (type, tmdbId) =>
      backend.delete(`/superadmin/titles/${normType(type)}/${tmdbId}`),
    keys: () => backend.get('/superadmin/api-keys').then((r) => r.data),
    addKey: (payload) =>
      backend.post('/superadmin/api-keys', payload).then((r) => r.data.key),
    updateKey: (id, payload) =>
      backend
        .patch(`/superadmin/api-keys/${id}`, payload)
        .then((r) => r.data.key),
    deleteKey: (id) => backend.delete(`/superadmin/api-keys/${id}`),
    testKey: (id) =>
      backend.post(`/superadmin/api-keys/${id}/test`).then((r) => r.data),
    crawlerStatus: () => backend.get('/superadmin/crawler').then((r) => r.data),
    crawlerStart: (opts = {}) =>
      backend.post('/superadmin/crawler/start', opts).then((r) => r.data),
    crawlerStop: () =>
      backend.post('/superadmin/crawler/stop').then((r) => r.data),
    crawlerUpdateCap: (payload) =>
      backend
        .patch(
          '/superadmin/crawler/cap',
          typeof payload === 'object' ? payload : { maxTitles: payload },
        )
        .then((r) => r.data),
  },
};
