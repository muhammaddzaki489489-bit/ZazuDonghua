const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const BASE_URL = 'https://donghub.vip';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.104 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.107 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.52'
];

function randomIp() {
  return Math.floor(Math.random() * 255) + 1 + '.' +
         Math.floor(Math.random() * 255) + '.' +
         Math.floor(Math.random() * 255) + '.' +
         Math.floor(Math.random() * 255);
}

function randomDelay(min = 800, max = 2500) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

let uaIndex = 0;

function getHeaders(ref) {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  const fakeIp = randomIp();
  const isMobile = ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android');
  const platform = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Linux';
  const browser = ua.includes('Firefox') ? 'Firefox' : ua.includes('Edg') ? 'Edge' : 'Chrome';
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': ref || BASE_URL + '/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': '1',
    'Sec-Ch-Ua': browser === 'Chrome' ? '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' : '"Firefox";v="133", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': `"${platform}"`,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive',
    'X-Forwarded-For': fakeIp,
    'Client-IP': fakeIp,
    'X-Real-IP': fakeIp
  };
}

async function fetchHTML(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await randomDelay(800, 2500);
      const response = await axios({
        url,
        method: 'GET',
        headers: getHeaders(url),
        timeout: 60000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
        maxRedirects: 5,
        decompress: true,
        validateStatus: status => status >= 200 && status < 400
      });
      const html = response.data;
      if (html && html.length > 500 && !html.includes('403 Forbidden')) {
        return html;
      }
      if (i < retries - 1) await randomDelay(3000, 6000);
    } catch (e) {
      if (i < retries - 1) await randomDelay(3000, 6000);
      else throw new Error('Gagal fetch setelah retry');
    }
  }
  throw new Error('Gagal fetch setelah retry');
}

function clean(obj) {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) return obj.map(i => clean(i)).filter(i => i !== undefined);
  if (typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      const val = clean(obj[key]);
      if (val !== undefined) result[key] = val;
    }
    return Object.keys(result).length ? result : undefined;
  }
  return obj;
}

function buildResponse(page, url, data) {
  return clean({
    creator: 'rynaqrtz',
    page: page,
    url: url,
    data: data
  });
}

function parsePagination($) {
  const result = { current: 1, next: null, hasNext: false };
  const nextLink = $('.hpage .r, .pagination .next, .page-numbers.next').first();
  if (nextLink.length) {
    const href = nextLink.attr('href');
    if (href) {
      result.hasNext = true;
      result.next = href.startsWith('http') ? href : BASE_URL + href;
      const match = href.match(/page[/]?(\d+)/);
      if (match) result.current = parseInt(match[1]) - 1 || 1;
    }
  }
  const current = $('.hpage .current, .page-numbers.current').first();
  if (current.length) {
    const text = current.text().trim();
    if (/^\d+$/.test(text)) result.current = parseInt(text);
  }
  return result;
}

function parseCard($, el) {
  const $el = $(el);
  const link = $el.find('a').first().attr('href');
  const title = $el.find('.tt h2, .jdlflm, .eggtitle, .tt').first().text().trim();
  const poster = $el.find('img').attr('data-src') || $el.find('img').attr('src') || null;
  const type = $el.find('.typez, .eggtype').first().text().trim() || null;
  const status = $el.find('.status, .bt .epx').first().text().trim() || null;
  const episode = $el.find('.eggepisode, .bt .epx').first().text().trim() || null;
  if (!link || !title) return null;
  return {
    title: title,
    url: link.startsWith('http') ? link : BASE_URL + link,
    poster: poster,
    type: type,
    status: status,
    episode: episode
  };
}

