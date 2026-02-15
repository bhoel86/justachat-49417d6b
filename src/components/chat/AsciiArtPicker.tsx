/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AtSign, ImagePlus, Heart, Star, Skull, Cat, Dog, Fish, Coffee, Music, Sparkles, Flame, Moon, Sun, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extended IRC 99-color palette for mIRC compatibility
const IRC_PALETTE: [number, number, number, string][] = [
  [255, 255, 255, '00'], [0, 0, 0, '01'], [0, 0, 127, '02'], [0, 147, 0, '03'],
  [255, 0, 0, '04'], [127, 0, 0, '05'], [156, 0, 156, '06'], [252, 127, 0, '07'],
  [255, 255, 0, '08'], [0, 252, 0, '09'], [0, 147, 147, '10'], [0, 255, 255, '11'],
  [0, 0, 252, '12'], [255, 0, 255, '13'], [127, 127, 127, '14'], [210, 210, 210, '15'],
];

// Generate extended 6x6x6 color cube (16-87) + grayscale (88-98)
const levels = [0, 51, 102, 153, 204, 255];
for (let r = 0; r < 6; r++) {
  for (let g = 0; g < 6; g++) {
    for (let b = 0; b < 6; b++) {
      const idx = 16 + (r * 36) + (g * 6) + b;
      IRC_PALETTE.push([levels[r], levels[g], levels[b], idx.toString()]);
    }
  }
}
// Grayscale (88-98)
for (let i = 0; i <= 10; i++) {
  const v = Math.round(i * 25.5);
  IRC_PALETTE.push([v, v, v, (88 + i).toString()]);
}

// Find closest color using weighted RGB distance
const findClosestColor = (r: number, g: number, b: number): string => {
  let minDist = Infinity;
  let closest = '01';
  
  for (const [pr, pg, pb, code] of IRC_PALETTE) {
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    // Weighted for human perception
    const dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);
    
    if (dist < minDist) {
      minDist = dist;
      closest = code;
    }
  }
  return closest;
};

// Convert image to colored block art with direct RGB
const imageToColoredBlocks = (img: HTMLImageElement, maxWidth: number = 100, maxHeight: number = 50): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Calculate dimensions - for tiny block chars, aspect is nearly 1:1
  const aspectRatio = img.width / img.height;
  const charAspect = 1.2; // Blocks are slightly taller than wide at 8px
  
  let width = maxWidth;
  let height = Math.floor(width / aspectRatio / charAspect);
  
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.floor(height * aspectRatio * charAspect);
  }

  canvas.width = width;
  canvas.height = height;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Use simple RGB format: [rgb:R,G,B]█
  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      
      if (a < 128) {
        result += ' ';
      } else {
        // Use direct RGB color format
        result += `[rgb:${r},${g},${b}]█`;
      }
    }
    result += '\n';
  }

  return result.trim();
};

// Simpler colored HTML output for web display
const imageToColoredHtml = (img: HTMLImageElement, maxWidth: number = 80, maxHeight: number = 40): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const aspectRatio = img.width / img.height;
  const charAspect = 0.5;
  
  let width = maxWidth;
  let height = Math.floor(width / aspectRatio * charAspect);
  
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.floor(height * aspectRatio / charAspect);
  }

  canvas.width = width;
  canvas.height = height;
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      
      if (a < 128) {
        result += ' ';
      } else {
        // Use half-block for better vertical resolution, color it
        result += `[C:${r},${g},${b}]█[/C]`;
      }
    }
    result += '\n';
  }

  return result.trim();
};

