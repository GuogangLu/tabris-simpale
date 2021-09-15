const { Button, Page, Popover, TextView, TextInput, contentView } = require('tabris');
const IServer = require('./xp');

var iserver = null;
var iserver_host = null;
var iserver_port = null;

/**
 * 链接到智能服务器
 * @param {string} host 智能服务器ip
 * @param {number} port 智能服务器端口
 */
function connectToIServer(host, port) {
  console.log(`[${host}:${port}]`);
  iserver_host = host ? host : localStorage.getItem('iserver_host');
  iserver_port = port ? port : Number(localStorage.getItem('iserver_port'));
  console.log(`[${iserver_host}:${iserver_port}]`);
  if (IServer.isIp(iserver_host) && IServer.isPort(iserver_port)) {
    iserver = new IServer(iserver_host, iserver_port);
    localStorage.setItem('iserver_host', iserver_host);
    localStorage.setItem('iserver_port', iserver_port);
  }
  return iserver;
}

/**
 * 显示智能服务器配置界面
 */
function showConfig() {
  let p = new Popover({width: 300, height: 400});
  let is_host_text = new TextInput({id: 'iserver_host', top: 200, left: 30, right: 30, message: 'iserver_host', text: localStorage.getItem('iserver_host')})
  .appendTo(p.contentView);
  let is_port_text = new TextInput({id: 'iserver_port', top: 260, left: 30, right: 30, message: 'iserver_port', text: localStorage.getItem('iserver_port')})
  .appendTo(p.contentView);
  let is_setting_btn = new Button({top: 320, centerX: true, text: '确定'})
  .onSelect(() => {
    let port = Number(is_port_text.text);
    let host = is_host_text.text;
    if (connectToIServer(host, port) !== null) {
      is_host_text.dispose();
      is_port_text.dispose();
      is_setting_btn.dispose();
      p.close();
    }
  }).appendTo(p.contentView);
  p.open();
}

if (connectToIServer() === null) {
  showConfig();
}

new Button({
  centerX: true, top: 'prev() 10',
  text: '设置'
}).onSelect(() => {
  showConfig();
}).appendTo(contentView);

new Button({
  centerX: true, top: 'prev() 10',
  text: '清除'
}).onSelect(() => {
  localStorage.setItem('iserver_host', '');
  localStorage.setItem('iserver_port', '');
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


window.device = device;
