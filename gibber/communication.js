let Gibber = null
const WebSocket = require('ws');
const JSON = require('json');

let Communication = {
  webSocketPort: 8081, // default?
  socketInitialized: false,
  connectMsg: null,
  debug: {
    input: false,
    output: false
  },

  init(_Gibber) {
    Gibber = _Gibber
    this.createWebSocket();
    this.send = this.send.bind(Communication);
  },

  createWebSocket() {

      if (this.connected) return

      //Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port )
      if (this.connectMsg === null) {
        this.connectMsg = 'connecting';
      } else {
        this.connectMsg += '.'
      }

      let host = '127.0.0.1',
        port = '8081',
        address = "ws://" + host + ":" + port

      this.wsocket = new WebSocket(address);

      this.wsocket.on('open', function open(ev) {
        //Gibber.log( 'CONNECTED to ' + address )
        Gibber.log('gibberwocky is ready to burble.')
        this.connected = true

        // cancel the auto-reconnect task:
        if (this.connectTask !== undefined) clearTimeout(this.connectTask)

        Gibber.Live.init();

      }.bind(Communication));

      this.wsocket.on('close', function close(ev) {
        if (this.connected) {
          Gibber.log('disconnected from ' + address)
          this.connectMsg = null
          this.connected = false
        }

        // set up an auto-reconnect task:
        this.connectTask = setTimeout(this.createWebSocket.bind(Communication), 1000)
      }.bind(Communication));

      this.wsocket.on('message', function message (ev) {
        //Gibber.log('msg:', ev )
        this.handleMessage(ev)
      }.bind(Communication));

      this.wsocket.on('error', function error(ev) {
        console.log('WebSocket error')
      }.bind(Communication));
  },

  callbacks: {},

  count: 0,

  handleMessage(_msg) {
    let id, key, data, msg

    if (_msg.charAt(0) === '{') {
      data = _msg
      key = null
      if (Communication.callbacks.scene) {
        Communication.callbacks.scene(JSON.parse(data))
      }
    } else if (_msg.includes('snapshot')) {
      data = _msg.substr(9).split(' ')
      for (let i = 0; i < data.length; i += 2) {
        let param_id = data[i]
        let param_value = data[i + 1]

        if (param_value < 0) {
          param_value = 0
        } else if (param_value > 1) {
          param_value = 1
        }

        // Gibber.Environment.codeMarkup.waveform.updateWidget(param_id, 1 - param_value)
      }

      return
    } else {
      msg = _msg.split(' ')
      id = msg[0]
      key = msg[1]

      if (key === 'err') {
        data = msg.slice(2).join(' ')
      } else {
        data = msg[2]
      }
    }

    if (id === undefined) return

    if (Communication.debug.input) {
      if (id !== undefined) {
        Gibber.log('debug.input:', id, key, data)
      } else {
        Gibber.log('debug.input (obj):', JSON.parse(data))
      }
    }

    switch (key) {
      case 'seq':
        if (data === undefined) {
          console.log('faulty ws seq message', _msg)
        } else {
          Gibber.Scheduler.seq(data);
        }
        break;

      case 'clr':
        // Gibber.Environment.clearConsole()
        break;

      case 'bpm':
        Gibber.Scheduler.bpm = parseFloat(data)
        break;

      case 'err':
        Gibber.log(data)
        break;

      default:
        break;
    }
  },

  send(code) {
    if (Communication.connected) {
      if (Communication.debug.output) Gibber.log('beat:', Gibber.Scheduler.currentBeat, 'msg:', code)
      Communication.wsocket.send(code)
    }
  },

  querystring: null,
}

// let qstr = global.shared.location.search,
//   query = {},
//   a = qstr.substr(1).split('&')

// for (let i = 0; i < a.length; i++) {
//   let b = a[i].split('=')
//   query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '')
// }

// Communication.querystring = query

module.exports = Communication