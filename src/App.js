import React, { Component } from 'react';
import './App.css';
import criticism from '../public/italiano/json/criticism.json';
import directions from '../public/italiano/json/directions.json';
import dynamics from '../public/italiano/json/dynamics.json';
import expression from '../public/italiano/json/expression.json';
import forms from '../public/italiano/json/forms.json';
import instruments from '../public/italiano/json/instruments.json';
import moods from '../public/italiano/json/moods.json';
import patterns from '../public/italiano/json/patterns.json';
import roles from '../public/italiano/json/roles.json';
import staging from '../public/italiano/json/staging.json';
import techniques from '../public/italiano/json/techniques.json';
import tempo from '../public/italiano/json/tempo.json';
import voices from '../public/italiano/json/voices.json';


const dictionary = {
  criticism, 
  directions, 
  dynamics, 
  expression, 
  forms, 
  instruments, 
  moods, 
  patterns, 
  roles, 
  staging, 
  techniques, 
  tempo, 
  voices,
};


const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
let webvoices = null;
if (
  'SpeechSynthesisUtterance' in window &&
  'speechSynthesis' in window
) {
  if ('onvoiceschanged' in speechSynthesis) {
    speechSynthesis.onvoiceschanged = () => {
      webvoices = getVoices();
    }
  } else if (speechSynthesis.getVoices) {
      webvoices = getVoices();
  }
}

function getVoices() {
  return speechSynthesis.getVoices().filter(v => v.lang === 'it-IT' && v.localService);
}

let term;

let settings = {};
Object.keys(dictionary).map(key => settings[key] = true);
const locoHash = location.hash.substring(1);
if (locoHash && locoHash !== 'words') {
  const hash = locoHash.split(',');
  Object.keys(settings).forEach(s => {
    settings[s] = hash.includes(s);
  });
  
  // at least one
  if (!Object.keys(settings).some(key => settings[key])) {
    settings.tempo = true;
  }
}

function getQuestion(i) {
  const topics = Object.keys(dictionary).filter(t => settings[t]);
  const topic = topics[Math.floor(Math.random() * topics.length)];
  term = dictionary[topic][Math.floor(Math.random() * dictionary[topic].length)];
  return <div><h3>{term[0]}</h3></div>;
}

function justLetters(s) {
  return s.toLowerCase().replace(/\W/g, '');
}

function getAnswer(i) {
  return (
    <div>
      <p><strong>{term[0]}</strong></p>
      <p><em>{term[1]}</em></p>
      <p>{term[2]}</p>
    </div>
  );
}

function getAudio() {
  if (webvoices && navigator.onLine === false) {
    return [];
  }
  const word = justLetters(term[0]);
  return [
    new Audio(`italiano/voices/Alice/${word}.mp3`),
    new Audio(`italiano/voices/Federica/${word}.mp3`),
    new Audio(`italiano/voices/Luca/${word}.mp3`),
    new Audio(`italiano/voices/Paola/${word}.mp3`),
  ];
}

// the actual quiz is done, boring stuff follows...

class App extends Component {
  constructor() {
    super();
    this.state = {
      question: getQuestion(1),
      answer: getAnswer(1),
      i: 1,
      audio: getAudio(1),
      pause: false,
      settings: false,
      words: location.hash.substring(1) === 'words',
    };
    window.addEventListener('keydown', (e) => {
      // space bar
      if (e.keyCode === 32 || e.charCode === 32) {
        e.preventDefault();
        this.say();
      }
      // p and P
      if (e.keyCode === 112 || e.charCode === 112 || e.keyCode === 80 || e.charCode === 80) {
        e.preventDefault();
        this.say();
      }
      // right arrow
      if (e.keyCode === 39 || e.charCode === 39) {
        e.preventDefault();
        this.nextQuestion();
      }
      // n and N
      if (e.keyCode === 110 || e.charCode === 110 || e.keyCode === 78 || e.charCode === 78) {
        e.preventDefault();
        this.nextQuestion();
      }
    });
  }
  
  nextQuestion() {
    this.pause();
    this.setState({
      question: getQuestion(this.state.i + 1),
      answer: getAnswer(this.state.i + 1),
      i: this.state.i + 1,
      audio: getAudio(this.state.i + 1),
    });
  }
  
  pause() {    
    for (const note of this.state.audio) {
      note.pause();
      note.currentTime = 0;
    }
    this.setState({pause: true});
  }

