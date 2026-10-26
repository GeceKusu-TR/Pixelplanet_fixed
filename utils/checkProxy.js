/* @flow */
// this script checks a ip with the pixelplanet proxychecker
//

import fetch from '../src/utils/proxiedFetch.js';

/*
 * check proxycheck.io if IP is proxy
 * Use proxiedFetch with random proxies
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getProxyCheck(ip: string): Promise<boolean> {
  const url = `https://proxycheck.io/v2/${encodeURIComponent(ip)}?risk=1&vpn=1&asn=1`;
  //const url = 'http://pixel.space';
  console.log('fetching proxycheck', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`proxycheck not ok ${response.status}/${text}`);
  }
  const data = await response.json();
  if (data.status !== 'ok' || !data[ip]) {
    throw new Error(`proxycheck returned no usable result for ${ip}`);
  }
  console.log('proxycheck.io is proxy?', ip, data);
  const ret = data.status === 'ok'
    && data[ip]
    && data[ip].proxy === 'yes';
  console.log(ret);
  return ret;
}

async function getIPIntel(ip: string): Promise<boolean> {
  const contact = process.env.PROXYCHECK_CONTACT;
  if (!contact) {
    throw new Error('Set PROXYCHECK_CONTACT before querying getipintel.');
  }
  const url = `https://check.getipintel.net/check.php?ip=${encodeURIComponent(ip)}&contact=${encodeURIComponent(contact)}&flags=m`;
  console.log('fetching getipintel', url);
  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      Referer: 'https://check.getipintel.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    }
  });
  // TODO log response code
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`getipintel not ok ${response.status}/${text}`);
  }
  const body = await response.text();
  console.log('fetch getipintel is proxy?', ip, body);
  // returns tru iff we found 1 in the response and was ok (http code = 200)
  const value = parseFloat(body);
  return value > 0.995;
}


const ip = process.argv[2];
if (!ip) {
  console.error('Usage: babel-node utils/checkProxy.js <ip>');
  process.exit(1);
}
Promise.all([
  getProxyCheck(ip),
  getIPIntel(ip),
]).then(([proxyCheck, ipIntel]) => {
  console.log(JSON.stringify({ ip, proxyCheck, ipIntel }));
}).catch((error) => {
  console.error(`Proxy check failed closed: ${error.message || error}`);
  process.exitCode = 1;
});