function extractBase64Streams(html) {
  const streams = [];
  const pattern = /[A-Za-z0-9+/]{50,}={0,2}/g;
  const matches = html.match(pattern);
  if (matches) {
    for (const match of matches) {
      try {
        const decoded = Buffer.from(match, 'base64').toString('utf-8');
        if (decoded.includes('ok.ru') || decoded.includes('dailymotion')) {
          const srcMatch = decoded.match(/src=["\']([^"\']+)["\']/);
          if (srcMatch) {
            const url = srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
            if (!streams.find(s => s.url === url)) {
              streams.push({
                server: decoded.includes('ok.ru') ? 'OKRU' : 'Dailymotion',
                url: url
              });
            }
          }
        }
      } catch (e) {}
    }
  }
  return streams;
}

function cleanEpisodeTitle(raw) {
  if (!raw) return '';
  return raw.replace(/\s+/g, ' ').trim();
}

class DonghubScraper {
  constructor() {
    this.base = BASE_URL;
    this.creator = 'rynaqrtz';
  }

  async home(page = 1) {
    const url = page === 1 ? this.base + '/' : this.base + `/page/${page}/`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd.normal .bs.styleegg, .listupd.popularslider .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('home', url, { pagination, items });
  }

  async ongoing(page = 1) {
    const url = page === 1 ? this.base + '/anime/?status=ongoing&order=update' : this.base + `/anime/?page=${page}&status=ongoing&order=update`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('ongoing', url, { pagination, items });
  }

  async completed(page = 1) {
    const url = page === 1 ? this.base + '/anime/?status=completed&order=update' : this.base + `/anime/?page=${page}&status=completed&order=update`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('completed', url, { pagination, items });
  }

  async schedule() {
    const url = this.base + '/schedule/';
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const schedule = {};
    for (const day of days) {
      const dayItems = [];
      $(`.schedulepage.sch_${day} .listupd .bs`).each((i, el) => {
        const $el = $(el);
        const link = $el.find('.bsx a').attr('href');
        const title = $el.find('.tt').text().trim();
        const episode = $el.find('.bt .epx').text().trim();
        const sub = $el.find('.bt .sb').text().trim();
        const poster = $el.find('img').attr('data-src') || $el.find('img').attr('src') || null;
        if (link && title) {
          dayItems.push({
            title: title,
            url: link.startsWith('http') ? link : this.base + link,
            episode: episode,
            sub: sub,
            poster: poster
          });
        }
      });
      if (dayItems.length) schedule[day] = dayItems;
    }
    return buildResponse('schedule', url, { schedule });
  }

  async search(query, page = 1) {
    const url = this.base + `/?s=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ''}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('search', url, { query, pagination, items });
  }

  async detail(slug) {
    const url = this.base + `/${slug}/`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const title = $('.infox .infolimit h2').text().trim() || $('h1.entry-title').text().trim();
    const poster = $('.thumb img').attr('data-src') || $('.thumb img').attr('src') || null;
    const rating = $('.rating strong').text().trim().replace('Rating ', '') || null;
    const synopsis = $('.sinopc p').text().trim() || $('.desc').text().trim() || null;
    const genres = $('.genxed a').map((_, el) => $(el).text().trim()).get();
    const info = {};
    $('.infox .spe span').each((i, el) => {
      const text = $(el).text().trim();
      const parts = text.split(':');
      if (parts.length > 1) {
        const key = parts[0].replace(/<[^>]*>/g, '').trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        if (key && value) info[key] = value;
      }
    });
    const episodes = [];
    $('.episodelist ul li, .bxcl .eplister ul li').each((i, el) => {
      const $el = $(el);
      const link = $el.find('a').attr('href');
      const rawTitle = $el.find('a .epl-title, a').text().trim() || $el.find('a').text().trim();
      const episodeNum = $el.find('.epl-num').text().trim() || $el.find('.epz').text().trim() || null;
      const date = $el.find('.epl-date, .zeebr').text().trim() || null;
      if (link && rawTitle) {
        const match = link.match(/episode-(\d+)/);
        const cleanTitle = cleanEpisodeTitle(rawTitle.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').replace(/Sub\s+/, '').replace(/\d+\s+/, '').replace(/\s{2,}/g, ' '));
        episodes.push({
          episode: match ? match[1] : episodeNum || null,
          title: cleanTitle || 'Episode ' + (match ? match[1] : ''),
          url: link.startsWith('http') ? link : this.base + link,
          releaseDate: date || null
        });
      }
    });
    const recommended = [];
    $('.listupd .bs').each((i, el) => {
      if (i < 10) {
        const card = parseCard($, el);
        if (card) recommended.push(card);
      }
    });
    return buildResponse('detail', url, {
      title: title,
      poster: poster,
      rating: rating,
      synopsis: synopsis,
      genres: genres,
      info: info,
      episodes: episodes.sort((a, b) => parseInt(a.episode) - parseInt(b.episode)),
      recommended: recommended
    });
  }

  async episode(slugOrUrl) {
    let url;
    if (slugOrUrl.includes('http')) {
      url = slugOrUrl;
    } else {
      const match = slugOrUrl.match(/^(.+?)-episode-(\d+)$/);
      if (match) {
        url = this.base + `/${slugOrUrl}/`;
      } else {
        throw new Error('Invalid format. Use slug-episode-number or full URL');
      }
    }
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const title = $('.entry-title').text().trim() || $('h1.entry-title').text().trim();
    const poster = $('.thumb img').attr('data-src') || $('.thumb img').attr('src') || null;
    const synopsis = $('.sinopc p').text().trim() || $('.desc').text().trim() || null;
    const genres = $('.genxed a').map((_, el) => $(el).text().trim()).get();
    const streams = [];
    $('.mirrorstream select.mirror option').each((i, el) => {
      const value = $(el).val();
      if (value && value.length > 10) {
        try {
          const decoded = Buffer.from(value, 'base64').toString('utf-8');
          const srcMatch = decoded.match(/src=["\']([^"\']+)["\']/);
          if (srcMatch) {
            const streamUrl = srcMatch[1].startsWith('//') ? 'https:' + srcMatch[1] : srcMatch[1];
            streams.push({
              server: $(el).text().trim(),
              url: streamUrl
            });
          }
        } catch (e) {}
      }
    });
    const base64Streams = extractBase64Streams(html);
    for (const s of base64Streams) {
      if (!streams.find(x => x.url === s.url)) {
        streams.push(s);
      }
    }
    const downloads = [];
    $('.download ul li').each((i, el) => {
      const $el = $(el);
      const resolution = $el.find('strong').text().trim() || $el.find('b').text().trim() || null;
      const links = [];
      $el.find('a').each((j, a) => {
        const name = $(a).text().trim();
        const href = $(a).attr('href');
        if (href) links.push({ name: name || 'Download', url: href });
      });
      if (resolution || links.length) {
        downloads.push({
          resolution: resolution || 'Unknown',
          links: links
        });
      }
    });
    const nav = {
      prev: $('.naveps .nvs:first-child a').attr('href') || null,
      all: $('.naveps .nvsc a').attr('href') || null,
      next: $('.naveps .nvs:last-child a').attr('href') || null
    };
    const info = {};
    $('.infox .spe span').each((i, el) => {
      const text = $(el).text().trim();
      const parts = text.split(':');
      if (parts.length > 1) {
        const key = parts[0].replace(/<[^>]*>/g, '').trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        if (key && value) info[key] = value;
      }
    });
    const otherEpisodes = [];
    $('.episodelist ul li, .bxcl .eplister ul li').each((i, el) => {
      const $el = $(el);
      const link = $el.find('a').attr('href');
      const rawTitle = $el.find('a .epl-title, a').text().trim() || $el.find('a').text().trim();
      const episodeNum = $el.find('.epl-num').text().trim() || $el.find('.epz').text().trim() || null;
      const date = $el.find('.epl-date, .zeebr').text().trim() || null;
      if (link && rawTitle && !link.includes(slugOrUrl)) {
        const match = link.match(/episode-(\d+)/);
        const cleanTitle = cleanEpisodeTitle(rawTitle.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').replace(/Sub\s+/, '').replace(/\d+\s+/, '').replace(/\s{2,}/g, ' '));
        otherEpisodes.push({
          episode: match ? match[1] : episodeNum || null,
          title: cleanTitle || 'Episode ' + (match ? match[1] : ''),
          url: link.startsWith('http') ? link : this.base + link,
          releaseDate: date || null
        });
      }
    });
    return buildResponse('episode', url, {
      title: title,
      poster: poster,
      synopsis: synopsis,
      genres: genres,
      info: info,
      streams: streams,
      downloads: downloads,
      nav: nav,
      otherEpisodes: otherEpisodes.sort((a, b) => parseInt(a.episode) - parseInt(b.episode))
    });
  }

  async watch(slugOrUrl) {
    const result = await this.episode(slugOrUrl);
    result.data = {
      title: result.data.title,
      streams: result.data.streams,
      nav: result.data.nav,
      otherEpisodes: result.data.otherEpisodes
    };
    return clean(result);
  }

  async genre(slug, page = 1) {
    const url = page === 1 ? this.base + `/genres/${slug}/` : this.base + `/genres/${slug}/page/${page}/`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('genre', url, { slug, pagination, items });
  }

  async order(order, page = 1) {
    const url = page === 1 ? this.base + `/anime/?order=${order}` : this.base + `/anime/?page=${page}&order=${order}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('order', url, { order, pagination, items });
  }

  async status(status, page = 1) {
    const url = page === 1 ? this.base + `/anime/?status=${status}` : this.base + `/anime/?page=${page}&status=${status}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('status', url, { status, pagination, items });
  }

  async type(type, page = 1) {
    const url = page === 1 ? this.base + `/anime/?type=${type}` : this.base + `/anime/?page=${page}&type=${type}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('type', url, { type, pagination, items });
  }

  async sub(sub, page = 1) {
    const url = page === 1 ? this.base + `/anime/?sub=${sub}` : this.base + `/anime/?page=${page}&sub=${sub}`;
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    const items = [];
    $('.listupd .bs').each((i, el) => {
      const card = parseCard($, el);
      if (card) items.push(card);
    });
    const pagination = parsePagination($);
    return buildResponse('sub', url, { sub, pagination, items });
  }
}

module.exports = DonghubScraper;
