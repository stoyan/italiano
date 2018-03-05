const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawnSync;

const readDir = fs.readdirSync;

const dataDir = path.resolve(__dirname, '../json');

function justLetters(s) {
  return s.toLowerCase().replace(/\W/g, '');
}

readDir(dataDir).forEach(f => {
  if (f.startsWith('.')) {
    return; // no .DS_Store etc, thank you
  }
  const file = path.resolve(dataDir, f);
  const jsonData = require(file);
  [
    "Alice",
    "Federica",
    "Luca",
    "Paola",
  ].forEach(voice => {    
    jsonData.forEach(definition => {
      const word = definition[0];
      const outfile = `voices/${voice}/${justLetters(word)}`; // .aiff is assumed
      console.log(outfile);
      spawn('say', ['-v', voice, '-o', outfile, word]);
    });
  });
});

// for f in *.aiff; do ffmpeg -i $f "${f%.*}.mp3"; done
// rm -rf *.aiff
