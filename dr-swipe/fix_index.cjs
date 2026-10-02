const fs = require('fs');
let content = fs.readFileSync('C:/Users/Admin/Documents/GitHub/Dr_Swipe_Specs/dr-swipe/src/machines/gameMachine.ts', 'utf8');
content = content.replace(/currentCardIndex: \(\{ context \}\) => context\.currentCardIndex \+ 1,[^\n]+/g, 'currentCardIndex: 0, // Restart current case cards for learning');
content = content.replace(/currentCardIndex: 0,[^\n]+/g, 'currentCardIndex: 0, // Restart current case cards for learning'); // Just to standardize
fs.writeFileSync('C:/Users/Admin/Documents/GitHub/Dr_Swipe_Specs/dr-swipe/src/machines/gameMachine.ts', content);
