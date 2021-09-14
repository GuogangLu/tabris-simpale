const { Button, TextView, contentView } = require('tabris');
const IServer = require('./xp');

var iserver = new IServer('192.168.10.243', 8000);
new Button({
  centerX: true, top: 100,
  text: 'Show message'
}).onSelect(() => {
  textView.text = 'Tabris.js rocks!';
  iserver.devList().then(a => {
    textView.text = JSON.stringify(a)
  })
}).appendTo(contentView);

new Button({
  centerX: true, top: 200,
  text: 'Open'
}).onSelect(() => {
  iserver.devRun('1:1:280', 'open', null, 1).then(a => {
    textView.text = JSON.stringify(a)
  })
}).appendTo(contentView);

new Button({
  centerX: true, top: 300,
  text: 'Close'
}).onSelect(() => {
  iserver.devRun('1:1:280', 'close', null, 1).then(a => {
    textView.text = JSON.stringify(a)
  })
}).appendTo(contentView);

const textView = new TextView({
  centerX: true, top: 'prev() 50',
  font: '24px'
}).appendTo(contentView);

window.device = device;
