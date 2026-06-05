const LOCAL_IMAGES = [
  'background/alovivian.jpeg',
  'background/CRL.jpeg',
  'background/nemseiseele.jpeg',
  'background/palestra.jpeg',
  'background/performatico.jpeg',
  'background/R.jpeg',
  'background/unicamp.jpeg'
].map(f => chrome.runtime.getURL(f));

const DEFAULTS = {
  libraries: { 'My Photos': LOCAL_IMAGES },
  selectedLibrary: 'My Photos',
  baseRate: 1,
  currentRate: 1,
  autoIncrease: { enabled: false, amount: 10, count: 1, interval: 'hour' }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('libraries', data => {
    if (!data.libraries) chrome.storage.local.set(DEFAULTS);
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== 'rateIncrease') return;
  chrome.storage.local.get(['currentRate', 'autoIncrease'], data => {
    if (!data.autoIncrease || !data.autoIncrease.enabled) return;
    const newRate = Math.min(100, (data.currentRate || 0) + (data.autoIncrease.amount || 10));
    chrome.storage.local.set({ currentRate: newRate });
  });
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg.action !== 'setAlarm') return;
  chrome.alarms.clear('rateIncrease', () => {
    if (!msg.enabled) return;
    const periodMap = { minute: 1, hour: 60, day: 1440 };
    const period = (periodMap[msg.interval] || 60) * (msg.count || 1);
    chrome.alarms.create('rateIncrease', { periodInMinutes: period });
  });
});
