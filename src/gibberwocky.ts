'use babel';
'use scrict';

import GibberwockyView from './gibberwocky-view';
import Gibber from '../gibber/gibber.js';
import {Function} from 'loophole'

export default {

  gibberwockyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gibberwockyView = new GibberwockyView(state.gibberwockyViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.gibberwockyView.getElement(),
    //   visible: false}
    );

    // Starting Gibber
    let useAudioContext = false,
        count = 0;

    Gibber.init();
    Gibber.log = (message) => {
      console.log(message);
    }
    Gibber.Communication.init(Gibber);
    window.Gibber = Gibber;



    console.log('gibber init');

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    // this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gibberwockyView.destroy();
  },

  serialize() {
    return {
      gibberwockyViewState: this.gibberwockyView.serialize()
    };
  },

  toggle() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      this.sendToGibber(selection)
    }
    console.log('Gibberwocky was toggled!');
    return null;
  },

  clear() {
    try{
      Gibber.clear()
    } catch( e ) {
      console.log( e )
    }
  },

  sendToGibber(selectedCode) {
    try {
      window.Gibber.Scheduler.functionsToExecute.push( new Function(selectedCode).bind( window.Gibber.currentTrack ) );
    } catch (e) {
      console.log( e )
    }
  }
};