// Premade ASCII art collection
const ASCII_ART = [
  {
    name: "Heart",
    icon: Heart,
    art: `░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░██░░░░██░░░░██░░░░██░░░░░░
░░██░░██░░░░██████░░░░░░██░░░░
░░██░░░░████████████░░░░██░░░░
░░░░████████████████████░░░░░░
░░░░████████████████████░░░░░░
░░░░░░████████████████░░░░░░░░
░░░░░░░░████████████░░░░░░░░░░
░░░░░░░░░░████████░░░░░░░░░░░░
░░░░░░░░░░░░████░░░░░░░░░░░░░░
░░░░░░░░░░░░░██░░░░░░░░░░░░░░░`
  },
  {
    name: "Skull",
    icon: Skull,
    art: `    ██████████████████████
  ██                      ██
██    ████████    ████████    ██
██    ██    ██    ██    ██    ██
██    ████████    ████████    ██
██                            ██
  ██      ██████████      ██
    ██  ██  ██  ██  ██  ██
      ██████████████████`
  },
  {
    name: "Dragon",
    icon: Flame,
    art: `          ______________
    ,===:'.,            \`-._
         \`:.'\`---.__         \`-._
           \`:.     \`--.         \`.
             \\.        \`.         \`.
     (,,(,    \\.         \`.   ____,-\`.
  (,'     \`/   \\           ,-'        \\
  ,  ,'  ,-'  (',          ) \\    _,-   \`\\
\`{D, {    \\  /    ,)      /   }  ,'      \\
  V,,'    / /  ,\`'      /   /  /         \\
  \`'   / / ,\`           (   / ,'          )
       / /,'             \\  \\(            (
      (vvv)               \\  )             Y
                           \\(              )`
  },
  {
    name: "Wizard",
    icon: Star,
    art: `        *
       /|\\
      /_|_\\
     /__|__\\
    /____|____\\
   |  _.---._  |
   | |  o o  | |
   |  \\_____/  |
   |  |MAGIC|  |
    \\ |_____| /
     \\_______/
      |     |
     /|     |\\
    / |     | \\`
  },
  {
    name: "Rose",
    icon: Sparkles,
    art: `       _.--._
     .'   '. '.
    /  .-.  \\ \\
   |  /   \\  | |
    \\ '---' / /
     '.___.'.'
       | |
       | |
       | |
      _| |_
     '-----'`
  },
  {
    name: "Cat",
    icon: Cat,
    art: `  /\\_____/\\
 /  o   o  \\
( ==  ^  == )
 )         (
(           )
( (  )   (  ) )
(__(__)___(__)__)`
  },
  {
    name: "Dog",
    icon: Dog,
    art: `       __
  (___()'';
  /,    /\`
  \\\\\"--\\\\`
  },
  {
    name: "Sword",
    icon: Zap,
    art: `        />
 ()===[====>
        \\>`
  },
  {
    name: "Castle",
    icon: Star,
    art: ` |>>           |>>
 |  ___  ___   |
 | | . || . |  |
 | |___||___|  |
_|_|___|____|__|_
  |  ___  ___|
  | |   ||   |
  | |   ||   |
__|_|___||___|___`
  },
  {
    name: "Coffee",
    icon: Coffee,
    art: `      )  )   )
     (  (  (
    __)__)__)__
   |           |]
    \\         /
     \`-------'`
  },
  {
    name: "Music",
    icon: Music,
    art: `   ♪ ♫ ♪ ♫
  ╔══╗ ♪ 
  ║██║ ♫ 
  ║(●)║ ♪
  ╚══╝ 
 ♫ ♪ ♫ ♪`
  },
  {
    name: "Fish",
    icon: Fish,
    art: `    /\\
   {  \`---._
  {    /    \\>°)
   {  .__,  }/
    \`-._   _.'
         \`\`\``
  },
  {
    name: "Moon",
    icon: Moon,
    art: `       _..._
     .:::::::.
    :::::::::::
    :::::::::::
    '::::::::::'
      ':::::::'
        ':::'`
  },
  {
    name: "Sun",
    icon: Sun,
    art: `    \\   |   /
     .--'--.
   /   o  o  \\
  |    \\__/   |
   \\  '----' /
     '--__--'
    /   |   \\`
  },
  {
    name: "Sparkles",
    icon: Sparkles,
    art: `✧ ･ﾟ✦ ･ﾟ✧ ･ﾟ✦
  ✦ ･ﾟ✧ ･ﾟ✦
✧ ･ﾟ✦ ･ﾟ✧ ･ﾟ✦`
  },
  {
    name: "Shrug",
    icon: Zap,
    art: `¯\\_(ツ)_/¯`
  },
  {
    name: "Table Flip",
    icon: Zap,
    art: `(╯°□°)╯︵ ┻━┻`
  },
  {
    name: "Lenny",
    icon: Zap,
    art: `( ͡° ͜ʖ ͡°)`
  },
  {
    name: "Bear",
    icon: Zap,
    art: `ʕ •ᴥ•ʔ`
  },
  {
    name: "Disapproval",
    icon: Zap,
    art: `ಠ_ಠ`
  },
  {
    name: "Middle Finger",
    icon: Zap,
    art: `    ┌∩┐
    ████
    ████
 ████████████
 ████████████
 ████████████
  ██████████
   ████████`
  },
  {
    name: "Pirate",
    icon: Skull,
    art: `    ___
   /   \\
  |=   =|
  | \\█/ |
   \\_▄_/
  .-'Y'-.
 /__|_|__\\`
  },
  {
    name: "Guitar",
    icon: Music,
    art: `     ___
     /   \\
     |   |
     |   |
    /|   |\\
   / |===| \\
  /  |   |  \\
 (   '---'   )
  \\         /
   \`-------'
       | |
       | |
       |_|`
  },
  {
    name: "Woman",
    icon: Sparkles,
    art: `                        8888888888888
  Close Your        888888888888888888888888
 Eyes If You    8888:::8888888888888888888888888
 Can't Stand  8888::::::8888888888888888888888888888
  Seeing A  88::::::::888:::8888888888888888888888888
   Naked  88888888::::8:::::::::::88888888888888888888
   Woman! 888 8::888888::::::::::::::::::88888888888   888
            88::::88888888::::m::::::::::88888888888    8
          888888888888888888:M:::::::::::8888888888888
         88888888888888888888::::::::::::M88888888888888
         8888888888888888888888:::::::::M8888888888888888
          8888888888888888888888:::::::M888888888888888888
         8888888888888888::88888::::::M88888888888888888888
       88888888888888888:::88888:::::M888888888888888   8888
      88888888888888888:::88888::::M::;o*M*o;888888888    88
     88888888888888888:::8888:::::M:::::::::::88888888    8
    88888888888888888::::88::::::M:;:::::::::::888888888
   8888888888888888888:::8::::::M::aAa::::::::M8888888888       8
   88   8888888888::88::::8::::M:::::::::::::888888888888888 8888
  88  88888888888:::8:::::::::M::::::::::;::88:88888888888888888
  8  8888888888888:::::::::::M::"@@@@@@@"::::8w8888888888888888
   88888888888:888::::::::::M:::::"@a@":::::M8i888888888888888
  8888888888::::88:::::::::M88:::::::::::::M88z88888888888888888
 8888888888:::::8:::::::::M88888:::::::::MM888!888888888888888888
 888888888:::::8:::::::::M8888888MAmmmAMVMM888*88888888   88888888
 888888 M:::::::::::::::M888888888:::::::MM88888888888888   8888888
 8888   M::::::::::::::M88888888888::::::MM888888888888888    88888
  888   M:::::::::::::M8888888888888M:::::mM888888888888888    8888
   888  M::::::::::::M8888:888888888888::::m::Mm88888 888888   8888
    88  M::::::::::::8888:88888888888888888::::::Mm8   88888   888
    88  M::::::::::8888M::88888::888888888888:::::::Mm88888    88
    8   MM::::::::8888M:::8888:::::888888888888::::::::Mm8     4
        8M:::::::8888M:::::888:::::::88:::8888888::::::::Mm    2
       88MM:::::8888M:::::::88::::::::8:::::888888:::M:::::M
      8888M:::::888MM::::::::8:::::::::::M::::8888::::M::::M
     88888M:::::88:M::::::::::8:::::::::::M:::8888::::::M::M
    88 888MM:::888:M:::::::::::::::::::::::M:8888:::::::::M:
    8 88888M:::88::M:::::::::::::::::::::::MM:88::::::::::::M
      88888M:::88::M::::::::::*88*::::::::::M:88::::::::::::::M
     888888M:::88::M:::::::::88@@88:::::::::M::88::::::::::::::M
     888888MM::88::MM::::::::88@@88:::::::::M:::8::::::::::::::*8
     88888  M:::8::MM:::::::::*88*::::::::::M:::::::::::::::::88@@
     8888   MM::::::MM:::::::::::::::::::::MM:::::::::::::::::88@@
      888    M:::::::MM:::::::::::::::::::MM::M::::::::::::::::*8
      888    MM:::::::MMM::::::::::::::::MM:::MM:::::::::::::::M
       88     M::::::::MMMM:::::::::::MMMM:::::MM::::::::::::MM
        88    MM:::::::::MMMMMMMMMMMMMMM::::::::MMM::::::::MMM
         88    MM::::::::::::MMMMMMM::::::::::::::MMMMMMMMMM
          88   8MM::::::::::::::::::::::::::::::::::MMMMMM
           8   88MM::::::::::::::::::::::M:::M::::::::MM
               888MM::::::::::::::::::MM::::::MM::::::MM
              88888MM:::::::::::::::MMM:::::::mM:::::MM
              888888MM:::::::::::::MMM:::::::::MMM:::M
             88888888MM:::::::::::MMM:::::::::::MM:::M
            88 8888888M:::::::::MMM::::::::::::::M:::M
            8  888888 M:::::::MM:::::::::::::::::M:::M:
               888888 M::::::M:::::::::::::::::::M:::MM
              888888  M:::::M::::::::::::::::::::::::M:M
              888888  M:::::M:::::::::@::::::::::::::M::M
              88888   M::::::::::::::@@:::::::::::::::M::M
             88888   M::::::::::::::@@@::::::::::::::::M::M
            88888   M:::::::::::::::@@::::::::::::::::::M::M
           88888   M:::::m::::::::::@::::::::::Mm:::::::M:::M
           8888   M:::::M:::::::::::::::::::::::MM:::::::M:::M
          8888   M:::::M:::::::::::::::::::::::MMM::::::::M:::M
         888    M:::::Mm::::::::::::::::::::::MMM:::::::::M::::M
       8888    MM::::Mm:::::::::::::::::::::MMMM:::::::::m::m:::M
      888      M:::::M::::::::::::::::::::MMM::::::::::::M::mm:::M
   8888       MM:::::::::::::::::::::::::MM:::::::::::::mM::MM:::M:
              M:::::::::::::::::::::::::M:::::::::::::::mM::MM:::Mm
             MM::::::m:::::::::::::::::::::::::::::::::::M::MM:::MM
             M::::::::M:::::::::::::::::::::::::::::::::::M::M:::MM
            MM:::::::::M:::::::::::::M:::::::::::::::::::::M:M:::MM
            M:::::::::::M88:::::::::M:::::::::::::::::::::::MM::MMM
            M::::::::::::8888888888M::::::::::::::::::::::::MM::MM
            M:::::::::::::88888888M:::::::::::::::::::::::::M::MM
            M::::::::::::::888888M:::::::::::::::::::::::::M::MM
            M:::::::::::::::88888M:::::::::::::::::::::::::M:MM
            M:::::::::::::::::88M::::::::::::::::::::::::::MMM
            M:::::::::::::::::::M::::::::::::::::::::::::::MMM
            MM:::::::::::::::::M::::::::::::::::::::::::::MMM
             M:::::::::::::::::M::::::::::::::::::::::::::MMM
             MM:::::::::::::::M::::::::::::::::::::::::::MMM
              M:::::::::::::::M:::::::::::::::::::::::::MMM
              MM:::::::::::::M:::::::::::::::::::::::::MMM
               M:::::::::::::M::::::::::::::::::::::::MMM
               MM:::::::::::M::::::::::::::::::::::::MMM
                M:::::::::::M:::::::::::::::::::::::MMM
                MM:::::::::M:::::::::::::::::::::::MMM
                 M:::::::::M::::::::::::::::::::::MMM
                 MM:::::::M::::::::::::::::::::::MMM
                  MM::::::M:::::::::::::::::::::MMM
                  MM:::::M:::::::::::::::::::::MMM
                   MM::::M::::::::::::::::::::MMM
                   MM:::M::::::::::::::::::::MMM
                    MM::M:::::::::::::::::::MMM
                    MM:M:::::::::::::::::::MMM
                     MMM::::::::::::::::::MMM
                     MM::::::::::::::::::MMM
                      M:::::::::::::::::MMM
                     MM::::::::::::::::MMM
                     MM:::::::::::::::MMM
                     MM::::M:::::::::MMM:
                     mMM::::MM:::::::MMMM
                      MMM:::::::::::MMM:M
                      mMM:::M:::::::M:M:M
                       MM::MMMM:::::::M:M
                       MM::MMM::::::::M:M
                       mMM::MM::::::::M:M
                        MM::MM:::::::::M:M
                        MM::MM::::::::::M:m
                        MM:::M:::::::::::MM
                        MMM:::::::::::::::M:
                        MMM:::::::::::::::M:
                        MMM::::::::::::::::M
                        MMM::::::::::::::::M
                        MMM::::::::::::::::Mm
                         MM::::::::::::::::MM
                         MMM:::::::::::::::MM
                         MMM:::::::::::::::MM
                         MMM:::::::::::::::MM
                         MMM:::::::::::::::MM
                          MM::::::::::::::MMM
                          MMM:::::::::::::MM
                          MMM:::::::::::::MM
                          MMM::::::::::::MM
                           MM::::::::::::MM
                           MM::::::::::::MM
                           MM:::::::::::MM
                           MMM::::::::::MM
                           MMM::::::::::MM
                            MM:::::::::MM
                            MMM::::::::MM
                            MMM::::::::MM
                             MM::::::::MM
                             MMM::::::MM
                             MMM::::::MM
                              MM::::::MM
                              MM::::::MM
                               MM:::::MM
                               MM:::::MM:
                               MM:::::M:M
                               MM:::::M:M
                               :M::::::M:
                              M:M:::::::M
                             M:::M::::::M
                            M::::M::::::M
                           M:::::M:::::::M
                          M::::::MM:::::::M
                          M:::::::M::::::::M
                          M;:;::::M:::::::::M
                          M:m:;:::M::::::::::M
                          MM:m:m::M::::::::;:M
                           MM:m::MM:::::::;:;M
                            MM::MMM::::::;:m:M
                             MMMM MM::::m:m:MM
                                   MM::::m:MM
                                    MM::::MM
                                     MM::MM`
  },
  {
    name: "Doggy",
    icon: Dog,
    art: `           __
        __/o \\__    
        \\____   \\  
      __   //\\   \\
   __/o \\-//--\\   \\_/ 
   \\____  ___  \\  |
        ||   \\ |\\ |
       _||   _||_||`
  },
  {
    name: "Doggy 2",
    icon: Dog,
    art: `           __
        __/o \\__    
        \\____   \\  
      __   //\\   \\
   __/o \\-//--\\   \\_/ 
   \\____  ___  \\  |++POFFZZZ!!!!!     
        ||   \\ |\\ | ++PRUTTT!!!!!!!!
       _||   _||_||  ++ANUSLUKT!!!!!!`
  },
  {
    name: "Butt",
    icon: Heart,
    art: ` The fleecy cloud may kiss the sky.   
 The rose may kiss the butterfly.     
 The morning dew may kiss the grass.  
 And you my friend may kiss my....    
            .         .              
            |         |              
            j    :    l              
           /           \\             
          /             \\            
         Y       .       Y           
         |       |       |           
         l "----~Y~----" !           
          \\      |      /            
           Y     |     Y             
           |     I     |             
***************************************`
  },
  {
    name: "$100 Bill",
    icon: Star,
    art: `||====================================================================||
||//$\\\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\//$\\\\||
||(100)==================| FEDERAL RESERVE NOTE |================(100)||
||\\\\$//        ~         '------========--------'                \\\\$//||
||<< /        /$\\              // ____ \\\\                         \\ >>||
||>>|  12    //L\\\\            // ///..) \\\\         L38036133B   12 |<<||
||<<|        \\\\ //           || <||  >\\  ||                        |>>||
||>>|         \\$/            ||  $$ --/  ||        One Hundred     |<<||
||<<|      L38036133B        *\\\\  |\\_/  //* series                 |>>||
||>>|  12                     *\\\\/___\\_//*   1989                  |<<||
||<<\\      Treasurer     ______/Franklin\\________     Secretary 12 />>||
||//$\\                 ~|UNITED STATES OF AMERICA|~               /$\\\\||
||(100)===================  ONE HUNDRED DOLLARS =================(100)||
||\\\\$//\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\\\$//||
||====================================================================||
                   SHOW ME DA $MONEY$`
  },
  {
    name: "F U Flag",
    icon: Zap,
    art: `              WWWWW
              \\u00ABy\\u00AB
              |\\u00AB \\u00AB|
        (O)  q/ \\u00AB \\p
        | |  (\\u00AB-0-\\u00AB)  
        | |   ~\\_/~    
       .(\\u00AB)_  _| |_  O=WWo=====|===========|+|\\u00AB
  __ .( | | )_ \\ / \\  //       |  F U C K  |
 (_ \\ | | | | ) \\u00AB |\\\\//        |   Y O U   |
  .\\ \\/" " " "\\ \\u00AB | \\/         |  ASSHOLE  |
   .\\         //v\\|            |  !!!!!!!  |
    .\\_______/| | |            |  _        |
              | | |            | / \\    -\\ |
           ___| | |___         |/   \\  /  \\|
          [_____V_____]              \\/`
  },
  {
    name: "2 Dinos",
    icon: Zap,
    art: `                 __
                / ')  /@\\
       _/\\/\\/\\_/ /   \`-\\ \\  ______
     _|         /       \\ \\/ \` /  \\
   _|  (  | (  |         \\_i / \\  |\\____//
  /__.-'|_|--|_|           | |==| |=----/
----------------     ------hn/--hn/--------`
  },
  {
    name: "Alien",
    icon: Moon,
    art: `.       .  .   . .   .   . .    +  .
  .  :     .    .. :. .___---------___.
 .  .   .    .  :.:. _".^ .^ ^.  '.. :"-_. .
 :       .  .  .:../:            . .^  :.:\.
  .   . :: +. :.:/: .   .    .        . . .:\\
   .     . _ :::/:               .  ^ .  . .:\\
 .   . - : :.:./.                        .  .:\\
   .     . :..|:                    .  .  ^. .:|
      . : : ..||        .                . . !:|
  . . . ::. ::\\(                           . :)/
     : . : .:.|. ######              .#######::|
.  :-  : .:  ::|.#######           ..########:|
 .  ..  .  .. :\\ ########          :######## :/
     .+ :: : -.:\\ ########       . ########.:/
 .+   . . . . :.:\\. #######       #######..:/
:: . . . . ::.:..:.\\.           .   .   ..:/
 .   .  .. :  -::::.\\..       | |     . .:/
.  :  .  .  .-:.":.::.\\.             ..:/
  -.   . . . .: .:::.:.\\..           .:/
  .  :      : ....::_:..::\\   ___.  :/
 .  .   .:. .. .  .: :.:.:\\       :/
   .   .   : . ::. :.:. .:.|\\.  .:/|
         +   .  .  ...:: ..|  --.:|
 . . .   .  .  . ... :..:.."(  ..)"
       .      :  .   .: ::/  .  .::\\`
  },
  {
    name: "Bart",
    icon: Zap,
    art: `     |\\/\\/\\/\\/\\/|
     |          |
     |          |
     |          |
     |    __  __|
     |   /  \\/  \\
     |  (o   )o  )
    /C   \\__/ --.
    \\_   ,     -'
     |  '\\_______)
     |      _)
     |     |
    /\`-----'\\
   /         \\`
  },
];