  say() {
    this.pause();
    this.setState({pause: false});
    if (webvoices && navigator.onLine === false) {
      const u = new SpeechSynthesisUtterance(term[0]);
      u.voice = webvoices[Math.floor(Math.random() * webvoices.length)];
      speechSynthesis.speak(u);
    } else {
      this.state.audio[Math.floor(Math.random() * this.state.audio.length)].play();  
    }    
  }
  
  toggleSettings() {
    if (this.state.settings) {
      this.nextQuestion();
    }
    this.setState({settings: !this.state.settings});
  }
  
  toggleWords() {
    this.setState({words: !this.state.words});
  }
  
  render() {
    return (
      <div>
        <div className="settings">
          <div className="settingsLink" onClick={this.toggleSettings.bind(this)}>⚙ Customize</div>
          {this.state.settings 
          ? <div>
              <Settings init={settings} /> 
              <button className="settingsButton" onClick={e => {
                this.toggleSettings();
                this.nextQuestion();
              }}>done</button>
            </div>
          : null
          }
        </div>
        <Flashcard 
          question={this.state.question}
          answer={this.state.answer}
        />
        <button 
          className="playButton" 
          onMouseDown={this.say.bind(this)}>
          {iOS ? 'say' : '▶'}
        </button>
        {' '}        
        <button 
          className="nextButton" 
          onClick={this.nextQuestion.bind(this)}>
          next...
        </button>
        <div className="wordsToggle">      
          <a href={this.state.words ? '#words' : '#'} className="settingsLink" onClick={this.toggleWords.bind(this)}>
            📖 
            {this.state.words ? ' Hide the list of words' : ' Show all the words'}
          </a>
          {this.state.words 
            ? <div>
                <Words /> 
              </div>
            : null
          }
        </div>
      </div>
    );
  }
}

class Flashcard extends Component {

  constructor() {
    super();
    this.state = {
      reveal: false,
    };
    window.addEventListener('keydown', (e) => {
      // arrows
      if (e.keyCode === 38 || e.charCode === 38 || e.keyCode === 40 || e.charCode === 40) {
        this.flip();
      }
      // f and F
      if (e.keyCode === 102 || e.charCode === 102 || e.keyCode === 70 || e.charCode === 70) {
        this.flip();
      }
    });
  }

  componentWillReceiveProps() {
    this.setState({reveal: false});
  }

  flip() {
    this.setState({
      reveal: !this.state.reveal,
    });
  }

  render() {
    const className = 'card flip-container' + (this.state.reveal ? ' flip' : '');
    return (
      <div><center>
        <div className={className} onClick={this.flip.bind(this)}>
          <div className="flipper">
            <div className="front" style={{display: this.state.reveal ? 'none' : ''}}>
              {this.props.question}
            </div>
            <div className="back" style={{display: this.state.reveal ? '' : 'none'}}>
              {this.props.answer}
            </div>
          </div>
        </div>
        <button className="answerButton" onClick={this.flip.bind(this)}>flip</button>
      </center></div>
    );
  }
}

function updateSettings(e) {
  settings[e.target.getAttribute('data-id')] = e.target.checked;
  // at least one
  if (!Object.keys(settings).some(key => settings[key])) {
    e.target.checked = true;
    settings[e.target.getAttribute('data-id')] = true;
    alert('At least one option should be ON');
  }
  location.hash = Object.keys(settings).filter(s => settings[s] === true).join(',');
  if (location.hash.substring(1).split(',').length === Object.keys(settings).length) {
    // all the options = default
    location.hash = '';
  }
}

const Settings = ({init}) =>
  <div>
    {Object.keys(dictionary).map(c => 
      <div key={c}>
        <input type="checkbox" id={'notanid-' + c} data-id={c} defaultChecked={init[c]} onChange={updateSettings}/>
        <label htmlFor={'notanid-' + c}>{c}</label>
      </div>
    )}
  </div>;
  
const Words = () =>
  <div className="words">
  {Object.keys(dictionary).map(topic =>
    <div key={topic}>
      <h3>{topic}</h3>
      <table cellSpacing="0" cellPadding="4"><tbody>
        <tr><th>Term</th><th>Translation</th><th>Info</th></tr>
        {
          dictionary[topic].map(k => 
            <tr key={k[0]}>
              <td>{k[0]}</td>
              <td>{k[1]}</td>
              <td>{k[2]}</td>
            </tr>
          )
        }
      </tbody></table>
    </div>
  )}
  </div>;
  

export default App;

