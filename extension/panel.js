const $ = id => document.getElementById(id);
let controller;
function render(capture) {
  $('toggle').disabled = false;
  $('toggle').textContent = capture.running ? 'Pause capture' : 'Start capture';
  $('state').textContent = capture.running ? 'Capturing' : 'Paused';
  $('state').classList.toggle('live', capture.running);
  $('sent').textContent = capture.counts.sent;
  $('failed').textContent = capture.counts.failed;
  $('pending').textContent = `${capture.queue.length + capture.active} pending`;
  $('notice').textContent = capture.counts.dropped ? `${capture.counts.dropped} requests dropped (queue full or capture paused).` : '';
  $('empty').hidden = capture.events.length > 0;
  $('events').replaceChildren(...capture.events.map(event => {
    const item = document.createElement('li');
    const meta = document.createElement('span');
    meta.className = event.state;
    meta.textContent = `${event.time} · ${event.state}`;
    const url = document.createElement('span');
    url.className = 'url'; url.textContent = event.url;
    item.append(meta, url);
    if (event.detail) { const detail = document.createElement('small'); detail.textContent = event.detail; item.append(detail); }
    return item;
  }));
}
window.attachController = capture => { controller = capture; capture.onChange = render; render(capture); };
$('toggle').addEventListener('click', () => {
  if (controller.running) controller.stop(); else controller.start();
});
