import axios from 'axios'

const API = axios.create({
  baseURL: 'https://news-draft-generator.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000
})

export const generateDraft = (facts, tone, style, size) =>
  API.post('/generate', { facts, tone, style, size })

export const refineTone = (article_text, target_tone) =>
  API.post('/refine-tone', { article_text, target_tone })

export const getSEO = (article) =>
  API.post('/seo', { article })

export const injectImages = (article) =>
  API.post('/inject-images', { article })

export const checkPlagiarism = (text) =>
  API.post('/plagiarism-check', { text })

export const flagQuotes = (article) =>
  API.post('/flag-quotes', { article })

export const getToneHeatmap = (article) =>
  API.post('/tone-heatmap', { article })

export const getTrends = () =>
  API.get('/trends')

export const adaptPlatform = (article, platform) =>
  API.post('/adapt-platform', { article, platform })

export const factCheck = (article) =>
  API.post('/fact-check', { article })

export const getEngagementScore = (article) =>
  API.post('/engagement-score', { article })

export const suggestAngles = (facts) =>
  API.post('/suggest-angles', { facts })

export const getSocialPack = (article, platform) =>
  API.post('/social-pack', { article, platform })

export const detectBias = (text) =>
  API.post('/detect-bias', { text })

export const pingBackend = () =>
  API.get('/health').catch(() => {})