interface AsciiArtPickerProps {
  onArtSelect: (art: string) => void;
  onImageUpload?: (file: File) => void;
}

const AsciiArtPicker = ({ onArtSelect }: AsciiArtPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleArtClick = (art: string) => {
    onArtSelect(art);
    setIsOpen(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
      return;
    }

    setIsConverting(true);

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const coloredArt = imageToColoredBlocks(img, 100, 50);
          if (coloredArt) {
            onArtSelect(coloredArt);
          }
          setIsConverting(false);
          setIsOpen(false);
        };
        img.onerror = () => {
          toast({
            variant: "destructive",
            title: "Failed to load image",
            description: "Could not process the image",
          });
          setIsConverting(false);
        };
        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Failed to read file",
          description: "Could not read the image file",
        });
        setIsConverting(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: err instanceof Error ? err.message : "Failed to convert image",
      });
      setIsConverting(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="ASCII Art"
          >
            <AtSign className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 bg-popover border-border z-[200]"
          sideOffset={5}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <AtSign className="w-3 h-3" />
            ASCII Art
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Image to ASCII Option */}
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 cursor-pointer"
            disabled={isConverting}
          >
            {isConverting ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 text-primary" />
            )}
            <span>{isConverting ? 'Converting...' : 'Convert Image to ASCII'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* ASCII Art Grid */}
          <ScrollArea className="h-64">
            <div className="grid grid-cols-2 gap-1 p-1">
              {ASCII_ART.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleArtClick(item.art)}
                    className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors text-left group"
                  >
                    <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                      {item.name}
                    </span>
                    <pre className="text-[8px] leading-tight text-muted-foreground group-hover:text-foreground font-mono whitespace-pre max-w-full overflow-hidden">
                      {item.art.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AsciiArtPicker;
