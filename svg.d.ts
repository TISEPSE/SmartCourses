// Permet d'importer les fichiers .svg comme composants React
// (via react-native-svg-transformer).
declare module '*.svg' {
  import React from 'react';
  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
